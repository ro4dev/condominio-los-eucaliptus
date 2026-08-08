# Documentos

## 1. Descripción general

Repositorio de documentos oficiales del condominio clasificados por categorías configurables. Cada documento tiene nombre, categoría, fecha, descripción (visible en modal) y archivo adjunto opcional.

ID del tab: `documentos`
Contenedor: `<div id="tab-documentos">`

## 2. Schema SQL

```sql
CREATE TABLE documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,              -- desde config categorias_documentos
  fecha DATE,                           -- autogenerada si no se provee
  descripcion TEXT,
  archivo TEXT,                         -- URL en Supabase Storage
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/documentos.json)

```json
[
  {
    "id": "d1",
    "nombre": "Estatuto Condominio",
    "categoria": "Estatuto",
    "fecha": "2020-01-15",
    "descripcion": "Estatuto actualizado del condominio Los Eucaliptus, aprobado en asamblea extraordinaria del 15/01/2020.",
    "archivo": "https://ejemplo.com/estatuto.pdf",
    "created_at": "2020-01-15T00:00:00Z"
  },
  {
    "id": "d2",
    "nombre": "Acta reunión marzo 2026",
    "categoria": "Actas",
    "fecha": "2026-03-15",
    "descripcion": "Acta de la asamblea ordinaria de marzo 2026.",
    "archivo": "",
    "created_at": "2026-03-15T00:00:00Z"
  }
]
```

## 4. HTML structure (index.html lines 156-173)

```html
<div id="tab-documentos" class="tab-content" role="region" aria-label="Documentos">
  <md-filled-button class="admin-only" id="formDocumentos" onclick="formDocumentos()">
    <md-icon slot="icon">add</md-icon>Agregar Documento
  </md-filled-button>

  <div class="filter-chips" id="documentosChips">
    <md-filter-chip label="Todos" selected onclick="filterDocumentos('Todos')"></md-filter-chip>
    <md-filter-chip label="Estatuto" onclick="filterDocumentos('Estatuto')"></md-filter-chip>
    <md-filter-chip label="Actas" onclick="filterDocumentos('Actas')"></md-filter-chip>
    <md-filter-chip label="Contratos" onclick="filterDocumentos('Contratos')"></md-filter-chip>
    <md-filter-chip label="Seguros" onclick="filterDocumentos('Seguros')"></md-filter-chip>
    <md-filter-chip label="Planos" onclick="filterDocumentos('Planos')"></md-filter-chip>
  </div>

  <div class="docs-grid" id="documentosList">
    <div class="skeleton skeleton-doc"></div>
    <div class="skeleton skeleton-doc"></div>
    <div class="skeleton skeleton-doc"></div>
    <div class="skeleton skeleton-doc"></div>
  </div>
</div>
```

## 5. Global state

```js
var DOCUMENTOS = [];
var documentosFilter = 'Todos';
```

## 6. Tab data loading

```js
documentos: function() {
  return loadJson('DOCUMENTOS').then(function() { renderDocumentos(); });
}
```

## 7. JS Functions

### 7.1 filterDocumentos(cat)

```js
function filterDocumentos(cat) {
  documentosFilter = cat;
  document.querySelectorAll('#documentosChips md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderDocumentos();
}
```

### 7.2 renderDocumentos()

**Flujo**:
```
1. icons = { 'Estatuto': 📄, 'Actas': 🗂️, 'Contratos': 📝, 'Seguros': 🏷️, 'Planos': 📐 }
2. Filtrar DOCUMENTOS según documentosFilter
3. Por cada documento:
   a. icon = icons[d.categoria] || default 🗂️
   b. fecha = formatDate(d.fecha || d.created_at)
   c. Botones: edit/delete (admin) + info (si descripcion) + ver archivo (si archivo)
4. Renderizar como doc-item
```

**Código exacto**:
```js
function renderDocumentos() {
  var list = document.getElementById('documentosList');
  var icons = { 'Estatuto': '&#128220;', 'Actas': '&#128196;', 'Contratos': '&#128221;', 'Seguros': '&#128737;', 'Planos': '&#128208;' };
  var filtered = DOCUMENTOS.filter(function(d) {
    return documentosFilter === 'Todos' || d.categoria === documentosFilter;
  });
  list.innerHTML = filtered.map(function(d) {
    var icon = icons[d.categoria] || '&#128196;';
    var fecha = formatDate(d.fecha || d.created_at);
    var btns = '<div style="display:flex;gap:0rem;flex-shrink:0;align-items:center">';
    btns += adminActions("editDocumento('" + d.id + "')", "deleteDocumento('" + d.id + "')");
    if (d.descripcion) {
      btns += '<md-icon-button onclick="showDescripcion(\'' + d.id + '\')" title="Ver descripción"><md-icon>info</md-icon></md-icon-button>';
    }
    if (d.archivo) {
      btns += '<a href="' + d.archivo + '" title="Ver documento" target="_blank" style="text-decoration:none"><md-icon-button style="color:var(--text-2)"><md-icon>description</md-icon></md-icon-button></a>';
    }
    btns += '</div>';
    return '<div class="doc-item">'
      + '<div class="doc-icon">' + icon + '</div>'
      + '<div class="doc-info" style="flex:1">'
        + '<div class="doc-name">' + d.nombre + '</div>'
        + '<div class="doc-meta">' + d.categoria + ' · ' + fecha + '</div>'
      + '</div>'
      + btns
    + '</div>';
  }).join('');
}
```

### 7.3 showDescripcion(docId)

```js
function showDescripcion(docId) {
  var doc = DOCUMENTOS.find(function(d) { return d.id === docId; });
  if (!doc) return;
  openModal('Descripción', '<div style="line-height:1.6;white-space:pre-wrap">' + (doc.descripcion || '') + '</div>');
}
```

### 7.4 formDocumentos(data?)

```js
function formDocumentos(data) {
  var isEdit = !!data;
  var cats = (CONFIG.categorias_documentos && CONFIG.categorias_documentos.length)
    ? CONFIG.categorias_documentos
    : ['Estatuto', 'Actas', 'Contratos', 'Seguros', 'Planos'];
  var catOpts = cats.map(function(c) {
    return '<md-select-option value="' + c + '"' + (isEdit && data.categoria === c ? ' selected' : '') + '><span slot="headline">' + c + '</span></md-select-option>';
  }).join('');
  openModal(isEdit ? 'Editar Documento' : 'Agregar Documento',
    '<form id="modalForm" data-table="documentos" data-bucket="documentos" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-row" style="grid-template-columns:2fr 1fr">'
      + '<div class="form-group"><md-filled-text-field label="Nombre" name="nombre" placeholder="Ej: Acta reunión marzo 2026" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></md-filled-text-field></div>'
      + '<div class="form-group"><md-filled-select label="Categoría" name="categoria" required style="width:100%">' + catOpts + '</md-filled-select></div>'
    + '</div>'
    + '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Resumen del documento..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><label>Archivo</label><input type="file" name="archivo"></div>'
    + (isEdit && data.archivo ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.archivo + '" target="_blank">ver</a></div>' : '')
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
}
```

## 8. Render output exacto

```html
<div class="doc-item">
  <div class="doc-icon">📄</div>
  <div class="doc-info" style="flex:1">
    <div class="doc-name">Estatuto Condominio</div>
    <div class="doc-meta">Estatuto · 15/01/2020</div>
  </div>
  <div style="display:flex;gap:0rem;flex-shrink:0;align-items:center">
    [edit] [delete]
    <md-icon-button onclick="showDescripcion('d1')" title="Ver descripción"><md-icon>info</md-icon></md-icon-button>
    <a href="https://..." target="_blank" style="text-decoration:none"><md-icon-button style="color:var(--text-2)"><md-icon>description</md-icon></md-icon-button></a>
  </div>
</div>
```

### Sin descripción: no se muestra botón info
### Sin archivo: no se muestra botón description

## 9. Filtros

Los chips de categoría están hardcodeados en HTML:
- **Todos** (default)
- Estatuto, Actas, Contratos, Seguros, Planos

Si se agregan categorías custom en Config, **no aparecen automáticamente como chips** (hay que actualizar el HTML). El filtro funciona igual porque compara `d.categoria === documentosFilter`.

## 10. Descripción en modal

La descripción se abre en un modal aparte:
```js
openModal('Descripción', '<div style="line-height:1.6;white-space:pre-wrap">' + (doc.descripcion || '') + '</div>');
```
- Usa `white-space: pre-wrap` para preservar saltos de línea
- Sin botones de acción en el modal (solo "Cerrar")

## 11. Auto-fecha

```js
// En handleForm():
var autoDateTables = ['noticias', 'documentos'];
if (autoDateTables.indexOf(table) !== -1 && !data.fecha) {
  data.fecha = new Date().toISOString().slice(0, 10);
}
```

## 12. Upload de archivos

- Bucket: `documentos` (form.dataset.bucket = "documentos")
- Carpeta: `{categoria}/` (ej: "Actas/")
- Sin restricción de tipo de archivo (no tiene accept)
- Opcional

## 13. RLS Policies

```sql
CREATE POLICY "documentos_select" ON documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "documentos_insert" ON documentos FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "documentos_update" ON documentos FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "documentos_delete" ON documentos FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 14. Dependencias

- Las categorías disponibles dependen de `CONFIG.categorias_documentos` (config page)
- Si la config está vacía, usa fallback hardcodeado
- Los documentos no tienen FK a otras tablas (entidad independiente)
