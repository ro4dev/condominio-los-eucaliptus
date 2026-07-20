# Ingresos/Egresos

## Qué es
Registro de movimientos financieros del condominio (ingresos y egresos).

## Tablas involucradas
- `flujo` — movimientos financieros

## Campos
- `fecha` (DATE) — fecha del movimiento
- `tipo` (TEXT) — "Ingreso" o "Egreso"
- `concepto` (TEXT) — descripción del movimiento
- `monto` (NUMERIC) — monto del movimiento
- `descripcion` (TEXT) — detalle adicional (opcional)
- `comprobante` (TEXT) — URL de comprobante subido a Supabase Storage
- `registrado_por` (TEXT) — email del usuario que registró (auto-llenado)
- `created_at` (TIMESTAMPTZ) — fecha de creación automática

## Cómo funciona
1. Admin crea movimientos via modal
2. Se muestran stats: total ingresos, egresos, balance y cantidad de movimientos
3. Filtros chips: Todos / Ingresos / Egresos
4. Cards con borde coloreado por tipo (verde=ingreso, rojo=egreso)
5. Comprobante como link adjunto

## Permisos
- SELECT: usuarios autenticados
- INSERT/UPDATE/DELETE: solo admin

## Propósito
Control de flujo de caja del condominio, segregando ingresos y egresos.
