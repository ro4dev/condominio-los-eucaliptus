-- ============================================
-- Crear buckets para archivos
-- ============================================

-- Bucket para ingresos/egresos
INSERT INTO storage.buckets (id, name, public) VALUES ('ingresos_egresos', 'ingresos_egresos', true);

CREATE POLICY "authenticated_upload_flujo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ingresos_egresos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "public_read_flujo" ON storage.objects
  FOR SELECT USING (bucket_id = 'ingresos_egresos');

-- Bucket para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true);

CREATE POLICY "authenticated_upload_documentos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documentos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "public_read_documentos" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos');
