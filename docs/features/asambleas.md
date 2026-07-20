# Asambleas

## Qué es
Registro de asambleas de copropietarios y sus asistentes.

## Tablas involucradas
- `asambleas` — asambleas realizadas
- `asamblea_asistentes` — junction table de asistencia

## Campos asambleas
- `fecha` (DATE) — fecha de la asamblea
- `tipo` (TEXT) — "Ordinaria" o "Extraordinaria"
- `temario` (TEXT) — puntos a tratar
- `acuerdos` (TEXT) — decisiones tomadas (opcional)

## Campos asamblea_asistentes
- `asamblea_id` (UUID FK) — asamblea
- `parcela_id` (UUID FK) — parcela asistente

## Cómo funciona
1. Admin crea asambleas via modal
2. Selector múltiple para marcar asistentes (parcelas disponibles)
3. Botón "Seleccionar todas" para marcar todas
4. Filtros chips: Todos / Ordinarias / Extraordinarias
5. Timeline con cards coloreadas por tipo (azul=ordinaria, amarillo=extraordinaria)
6. Muestra asistentes como chips en cada card

## Permisos
- SELECT: usuarios autenticados
- INSERT/UPDATE/DELETE: solo admin

## Propósito
Registro formal de asambleas y control de asistencia de copropietarios.
