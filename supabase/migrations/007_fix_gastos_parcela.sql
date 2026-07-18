-- ============================================
-- Fix: asignar gasto sin parcela a Parcela 6
-- ============================================

UPDATE gastos SET parcela_id = (SELECT id FROM parcelas WHERE numero = 'Parcela 6')
WHERE parcela_id IS NULL;
