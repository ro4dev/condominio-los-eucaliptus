# Noticias

## 1. Descripción general

Tablero de avisos y comunicaciones del condominio. Las noticias tienen título, descripción, fecha de publicación (autogenerada) y fecha de vigencia requerida en el form (aunque la BD permite NULL = siempre vigente). El sistema clasifica automáticamente en vigentes y vencidas según la fecha actual.

ID del tab: `noticias`
Contenedor: `<div id="tab-noticias">`

## 2. Schema SQL

```sql
CREATE TABLE noticias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE,                             -- autogenerada si no se provee
  fecha_hasta DATE,                       -- NULL = siempre vigente
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/noticias.json)

```json
[
  {
    "id": "n1",
    "titulo": "Corte de agua programado",
    "descripcion": "El día sábado 15 de abril se realizará un corte de agua programado desde las 09:00 hasta las 14:00 hrs por mantención de la red.",
    "fecha": "2026-04-10",
    "fecha_hasta": "2026-04-16",
    "created_at": "2026-04-10T10:00:00Z"
  },
  {
    "id": "n2",
    "titulo": "Recordatorio: pago de gastos comunes",
    "descripcion": "Se recuerda a los residentes que el pago de gastos comunes se recibe hasta el día 10 de cada mes.",
    "fecha": "2026-03-01",
    "fecha_hasta": null,
    "created_at": "2026-03-01T08:00:00Z"
  }
]
```

## 4. HTML structure (index.html lines 120-133)

```html
<div id="tab-noticias" class="tab-content" role="region" aria-label="Noticias">
  <md-filled-button class="admin-only" id="formNoticias" onclick="formNoticias()">
    <md-icon slot="icon">add</md-icon>Agregar Noticia
  </md-filled-button>

  <div class="filter-chips" id="noticiasFilter">
    <md-filter-chip label="Vigentes" selected onclick="filterNoticias('vigentes')"></md-filter-chip>
    <md-filter-chip label="No vigentes" onclick="filterNoticias('no_vigentes')"></md-filter-chip>
    <md-filter-chip label="Todas" onclick="filterNoticias('todas')"></md-filter-chip>
  </div>

  <div id="noticiasList">
    <div class="skeleton skeleton-news"></div>
    <div class="skeleton skeleton-news"></div>
    <div class="skeleton skeleton-news"></div>
  </div>
</div>
```

## 5. Global state

```js
var NOTICIAS = [];
var noticiasFilter = 'vigentes';   // default
```

## 6. Tab data loading

```js
noticias: function() {
  return loadJson('NOTICIAS').then(function() { renderNoticias(); });
}
```

## 7. JS Functions

### 7.1 filterNoticias(filtro)

```js
function filterNoticias(filtro) {
  noticiasFilter = filtro;
  document.querySelectorAll('#noticiasFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderNoticias();
}
```

### 7.2 renderNoticias()

**Flujo**:
```
1. hoy = new Date()
2. hoyStr = YYYY-MM-DD
3. Clasificar:
   - activas: fecha_hasta >= hoyStr O fecha_hasta es null/undefined
   - vencidas: fecha_hasta < hoyStr
4. Ordenar cada grupo por fecha descendente
5. Según filtro:
   - 'vigentes': mostrar activas
   - 'no_vigentes': mostrar vencidas
   - 'todas': activas.concat(vencidas)
6. Si no hay: mensaje "No hay noticias"
7. Renderizar cada noticia con renderNoticiaCard()
```

**Código exacto**:
```js
function renderNoticias() {
  var list = document.getElementById('noticiasList');
  var hoy = new Date();
  var hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

  var activas = NOTICIAS.filter(function(n) {
    if (!n.fecha_hasta) return true;
    return n.fecha_hasta >= hoyStr;
  });
  var vencidas = NOTICIAS.filter(function(n) {
    if (!n.fecha_hasta) return false;
    return n.fecha_hasta < hoyStr;
  });

  activas.sort(function(a, b) { return new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at); });
  vencidas.sort(function(a, b) { return new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at); });

  var mostrar = [];
  if (noticiasFilter === 'vigentes') mostrar = activas;
  else if (noticiasFilter === 'no_vigentes') mostrar = vencidas;
  else mostrar = activas.concat(vencidas);

  if (mostrar.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--md-sys-color-outline);padding:2rem">No hay noticias</div>';
    return;
  }

  list.innerHTML = mostrar.map(function(n) {
    var esVencida = vencidas.indexOf(n) !== -1;
    return renderNoticiaCard(n, esVencida);
  }).join('');
}
```

### 7.3 renderNoticiaCard(n, old)

```js
function renderNoticiaCard(n, old) {
  var fecha = formatDate(n.fecha || n.created_at);
  return '<div class="news-card" style="margin-bottom:1rem;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center">'
      + '<h4 style="margin:0;flex:1">' + (n.titulo || '') + '</h4>'
      + '<span class="dates" style="margin:0">' + fecha + '</span>'
      + adminActions("editNoticia('" + n.id + "')", "deleteNoticia('" + n.id + "')")
    + '</div>'
    + '<div class="desc">' + nl2br(n.descripcion) + '</div>'
    + (n.archivo ? '<a href="' + n.archivo + '" target="_blank" style="color:var(--md-sys-color-primary);font-size:0.85rem">Ver archivo adjunto</a>' : '')
  + '</div>';
}
```

### 7.4 formNoticias(data?)

```js
function formNoticias(data) {
  var isEdit = !!data;
  openModal(isEdit ? 'Editar Noticia' : 'Agregar Noticia',
    '<form id="modalForm" data-table="noticias" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-row" style="grid-template-columns:1fr 1fr">'
      + '<div class="form-group"><md-filled-text-field label="Título" name="titulo" placeholder="Ej: Corte de agua programado" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></md-filled-text-field></div>'
      + dateFieldHtml('fecha_hasta', 'Vigente hasta*', isEdit ? data.fecha_hasta : '')
      // → Genera el date picker M3 custom (campo display + hidden input ISO + label + error + ícono calendario)
    + '</div>'
    + '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalle de la noticia..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion) + '"' : '') + '></md-filled-text-field></div>'
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
}
```

## 8. Render output exacto

```html
<div class="news-card" style="margin-bottom:1rem;">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <h4 style="margin:0;flex:1">Corte de agua programado</h4>
    <span class="dates" style="margin:0">10/04/2026</span>
    [edit] [delete]
  </div>
  <div class="desc">El día sábado 15 de abril se realizará un corte de agua programado desde las 09:00 hasta las 14:00 hrs por mantención de la red.</div>
  <!-- archivo si existe -->
  <a href="https://..." target="_blank" style="color:var(--md-sys-color-primary);font-size:0.85rem">Ver archivo adjunto</a>
</div>
```

## 9. CSS classes (sections.css)

```css
.news-card {
  background: var(--bg-card);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 1rem;
}

.news-card h4 {
  font-size: 1rem;
  color: var(--text);
}

.news-card .dates {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
}

.news-card .desc {
  margin-top: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-2);
  line-height: 1.6;
  white-space: pre-wrap;
}
```

## 10. Filtros

| Chip | Filtro | Default |
|------|--------|---------|
| Vigentes | `!n.fecha_hasta \|\| n.fecha_hasta >= hoyStr` | ✅ Sí |
| No vigentes | `n.fecha_hasta && n.fecha_hasta < hoyStr` | No |
| Todas | Sin filtro | No |

## 11. Auto-fecha

```js
// En handleForm():
var autoDateTables = ['noticias', 'documentos'];
if (autoDateTables.indexOf(table) !== -1 && !data.fecha) {
  data.fecha = new Date().toISOString().slice(0, 10);
}
```

## 12. RLS Policies

```sql
CREATE POLICY "noticias_select" ON noticias FOR SELECT TO authenticated USING (true);
CREATE POLICY "noticias_insert" ON noticias FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "noticias_update" ON noticias FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "noticias_delete" ON noticias FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 13. Dependencias

- Sin dependencias de otras tablas
- El campo archivo existe en el schema pero no hay input file en el form actual de noticias
