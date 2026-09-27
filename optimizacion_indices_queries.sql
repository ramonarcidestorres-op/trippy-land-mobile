-- ============================================================================
-- TRIPPY LAND STORE - OPTIMIZACIÓN DE ÍNDICES, QUERIES Y ESCALABILIDAD
-- ============================================================================

-- 1. EXTENSIONES PARA BÚSQUEDA ULTRARRÁPIDA (TRIGRAMAS)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. ÍNDICES DE CLAVES FORÁNEAS (FOREIGN KEYS)
-- Resuelve consultas N+1 y JOINs lentos en orders, items y suscripciones
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history (order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_created ON public.order_status_history (order_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders (driver_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses (user_id);
CREATE INDEX IF NOT EXISTS idx_order_push_logs_order_id ON public.order_push_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_order_push_logs_recipient ON public.order_push_logs (recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items (product_id);
CREATE INDEX IF NOT EXISTS idx_favorites_product_id ON public.favorites (product_id);

-- 3. ÍNDICES DE ALTO RENDIMIENTO PARA FILTRADO, ORDENAMIENTO Y BÚSQUEDA
-- Acelera listados ordenados por fecha y consultas por estado en el panel admin y cliente
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON public.orders (referral_code) WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_created_at_desc ON public.products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_cat_created ON public.products (category_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products (is_available);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories (name ASC);

CREATE INDEX IF NOT EXISTS idx_referrals_code_lower ON public.referrals (lower(code));
CREATE INDEX IF NOT EXISTS idx_referrals_is_active ON public.referrals (is_active);

-- 4. OPTIMIZACIÓN DE FUNCIÓN IS_ADMIN (INITPLAN CACHE)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM public.profiles WHERE id = (select auth.uid())),
    false
  );
$$;

-- 5. POLÍTICAS RLS CONSOLIDADAS Y OPTIMIZADAS
-- Categorías
DROP POLICY IF EXISTS "Allow all modify categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins insert categories" ON public.categories FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update categories" ON public.categories FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete categories" ON public.categories FOR DELETE USING (public.is_admin());

-- Productos
DROP POLICY IF EXISTS "Allow all modify products" ON public.products;
DROP POLICY IF EXISTS "Allow public read products" ON public.products;
DROP POLICY IF EXISTS "Admins manage products" ON public.products;
CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins insert products" ON public.products FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update products" ON public.products FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete products" ON public.products FOR DELETE USING (public.is_admin());

-- Referidos
DROP POLICY IF EXISTS "Allow all modify referrals" ON public.referrals;
DROP POLICY IF EXISTS "Allow public read referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins manage referrals" ON public.referrals;
CREATE POLICY "Public read referrals" ON public.referrals FOR SELECT USING (true);
CREATE POLICY "Admins insert referrals" ON public.referrals FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update referrals" ON public.referrals FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete referrals" ON public.referrals FOR DELETE USING (public.is_admin());

-- App Config
DROP POLICY IF EXISTS "Allow all to modify app_config" ON public.app_config;
DROP POLICY IF EXISTS "Allow public read app_config" ON public.app_config;
DROP POLICY IF EXISTS "Admins manage app_config" ON public.app_config;
CREATE POLICY "Public read app_config" ON public.app_config FOR SELECT USING (true);
CREATE POLICY "Admins insert app_config" ON public.app_config FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update app_config" ON public.app_config FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete app_config" ON public.app_config FOR DELETE USING (public.is_admin());

-- Tarifas de Domicilio
DROP POLICY IF EXISTS "Admins gestionan tarifas" ON public.delivery_fees;
DROP POLICY IF EXISTS "Todos leen tarifas" ON public.delivery_fees;
CREATE POLICY "Todos leen tarifas" ON public.delivery_fees FOR SELECT USING (true);
CREATE POLICY "Admins insert delivery_fees" ON public.delivery_fees FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins update delivery_fees" ON public.delivery_fees FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Admins delete delivery_fees" ON public.delivery_fees FOR DELETE USING (public.is_admin());

-- Pedidos (Orders)
DROP POLICY IF EXISTS "Admins gestionan pedidos" ON public.orders;
DROP POLICY IF EXISTS "Clientes actualizan whatsapp" ON public.orders;
DROP POLICY IF EXISTS "Lectura publica de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Users can create own orders." ON public.orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Guests and users can view orders" ON public.orders;

CREATE POLICY "Lectura publica de pedidos" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Creacion de pedidos" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion de pedidos" ON public.orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Eliminacion de pedidos admin" ON public.orders FOR DELETE USING (public.is_admin());

-- Order Items
DROP POLICY IF EXISTS "Users can insert own order items." ON public.order_items;
CREATE POLICY "Users can insert own order items." ON public.order_items 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND (orders.user_id IS NULL OR orders.user_id = (select auth.uid()))
  )
);

-- Direcciones
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

-- Perfiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles view access" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Profiles view access" ON public.profiles FOR SELECT USING ((select auth.uid()) = id OR public.is_admin());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
