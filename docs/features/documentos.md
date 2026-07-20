# Documentos

## Qué es
Repositorio de documentos oficiales del condominio.

## Tablas involucradas
- `documentos` — documentos categorizados

## Campos
- `nombre` (TEXT) — nombre del documento
- `categoria` (TEXT) — "Estatuto", "Actas", "Contratos", "Seguros" o "Planos"
- `fecha` (DATE) — fecha del documento (auto-generada si no se indica)
- `descripcion` (TEXT) — resumen del documento (opcional)
- `archivo` (TEXT) — URL del archivo subido a Supabase Storage
- `created_at` (TIMESTAMPTZ) — fecha de creación automática

## Cómo funciona
1. Admin crea documentos via modal con categoría predefinida
2. Filtros chips por categoría: Todos / Estatuto / Actas / Contratos / Seguros / Planos
3. Cada ítem muestra ícono según categoría, nombre, categoría y fecha
4. Link "Ver" para abrir archivo adjunto

## Permisos
- SELECT: usuarios autenticados
- INSERT/UPDATE/DELETE: solo admin

## Propósito
Almacenar y organizar documentos oficiales del condominio para consulta de residentes.
