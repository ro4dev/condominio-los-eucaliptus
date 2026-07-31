# Upload de Archivos

## Descripción general

Sistema de subida de archivos a Supabase Storage, utilizado por tres módulos para adjuntar comprobantes y documentos. Los archivos se organizan en buckets y carpetas según su tipo y origen.

## Buckets de Storage

| Bucket | Uso | Módulo |
|--------|-----|--------|
| `gastos_comunes` | Comprobantes de pago de gastos comunes | Gastos Comunes |
| `ingresos_egresos` | Comprobantes de movimientos financieros | Ingresos/Egresos |
| `documentos` | Archivos de documentos oficiales | Documentos |

## Función de upload

No hay una función `supabaseUpload()` visible en el código base actual (está en `supabase-config.js` que no se debe modificar). La función se invoca desde `handleForm()`:

```js
var fileInput = form.querySelector('input[type="file"]');
var filePromise = Promise.resolve(null);
if (fileInput && fileInput.files.length > 0) {
  var bucket = form.dataset.bucket || 'gastos_comunes';
  var folder = '';
  if (table === 'gastos' && data.periodo) {
    folder = data.periodo;
  } else if (table === 'flujo' && data.fecha && data.tipo) {
    folder = data.fecha.slice(0, 7) + '-' + data.tipo;
  } else if (table === 'documentos' && data.categoria) {
    folder = data.categoria;
  }
  filePromise = supabaseUpload(fileInput.files[0], bucket, folder);
}
```

## Organización de carpetas

| Módulo | Carpeta | Ejemplo |
|--------|---------|---------|
| Gastos | `{periodo}/` | `2026-07/comprobante_12345.jpg` |
| Flujo | `{YYYY-MM}-{tipo}/` | `2026-07-Ingreso/comprobante_12345.jpg` |
| Documentos | `{categoria}/` | `Actas/acta_reunion_12345.pdf` |

## Flujo de upload

```
handleForm()
  → detecta input[type="file"] con archivo
  → determina bucket (data-bucket del form) y carpeta
  → llama supabaseUpload(file, bucket, folder)
  → espera URL de retorno
  → asigna URL al campo correspondiente (data[fileInput.name] = fileUrl)
  → inserta/actualiza registro con la URL
```

### En modo demo
```js
// No se ejecuta upload. filePromise = Promise.resolve(null)
// El campo archivo queda undefined
```

### En producción
1. El archivo se sube a Supabase Storage
2. Se obtiene la URL pública
3. La URL se guarda en el campo `archivo` o `comprobante` de la tabla

## Visualización de archivos

### Enlaces "Ver"
Cuando existe una URL de archivo, se muestra un link al archivo:
- **Gastos**: link "Ver" en la columna Comprobante de la tabla
- **Flujo**: icono `receipt` en cada card
- **Documentos**: icono `description` en cada documento

Todos los links abren en nueva pestaña (`target="_blank"`).

### Archivo actual en edición
Al editar un registro existente que tiene archivo:
```
<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">
  Archivo actual: <a href="{url}" target="_blank">ver</a>
</div>
```

## Tipos de archivo

| Módulo | accept | Tipo esperado |
|--------|--------|---------------|
| Gastos | `image/*` | Fotos/comprobantes |
| Flujo | `image/*` | Fotos/comprobantes |
| Documentos | sin filtro | PDF, imágenes, etc. |

## Compresión de imágenes
El HTML incluye `browser-image-compression`:
```html
<script src="https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.1/dist/browser-image-compression.js"></script>
```
Esta librería puede ser usada por `supabaseUpload()` para comprimir imágenes antes de subir (la implementación está en `supabase-config.js`).

## Permisos
- Upload requiere usuario autenticado (manejado por Supabase Storage policies)
- Las URLs públicas son accesibles sin autenticación (para visualización)
- No hay límite de tamaño configurado en la app (depende de Supabase)

## Propósito
Almacenar comprobantes y documentos adjuntos accesibles vía URL pública, organizados por tipo y origen para facilitar su localización y consulta.
