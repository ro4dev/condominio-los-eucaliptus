# Gastos Comunes

## Qué es
Módulo principal del sistema. Registra y visualiza los gastos comunes que cada parcela debe pagar mensualmente.

## Tablas involucradas
- `gastos` — registros de gastos por parcela y periodo
- `parcelas` — referencia para mostrar número de parcela

## Campos
- `parcela_id` (UUID FK) — parcela que genera el gasto
- `periodo` (TEXT) — mes del gasto (formato YYYY-MM)
- `monto` (NUMERIC) — monto a pagar
- `descripcion` (TEXT) — detalle del gasto (opcional)
- `archivo` (TEXT) — URL de comprobante subido a Supabase Storage
- `created_at` (TIMESTAMPTZ) — fecha de creación automática

## Cómo funciona
1. Admin crea gastos via modal, seleccionando periodo y parcela
2. Sistema valida que no exista gasto duplicado para misma parcela+periodo
3. Al cambiar periodo, el selector de parcelas filtra las que ya tienen gasto
4. Usuarios autenticados ven la tabla con filtros por periodo y parcela
5. Stats muestran total recaudado, registros, periodos y parcelas
6. Charts muestran distribución por parcela y evolución mensual

## Permisos
- SELECT: usuarios autenticados
- INSERT/UPDATE/DELETE: solo admin

## Propósito
Controlar el cobro de gastos comunes del condominio, evitando duplicidades y permitiendo seguimiento de pagos.
