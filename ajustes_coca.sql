-- Script para ajustar precios de la coca y agregar los nuevos sabores

DO $$
DECLARE
    v_coca_id uuid;
BEGIN
    -- Buscar la categoría de Coca
    SELECT id INTO v_coca_id FROM categories WHERE name ILIKE '%Coca%' LIMIT 1;

    IF v_coca_id IS NOT NULL THEN
        
        -- 1. Actualizar la Coca Pura a $60.000 el gramo
        UPDATE products 
        SET price = 60000, name = 'Coca pura 1gr'
        WHERE category_id = v_coca_id 
          AND name ILIKE '%coca pura%';

        -- 2. Actualizar la Coca Lavada a $50.000 el gramo
        UPDATE products 
        SET price = 50000, name = 'Coca lavada 1gr'
        WHERE category_id = v_coca_id 
          AND name ILIKE '%coca lavada%';

        -- 3. Insertar las nuevas: Coca lavada de uva y de coco (a $50.000 también)
        INSERT INTO products (category_id, name, description, price, is_available) VALUES
        (v_coca_id, 'Coca lavada de uva 1gr', 'Lavada sabor uva', 50000, true),
        (v_coca_id, 'Coca lavada de coco 1gr', 'Lavada sabor coco', 50000, true);

    END IF;
END $$;
