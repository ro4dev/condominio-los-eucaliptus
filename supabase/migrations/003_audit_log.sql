-- ============================================
-- Condominio Los Eucaliptus - Auditoría de cambios
-- ============================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id TEXT,
  datos JSONB,            -- snapshot del registro (solo UPDATE/DELETE)
  usuario TEXT,           -- email del usuario autenticado
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Lectura: solo admin
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Escritura: cualquier autenticado (insert desde JS vía logAudit)
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
