# Gastos Comunes

## 1. Descripción general

Módulo principal del sistema. Es el primer tab que ve el usuario. Registra, visualiza y analiza los gastos comunes (expensas) que cada parcela debe pagar mensualmente. Incluye tabla de registros, 4 cards de estadísticas, 2 gráficos Chart.js y filtros combinados.

ID del tab: `cuenta`
Contenedor: `<div id="tab-cuenta">`
Clase: `tab-content active` (es el único tab activo por defecto)

## 2. Schema SQL

```sql
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,                       -- formato "YYYY-MM"
  concepto TEXT NOT NULL,                      -- generado auto: "GC_MM_AAAA_NUMERO"
  monto NUMERIC NOT NULL,
  descripcion TEXT,
  archivo TEXT,                                -- URL del comprobante en Storage
  pagado TEXT DEFAULT 'No',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/gastos.json)

```json
[
  {
    "id": "g1",
    "parcela_id": "p1",
    "periodo": "2026-03",
    "concepto": "GC_03_2026_1",
    "monto": 65000,
    "descripcion": "Gasto común marzo 2026 - Parcela 1",
    "archivo": "",
    "pagado": "No",
    "created_at": "2026-03-01T00:00:00Z"
  },
  {
    "id": "g2",
    "parcela_id": "p2",
    "periodo": "2026-03",
    "concepto": "GC_03_2026_2",
    "monto": 65000,
    "descripcion": "Gasto común marzo 2026 - Parcela 2",
    "archivo": "",
    "pagado": "No",
    "created_at": "2026-03-01T00:00:00Z"
  }
]
```

## 4. HTML structure (index.html lines 63-108)

```html
<div id="tab-cuenta" class="tab-content active" role="region" aria-label="Gastos comunes" aria-busy="true">
  <!-- Botón admin -->
  <md-filled-button class="admin-only" id="formGastos" onclick="formGastos()">
    <md-icon slot="icon">add</md-icon>Agregar Gasto
  </md-filled-button>

  <!-- Stats cards -->
  <section class="stats" id="stats">
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
  </section>

  <!-- Filtros -->
  <div class="filters">
    <md-filled-select id="periodFilter" label="Periodo"></md-filled-select>
    <md-filled-select id="parcelaFilter" label="Parcela"></md-filled-select>
  </div>

  <!-- Charts -->
  <section class="charts">
    <div class="chart-box">
      <h3>Monto por período</h3>
      <canvas id="chartPeriodos"></canvas>
    </div>
    <div class="chart-box">
      <h3>Por parcela</h3>
      <canvas id="chartParcelas"></canvas>
    </div>
  </section>

  <!-- Tabla -->
  <div class="table-wrap">
    <h3>Registros</h3>
    <div id="tableLoading">
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
      <div class="skeleton skeleton-row"></div>
    </div>
    <table style="display:none" id="tableGastos">
      <thead>
        <tr>
          <th>Parcela</th>
          <th>Periodo</th>
          <th>Monto</th>
          <th>Comprobante</th>
          <th></th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>
</div>
```

## 5. CSS classes used

| Class | Element | Estilo |
|-------|---------|--------|
| `.stats` | `<section>` | Grid 4 columnas, gap 1rem, responsive (700px breakpoint: 2 col, 500px: 1 col) |
| `.stat-card` | `<div>` interno | Card con padding, bg-card, border-radius, sombra |
| `.stat-card .label` | `<div>` | font-size 0.8rem, text-muted, margin-bottom 0.3rem |
| `.stat-card .value` | `<div>` | font-size 1.4rem, font-weight 700 |
| `.value.blue` | `<div>` | color: `--md-sys-color-primary` (azul) |
| `.filters` | `<div>` | display flex, gap 1rem, responsive flex-direction column |
| `.charts` | `<section>` | display grid, 2 columns, responsive 1 col |
| `.chart-box` | `<div>` | bg-card, border-radius, padding, height 300px |
| `.table-wrap` | `<div>` | overflow-x auto, bg-card, border-radius |
| `.skeleton` | varios | Animación de shimmer, bg gradient |
| `.skeleton-stat` | stat skeleton | height 80px, border-radius |
| `.skeleton-row` | table row skeleton | height 40px |

### Clases dinámicas inline (no en CSS)
- Colores de value: `blue` (total), sin clase (registros, periodos, parcelas)
- Badge de tipo en modal: no aplica
- Admin actions: solo visible si `IS_ADMIN`

## 6. Global state

```js
// En config.js
var GASTOS = [];                           // Array de objetos gasto
var PARCELAS = [];                         // Array de objetos parcela

// En renderers.js
// No hay variable filter global para gastos (usa DOM)
```

## 7. JS functions — lista completa

### 7.1 fillFilters()

**Propósito**: Llena los selects de periodo y parcela en el DOM.

**Llamado desde**: `loadInitialData()` en `data.js`

**Flujo**:
```
1. Recorre GASTOS, extrae periodos únicos, ordena descendente
2. Setea innerHTML de #periodFilter con md-select-option
   - Primer option: "Todos" (value="")
   - Options: cada periodo formateado con formatPeriodo()
3. Ordena PARCELAS por número (numeric sort)
4. Setea innerHTML de #parcelaFilter con md-select-option
   - Primer option: "Todas" (value="")
   - Options: cada parcela con value=id, headline=numero
5. Asigna onchange = applyFilters a ambos selects
```

**Código exacto**:
```js
function fillFilters() {
  var periodos = [];
  GASTOS.forEach(function(r) {
    if (r.periodo && periodos.indexOf(r.periodo) === -1)
      periodos.push(r.periodo);
  });
  periodos.sort().reverse();

  var pf = document.getElementById('periodFilter');
  pf.innerHTML = '<md-select-option value=""><span slot="headline">Todos</span></md-select-option>'
    + periodos.map(function(p) {
        return '<md-select-option value="' + p + '"><span slot="headline">' + formatPeriodo(p) + '</span></md-select-option>';
      }).join('');

  var paf = document.getElementById('parcelaFilter');
  var sorted = PARCELAS.slice().sort(function(a, b) {
    return (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true });
  });
  paf.innerHTML = '<md-select-option value=""><span slot="headline">Todas</span></md-select-option>'
    + sorted.map(function(p) {
        return '<md-select-option value="' + p.id + '"><span slot="headline">' + p.numero + '</span></md-select-option>';
      }).join('');

  pf.onchange = applyFilters;
  paf.onchange = applyFilters;
}
```

### 7.2 filteredData()

**Propósito**: Retorna los gastos filtrados según selects actuales.

**Llamado desde**: `applyFilters()`, `renderStatsAndTable()`

**Retorna**: Array de objetos gasto

**Código exacto**:
```js
function filteredData() {
  var p = document.getElementById('periodFilter').value;
  var pa = document.getElementById('parcelaFilter').value;
  return GASTOS.filter(function(r) {
    return (!p || r.periodo == p) && (!pa || r.parcela_id == pa);
  });
}
```

### 7.3 applyFilters()

**Propósito**: Re-renderiza stats, tabla y charts con datos filtrados.

**Llamado desde**: `onchange` de selects, `loadInitialData()`

**Código exacto**:
```js
function applyFilters() {
  var data = filteredData();
  renderStats(data);
  renderTable(data);
  renderCharts(data);
}
```

### 7.4 renderStats(data)

**Propósito**: Renderiza los 4 stat cards.

**Llamado desde**: `applyFilters()`, `renderStatsAndTable()`

**Código exacto**:
```js
function renderStats(data) {
  var total = data.reduce(function(s, r) { return s + parseFloat(r.monto || 0); }, 0);
  var periodos = [];
  var parcelas = [];
  data.forEach(function(r) {
    if (periodos.indexOf(r.periodo) === -1) periodos.push(r.periodo);
    if (r.parcela_id && parcelas.indexOf(r.parcela_id) === -1) parcelas.push(r.parcela_id);
  });
  document.getElementById('stats').innerHTML =
    '<div class="stat-card"><div class="label">Total recaudado</div><div class="value blue">$' + formatMoney(total) + '</div></div>'
    + '<div class="stat-card"><div class="label">Registros</div><div class="value">' + data.length + '</div></div>'
    + '<div class="stat-card"><div class="label">Periodos</div><div class="value">' + periodos.length + '</div></div>'
    + '<div class="stat-card"><div class="label">Parcelas</div><div class="value">' + parcelas.length + '</div></div>';
}
```

### 7.5 renderTable(data)

**Propósito**: Renderiza la tabla de registros.

**Llamado desde**: `applyFilters()`, `renderStatsAndTable()`

**Comportamiento**:
- Si `data.length === 0`: muestra "Sin registros" en tbody (colspan 5)
- Si hay datos: genera TRs con parcela, periodo, monto ($), comprobante (link "Ver" si existe), acciones admin

**Código exacto**:
```js
function renderTable(data) {
  document.getElementById('tableLoading').style.display = 'none';
  document.getElementById('tableGastos').style.display = 'table';
  var tbody = document.getElementById('tableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--md-sys-color-outline);padding:1.5rem">Sin registros</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(function(r) {
    return '<tr>'
      + '<td>' + parcelName(r.parcela_id) + '</td>'
      + '<td>' + formatPeriodo(r.periodo) + '</td>'
      + '<td>$' + formatMoney(parseFloat(r.monto || 0)) + '</td>'
      + '<td>' + (r.archivo ? '<a href="' + r.archivo + '" target="_blank">Ver</a>' : '') + '</td>'
      + '<td>' + adminActions("editGasto('" + r.id + "')", "deleteGasto('" + r.id + "')") + '</td>'
      + '</tr>';
  }).join('');
}
```

### 7.6 renderCharts(data)

**Propósito**: Renderiza los 2 gráficos Chart.js.

**Llamado desde**: `applyFilters()`

**Código exacto**:
```js
function renderCharts(data) {
  renderPeriodChart(data);
  renderParcelaChart(data);
}
```

### 7.7 renderPeriodChart(data)

**Agrupa** por periodo, suma montos. **Gráfico de barras**.

**Código exacto**:
```js
function renderPeriodChart(data) {
  var groups = {};
  data.forEach(function(r) {
    var p = r.periodo || 'Sin periodo';
    groups[p] = (groups[p] || 0) + parseFloat(r.monto || 0);
  });
  var labels = Object.keys(groups).map(formatPeriodo);
  var values = Object.values(groups);
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  var primary = getCSS('--md-sys-color-primary');
  var ctx = document.getElementById('chartPeriodos').getContext('2d');
  if (chartPeriodos) chartPeriodos.destroy();
  chartPeriodos = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'Monto', data: values, backgroundColor: primary, borderRadius: 4 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: {
          beginAtZero: true,
          ticks: { color: textColor, callback: function(v) { return '$' + formatMoney(v); } },
          grid: { color: gridColor }
        }
      }
    }
  });
}
```

### 7.8 renderParcelaChart(data)

**Agrupa** por parcela, suma montos. **Gráfico de dona**.

**Código exacto**:
```js
function renderParcelaChart(data) {
  var groups = {};
  data.forEach(function(r) {
    var p = parcelName(r.parcela_id) || 'Sin parcela';
    groups[p] = (groups[p] || 0) + parseFloat(r.monto || 0);
  });
  var labels = Object.keys(groups);
  var values = Object.values(groups);
  var textColor = getCSS('--text');
  var colors = ['#10b981', '#f59e0b', '#b91c1c', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];
  var primary = getCSS('--md-sys-color-primary');
  colors.unshift(primary);
  var ctx = document.getElementById('chartParcelas').getContext('2d');
  if (chartParcelas) chartParcelas.destroy();
  chartParcelas = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length) }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12, font: { size: 11 } } } }
    }
  });
}
```

### 7.9 updateChartTheme()

**Propósito**: Actualiza colores de charts al cambiar dark/light mode.

```js
function updateChartTheme() {
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  var primary = getCSS('--md-sys-color-primary');
  if (chartPeriodos) {
    chartPeriodos.data.datasets[0].backgroundColor = primary;
    chartPeriodos.options.scales.x.ticks.color = textColor;
    chartPeriodos.options.scales.y.ticks.color = textColor;
    chartPeriodos.options.scales.x.grid.color = gridColor;
    chartPeriodos.options.scales.y.grid.color = gridColor;
    chartPeriodos.update();
  }
  if (chartParcelas) {
    chartParcelas.options.plugins.legend.labels.color = textColor;
    chartParcelas.update();
  }
}
```

### 7.10 formGastos(data?)

**Propósito**: Abre modal para crear o editar gasto.

**Parámetros**:
- `undefined` o `null`: modo creación
- Objeto con `id, parcela_id, periodo, monto, descripcion, archivo`: modo edición

**Flujo**:
```
1. Si PARCELAS está vacío, intenta cargarlo con loadJson('PARCELAS')
2. Ordena parcelas numéricamente
3. Genera options de parcelas
4. Genera options de periodos: ±6 meses desde ahora
5. Abre modal con form
   - data-table="gastos"
   - Hidden: id (si es edit), concepto (autogenerado)
   - Select: periodo
   - Select: parcela (parcela_id)
   - Input number: monto
   - Textarea: descripcion (required)
   - File: archivo (accept="image/*")
   - Si edit: muestra archivo actual como link
6. Asigna event listeners:
   - #gastoPeriodo onchange → updateGastoParcelas()
   - #gastoParcela onchange → updateGastoConcepto()
7. Ejecuta updateGastoConcepto() inicial
```

**Código exacto**:
```js
function formGastos(opt) {
  var isEdit = opt && typeof opt === 'object';
  var data = isEdit ? opt : null;
  if (PARCELAS.length === 0) {
    loadJson('PARCELAS').then(function() { formGastos(opt); });
    return;
  }
  var sorted = PARCELAS.slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  var parcelas = sorted.map(function(p) {
    var sel = isEdit && data.parcela_id === p.id ? ' selected' : '';
    return '<md-select-option value="' + p.id + '"' + sel + '><span slot="headline">' + p.numero + '</span></md-select-option>';
  }).join('');
  var meses = [];
  var now = new Date();
  for (var i = -6; i <= 6; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    var val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var label = d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
    var sel = isEdit && data.periodo === val ? ' selected' : '';
    meses.push('<md-select-option value="' + val + '"' + sel + '><span slot="headline">' + label + '</span></md-select-option>');
  }
  openModal(isEdit ? 'Editar Gasto' : 'Agregar Gasto',
    '<form id="modalForm" data-table="gastos" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<input type="hidden" name="concepto" id="gastoConcepto">'
    + '<div class="form-group"><md-filled-select label="Periodo" name="periodo" required id="gastoPeriodo" style="width:100%">' + meses.join('') + '</md-filled-select></div>'
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-select label="Parcela" name="parcela_id" required id="gastoParcela" style="width:100%">' + parcelas + '</md-filled-select></div>'
      + '<div class="form-group"><md-filled-text-field label="Monto" type="number" name="monto" min="0" placeholder="Ej: 0" required style="width:100%"' + (isEdit ? ' value="' + data.monto + '"' : '') + '></md-filled-text-field></div>'
    + '</div>'
    + '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalles del gasto..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><label>Comprobante (foto)</label><input type="file" name="archivo" accept="image/*"></div>'
    + (isEdit && data.archivo ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.archivo + '" target="_blank">ver</a></div>' : '')
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
  document.getElementById('gastoPeriodo').addEventListener('change', updateGastoParcelas);
  document.getElementById('gastoParcela').addEventListener('change', updateGastoConcepto);
  updateGastoConcepto();
}
```

### 7.11 updateGastoParcelas()

**Propósito**: Al cambiar periodo, filtra parcelas disponibles (excluye las que ya tienen gasto en ese periodo).

**Código exacto**:
```js
function updateGastoParcelas() {
  var periodo = document.getElementById('gastoPeriodo').value;
  var select = document.getElementById('gastoParcela');
  var usadas = GASTOS.filter(function(g) { return g.periodo === periodo; }).map(function(g) { return g.parcela_id; });
  var sorted = PARCELAS.filter(function(p) { return usadas.indexOf(p.id) === -1; }).slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  select.innerHTML = sorted.map(function(p) {
    return '<md-select-option value="' + p.id + '"><span slot="headline">' + p.numero + '</span></md-select-option>';
  }).join('');
  if (sorted.length === 0) {
    select.innerHTML = '<md-select-option value="" disabled selected>Todas las parcelas ya tienen gasto</md-select-option>';
    select.disabled = true;
  } else {
    select.disabled = false;
  }
  updateGastoConcepto();
}
```

### 7.12 updateGastoConcepto()

**Propósito**: Genera concepto automático "GC_MM_AAAA_NUMERO".

**Código exacto**:
```js
function updateGastoConcepto() {
  var periodo = document.getElementById('gastoPeriodo').value || '';
  var select = document.getElementById('gastoParcela');
  var selectedValue = select.value;
  var parcela = PARCELAS.find(function(p) { return p.id === selectedValue; });
  var numero = parcela ? parcela.numero : '';
  var conceptoEl = document.getElementById('gastoConcepto');
  if (periodo && numero) {
    var parts = periodo.split('-');
    conceptoEl.value = 'GC_' + parts[1] + '_' + parts[0] + '_' + numero;
  } else {
    conceptoEl.value = '';
  }
}
```

### 7.13 renderStatsAndTable()

**Propósito**: Re-renderiza stats y tabla (sin charts, usado después de crear/editar).

```js
function renderStatsAndTable() {
  var data = filteredData();
  renderStats(data);
  renderTable(data);
}
```

### 7.14 editGasto(id) / deleteGasto(id)

```js
function editGasto(id) {
  var data = GASTOS.find(function(g) { return g.id === id; });
  if (data) formGastos(data);
}

function deleteGasto(id) {
  deleteItem('gastos', id, 'GASTOS', renderStatsAndTable);
}
```

## 8. Modal form HTML (generado por formGastos)

```html
<form id="modalForm" data-table="gastos" onsubmit="handleForm(event)">
  <!-- EDIT MODE ONLY -->
  <input type="hidden" name="id" value="g1">

  <!-- Hidden: concepto (autogenerado) -->
  <input type="hidden" name="concepto" id="gastoConcepto" value="GC_03_2026_1">

  <!-- Periodo -->
  <div class="form-group">
    <md-filled-select label="Periodo" name="periodo" required id="gastoPeriodo" style="width:100%">
      <md-select-option value="2026-01"><span slot="headline">enero 2026</span></md-select-option>
      <md-select-option value="2026-02"><span slot="headline">febrero 2026</span></md-select-option>
      <md-select-option value="2026-03" selected><span slot="headline">marzo 2026</span></md-select-option>
      ...
    </md-filled-select>
  </div>

  <!-- Parcela + Monto (row) -->
  <div class="form-row">
    <div class="form-group">
      <md-filled-select label="Parcela" name="parcela_id" required id="gastoParcela" style="width:100%">
        <md-select-option value="p1"><span slot="headline">1</span></md-select-option>
        <md-select-option value="p2"><span slot="headline">2</span></md-select-option>
        ...
      </md-filled-select>
    </div>
    <div class="form-group">
      <md-filled-text-field label="Monto" type="number" name="monto" min="0"
        placeholder="Ej: 0" required style="width:100%" value="65000">
      </md-filled-text-field>
    </div>
  </div>

  <!-- Descripción -->
  <div class="form-group">
    <md-filled-text-field label="Descripción" name="descripcion"
      placeholder="Ej: Detalles del gasto..." type="textarea" rows="3"
      required style="width:100%" value="Gasto común marzo 2026">
    </md-filled-text-field>
  </div>

  <!-- Archivo -->
  <div class="form-group">
    <label>Comprobante (foto)</label>
    <input type="file" name="archivo" accept="image/*">
  </div>

  <!-- EDIT: archivo actual -->
  <div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">
    Archivo actual: <a href="https://..." target="_blank">ver</a>
  </div>
</form>
```

## 9. Data flow: creación de gasto

### Modo demo
```
formGastos() → handleForm(event)
  → recolecta datos del form
  → si hay archivo: supabaseUpload() (no hace nada en demo)
  → DEMO_MODE = true
  → arrName = tableToArray('gastos') → null (gastos no está en el map)
  → NOTA: gastos no tiene tableToArray, por lo que en demo...
    → En realidad el código actual no maneja el caso 'gastos' en el bloque DEMO_MODE de handleForm()
    → Cae en el else final: data.id = generateUUID(); window[arrName].push(data);
    → Pero arrName es null, entonces no pushea
    → wait, revisemos el código exacto:
    → En handleForm(), el bloque DEMO_MODE tiene:
      if (table === 'encuestas') { ... }
      else if (isEdit) { ... busca arrName y reemplaza }
      else { arrName = tableToArray(table); if (arrName) { data.id = generateUUID(); window[arrName].push(data); } }
    → tableToArray('gastos') → null (no está en el map)
    → Entonces en demo, los gastos no se guardan realmente en handleForm()
    → Sin embargo, el código actual de handleForm DEMO tiene ese bug para gastos
    → En la práctica, el formulario snackbar "Guardado correctamente" y reloadTab(), que recarga de JSON
```

### Modo producción
```
handleForm(event)
  → recolecta datos
  → si archivo: supabaseUpload → URL
  → doUpdate('gastos', data)
    → isEdit ? supabaseUpdate('gastos', id, data) : supabaseInsert('gastos', data)
  → afterSave()
    → hideLoading(), showSnackbar, closeModal(), reloadTab('cuenta')
```

## 10. handleForm() para gastos (flujo exacto en el código)

```
form.onsubmit:
1. e.preventDefault()
2. Disable submit button, text = "Guardando..."
3. showLoading()
4. Recolectar data de: hidden inputs, inputs (not file), textareas, selects, md-filled-text-field, md-filled-select
5. Recolectar asistentes (no aplica a gastos)
6. table = 'gastos'
7. isEdit = !!data.id
8. Auto-date: no aplica (gastos no está en autoDateTables)
9. registrado_por: no aplica
10. web_instagram: no aplica
11. Delete data.parcela_id si está vacío: no aplica (siempre tiene valor)
12. File upload:
    - bucket = form.dataset.bucket || 'gastos_comunes' → 'gastos_comunes'
    - folder = data.periodo (ej: "2026-03")
    - supabaseUpload(file, bucket, folder) → Promise<URL>
13. En el .then():
    a. Si DEMO_MODE:
       - No hay case específico para 'gastos'
       - Cae en else final: tableToArray('gastos') → null
       - No hace nada en arrays
       - Llama afterSave() igual → reloadTab
    b. Si PROD:
       - doUpdate('gastos', data) → supabaseInsert/supabaseUpdate
       - afterSave()
```

## 11. Event handlers

| Elemento | Evento | Handler | Línea |
|----------|--------|---------|-------|
| `#periodFilter` | change | `applyFilters` | fillFilters:63 |
| `#parcelaFilter` | change | `applyFilters` | fillFilters:64 |
| `#formGastos` | click | `formGastos()` | index.html:65 |
| `#gastoPeriodo` | change | `updateGastoParcelas` | formGastos:328 |
| `#gastoParcela` | change | `updateGastoConcepto` | formGastos:329 |

## 12. Estados de UI

### Empty state (sin datos filtrados)
- Stats: 0 en total, 0 registros, 0 periodos, 0 parcelas
- Tabla: "Sin registros" (colspan 5, centered, muted)
- Charts: se renderizan con datos vacíos (chart vacío)

### Loading state
- Stats: 4 skeletons
- Charts: no se renderizan hasta applyFilters
- Tabla: 5 skeleton rows, table oculta

### Error state
- No hay manejo de error específico para gastos
- Los errores de carga se loguean en console.error (data.js:31)

## 13. Validaciones

| Campo | Regla | UI |
|-------|-------|-----|
| periodo | required | md-filled-select maneja required |
| parcela_id | required, no duplicado | Select filtra parcelas ya usadas en ese periodo |
| monto | number, min=0, required | HTML input type="number" min="0" |
| descripcion | required | HTML required |
| archivo | accept="image/*" | Restricción de tipo |

## 14. Dependencias

- Requiere `PARCELAS` cargado (se carga en `loadInitialData()` junto con `GASTOS`)
- Requiere Chart.js (CDN en index.html)
- Charts requieren canvas elements en DOM

## 15. Carga inicial (data.js)

```js
async function loadInitialData() {
  await Promise.all([loadJson('GASTOS'), loadJson('PARCELAS'), loadConfig()]);
  fillFilters();
  applyFilters();
  var tabEl = document.getElementById('tab-cuenta');
  if (tabEl) tabEl.setAttribute('aria-busy', 'false');
}
```

## 16. Carga al switchear tab

```js
cuenta: function() {
  return loadJson('GASTOS').then(function() { fillFilters(); applyFilters(); });
}
```

## 17. RLS Policies

```sql
-- SELECT: cualquier authenticated
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT TO authenticated USING (true);

-- INSERT: solo admin
CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT TO authenticated
  WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- UPDATE: solo admin
CREATE POLICY "gastos_update" ON gastos
  FOR UPDATE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- DELETE: solo admin
CREATE POLICY "gastos_delete" ON gastos
  FOR DELETE TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 18. Cálculo de montos

- `monto` se almacena como NUMERIC en DB
- En JS: `parseFloat(r.monto || 0)` para sumar
- `formatMoney()` formatea con separadores de miles (punto cada 3 dígitos)
- Prefijo `$` en display
- Sin decimales (se redondea con Math.round en formatMoney)

## 19. formatMoney()

```js
function formatMoney(v) {
  var s = Math.round(v).toString();
  var result = '';
  var count = 0;
  for (var i = s.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) result = '.' + result;
    result = s.charAt(i) + result;
    count++;
  }
  return result;
}
```

## 20. Utilidades usadas

- `parcelName(parcelaId)` → número de parcela desde PARCELAS
- `formatPeriodo(p)` → "YYYY-MM" → "MM/AAAA"
- `formatMoney(v)` → número a string con separador de miles
- `adminActions(editFn, deleteFn)` → HTML con botones edit/delete (solo admin)
- `deleteItem(table, id, arrayName, renderFn)` → confirmación + eliminación

## 21. Upload de archivos

- Bucket: `gastos_comunes` (default)
- Carpeta: `{periodo}/` (ej: "2026-03/")
- Solo imágenes (`accept="image/*"`)
- Opcional (el form funciona sin archivo)
- En demo: no se sube, campo queda vacío
- En prod: `supabaseUpload()` (definido en supabase-config.js)
