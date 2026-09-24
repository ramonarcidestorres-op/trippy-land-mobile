-- Script maestro para la base de datos de Trippy Land Store
-- 1. Agregar columna referral_code si no existe
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS referral_code text;

-- 2. Crear tabla addresses para guardar direcciones de usuarios
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  address text NOT NULL,
  neighborhood text,
  apartment text,
  instructions text,
  lat numeric,
  lng numeric,
  created_at timestamptz DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Tarifas de domicilio según solicitud
DELETE FROM public.delivery_fees;
INSERT INTO public.delivery_fees (min_subtotal, max_subtotal, normal_fee, fast_fee) VALUES
(0, 199999, 25000, 50000),
(200000, 999999, 50000, 50000),
(1000000, NULL, 100000, 100000);

-- 4. Función de creación de pedidos para invitados (place_order_guest)
CREATE OR REPLACE FUNCTION place_order_guest(
  p_delivery_address text,
  p_delivery_type text,
  p_payment_method text,
  p_cart_items jsonb,
  p_referral_code text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_order_id uuid;
  v_cart_item jsonb;
  v_total numeric := 0;
  v_subtotal numeric := 0;
  v_delivery_fee numeric := 0;
  v_item_price numeric;
  v_product_id uuid;
  v_quantity int;
BEGIN
  IF p_delivery_address IS NULL OR trim(p_delivery_address) = '' THEN
    RAISE EXCEPTION 'La dirección de entrega es requerida';
  END IF;

  INSERT INTO orders (delivery_address, delivery_type, payment_method, status, total, subtotal, delivery_fee, referral_code)
  VALUES (p_delivery_address, p_delivery_type, p_payment_method, 'pending', 0, 0, 0, p_referral_code)
  RETURNING id INTO v_order_id;

  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    BEGIN
      v_product_id := COALESCE(v_cart_item->>'product_id', v_cart_item->>'id', v_cart_item->'products'->>'id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      v_product_id := NULL;
    END;

    IF v_product_id IS NOT NULL THEN
      v_quantity := COALESCE((v_cart_item->>'quantity')::int, 1);
      IF v_quantity < 1 THEN v_quantity := 1; END IF;

      SELECT price INTO v_item_price FROM products WHERE id = v_product_id;
      
      IF v_item_price IS NULL AND (v_cart_item->>'price') IS NOT NULL THEN
        v_item_price := (v_cart_item->>'price')::numeric;
      END IF;

      IF v_item_price IS NOT NULL THEN
        -- Inflar 40% si hay código
        IF p_referral_code IS NOT NULL AND trim(p_referral_code) != '' THEN
          v_item_price := ROUND(v_item_price * 1.40);
        END IF;

        INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
        VALUES (v_order_id, v_product_id, v_quantity, v_item_price);

        v_subtotal := v_subtotal + (v_item_price * v_quantity);
      END IF;
    END IF;
  END LOOP;

  IF v_subtotal = 0 THEN
    RAISE EXCEPTION 'El carrito no contiene productos válidos';
  END IF;

  -- Tarifa de domicilio
  SELECT CASE 
    WHEN p_delivery_type = 'fast' THEN fast_fee 
    ELSE normal_fee 
  END INTO v_delivery_fee
  FROM delivery_fees
  WHERE min_subtotal <= v_subtotal AND (max_subtotal IS NULL OR max_subtotal >= v_subtotal)
  ORDER BY min_subtotal DESC
  LIMIT 1;

  IF v_delivery_fee IS NULL THEN
    v_delivery_fee := CASE WHEN p_delivery_type = 'fast' THEN 50000 ELSE 25000 END;
  END IF;

  v_total := v_subtotal + v_delivery_fee;

  UPDATE orders 
  SET total = v_total, subtotal = v_subtotal, delivery_fee = v_delivery_fee
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Políticas de lectura para pedidos anónimos
DROP POLICY IF EXISTS "Guests and users can view orders" ON orders;
CREATE POLICY "Guests and users can view orders" ON orders FOR SELECT USING (
  user_id IS NULL OR user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Guests and users can view order items" ON order_items;
CREATE POLICY "Guests and users can view order items" ON order_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id IS NULL OR orders.user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  )
);
