# Reclamos/Sugerencias

## Qué es
Sistema de reclamos y sugerencias donde cualquier residente puede participar.

## Tablas involucradas
- `reclamos` — reclamos y sugerencias de residentes

## Campos
- `tipo` (TEXT) — "Reclamo" o "Sugerencia"
- `parcela_id` (UUID FK) — parcela del reclamante (opcional, permite anónimo)
- `asunto` (TEXT) — asunto del reclamo
- `descripcion` (TEXT) — detalle del problema o sugerencia
- `created_at` (TIMESTAMPTZ) — fecha de creación automática

## Cómo funciona
1. **Cualquier usuario autenticado** puede crear reclamos (no solo admin)
2. Opción de adjuntar parcela o ser anónimo
3. Filtros chips: Todos / Reclamos / Sugerencias
4. Cards coloreadas según tipo

## Permisos
- SELECT: usuarios autenticados
- INSERT: **usuarios autenticados** (no solo admin)
- UPDATE/DELETE: solo admin

## Propósito
Canal de comunicación para que residentes reporten problemas o sugieran mejoras.
