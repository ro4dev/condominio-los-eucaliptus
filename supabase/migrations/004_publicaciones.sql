-- ============================================
-- Condominio Los Eucaliptus - Publicaciones de venta
-- ============================================

-- PUBLICACIONES DE VENTA
CREATE TABLE publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Producto', 'Servicio')),
  precio NUMERIC,
  contacto TEXT,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Vendido')),
  foto TEXT,
  usuario TEXT,               -- email del autor (auth.jwt() ->> 'email')
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE publicaciones ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS: SELECT cualquiera autenticado
--      INSERT cualquier autenticado (autor forzado)
--      UPDATE/DELETE autor o admin
-- ============================================
CREATE POLICY "publicaciones_select" ON publicaciones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "publicaciones_insert" ON publicaciones
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = usuario);

CREATE POLICY "publicaciones_update" ON publicaciones
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = usuario
      OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'email' = usuario
      OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "publicaciones_delete" ON publicaciones
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'email' = usuario
      OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
