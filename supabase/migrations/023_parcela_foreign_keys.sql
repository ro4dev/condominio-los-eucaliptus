-- ============================================
-- Migrar referencias de parcela a foreign keys
-- ============================================

-- 1. Agregar columnas parcela_id
ALTER TABLE propietarios ADD COLUMN parcela_id UUID REFERENCES parcelas(id);
ALTER TABLE gastos ADD COLUMN parcela_id UUID REFERENCES parcelas(id);
ALTER TABLE reclamos ADD COLUMN parcela_id UUID REFERENCES parcelas(id);

-- 2. Migrar datos de texto a UUID
UPDATE propietarios SET parcela_id = p.id FROM parcelas p WHERE propietarios.parcela = p.numero;
UPDATE gastos SET parcela_id = p.id FROM parcelas p WHERE gastos.parcela = p.numero;
UPDATE reclamos SET parcela_id = p.id FROM parcelas p WHERE reclamos.parcela = p.numero;

-- 3. Crear tabla asamblea_asistentes
CREATE TABLE asamblea_asistentes (
  asamblea_id UUID REFERENCES asambleas(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  PRIMARY KEY (asamblea_id, parcela_id)
);

-- 4. Migrar asistentes de texto comma-separated a junction table
DO $$
DECLARE
  rec RECORD;
  item TEXT;
  parcela_name TEXT;
BEGIN
  FOR rec IN SELECT id, asistentes FROM asambleas WHERE asistentes IS NOT NULL AND asistentes != '' LOOP
    FOR item IN SELECT unnest(string_to_array(rec.asistentes, ',')) LOOP
      parcela_name := trim(item);
      INSERT INTO asamblea_asistentes (asamblea_id, parcela_id)
      SELECT rec.id, p.id FROM parcelas p WHERE p.numero = parcela_name
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- 5. Dropear columnas de texto
ALTER TABLE propietarios DROP COLUMN parcela;
ALTER TABLE gastos DROP COLUMN parcela;
ALTER TABLE reclamos DROP COLUMN parcela;
ALTER TABLE asambleas DROP COLUMN asistentes;
