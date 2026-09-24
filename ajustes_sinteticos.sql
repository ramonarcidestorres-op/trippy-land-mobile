-- Script para ajustar precios y orden de los sintéticos

DO $$
DECLARE
    v_sinteticos_id uuid;
BEGIN
    -- Buscar la categoría de sintéticos
    SELECT id INTO v_sinteticos_id FROM categories WHERE name ILIKE '%Sint%tico%' LIMIT 1;

    IF v_sinteticos_id IS NOT NULL THEN
        
        -- 1. Incrementar en 20.000 los precios de todos los sintéticos, EXCEPTO los Tussi
        UPDATE products 
        SET price = price + 20000 
        WHERE category_id = v_sinteticos_id 
          AND name NOT ILIKE '%tussi%';

        -- 2. Reorganizar para que destaquen en este orden: Tussi > M (Molly/MDMA) > Micropunto > Resto
        -- Como la app ordena por fecha de creación (los más recientes primero), 
        -- adelantaremos el reloj artificialmente de estos productos para que queden arriba.

        -- Tussi quedará de PRIMERO (10 minutos en el futuro)
        UPDATE products 
        SET created_at = NOW() + INTERVAL '10 minutes' 
        WHERE category_id = v_sinteticos_id AND name ILIKE '%tussi%';

        -- Molly y MDMA quedarán de SEGUNDOS (5 minutos en el futuro)
        UPDATE products 
        SET created_at = NOW() + INTERVAL '5 minutes' 
        WHERE category_id = v_sinteticos_id AND (name ILIKE '%molly%' OR name ILIKE '%mdma%');

        -- Micropunto quedará de TERCERO (2 minutos en el futuro)
        UPDATE products 
        SET created_at = NOW() + INTERVAL '2 minutes' 
        WHERE category_id = v_sinteticos_id AND name ILIKE '%micropunto%';

    END IF;
END $$;
