# Asambleas

## 1. Descripción general

Registro de asambleas de copropietarios con control de asistencia por parcela. Soporta asambleas ordinarias y extraordinarias, con temario, acuerdos opcionales y selector visual de parcelas asistentes mediante chips.

ID del tab: `asambleas`
Contenedor: `<div id="tab-asambleas">`

## 2. Schema SQL

```sql
CREATE TABLE asambleas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Ordinaria', 'Extraordinaria')),
  temario TEXT NOT NULL,
  acuerdos TEXT,                           -- opcional
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE asamblea_asistentes (
  asamblea_id UUID REFERENCES asambleas(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  PRIMARY KEY (asamblea_id, parcela_id)
);
```

## 3. Mock data

### data/asambleas.json
```json
[
  {
    "id": "a1",
    "fecha": "2026-03-15",
    "tipo": "Ordinaria",
    "temario": "1. Lectura acta anterior\n2. Estado de cuentas\n3. Presupuesto anual\n4. Varios",
    "acuerdos": "Se aprueba presupuesto anual por $2.500.000.\nSe delega en administración la cotización de mejoras.",
    "created_at": "2026-03-15T20:00:00Z"
  },
  {
    "id": "a2",
    "fecha": "2026-02-20",
    "tipo": "Extraordinaria",
    "temario": "1. Filtraciones en parcela 5\n2. Reparación urgente techo salón",
    "acuerdos": "Se aprueba reparación urgente por $350.000 con cargo al fondo de reserva.",
    "created_at": "2026-02-20T19:00:00Z"
  }
]
```

### data/asamblea_asistentes.json
```json
[
  { "asamblea_id": "a1", "parcela_id": "p1" },
  { "asamblea_id": "a1", "parcela_id": "p2" },
  { "asamblea_id": "a1", "parcela_id": "p3" },
  { "asamblea_id": "a2", "parcela_id": "p1" },
  { "asamblea_id": "a2", "parcela_id": "p5" }
]
```

## 4. HTML structure (index.html lines 200-212)

```html
<div id="tab-asambleas" class="tab-content" role="region" aria-label="Asambleas">
  <md-filled-button class="admin-only" id="formAsambleas" onclick="formAsambleas()">
    <md-icon slot="icon">add</md-icon>Agregar Asamblea
  </md-filled-button>

  <div class="filter-chips" id="asambleasChips">
    <md-filter-chip label="Todos" selected onclick="filterAsambleas('Todos')"></md-filter-chip>
    <md-filter-chip label="Ordinarias" onclick="filterAsambleas('Ordinaria')"></md-filter-chip>
    <md-filter-chip label="Extraordinarias" onclick="filterAsambleas('Extraordinaria')"></md-filter-chip>
  </div>

  <div id="asambleasTimeline">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
  </div>
</div>
```

## 5. Global state

```js
var ASAMBLEAS = [];             // Array de asambleas
var ASAMBLEA_ASISTENTES = [];   // Array de {asamblea_id, parcela_id}
var PARCELAS = [];              // Para nombres de parcela
var asambleasFilter = 'Todos';  // Default
```

## 6. Tab data loading

```js
asambleas: function() {
  return Promise.all([
    loadJson('ASAMBLEAS'),
    loadJson('ASAMBLEA_ASISTENTES')
  ]).then(function() { renderAsambleas(); });
}
```

## 7. JS Functions

### 7.1 filterAsambleas(tipo)

```js
function filterAsambleas(tipo) {
  asambleasFilter = tipo;
  document.querySelectorAll('#asambleasChips md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderAsambleas();
}
```

### 7.2 renderAsambleas()

**Flujo**:
```
1. Filtra ASAMBLEAS según asambleasFilter
2. Ordena por fecha descendente
3. Por cada asamblea:
   a. Busca asistentes en ASAMBLEA_ASISTENTES donde asamblea_id === a.id
   b. Mapea a número de parcela via parcelName()
   c. Genera chips inline para cada asistente
   d. Renderiza card con badge de tipo, fecha, temario, acuerdos, asistentes
4. Si no hay asambleas: no muestra nada (no hay empty state explícito)
```

**Código exacto**:
```js
function renderAsambleas() {
  var timeline = document.getElementById('asambleasTimeline');
  var filtered = ASAMBLEAS.filter(function(a) {
    return asambleasFilter === 'Todos' || a.tipo === asambleasFilter;
  });
  var sorted = filtered.slice().sort(function(a, b) {
    return new Date(b.fecha) - new Date(a.fecha);
  });
  timeline.innerHTML = sorted.map(function(a) {
    var fecha = formatDate(a.fecha);
    var asistentesIds = (ASAMBLEA_ASISTENTES || []).filter(function(aa) {
      return aa.asamblea_id === a.id;
    }).map(function(aa) { return aa.parcela_id; });
    var asistentes = asistentesIds.length ? asistentesIds.map(function(pid) {
      return '<span style="display:inline-block;background:var(--skeleton-1);color:var(--text-2);padding:0.2rem 0.5rem;border-radius:var(--md-sys-shape-corner-extra-small);font-size:0.8rem;margin:0.1rem">' + parcelName(pid) + '</span>';
    }).join('') : '';
    return '<div class="flujo-card">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">'
        + '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:'
          + (a.tipo === 'Extraordinaria' ? 'var(--color-extraordinaria-bg)' : 'var(--md-sys-color-primary-container)')
          + ';color:' + (a.tipo === 'Extraordinaria' ? 'var(--color-extraordinaria-text)' : 'var(--md-sys-color-on-primary-container)')
          + '">' + a.tipo + '</span>'
        + '<div style="display:flex;gap:0.3rem;align-items:center">'
          + '<span style="font-size:0.8rem;color:var(--text-muted)">' + fecha + '</span>'
          + adminActions("editAsamblea('" + a.id + "')", "deleteAsamblea('" + a.id + "')")
        + '</div>'
      + '</div>'
      + '<div style="font-size:0.85rem;font-weight:600;margin-bottom:0.2rem">Temario</div>'
      + '<div style="font-size:0.85rem;margin-bottom:0.6rem">' + nl2br(a.temario) + '</div>'
      + (a.acuerdos ? '<div style="font-size:0.85rem;font-weight:600;margin-bottom:0.2rem">Acuerdos</div><div style="font-size:0.85rem;margin-bottom:0.4rem">' + nl2br(a.acuerdos) + '</div>' : '')
      + (asistentes ? '<div style="margin-top:0.4rem"><strong style="font-size:0.85rem">Asistentes:</strong><div style="margin-top:0.3rem">' + asistentes + '</div></div>' : '')
    + '</div>';
  }).join('');
}
```

### 7.3 formAsambleas(data?)

**Propósito**: Modal para crear/editar asamblea.

**Flujo**:
```
1. Si PARCELAS vacío: intenta cargar, sino muestra error
2. Genera chips de parcela (md-filter-chip) para seleccionar asistentes
3. Si isEdit: marca chips como selected según data.asistentesIds
4. Abre modal con form:
   - data-table="asambleas"
   - Fecha (date, required)
   - Tipo (select: Ordinaria/Extraordinaria)
   - Temario (textarea, required)
   - Acuerdos (textarea, optional)
   - Asistentes: chips selector + link "Seleccionar todas"
```

**Código exacto**:
```js
function formAsambleas(data) {
  if (PARCELAS.length === 0) {
    loadJson('PARCELAS').then(function() {
      if (PARCELAS.length === 0) {
        showSnackbar('Primero debes configurar las parcelas', 'warning');
        return;
      }
      formAsambleas(data);
    });
    return;
  }
  var isEdit = !!data;
  var parcelas = PARCELAS.map(function(p) {
    var selected = isEdit && data.asistentesIds && data.asistentesIds.indexOf(p.id) !== -1;
    return '<md-filter-chip label="' + p.numero + '" value="' + p.id + '"' + (selected ? ' selected' : '') + ' onclick="toggleChip(this)"></md-filter-chip>';
  }).join('');
  openModal(isEdit ? 'Editar Asamblea' : 'Agregar Asamblea',
    '<form id="modalForm" data-table="asambleas" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-row">'
      + dateFieldHtml('fecha', 'Fecha*', isEdit ? data.fecha : '')
      + '<div class="form-group"><md-filled-select label="Tipo" name="tipo" required style="width:100%">'
        + '<md-select-option value="Ordinaria"' + (isEdit && data.tipo === 'Ordinaria' ? ' selected' : '') + '><span slot="headline">Ordinaria</span></md-select-option>'
        + '<md-select-option value="Extraordinaria"' + (isEdit && data.tipo === 'Extraordinaria' ? ' selected' : '') + '><span slot="headline">Extraordinaria</span></md-select-option>'
      + '</md-filled-select></div>'
    + '</div>'
    + '<div class="form-group"><md-filled-text-field label="Temario" name="temario" placeholder="Ej: Puntos a tratar en la asamblea" type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.temario) + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><md-filled-text-field label="Acuerdos" name="acuerdos" placeholder="Ej: Decisiones tomadas..." type="textarea" rows="3" style="width:100%"' + (isEdit ? ' value="' + escHtml(data.acuerdos || '') + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><label>Asistentes</label>'
      + '<div style="margin-bottom:0.3rem"><a href="#" onclick="toggleAllAsistentes(); return false" style="color:var(--md-sys-color-primary);font-size:0.8rem">Seleccionar todas</a></div>'
      + '<div id="asistentesChips" class="filter-chips">' + parcelas + '</div>'
    + '</div>'
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
}
```

### 7.4 editAsamblea(id)

```js
function editAsamblea(id) {
  var item = ASAMBLEAS.find(function(a) { return a.id === id; });
  if (!item) return;
  var asistenteIds = (ASAMBLEA_ASISTENTES || []).filter(function(aa) { return aa.asamblea_id === id; }).map(function(aa) { return aa.parcela_id; });
  var copy = Object.assign({}, item, { asistentesIds: asistenteIds });
  formAsambleas(copy);
}
```

### 7.5 deleteAsamblea(id)

```js
function deleteAsamblea(id) {
  if (!IS_ADMIN) return;
  showConfirm('¿Eliminar esta asamblea? Se perderán todos los datos y asistentes asociados. Esta acción no se puede deshacer.', function() {
    if (DEMO_MODE) {
      ASAMBLEAS = ASAMBLEAS.filter(function(a) { return a.id !== id; });
      ASAMBLEA_ASISTENTES = ASAMBLEA_ASISTENTES.filter(function(aa) { return aa.asamblea_id !== id; });
      showSnackbar('Eliminado (demo).', 'success');
      renderAsambleas();
    } else {
      showLoading();
      supabaseClient.from('asamblea_asistentes').delete().eq('asamblea_id', id).then(function() {
        supabaseDelete('asambleas', id).then(function(result) {
          hideLoading();
          if (result) { showSnackbar('Eliminada correctamente.', 'success'); reloadTab(getCurrentTab()); }
        });
      });
    }
  });
}
```

### 7.6 toggleChip(chip) / toggleAllAsistentes()

```js
function toggleChip(chip) {
  if (chip.hasAttribute('selected')) chip.removeAttribute('selected');
  else chip.setAttribute('selected', '');
}

function toggleAllAsistentes() {
  var chips = document.querySelectorAll('#asistentesChips md-filter-chip');
  var allSelected = Array.from(chips).every(function(c) { return c.hasAttribute('selected'); });
  chips.forEach(function(c) {
    if (allSelected) c.removeAttribute('selected');
    else c.setAttribute('selected', '');
  });
}
```

## 8. Manejo de asistentes en handleForm()

En el form, los asistentes se recolectan así:
```js
var asistentesChips = document.getElementById('asistentesChips');
if (asistentesChips) {
  data.asistentes = Array.from(asistentesChips.querySelectorAll('md-filter-chip[selected]'))
    .map(function(c) { return c.getAttribute('value'); })
    .join(', ');
}
```

### En PROD:
```js
if (table === 'asambleas') {
  var asistentesStr = data.asistentes || '';
  var asistentesIds = asistentesStr ? asistentesStr.split(', ') : [];
  delete data.asistentes;
  doUpdate(table, data).then(function(result) {
    if (!result) { submitError(); return; }
    var asambleaId = isEdit ? data.id : result[0] && result[0].id;
    if (isEdit) {
      supabaseClient.from('asamblea_asistentes').delete().eq('asamblea_id', asambleaId).then(function() {
        if (asistentesIds.length) {
          var rows = asistentesIds.map(function(pid) { return { asamblea_id: asambleaId, parcela_id: pid }; });
          supabaseClient.from('asamblea_asistentes').insert(rows).then(function() { afterSave(); });
        } else { afterSave(); }
      });
    } else {
      if (asistentesIds.length) {
        var rows = asistentesIds.map(function(pid) { return { asamblea_id: asambleaId, parcela_id: pid }; });
        supabaseClient.from('asamblea_asistentes').insert(rows).then(function() { afterSave(); });
      } else { afterSave(); }
    }
  });
}
```

### En DEMO:
El bloque `else` al final de handleForm() DEMO maneja asambleas como tabla normal (pushea al array). Pero los asistentes se manejan separadamente en deleteAsamblea.

## 9. Render output exacto

```html
<div class="flujo-card">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
    <span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;
      background:var(--md-sys-color-primary-container);
      color:var(--md-sys-color-on-primary-container)">
      Ordinaria
    </span>
    <div style="display:flex;gap:0.3rem;align-items:center">
      <span style="font-size:0.8rem;color:var(--text-muted)">15/03/2026</span>
      [admin edit/delete icons]
    </div>
  </div>

  <!-- Temario -->
  <div style="font-size:0.85rem;font-weight:600;margin-bottom:0.2rem">Temario</div>
  <div style="font-size:0.85rem;margin-bottom:0.6rem">1. Lectura acta anterior<br>2. Estado de cuentas<br>...</div>

  <!-- Acuerdos (opcional) -->
  <div style="font-size:0.85rem;font-weight:600;margin-bottom:0.2rem">Acuerdos</div>
  <div style="font-size:0.85rem;margin-bottom:0.4rem">Se aprueba presupuesto anual por $2.500.000.<br>...</div>

  <!-- Asistentes (opcional) -->
  <div style="margin-top:0.4rem">
    <strong style="font-size:0.85rem">Asistentes:</strong>
    <div style="margin-top:0.3rem">
      <span style="display:inline-block;background:var(--skeleton-1);color:var(--text-2);padding:0.2rem 0.5rem;border-radius:var(--md-sys-shape-corner-extra-small);font-size:0.8rem;margin:0.1rem">1</span>
      <span style="display:inline-block;background:var(--skeleton-1);color:var(--text-2);padding:0.2rem 0.5rem;border-radius:var(--md-sys-shape-corner-extra-small);font-size:0.8rem;margin:0.1rem">2</span>
    </div>
  </div>
</div>
```

### Extraordinaria badge:
```css
background: var(--color-extraordinaria-bg);
color: var(--color-extraordinaria-text);
```

## 10. Filtros

| Chip | Valor | Filtro |
|------|-------|--------|
| Todos | `'Todos'` | Sin filtro (default selected) |
| Ordinarias | `'Ordinaria'` | `a.tipo === 'Ordinaria'` |
| Extraordinarias | `'Extraordinaria'` | `a.tipo === 'Extraordinaria'` |

## 11. RLS Policies

```sql
-- ASAMBLEAS
CREATE POLICY "asambleas_select" ON asambleas FOR SELECT TO authenticated USING (true);
CREATE POLICY "asambleas_insert" ON asambleas FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "asambleas_update" ON asambleas FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "asambleas_delete" ON asambleas FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ASAMBLEA_ASISTENTES
CREATE POLICY "asamblea_asistentes_select" ON asamblea_asistentes FOR SELECT TO authenticated USING (true);
CREATE POLICY "asamblea_asistentes_insert" ON asamblea_asistentes FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "asamblea_asistentes_delete" ON asamblea_asistentes FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 12. Colores de tipo

| Tipo | Variable CSS fondo | Variable CSS texto |
|------|--------------------|--------------------|
| Ordinaria | `--md-sys-color-primary-container` | `--md-sys-color-on-primary-container` |
| Extraordinaria | `--color-extraordinaria-bg` | `--color-extraordinaria-text` |

## 13. Dependencias

- Requiere `PARCELAS` cargado antes de abrir el form (para chips de asistentes)
- La edición requiere `ASAMBLEA_ASISTENTES` cargado (para preseleccionar asistentes)
- ON DELETE CASCADE: al eliminar asamblea, se eliminan sus asistentes automáticamente
