-- ============================================
-- Fix: RLS correcto según modelo de permisos
-- ============================================
-- Tabla de permisos:
--   SELECT: todos autenticados
--   INSERT: solo admin (excepto reclamos = authenticated)
--   UPDATE/DELETE: solo admin

-- ============================================
-- 1. DROP policies incorrectas
-- ============================================

-- 024: authenticated update/insert/delete que deben ser admin
DROP POLICY IF EXISTS "parcelas_update" ON parcelas;
DROP POLICY IF EXISTS "propietarios_update" ON propietarios;
DROP POLICY IF EXISTS "gastos_update" ON gastos;
DROP POLICY IF EXISTS "reclamos_update" ON reclamos;
DROP POLICY IF EXISTS "asambleas_update" ON asambleas;
DROP POLICY IF EXISTS "config_update" ON config;
DROP POLICY IF EXISTS "config_insert" ON config;
DROP POLICY IF EXISTS "config_delete" ON config;
DROP POLICY IF EXISTS "reclamos_delete" ON reclamos;

-- 025: authenticated insert/delete que deben ser admin
DROP POLICY IF EXISTS "asamblea_asistentes_insert" ON asamblea_asistentes;
DROP POLICY IF EXISTS "asamblea_asistentes_delete" ON asamblea_asistentes;
DROP POLICY IF EXISTS "documentos_delete" ON documentos;
DROP POLICY IF EXISTS "flujo_delete" ON flujo;
DROP POLICY IF EXISTS "noticias_delete" ON noticias;
DROP POLICY IF EXISTS "proveedores_delete" ON proveedores;

-- ============================================
-- 2. Crear policies correctas
-- ============================================

-- asamblea_asistentes: admin ALL, SELECT authenticated
CREATE POLICY "asamblea_asistentes_insert" ON asamblea_asistentes
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "asamblea_asistentes_update" ON asamblea_asistentes
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "asamblea_asistentes_delete" ON asamblea_asistentes
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- asambleas: admin ALL, SELECT authenticated
CREATE POLICY "asambleas_update" ON asambleas
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "asambleas_delete" ON asambleas
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- config: admin ALL, SELECT authenticated
CREATE POLICY "config_insert" ON config
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "config_update" ON config
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "config_delete" ON config
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- documentos: admin ALL, SELECT authenticated
CREATE POLICY "documentos_insert" ON documentos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "documentos_update" ON documentos
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "documentos_delete" ON documentos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- flujo: admin ALL, SELECT authenticated
CREATE POLICY "flujo_insert" ON flujo
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "flujo_update" ON flujo
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "flujo_delete" ON flujo
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- gastos: admin ALL, SELECT authenticated
CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "gastos_update" ON gastos
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "gastos_delete" ON gastos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- noticias: admin ALL, SELECT authenticated
CREATE POLICY "noticias_insert" ON noticias
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "noticias_update" ON noticias
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "noticias_delete" ON noticias
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- parcelas: admin ALL, SELECT authenticated
CREATE POLICY "parcelas_insert" ON parcelas
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "parcelas_update" ON parcelas
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "parcelas_delete" ON parcelas
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- propietarios: admin ALL, SELECT authenticated
CREATE POLICY "propietarios_insert" ON propietarios
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "propietarios_update" ON propietarios
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "propietarios_delete" ON propietarios
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- proveedores: admin ALL, SELECT authenticated
CREATE POLICY "proveedores_insert" ON proveedores
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "proveedores_update" ON proveedores
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "proveedores_delete" ON proveedores
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- reclamos: INSERT authenticated, UPDATE/DELETE admin, SELECT authenticated
CREATE POLICY "reclamos_insert" ON reclamos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reclamos_update" ON reclamos
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "reclamos_delete" ON reclamos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
