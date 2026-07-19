-- ============================================
-- Configuración admin + tabla config
-- ============================================

-- TABLA CONFIG (key-value store)
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- TABLA ADMIN_USERS
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: solo admins pueden leer/escribir config
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read config" ON config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update config" ON config
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can insert config" ON config
  FOR INSERT WITH CHECK (is_admin());

-- RLS: solo admins pueden ver/gestionar admin_users
-- NOTA: SELECT abierto a autenticados para evitar recursión infinita
-- La seguridad real está en INSERT/DELETE que requieren is_admin()
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read admin_users" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid());
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE POLICY "Admins can manage admin_users" ON admin_users
  FOR ALL USING (is_admin());

-- SEED DATA: configuración inicial
INSERT INTO config (key, value) VALUES
  ('condominio', '{"nombre": "Condominio Eucaliptus", "direccion": "", "contacto": ""}'),
  ('montos', '{"monto_mensual": 50000, "fondo_reserva": 15000, "moneda": "CLP"}'),
  ('categorias_documentos', '["Estatuto", "Actas", "Contratos", "Seguros", "Planos"]'),
  ('rubros_proveedores', '["Jardinería", "Limpieza", "Electricidad", "Plomería", "Seguridad", "Mantenimiento", "Otro"]')
ON CONFLICT (key) DO NOTHING;
