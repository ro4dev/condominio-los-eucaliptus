-- ============================================
-- Fix: Limpiar policies viejas + completar RLS
-- ============================================

-- 1. Eliminar función is_admin() que referencia admin_users (ya no existe)
DROP FUNCTION IF EXISTS is_admin();

-- 2. Eliminar policies viejas de config que usaban is_admin()
DROP POLICY IF EXISTS "Admins can update config" ON config;
DROP POLICY IF EXISTS "Admins can insert config" ON config;

-- 3. asamblea_asistentes: habilitar API y agregar policies authenticated
ALTER TABLE asamblea_asistentes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "asamblea_asistentes_select" ON asamblea_asistentes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "asamblea_asistentes_insert" ON asamblea_asistentes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "asamblea_asistentes_delete" ON asamblea_asistentes
  FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Agregar DELETE policies donde faltan
CREATE POLICY "documentos_delete" ON documentos
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "flujo_delete" ON flujo
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "noticias_delete" ON noticias
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "proveedores_delete" ON proveedores
  FOR DELETE USING (auth.role() = 'authenticated');
