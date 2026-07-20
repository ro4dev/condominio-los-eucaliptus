# Encuestas

## Qué es
Sistema de votación para propuestas del condominio.

## Tablas involucradas
- `encuestas` — encuestas/votaciones
- `encuestas_votos` — votos registrados

## Campos encuestas
- `titulo` (TEXT) — título de la propuesta
- `descripcion` (TEXT) — detalle de la propuesta (opcional)
- `alternativas` (JSONB) — array de opciones de voto
- `fecha_termino` (DATE) — fecha límite de votación (opcional)
- `quorum` (INTEGER) — mínimo de votos requeridos (opcional)

## Campos encuestas_votos
- `encuesta_id` (UUID FK) — encuesta
- `parcela_id` (UUID FK) — parcela que votó
- `seleccion` (TEXT) — opción elegida
- UNIQUE(encuesta_id, parcela_id) — un voto por parcela

## Cómo funciona
1. Admin crea encuestas via modal con toggle de alternativas
2. **Modo simple** (sin alternativas): "A favor" / "En contra"
3. **Modo alternativas**: opciones personalizadas (agregar/quitar dinámicamente)
4. Cada usuario vota una vez por encuesta (asociado a su parcela via propietarios)
5. Barra de progreso por opción con porcentaje
6. Indicador de quorum alcanzado
7. Auto-cierre por fecha_termino
8. Filtros: Todas / Abiertas / Cerradas

## Permisos
- SELECT: usuarios autenticados
- INSERT encuestas: solo admin
- INSERT votos: **usuarios autenticados**
- DELETE: solo admin

## Propósito
Votaciones transparentes para decisiones del condominio con control de quorum.
