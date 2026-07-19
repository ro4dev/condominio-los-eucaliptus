-- ============================================
-- Fix: infinite recursion en RLS de admin_users
-- ============================================

-- Eliminar políticas recursivas
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can read config" ON config;
DROP POLICY IF EXISTS "Admins can update config" ON config;
DROP POLICY IF EXISTS "Admins can insert config" ON config;

-- Función para check admin (bypassa RLS con SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- admin_users: SELECT abierto a autenticados (evita recursión)
CREATE POLICY "Authenticated can read admin_users" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- admin_users: INSERT/UPDATE/DELETE solo admins
CREATE POLICY "Admins can manage admin_users" ON admin_users
  FOR ALL USING (is_admin());

-- config: SELECT abierto a autenticados
CREATE POLICY "Authenticated can read config" ON config
  FOR SELECT USING (auth.role() = 'authenticated');

-- config: UPDATE/INSERT solo admins
CREATE POLICY "Admins can update config" ON config
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert config" ON config
  FOR INSERT WITH CHECK (is_admin());
