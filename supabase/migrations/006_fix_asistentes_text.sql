-- ============================================
-- Fix: asistentes debe ser texto (lista de parcelas), no NUMÉRICO
-- ============================================

ALTER TABLE asambleas ALTER COLUMN asistentes TYPE TEXT;

-- Actualizar datos de ejemplo
UPDATE asambleas SET asistentes = 'Parcela 1, Parcela 2, Parcela 3, Parcela 4, Parcela 5, Parcela 6' WHERE fecha = '2026-06-15';
UPDATE asambleas SET asistentes = 'Parcela 1, Parcela 2, Parcela 3, Parcela 5, Parcela 7' WHERE fecha = '2026-07-20';
