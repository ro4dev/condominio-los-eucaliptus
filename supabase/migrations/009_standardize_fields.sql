-- ============================================
-- Fix: estandarizar campos y nombres snake_case
-- ============================================

-- PROPIETARIOS: parcela_id UUID → parcela TEXT
ALTER TABLE propietarios ADD COLUMN parcela TEXT;
UPDATE propietarios SET parcela = (SELECT numero FROM parcelas WHERE id = propietarios.parcela_id);
ALTER TABLE propietarios DROP CONSTRAINT IF EXISTS propietarios_parcela_id_fkey;
ALTER TABLE propietarios DROP COLUMN parcela_id;

-- RECLAMOS: parcela_id UUID → parcela TEXT
ALTER TABLE reclamos ADD COLUMN parcela TEXT;
UPDATE reclamos SET parcela = (SELECT numero FROM parcelas WHERE id = reclamos.parcela_id);
ALTER TABLE reclamos DROP CONSTRAINT IF EXISTS reclamos_parcela_id_fkey;
ALTER TABLE reclamos DROP COLUMN parcela_id;

-- NOTICIAS: agregar fecha
ALTER TABLE noticias ADD COLUMN fecha DATE;
UPDATE noticias SET fecha = fecha_hasta - INTERVAL '7 days';

-- DOCUMENTOS: agregar fecha
ALTER TABLE documentos ADD COLUMN fecha DATE;
