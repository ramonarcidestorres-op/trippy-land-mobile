-- Script para desmantelar el login, hacer pedidos anónimos y preparar el tracking

-- 1. Hacemos que user_id ya no sea obligatorio en la tabla orders (para pedidos sin cuenta)
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 2. Añadimos las columnas para el tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_details text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS whatsapp_contact text;

-- 3. Creamos una nueva función para que la app envíe el carrito local y cree la orden
CREATE OR REPLACE FUNCTION place_order_guest(
  p_delivery_address jsonb,
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
  -- Insertar orden anónima
  INSERT INTO orders (delivery_address, delivery_type, payment_method, status, total_amount, referral_code)
  VALUES (p_delivery_address, p_delivery_type, p_payment_method, 'pending', 0, p_referral_code)
  RETURNING id INTO v_order_id;

  -- Procesar los items enviados desde el celular
  FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
  LOOP
    v_product_id := (v_cart_item->>'id')::uuid;
    v_quantity := (v_cart_item->>'quantity')::int;

    SELECT price INTO v_item_price FROM products WHERE id = v_product_id;
    
    -- Inflar 30% si hay código
    IF p_referral_code IS NOT NULL AND p_referral_code != '' THEN
      v_item_price := ROUND(v_item_price * 1.30);
    END IF;

    INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
    VALUES (v_order_id, v_product_id, v_quantity, v_item_price);

    v_subtotal := v_subtotal + (v_item_price * v_quantity);
  END LOOP;

  -- Tarifa de domicilio
  SELECT CASE 
    WHEN p_delivery_type = 'fast' THEN fast_fee 
    ELSE normal_fee 
  END INTO v_delivery_fee
  FROM delivery_fees
  WHERE min_subtotal <= v_subtotal AND (max_subtotal IS NULL OR max_subtotal >= v_subtotal)
  LIMIT 1;

  v_total := v_subtotal + COALESCE(v_delivery_fee, 0);

  UPDATE orders SET total_amount = v_total WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
