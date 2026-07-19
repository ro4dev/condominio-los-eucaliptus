-- ============================================
-- Renombrar monto_mensual → gasto_comun_base
-- y eliminar moneda de config
-- ============================================

UPDATE config SET value = jsonb_build_object(
  'gasto_comun_base', value->'monto_mensual',
  'fondo_reserva', value->'fondo_reserva'
) WHERE key = 'montos';
