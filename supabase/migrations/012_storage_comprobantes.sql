-- ============================================
-- Crear bucket para comprobantes de gastos
-- ============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('gastos_comunes', 'gastos_comunes', true);

-- Permitir upload a usuarios autenticados
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gastos_comunes' AND
    auth.role() = 'authenticated'
  );

-- Permitir lectura pública
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gastos_comunes');
