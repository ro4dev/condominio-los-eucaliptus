-- ============================================
-- Condominio Los Eucaliptus - Pagos de cuotas
-- ============================================

-- Tabla de pagos: cada pago se asocia a una cuota (gasto)
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_id UUID REFERENCES gastos(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  fecha DATE NOT NULL,
  comprobante TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_pagos_gasto ON pagos(gasto_id);
CREATE INDEX idx_pagos_periodo ON pagos(periodo);
CREATE INDEX idx_pagos_parcela ON pagos(parcela_id);

-- RLS
ALTER TABLE pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pagos_select" ON pagos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pagos_insert" ON pagos
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "pagos_update" ON pagos
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

CREATE POLICY "pagos_delete" ON pagos
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ============================================
-- Migración de cuotas ya pagadas a pagos
-- (idempotente: no duplica pagos existentes)
-- ============================================
INSERT INTO pagos (gasto_id, parcela_id, periodo, monto, fecha, comprobante)
SELECT g.id, g.parcela_id, g.periodo, g.monto::numeric, (g.periodo || '-10')::date, g.archivo
FROM gastos g
WHERE g.pagado = 'Sí'
  AND NOT EXISTS (
    SELECT 1 FROM pagos p WHERE p.gasto_id = g.id
  );
