-- Script para actualizar la lógica de los pedidos en la base de datos
-- Esto permite que el backend registre el pedido inflado un 30% si hay un código.

CREATE OR REPLACE FUNCTION place_order(
  p_delivery_address jsonb,
  p_delivery_type text,
  p_payment_method text,
  p_referral_code text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_order_id uuid;
  v_cart_item record;
  v_total numeric := 0;
  v_subtotal numeric := 0;
  v_delivery_fee numeric := 0;
  v_item_price numeric;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Crea el pedido inicial e inyecta el código del comisionista
  INSERT INTO orders (user_id, delivery_address, delivery_type, payment_method, status, total_amount, referral_code)
  VALUES (v_user_id, p_delivery_address, p_delivery_type, p_payment_method, 'pending', 0, p_referral_code)
  RETURNING id INTO v_order_id;

  -- Procesa los productos del carrito
  FOR v_cart_item IN SELECT * FROM cart_items WHERE user_id = v_user_id
  LOOP
    -- Obtener precio original
    SELECT price INTO v_item_price FROM products WHERE id = v_cart_item.product_id;
    
    -- MAGIA: Si viene con un código de comisionista, le sumamos el 30% al valor real
    IF p_referral_code IS NOT NULL AND p_referral_code != '' THEN
      v_item_price := ROUND(v_item_price * 1.30);
    END IF;

    -- Guardar el producto dentro del pedido con el nuevo precio ya modificado
    INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
    VALUES (v_order_id, v_cart_item.product_id, v_cart_item.quantity, v_item_price);

    v_subtotal := v_subtotal + (v_item_price * v_cart_item.quantity);
  END LOOP;

  -- Calcula el domicilio usando el nuevo subtotal inflado
  SELECT CASE 
    WHEN p_delivery_type = 'fast' THEN fast_fee 
    ELSE normal_fee 
  END INTO v_delivery_fee
  FROM delivery_fees
  WHERE min_subtotal <= v_subtotal AND (max_subtotal IS NULL OR max_subtotal >= v_subtotal)
  LIMIT 1;

  v_total := v_subtotal + COALESCE(v_delivery_fee, 0);

  -- Actualiza el total final en el pedido
  UPDATE orders SET total_amount = v_total WHERE id = v_order_id;

  -- Vacía el carrito del usuario
  DELETE FROM cart_items WHERE user_id = v_user_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
