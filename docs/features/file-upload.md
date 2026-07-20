# Upload de Archivos

## Qué es
Sistema de subida de archivos a Supabase Storage.

## Buckets
| Bucket | Uso |
|--------|-----|
| `gastos_comunes` | Comprobantes de gastos |
| `ingresos_egresos` | Comprobantes de flujo |
| `documentos` | Archivos de documentos |

## Cómo funciona
1. Forms con campo `<input type="file">`
2. Al enviar, archivo se sube a bucket correspondiente
3. Path organizado: `folder/timestamp.ext`
4. URL pública se guarda en campo de la tabla
5. Links "Ver" abren archivo en nueva pestaña

## Funciones JS
- `supabaseUpload(file, bucket, folder)` — sube archivo y retorna URL
- Se llama desde `handleForm()` antes de insertar registro

## Carpetas por tabla
- gastos: `periodo/` (ej: "2026-07")
- flujo: `YYYY-MM-tipo/` (ej: "2026-07-Ingreso")
- documentos: `categoria/` (ej: "Actas")

## Permisos
- Upload requiere usuario autenticado

## Propósito
Almacenar comprobantes y documentos adjuntos accesibles vía URL.
