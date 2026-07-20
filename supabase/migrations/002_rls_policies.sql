-- ============================================
-- Condominio Los Eucaliptus - Políticas RLS
-- ============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE propietarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE flujo ENABLE ROW LEVEL SECURITY;
ALTER TABLE noticias ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE asambleas ENABLE ROW LEVEL SECURITY;
ALTER TABLE asamblea_asistentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuestas_votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PARCELAS
-- ============================================
CREATE POLICY "parcelas_select" ON parcelas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "parcelas_insert" ON parcelas
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "parcelas_update" ON parcelas
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "parcelas_delete" ON parcelas
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- PROPIETARIOS
-- ============================================
CREATE POLICY "propietarios_select" ON propietarios
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "propietarios_insert" ON propietarios
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "propietarios_update" ON propietarios
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "propietarios_delete" ON propietarios
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- GASTOS
-- ============================================
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "gastos_update" ON gastos
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "gastos_delete" ON gastos
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- FLUJO (INGRESOS/EGRESOS)
-- ============================================
CREATE POLICY "flujo_select" ON flujo
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "flujo_insert" ON flujo
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "flujo_update" ON flujo
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "flujo_delete" ON flujo
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- NOTICIAS
-- ============================================
CREATE POLICY "noticias_select" ON noticias
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "noticias_insert" ON noticias
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "noticias_update" ON noticias
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "noticias_delete" ON noticias
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- DOCUMENTOS
-- ============================================
CREATE POLICY "documentos_select" ON documentos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "documentos_insert" ON documentos
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "documentos_update" ON documentos
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "documentos_delete" ON documentos
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- RECLAMOS (INSERT para cualquier autenticado)
-- ============================================
CREATE POLICY "reclamos_select" ON reclamos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reclamos_insert" ON reclamos
  FOR INSERT TO authenticated USING (true);

CREATE POLICY "reclamos_update" ON reclamos
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "reclamos_delete" ON reclamos
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- PROVEEDORES
-- ============================================
CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "proveedores_update" ON proveedores
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "proveedores_delete" ON proveedores
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- ASAMBLEAS
-- ============================================
CREATE POLICY "asambleas_select" ON asambleas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "asambleas_insert" ON asambleas
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "asambleas_update" ON asambleas
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "asambleas_delete" ON asambleas
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- ASAMBLEA ASISTENTES
-- ============================================
CREATE POLICY "asamblea_asistentes_select" ON asamblea_asistentes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "asamblea_asistentes_insert" ON asamblea_asistentes
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "asamblea_asistentes_delete" ON asamblea_asistentes
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- ENCUESTAS
-- ============================================
CREATE POLICY "encuestas_select" ON encuestas
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "encuestas_insert" ON encuestas
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "encuestas_update" ON encuestas
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "encuestas_delete" ON encuestas
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- ENCUESTAS VOTOS (INSERT para cualquier autenticado)
-- ============================================
CREATE POLICY "encuestas_votos_select" ON encuestas_votos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "encuestas_votos_insert" ON encuestas_votos
  FOR INSERT TO authenticated USING (true);

CREATE POLICY "encuestas_votos_delete" ON encuestas_votos
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- CONFIG
-- ============================================
CREATE POLICY "config_select" ON config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "config_insert" ON config
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "config_update" ON config
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "config_delete" ON config
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
