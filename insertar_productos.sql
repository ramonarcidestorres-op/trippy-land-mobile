-- Script para insertar los productos del menú con sus precios en pesos colombianos
-- Corre este script en el SQL Editor de Supabase.

DO $$
DECLARE
    v_weed_id uuid;
    v_preroll_id uuid;
    v_sinteticos_id uuid;
    v_coca_id uuid;
    v_farmacia_id uuid;
BEGIN
    -- Obtener IDs de las categorías (usando ILIKE para ignorar mayúsculas o tildes)
    SELECT id INTO v_weed_id FROM categories WHERE name ILIKE '%Weed%' LIMIT 1;
    SELECT id INTO v_preroll_id FROM categories WHERE name ILIKE '%Pre-Roll%' OR name ILIKE '%Armado%' LIMIT 1;
    SELECT id INTO v_sinteticos_id FROM categories WHERE name ILIKE '%Sint%tico%' LIMIT 1;
    SELECT id INTO v_coca_id FROM categories WHERE name ILIKE '%Coca%' LIMIT 1;
    SELECT id INTO v_farmacia_id FROM categories WHERE name ILIKE '%Farma%' LIMIT 1;

    -- =====================================
    -- CATEGORÍA: WEED
    -- =====================================
    IF v_weed_id IS NOT NULL THEN
        INSERT INTO products (category_id, name, description, price, is_available) VALUES
        (v_weed_id, 'Cali (Californiana) x 3gr', 'Flor premium', 170000, true),
        (v_weed_id, 'Gelato x 1gr', 'Flor indoor', 15000, true),
        (v_weed_id, 'Passion x 1gr', 'Flor indoor', 30000, true);
    END IF;

    -- =====================================
    -- CATEGORÍA: PRE-ROLLS (ARMADOS)
    -- =====================================
    IF v_preroll_id IS NOT NULL THEN
        INSERT INTO products (category_id, name, description, price, is_available) VALUES
        (v_preroll_id, 'Conos x10', 'Paquete de 10 conos armados', 160000, true),
        (v_preroll_id, 'Armados x10', 'Paquete de 10 pre-rolls', 100000, true),
        (v_preroll_id, 'Pre Roll', 'Unidad de pre-roll', 100000, true);
    END IF;

    -- =====================================
    -- CATEGORÍA: SINTÉTICOS
    -- =====================================
    IF v_sinteticos_id IS NOT NULL THEN
        INSERT INTO products (category_id, name, description, price, is_available) VALUES
        (v_sinteticos_id, 'Nexus 1gr', 'Nexus', 100000, true),
        (v_sinteticos_id, 'Nexus 1/2', 'Nexus medio gramo', 60000, true),
        (v_sinteticos_id, 'Filimento keta', 'Ketamina', 120000, true),
        (v_sinteticos_id, 'Molly 1gr', 'Molly', 100000, true),
        (v_sinteticos_id, 'Molly 1/2', 'Molly medio gramo', 60000, true),
        (v_sinteticos_id, 'Mdma 1gr', 'MDMA', 85000, true),
        (v_sinteticos_id, 'Mdma 1/2', 'MDMA medio gramo', 50000, true),
        (v_sinteticos_id, 'Éxtasis', 'Éxtasis', 30000, true),
        (v_sinteticos_id, 'Papel LSD', 'LSD', 30000, true),
        (v_sinteticos_id, 'Micropunto', 'Micropunto', 40000, true),
        (v_sinteticos_id, 'Candy flipping', 'Candy flipping', 40000, true),
        (v_sinteticos_id, 'Popper rush', 'Popper rush', 80000, true),
        (v_sinteticos_id, 'Ghb', 'GHB', 50000, true),
        (v_sinteticos_id, '2cb (tussi) 1gr', 'Tussi', 100000, true),
        (v_sinteticos_id, '2cb (tussi azul) 1gr', 'Tussi azul', 180000, true),
        (v_sinteticos_id, '2cb (tussi) 3 gramos', 'Tussi 3g', 230000, true);
    END IF;

    -- =====================================
    -- CATEGORÍA: COCA (Movidos de sintéticos)
    -- =====================================
    IF v_coca_id IS NOT NULL THEN
        INSERT INTO products (category_id, name, description, price, is_available) VALUES
        (v_coca_id, 'Coca lavada', 'Lavada', 40000, true),
        (v_coca_id, 'Coca pura', 'Pura', 30000, true);
    END IF;

    -- =====================================
    -- CATEGORÍA: FARMACIA
    -- =====================================
    IF v_farmacia_id IS NOT NULL THEN
        INSERT INTO products (category_id, name, description, price, is_available) VALUES
        (v_farmacia_id, 'Caja Xanax', 'Caja de Xanax', 200000, true),
        (v_farmacia_id, 'Xanax', 'Unidad de Xanax', 7000, true),
        (v_farmacia_id, 'Ritalina', 'Ritalina', 15000, true),
        (v_farmacia_id, 'Oxycodona', 'Oxycodona', 20000, true),
        (v_farmacia_id, 'Clonazepam', 'Clonazepam', 4000, true),
        (v_farmacia_id, 'Metadona', 'Metadona', 20000, true);
    END IF;

END $$;
