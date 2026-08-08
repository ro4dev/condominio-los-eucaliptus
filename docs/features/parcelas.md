# Parcelas

## 1. Descripción general

Gestión de unidades habitacionales del condominio. Cada parcela se muestra como fila de tabla con datos catastrales, chip de estado y acceso al popup de propietarios asociados. La creación puede ser individual (modal) o masiva (config). Es la entidad central del sistema: gastos, reclamos, votos y asistencias referencian a parcelas.

ID del tab: `parcelas`
Contenedor: `<div id="tab-parcelas">`

## 2. Schema SQL

```sql
CREATE TABLE parcelas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE NOT NULL,              -- "1", "2A", "Terreno 15"
  rol TEXT,                                 -- rol de propiedad (opcional)
  metros NUMERIC NOT NULL,                  -- superficie en m²
  estado TEXT DEFAULT 'Habitada',           -- Habitada | Desocupada | En construcción | Sin asignar
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/parcelas.json)

```json
[
  { "id": "p1", "numero": "1", "rol": "1234-5", "metros": 250, "estado": "Habitada", "created_at": "2026-01-01T00:00:00Z" },
  { "id": "p2", "numero": "2", "rol": "1234-6", "metros": 300, "estado": "Habitada", "created_at": "2026-01-01T00:00:00Z" },
  { "id": "p3", "numero": "3", "rol": "1234-7", "metros": 200, "estado": "Desocupada", "created_at": "2026-01-01T00:00:00Z" }
]
```

## 4. HTML structure (index.html lines 110-118)

```html
<div id="tab-parcelas" class="tab-content" role="region" aria-label="Parcelas">
  <div class="table-wrap" id="parcelasGrid">
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
  </div>
</div>
```

Nota: no hay botón "+ Agregar" visible en el HTML. El botón de agregar parcela individual se invoca desde `formParcelas()` pero no hay un botón directo en la UI. La creación de parcelas se hace desde Config (bulk) o no hay UI para crear individual. Sin embargo, `formParcelas()` existe y funciona.

## 5. Global state

```js
var PARCELAS = [];        // en config.js
var PROPIETARIOS = [];    // para render inline
```

## 6. Tab data loading

```js
parcelas: function() {
  return Promise.all([
    loadJson('PARCELAS'),
    loadJson('PROPIETARIOS')
  ]).then(function() { renderParcelas(); });
}
```

## 7. JS Functions

### 7.1 renderParcelas()

Renderiza el listado como tabla (`.table-wrap`, scroll horizontal en mobile), replicando el patrón de `renderFlujo`.

**Flujo**:
```
1. Si no hay parcelas, muestra emptyState en #parcelasGrid
2. Ordena PARCELAS numéricamente (extrae dígitos con parseInt + replace \D)
3. Por cada parcela:
   a. Filtra PROPIETARIOS donde prop.parcela_id === p.id
   b. Genera chip de estado: Habitada (verde), En construcción (ámbar), resto (gris)
   c. Botón 👥 abre showPropietarios(p.id) + conteo de propietarios
   d. Ícono ✏️ editar solo admin
4. Setea innerHTML de #parcelasGrid con <table> (min-width 560px)
```

**Código exacto**:
```js
function renderParcelas() {
  var wrap = document.getElementById('parcelasGrid');

  if (!PARCELAS.length) {
    wrap.innerHTML = emptyState('No hay parcelas registradas.');
    return;
  }

  var sorted = PARCELAS.slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  var estadoChip = function(estado) {
    var st = String(estado || '').toLowerCase();
    var bg, color;
    if (st.indexOf('habit') !== -1) {
      bg = 'var(--color-positive-bg)';
      color = 'var(--color-positive-text)';
    } else if (st.indexOf('construc') !== -1) {
      bg = 'var(--color-extraordinaria-bg)';
      color = 'var(--color-extraordinaria-text)';
    } else {
      bg = 'var(--md-sys-color-surface-container-highest)';
      color = 'var(--md-sys-color-on-surface-variant)';
    }
    return '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;white-space:nowrap;background:' + bg + ';color:' + color + '">' + escHtml(estado) + '</span>';
  };

  var rows = sorted.map(function(p) {
    var propietarios = PROPIETARIOS.filter(function(pr) { return pr.parcela_id === p.id; });
    return '<tr>' +
      '<td style="font-weight:600;color:var(--text)">' + escHtml(p.numero || '') + '</td>' +
      '<td>' + escHtml(p.rol || '—') + '</td>' +
      '<td>' + (p.metros ? escHtml(p.metros) + ' m²' : '—') + '</td>' +
      '<td>' + estadoChip(p.estado) + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:0.2rem">' +
        '<md-icon-button onclick="showPropietarios(\'' + p.id + '\')" title="Ver propietarios (' + propietarios.length + ')" style="color:var(--md-sys-color-primary)"><md-icon>groups</md-icon></md-icon-button>' +
        '<span style="font-size:0.8rem;color:var(--text-2)">' + propietarios.length + '</span>' +
      '</div></td>' +
      '<td>' + (IS_ADMIN ? '<md-icon-button onclick="editParcela(\'' + p.id + '\')" title="Editar"><md-icon>edit</md-icon></md-icon-button>' : '') + '</td>' +
      '</tr>';
  }).join('');

  wrap.innerHTML = '<table style="min-width:560px">' +
    '<thead><tr>' +
      '<th>Parcela</th><th>Rol</th><th>Metros²</th><th>Estado</th><th>Propietarios</th><th></th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>';
}
```

### 7.2 formParcelas(data?)

```js
function formParcelas(data) {
  var isEdit = !!data;
  openModal(isEdit ? 'Editar Parcela' : 'Agregar Parcela',
    '<form id="modalForm" data-table="parcelas" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-text-field label="Número" name="numero" placeholder="Ej: 1, 2A, 15" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.numero) + '" disabled' : '') + '></md-filled-text-field></div>'
      + '<div class="form-group"><md-filled-text-field label="Rol" name="rol" placeholder="Ej: Rol de la propiedad" style="width:100%"' + (isEdit && data.rol ? ' value="' + escHtml(data.rol) + '"' : '') + '></md-filled-text-field></div>'
    + '</div>'
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-text-field label="Metros²" type="number" name="metros" min="0" placeholder="Ej: 0" style="width:100%"' + (isEdit ? ' value="' + data.metros + '"' : '') + '></md-filled-text-field></div>'
      + '<div class="form-group"><md-filled-select label="Estado" name="estado" style="width:100%">'
        + '<md-select-option value="Habitada"' + (isEdit && data.estado === 'Habitada' ? ' selected' : '') + '><span slot="headline">Habitada</span></md-select-option>'
        + '<md-select-option value="Desocupada"' + (isEdit && data.estado === 'Desocupada' ? ' selected' : '') + '><span slot="headline">Desocupada</span></md-select-option>'
        + '<md-select-option value="En construcción"' + (isEdit && data.estado === 'En construcción' ? ' selected' : '') + '><span slot="headline">En construcción</span></md-select-option>'
      + '</md-filled-select></div>'
    + '</div>'
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
}
```

### 7.3 editParcela(id)

```js
function editParcela(id) {
  var data = PARCELAS.find(function(p) { return p.id === id; });
  if (data) formParcelas(data);
}
```

## 8. Render output exacto (por fila)

```html
<table style="min-width:560px">
  <thead>
    <tr><th>Parcela</th><th>Rol</th><th>Metros²</th><th>Estado</th><th>Propietarios</th><th></th></tr>
  </thead>
  <tbody>
    <tr>
      <td style="font-weight:600;color:var(--text)">Parcela 1</td>
      <td>00521-001</td>
      <td>450 m²</td>
      <td><span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;white-space:nowrap;background:var(--color-positive-bg);color:var(--color-positive-text)">Habitada</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:0.2rem">
          <md-icon-button onclick="showPropietarios('...')" title="Ver propietarios (2)" style="color:var(--md-sys-color-primary)"><md-icon>groups</md-icon></md-icon-button>
          <span style="font-size:0.8rem;color:var(--text-2)">2</span>
        </div>
      </td>
      <!-- admin -->
      <td><md-icon-button onclick="editParcela('...')" title="Editar"><md-icon>edit</md-icon></md-icon-button></td>
    </tr>
  </tbody>
</table>
```

## 9. CSS classes usadas

| Class | Elemento | Estilo |
|-------|----------|--------|
| `.table-wrap` | Contenedor de la tabla | surface, border-radius, padding, sombra, overflow-x auto |
| `table` | `<table>` | width 100%, border-collapse, typescale body-small |
| `th` | `<th>` | background surface-hover, color text-2, border-bottom 2px border |
| `td` | `<td>` | padding 0.5rem 0.8rem, border-bottom border-light |
| `tr:hover td` | fila hover | background surface-hover |
| `.empty-state` | Sin parcelas | borde punteado, ícono inbox, texto muted |

## 10. Modal form HTML exacto

```html
<form id="modalForm" data-table="parcelas" onsubmit="handleForm(event)">
  <!-- EDIT: hidden id, numero disabled -->
  <input type="hidden" name="id" value="p1">
  
  <div class="form-row">
    <div class="form-group">
      <md-filled-text-field label="Número" name="numero" placeholder="Ej: 1, 2A, 15" required style="width:100%" value="1" disabled></md-filled-text-field>
    </div>
    <div class="form-group">
      <md-filled-text-field label="Rol" name="rol" placeholder="Ej: Rol de la propiedad" style="width:100%" value="1234-5"></md-filled-text-field>
    </div>
  </div>

  <div class="form-row">
    <div class="form-group">
      <md-filled-text-field label="Metros²" type="number" name="metros" min="0" placeholder="Ej: 0" style="width:100%" value="250"></md-filled-text-field>
    </div>
    <div class="form-group">
      <md-filled-select label="Estado" name="estado" style="width:100%">
        <md-select-option value="Habitada" selected><span slot="headline">Habitada</span></md-select-option>
        <md-select-option value="Desocupada"><span slot="headline">Desocupada</span></md-select-option>
        <md-select-option value="En construcción"><span slot="headline">En construcción</span></md-select-option>
      </md-filled-select>
    </div>
  </div>
</form>
```

## 11. RLS Policies

```sql
CREATE POLICY "parcelas_select" ON parcelas FOR SELECT TO authenticated USING (true);
CREATE POLICY "parcelas_insert" ON parcelas FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "parcelas_update" ON parcelas FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "parcelas_delete" ON parcelas FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 12. Dependencias

- FK referenciada por: `gastos.parcela_id` (CASCADE), `propietarios.parcela_id` (CASCADE), `reclamos.parcela_id` (SET NULL), `encuestas_votos.parcela_id` (CASCADE), `asamblea_asistentes.parcela_id` (CASCADE)
- La creación bulk depende de la pestaña Config (admin-only)
- El número de parcela es UNIQUE en DB pero no hay validación JS en demo
