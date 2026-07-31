# Parcelas

## 1. Descripción general

Gestión de unidades habitacionales del condominio. Cada parcela se muestra como card con datos catastrales y lista inline de propietarios asociados. La creación puede ser individual (modal) o masiva (config). Es la entidad central del sistema: gastos, reclamos, votos y asistencias referencian a parcelas.

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
  <div class="cards-grid" id="parcelasGrid">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
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

**Flujo**:
```
1. Ordena PARCELAS numéricamente (extrae dígitos con parseInt + replace \D)
2. Por cada parcela:
   a. Filtra PROPIETARIOS donde prop.parcela_id === p.id
   b. Calcula colorClass: colorClasses[i % 4] → green/purple/orange/pink cíclico
   c. Renderiza header: número + botones edit parcela + add propietario (admin)
   d. Renderiza campos: Rol (si existe), Metros², Estado
   e. Renderiza propietarios inline
3. Setea innerHTML de #parcelasGrid
```

**Código exacto**:
```js
function renderParcelas() {
  var grid = document.getElementById('parcelasGrid');
  var colorClasses = ['green', 'purple', 'orange', 'pink'];

  var sorted = PARCELAS.slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  grid.innerHTML = sorted.map(function(p, i) {
    var propietarios = PROPIETARIOS.filter(function(pr) { return pr.parcela_id === p.id; });
    var colorClass = colorClasses[i % 4];

    var propietariosHtml = propietarios.map(function(prop, j) {
      var propColor = colorClasses[(i + j) % 4];
      var nombre = prop.nombre_completo || '';
      return '<div style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid var(--border-light)">'
        + '<div style="display:flex;align-items:center;gap:0.6rem">'
          + '<div class="avatar ' + propColor + '">' + getInitials(nombre) + '</div>'
          + '<div style="flex:1"><div style="font-weight:600;font-size:0.9rem">' + nombre + '</div><div style="font-size:0.75rem;color:var(--text-muted)">' + prop.tipo + '</div></div>'
          + (IS_ADMIN ? '<md-icon-button onclick="editPropietario(\'' + prop.id + '\')" title="Editar"><md-icon>edit</md-icon></md-icon-button>'
            + '<md-icon-button onclick="deleteItem(\'propietarios\', \'' + prop.id + '\', \'PROPIETARIOS\', renderParcelas)" title="Eliminar"><md-icon>delete</md-icon></md-icon-button>' : '')
        + '</div>'
        + '<div style="margin-left:2.4rem;margin-top:0.3rem;font-size:0.8rem;color:var(--text-2)">'
          + (prop.telefono ? '<div>📱 <a href="tel:' + prop.telefono + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + prop.telefono + '</a></div>' : '')
          + (prop.email ? '<div>✉️ <a href="mailto:' + prop.email + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + prop.email + '</a></div>' : '')
          + (prop.rut ? '<div>📄 RUT: ' + prop.rut + '</div>' : '')
        + '</div>'
      + '</div>';
    }).join('');

    return '<div class="card">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem">'
        + '<h4 style="font-size:1rem;color:var(--text);margin:0;padding:0;border:none;flex:1">' + (p.numero || '') + '</h4>'
        + (IS_ADMIN ? '<md-icon-button onclick="editParcela(\'' + p.id + '\')" title="Editar"><md-icon>edit</md-icon></md-icon-button>'
          + '<md-icon-button onclick="formPropietarios(\'' + p.id + '\')" title="Agregar propietario" style="color:var(--md-sys-color-primary)"><md-icon>person_add</md-icon></md-icon-button>' : '')
      + '</div>'
      + (p.rol ? '<div class="field"><span class="field-label">Rol</span><span class="field-value">' + p.rol + '</span></div>' : '')
      + '<div class="field"><span class="field-label">Metros²</span><span class="field-value">' + (p.metros || '') + ' m²</span></div>'
      + '<div class="field"><span class="field-label">Estado</span><span class="field-value">' + p.estado + '</span></div>'
      + propietariosHtml
    + '</div>';
  }).join('');
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

## 8. Render output exacto (por card)

```html
<div class="card">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem">
    <h4 style="font-size:1rem;color:var(--text);margin:0;padding:0;border:none;flex:1">1</h4>
    <!-- admin: edit + add owner -->
    <md-icon-button onclick="editParcela('p1')" title="Editar"><md-icon>edit</md-icon></md-icon-button>
    <md-icon-button onclick="formPropietarios('p1')" title="Agregar propietario" style="color:var(--md-sys-color-primary)"><md-icon>person_add</md-icon></md-icon-button>
  </div>

  <!-- Fields -->
  <div class="field"><span class="field-label">Rol</span><span class="field-value">1234-5</span></div>
  <div class="field"><span class="field-label">Metros²</span><span class="field-value">250 m²</span></div>
  <div class="field"><span class="field-label">Estado</span><span class="field-value">Habitada</span></div>

  <!-- Propietarios -->
  <div style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid var(--border-light)">
    <div style="display:flex;align-items:center;gap:0.6rem">
      <div class="avatar green">JP</div>
      <div style="flex:1">
        <div style="font-weight:600;font-size:0.9rem">Juan Pérez</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">Propietario</div>
      </div>
      <!-- admin: edit + delete owner -->
    </div>
    <div style="margin-left:2.4rem;margin-top:0.3rem;font-size:0.8rem;color:var(--text-2)">
      <div>📱 <a href="tel:+56912345678" style="color:var(--md-sys-color-primary);text-decoration:none">+56 9 1234 5678</a></div>
      <div>✉️ <a href="mailto:juan@ejemplo.com" style="color:var(--md-sys-color-primary);text-decoration:none">juan@ejemplo.com</a></div>
      <div>📄 RUT: 12.345.678-9</div>
    </div>
  </div>
</div>
```

## 9. CSS classes usadas

| Class | Elemento | Estilo |
|-------|----------|--------|
| `.card` | Card contenedor | bg-card, border-radius, padding, sombra |
| `.field` | `<div>` fila | display flex, justify-content space-between, padding 0.3rem 0 |
| `.field-label` | `<span>` label | font-size 0.8rem, color text-muted |
| `.field-value` | `<span>` valor | font-size 0.85rem, font-weight 500 |
| `.avatar` | `<div>` círculo | width 36px, height 36px, border-radius 50%, display flex, align-items center, justify-content center, font-weight 600, font-size 0.85rem |
| `.avatar.green` | avatar | background #d1fae5, color #065f46 |
| `.avatar.purple` | avatar | background #ede9fe, color #5b21b6 |
| `.avatar.orange` | avatar | background #ffedd5, color #9a3412 |
| `.avatar.pink` | avatar | background #fce7f3, color #9d174d |

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
