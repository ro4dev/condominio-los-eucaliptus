-- ============================================
-- Fix: recrear encuestas con schema correcto
-- (027 fue modificado después de aplicarse)
-- ============================================

DROP TABLE IF EXISTS encuestas_votos;
DROP TABLE IF EXISTS encuestas;

CREATE TABLE encuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  alternativas JSONB DEFAULT '[]'::jsonb,
  fecha_termino DATE,
  quorum INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE encuestas_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id UUID REFERENCES encuestas(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  seleccion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(encuesta_id, parcela_id)
);

ALTER TABLE encuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE encuestas_votos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "encuestas_select" ON encuestas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "encuestas_votos_select" ON encuestas_votos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "encuestas_insert" ON encuestas
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "encuestas_update" ON encuestas
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "encuestas_delete" ON encuestas
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "encuestas_votos_insert" ON encuestas_votos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "encuestas_votos_delete" ON encuestas_votos
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
