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

CREATE POLICY "Admins can read config" ON config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update config" ON config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert config" ON config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- RLS: solo admins pueden ver/gestionar admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read admin_users" ON admin_users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage admin_users" ON admin_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  );

-- SEED DATA: configuración inicial
INSERT INTO config (key, value) VALUES
  ('condominio', '{"nombre": "Condominio Eucaliptus", "direccion": "", "contacto": ""}'),
  ('montos', '{"monto_mensual": 50000, "fondo_reserva": 15000, "moneda": "CLP"}'),
  ('categorias_documentos', '["Estatuto", "Actas", "Contratos", "Seguros", "Planos"]'),
  ('rubros_proveedores', '["Jardinería", "Limpieza", "Electricidad", "Plomería", "Seguridad", "Mantenimiento", "Otro"]')
ON CONFLICT (key) DO NOTHING;
