# Noticias

## Qué es
Tablero de noticias y avisos para residentes del condominio.

## Tablas involucradas
- `noticias` — publicaciones del admin

## Campos
- `titulo` (TEXT) — título de la noticia
- `descripcion` (TEXT) — contenido de la noticia
- `fecha` (DATE) — fecha de publicación (auto-generada si no se indica)
- `fecha_hasta` (DATE) — fecha de vigencia (opcional)
- `created_at` (TIMESTAMPTZ) — fecha de creación automática

## Cómo funciona
1. Admin crea noticias via modal
2. Noticias activas se muestran por defecto (fecha_hasta >= hoy o sin fecha_hasta)
3. Noticias vencidas se ocultan, con botón "Ver X noticias anteriores"
4. Toggle para mostrar/ocultar noticias vencidas
5. Ordenadas por fecha de publicación (más nuevas primero)

## Permisos
- SELECT: usuarios autenticados
- INSERT/UPDATE/DELETE: solo admin

## Propósito
Comunicar avisos, alertas y novedades del condominio a los residentes.
