# Ingresos/Egresos (Flujo de Caja)

## 1. Descripción general

Registro de movimientos financieros del condominio. Incluye ingresos y egresos con concepto configurable, fecha, monto, descripción y comprobante opcional. Muestra estadísticas de totales y balance.

ID del tab: `flujo`
Contenedor: `<div id="tab-flujo">`

## 2. Schema SQL

```sql
CREATE TABLE flujo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Egreso')),
  concepto TEXT NOT NULL,
  monto NUMERIC NOT NULL,
  descripcion TEXT,
  comprobante TEXT,
  registrado_por TEXT,               -- email del admin (autogenerado)
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/ingresos_egresos.json)

```json
[
  {
    "id": "f1",
    "fecha": "2026-03-01",
    "tipo": "Ingreso",
    "concepto": "Cuotas ordinarias",
    "monto": 2500000,
    "descripcion": "Pago de gastos comunes marzo 2026",
    "comprobante": "",
    "registrado_por": "admin@condominio.cl",
    "created_at": "2026-03-01T00:00:00Z"
  },
  {
    "id": "f2",
    "fecha": "2026-03-05",
    "tipo": "Egreso",
    "concepto": "Mantención",
    "monto": 350000,
    "descripcion": "Pago a Jardines Ltda. por mantención de áreas verdes",
    "comprobante": "https://ejemplo.com/comprobante.jpg",
    "registrado_por": "admin@condominio.cl",
    "created_at": "2026-03-05T00:00:00Z"
  }
]
```

## 4. HTML structure (index.html lines 135-154)

```html
<div id="tab-flujo" class="tab-content" role="region" aria-label="Ingresos/Egresos">
  <md-filled-button class="admin-only" id="formFlujo" onclick="formFlujo()">
    <md-icon slot="icon">add</md-icon>Agregar Movimiento
  </md-filled-button>

  <section class="stats" id="flujoStats">
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
  </section>

  <div class="filter-chips" id="flujoFilter">
    <md-filter-chip label="Todos" selected onclick="filterFlujo('todos')"></md-filter-chip>
    <md-filter-chip label="Ingresos" onclick="filterFlujo('Ingreso')"></md-filter-chip>
    <md-filter-chip label="Egresos" onclick="filterFlujo('Egreso')"></md-filter-chip>
  </div>

  <div class="table-wrap" id="flujoList">
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
    <div class="skeleton skeleton-row"></div>
  </div>
</div>
```

## 5. Global state

```js
var FLUJO = [];
var flujoFilter = 'todos';
```

## 6. Tab data loading

```js
flujo: function() {
  return loadJson('FLUJO').then(function() { renderFlujo(); });
}
```

## 7. JS Functions

### 7.1 filterFlujo(tipo)

```js
function filterFlujo(tipo) {
  flujoFilter = tipo;
  document.querySelectorAll('#flujoFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderFlujo();
}
```

### 7.2 renderFlujo()

**Flujo**:
```
1. Calcular stats:
   - ingresos = FLUJO.filter(tipo 'Ingreso')
   - egresos = FLUJO.filter(tipo 'Egreso')
   - totalIngresos = sum montos ingresos
   - totalEgresos = sum montos egresos
   - balance = totalIngresos - totalEgresos
2. Renderizar 4 stat cards
3. Filtrar según flujoFilter
4. Ordenar por fecha descendente
5. Renderizar tabla (min-width:640px, scroll horizontal en mobile):
   a. Columna Fecha
   b. Columna Tipo (badge coloreado)
   c. Columna Concepto (+ descripción debajo)
   d. Columna Comprobante (icono receipt si existe)
   e. Columna Monto (derecha, coloreado según tipo)
   f. Columna Acciones admin
6. Si no hay registros: fila con "Sin registros" (colspan=6)
```

**Código exacto**:
```js
function renderFlujo() {
  var ingresos = FLUJO.filter(function(f) { return f.tipo === 'Ingreso'; });
  var egresos = FLUJO.filter(function(f) { return f.tipo === 'Egreso'; });
  var totalIngresos = ingresos.reduce(function(s, f) { return s + parseFloat(f.monto); }, 0);
  var totalEgresos = egresos.reduce(function(s, f) { return s + parseFloat(f.monto); }, 0);
  var balance = totalIngresos - totalEgresos;

  document.getElementById('flujoStats').innerHTML =
    '<div class="stat-card"><div class="label">Ingresos</div><div class="value green">$' + formatMoney(totalIngresos) + '</div></div>'
    + '<div class="stat-card"><div class="label">Egresos</div><div class="value red">$' + formatMoney(totalEgresos) + '</div></div>'
    + '<div class="stat-card"><div class="label">Balance</div><div class="value ' + (balance >= 0 ? 'green' : 'red') + '">$' + formatMoney(balance) + '</div></div>'
    + '<div class="stat-card"><div class="label">Movimientos</div><div class="value">' + FLUJO.length + '</div></div>';

  var filtered = flujoFilter === 'todos' ? FLUJO : FLUJO.filter(function(f) { return f.tipo === flujoFilter; });
  var list = document.getElementById('flujoList');
  var sorted = filtered.slice().sort(function(a, b) { return new Date(b.fecha) - new Date(a.fecha); });

  var head = '<thead><tr>'
    + '<th>Fecha</th>'
    + '<th>Tipo</th>'
    + '<th>Concepto</th>'
    + '<th>Comprobante</th>'
    + '<th style="text-align:right">Monto</th>'
    + '<th></th>'
    + '</tr></thead>';

  var body;
  if (!sorted.length) {
    body = '<tbody><tr><td colspan="6" style="text-align:center;color:var(--md-sys-color-outline);padding:1.5rem">Sin registros</td></tr></tbody>';
  } else {
    body = '<tbody>' + sorted.map(function(f) {
      var color = f.tipo === 'Ingreso' ? 'var(--color-positive)' : 'var(--md-sys-color-error)';
      var bgColor = f.tipo === 'Ingreso' ? 'var(--color-positive-bg)' : 'var(--md-sys-color-error-container)';
      var textColor = f.tipo === 'Ingreso' ? 'var(--color-positive-text)' : 'var(--md-sys-color-on-error-container)';
      return '<tr>'
        + '<td style="white-space:nowrap">' + formatDate(f.fecha) + '</td>'
        + '<td><span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:' + bgColor + ';color:' + textColor + '">' + f.tipo + '</span></td>'
        + '<td>' + f.concepto + (f.descripcion ? '<div style="font-size:0.8rem;color:var(--text-muted)">' + nl2br(f.descripcion) + '</div>' : '') + '</td>'
        + '<td>' + (f.comprobante ? '<a href="' + f.comprobante + '" target="_blank" style="text-decoration:none"><md-icon-button style="color:var(--md-sys-color-primary)" title="Ver comprobante"><md-icon>receipt</md-icon></md-icon-button></a>' : '') + '</td>'
        + '<td style="text-align:right;font-weight:600;white-space:nowrap;color:' + color + '">$' + formatMoney(parseFloat(f.monto)) + '</td>'
        + '<td>' + adminActions("editFlujo('" + f.id + "')", "deleteFlujo('" + f.id + "')") + '</td>'
        + '</tr>';
    }).join('') + '</tbody>';
  }

  list.innerHTML = '<table style="min-width:640px">' + head + body + '</table>';
}
```

### 7.3 formFlujo(data?)

```js
function formFlujo(data) {
  var conceptos = CONFIG.conceptos_flujo || [];
  if (!conceptos.length) {
    showSnackbar('Primero debes configurar los conceptos en la pestaña Configuración.', 'warning');
    return;
  }
  var isEdit = !!data;
  var opts = conceptos.map(function(c) {
    return '<md-select-option value="' + c + '"' + (isEdit && data.concepto === c ? ' selected' : '') + '><span slot="headline">' + c + '</span></md-select-option>';
  }).join('');
  openModal(isEdit ? 'Editar Movimiento' : 'Agregar Movimiento',
    '<form id="modalForm" data-table="flujo" data-bucket="ingresos_egresos" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-select label="Tipo" name="tipo" required style="width:100%">'
        + '<md-select-option value="Ingreso"' + (isEdit && data.tipo === 'Ingreso' ? ' selected' : '') + '><span slot="headline">Ingreso</span></md-select-option>'
        + '<md-select-option value="Egreso"' + (isEdit && data.tipo === 'Egreso' ? ' selected' : '') + '><span slot="headline">Egreso</span></md-select-option>'
      + '</md-filled-select></div>'
      + dateFieldHtml('fecha', 'Fecha*', isEdit ? data.fecha : '')
    + '</div>'
    + '<div class="form-group"><md-filled-select label="Concepto" name="concepto" required style="width:100%">' + opts + '</md-filled-select></div>'
    + '<div class="form-group"><md-filled-text-field label="Monto" type="number" name="monto" min="0" placeholder="Ej: 0" required style="width:100%"' + (isEdit ? ' value="' + data.monto + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalles del movimiento..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><label>Comprobante (foto)</label><input type="file" name="comprobante" accept="image/*"></div>'
    + (isEdit && data.comprobante ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.comprobante + '" target="_blank">ver</a></div>' : '')
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
}
```

## 8. Render output exacto

```html
<table style="min-width:640px">
  <thead>
    <tr>
      <th>Fecha</th>
      <th>Tipo</th>
      <th>Concepto</th>
      <th>Comprobante</th>
      <th style="text-align:right">Monto</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="white-space:nowrap">01/03/2026</td>
      <td><span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:var(--color-positive-bg);color:var(--color-positive-text)">Ingreso</span></td>
      <td>Cuotas ordinarias<div style="font-size:0.8rem;color:var(--text-muted)">Pago de gastos comunes marzo 2026</div></td>
      <td><!-- comprobante si existe --><a href="https://..." target="_blank" style="text-decoration:none"><md-icon-button style="color:var(--md-sys-color-primary)" title="Ver comprobante"><md-icon>receipt</md-icon></md-icon-button></a></td>
      <td style="text-align:right;font-weight:600;white-space:nowrap;color:var(--color-positive)">$2.500.000</td>
      <td>[edit] [delete]</td>
    </tr>
  </tbody>
</table>
```

## 9. Colores según tipo

| Tipo | Texto monto | Badge bg | Badge text | Variable fondo |
|------|-------------|----------|------------|----------------|
| Ingreso | `--color-positive` (#22c55e) | `--color-positive-bg` | `--color-positive-text` | rgba verde |
| Egreso | `--md-sys-color-error` (#b91c1c) | `--md-sys-color-error-container` | `--md-sys-color-on-error-container` | rojo |

## 10. Filtros

| Chip | Filtro |
|------|--------|
| Todos (default) | Sin filtro |
| Ingresos | `f.tipo === 'Ingreso'` |
| Egresos | `f.tipo === 'Egreso'` |

## 11. Auto-registrado_por

```js
if (table === 'flujo' && currentUser && !data.registrado_por) {
  data.registrado_por = currentUser.email;
}
```

## 12. Dependencia de conceptos

Si `CONFIG.conceptos_flujo` está vacío:
```js
showSnackbar('Primero debes configurar los conceptos en la pestaña Configuración.', 'warning');
```
No se abre el modal.

## 13. Upload de archivos

- Bucket: `ingresos_egresos` (form.dataset.bucket)
- Carpeta: `{YYYY-MM}-{tipo}/` (ej: "2026-03-Ingreso/")
- Solo imágenes (accept="image/*")

## 14. RLS Policies

```sql
CREATE POLICY "flujo_select" ON flujo FOR SELECT TO authenticated USING (true);
CREATE POLICY "flujo_insert" ON flujo FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "flujo_update" ON flujo FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "flujo_delete" ON flujo FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 15. Dependencias

- Requiere conceptos configurados en Config page (ver `config-admin.md`)
- No requiere parcelas ni otras tablas
