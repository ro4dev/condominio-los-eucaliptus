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
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "parcelas_insert" ON parcelas
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "parcelas_update" ON parcelas
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "parcelas_delete" ON parcelas
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- PROPIETARIOS
-- ============================================
CREATE POLICY "propietarios_select" ON propietarios
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "propietarios_insert" ON propietarios
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "propietarios_update" ON propietarios
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "propietarios_delete" ON propietarios
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- GASTOS
-- ============================================
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "gastos_update" ON gastos
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "gastos_delete" ON gastos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- FLUJO (INGRESOS/EGRESOS)
-- ============================================
CREATE POLICY "flujo_select" ON flujo
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "flujo_insert" ON flujo
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "flujo_update" ON flujo
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "flujo_delete" ON flujo
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- NOTICIAS
-- ============================================
CREATE POLICY "noticias_select" ON noticias
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "noticias_insert" ON noticias
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "noticias_update" ON noticias
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "noticias_delete" ON noticias
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- DOCUMENTOS
-- ============================================
CREATE POLICY "documentos_select" ON documentos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "documentos_insert" ON documentos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "documentos_update" ON documentos
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "documentos_delete" ON documentos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- RECLAMOS (INSERT para cualquier autenticado)
-- ============================================
CREATE POLICY "reclamos_select" ON reclamos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "reclamos_insert" ON reclamos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reclamos_update" ON reclamos
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "reclamos_delete" ON reclamos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- PROVEEDORES
-- ============================================
CREATE POLICY "proveedores_select" ON proveedores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "proveedores_update" ON proveedores
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "proveedores_delete" ON proveedores
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- ASAMBLEAS
-- ============================================
CREATE POLICY "asambleas_select" ON asambleas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "asambleas_insert" ON asambleas
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "asambleas_update" ON asambleas
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "asambleas_delete" ON asambleas
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- ASAMBLEA ASISTENTES
-- ============================================
CREATE POLICY "asamblea_asistentes_select" ON asamblea_asistentes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "asamblea_asistentes_insert" ON asamblea_asistentes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "asamblea_asistentes_delete" ON asamblea_asistentes
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- ENCUESTAS
-- ============================================
CREATE POLICY "encuestas_select" ON encuestas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "encuestas_insert" ON encuestas
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "encuestas_update" ON encuestas
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "encuestas_delete" ON encuestas
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- ENCUESTAS VOTOS (INSERT para cualquier autenticado)
-- ============================================
CREATE POLICY "encuestas_votos_select" ON encuestas_votos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "encuestas_votos_insert" ON encuestas_votos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "encuestas_votos_delete" ON encuestas_votos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- CONFIG
-- ============================================
CREATE POLICY "config_select" ON config
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "config_insert" ON config
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "config_update" ON config
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "config_delete" ON config
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
