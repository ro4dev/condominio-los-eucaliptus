-- ============================================
-- Fix: campos NOT NULL que faltaban
-- ============================================

-- Parcelas: metros NOT NULL
UPDATE parcelas SET metros = 0 WHERE metros IS NULL;
ALTER TABLE parcelas ALTER COLUMN metros SET NOT NULL;

-- Propietarios: parcela NOT NULL
UPDATE propietarios SET parcela = 'Sin asignar' WHERE parcela IS NULL;
ALTER TABLE propietarios ALTER COLUMN parcela SET NOT NULL;

-- Proveedores: contacto NOT NULL
UPDATE proveedores SET contacto = 'Sin contacto' WHERE contacto IS NULL;
ALTER TABLE proveedores ALTER COLUMN contacto SET NOT NULL;
