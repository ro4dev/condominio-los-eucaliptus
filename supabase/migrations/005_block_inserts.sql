-- ============================================
-- Bloquear INSERT hasta que se implemente auth
-- ============================================

DROP POLICY IF EXISTS "parcelas_insert" ON parcelas;
DROP POLICY IF EXISTS "propietarios_insert" ON propietarios;
DROP POLICY IF EXISTS "gastos_insert" ON gastos;
DROP POLICY IF EXISTS "flujo_insert" ON flujo;
DROP POLICY IF EXISTS "noticias_insert" ON noticias;
DROP POLICY IF EXISTS "documentos_insert" ON documentos;
DROP POLICY IF EXISTS "reclamos_insert" ON reclamos;
DROP POLICY IF EXISTS "proveedores_insert" ON proveedores;
DROP POLICY IF EXISTS "asambleas_insert" ON asambleas;

CREATE POLICY "parcelas_insert" ON parcelas FOR INSERT WITH CHECK (false);
CREATE POLICY "propietarios_insert" ON propietarios FOR INSERT WITH CHECK (false);
CREATE POLICY "gastos_insert" ON gastos FOR INSERT WITH CHECK (false);
CREATE POLICY "flujo_insert" ON flujo FOR INSERT WITH CHECK (false);
CREATE POLICY "noticias_insert" ON noticias FOR INSERT WITH CHECK (false);
CREATE POLICY "documentos_insert" ON documentos FOR INSERT WITH CHECK (false);
CREATE POLICY "reclamos_insert" ON reclamos FOR INSERT WITH CHECK (false);
CREATE POLICY "proveedores_insert" ON proveedores FOR INSERT WITH CHECK (false);
CREATE POLICY "asambleas_insert" ON asambleas FOR INSERT WITH CHECK (false);

SELECT pg_notify('pgrst', 'reload schema');
