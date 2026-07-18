-- ============================================
-- Fix: Recrear políticas SELECT con USING (true)
-- Las anteriores se crearon con auth.role() = 'authenticated'
-- ============================================

DROP POLICY IF EXISTS "parcelas_select" ON parcelas;
DROP POLICY IF EXISTS "propietarios_select" ON propietarios;
DROP POLICY IF EXISTS "gastos_select" ON gastos;
DROP POLICY IF EXISTS "flujo_select" ON flujo;
DROP POLICY IF EXISTS "noticias_select" ON noticias;
DROP POLICY IF EXISTS "documentos_select" ON documentos;
DROP POLICY IF EXISTS "reclamos_select" ON reclamos;
DROP POLICY IF EXISTS "proveedores_select" ON proveedores;
DROP POLICY IF EXISTS "asambleas_select" ON asambleas;

CREATE POLICY "parcelas_select" ON parcelas FOR SELECT USING (true);
CREATE POLICY "propietarios_select" ON propietarios FOR SELECT USING (true);
CREATE POLICY "gastos_select" ON gastos FOR SELECT USING (true);
CREATE POLICY "flujo_select" ON flujo FOR SELECT USING (true);
CREATE POLICY "noticias_select" ON noticias FOR SELECT USING (true);
CREATE POLICY "documentos_select" ON documentos FOR SELECT USING (true);
CREATE POLICY "reclamos_select" ON reclamos FOR SELECT USING (true);
CREATE POLICY "proveedores_select" ON proveedores FOR SELECT USING (true);
CREATE POLICY "asambleas_select" ON asambleas FOR SELECT USING (true);

SELECT pg_notify('pgrst', 'reload schema');
