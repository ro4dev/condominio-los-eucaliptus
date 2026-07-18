-- ============================================
-- Fix: gastos usa parcela como texto, no UUID
-- ============================================

-- Agregar columna parcela como texto
ALTER TABLE gastos ADD COLUMN parcela TEXT;

-- Copiar datos de parcela_id a parcela
UPDATE gastos SET parcela = (SELECT numero FROM parcelas WHERE id = gastos.parcela_id);

-- Eliminar foreign key y columna parcela_id
ALTER TABLE gastos DROP CONSTRAINT IF EXISTS gastos_parcela_id_fkey;
ALTER TABLE gastos DROP COLUMN parcela_id;

-- NOTA: Ejecutar esto DESPUÉS de actualizar los datos de ejemplo
-- para que tengan la columna parcela con los valores correctos
