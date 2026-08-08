# Finanzas / Balance

## 1. Descripción general

Pestaña unificada que reemplaza a **Gastos Comunes** y **Ingresos/Egresos**. Distingue dos flujos que hoy se registran duplicados:

- **Ingresos por cuotas**: se **derivan** de `gastos` con `pagado === 'Sí'` (mensualidad + fondo reserva). Ya no se cargan a mano como movimiento "Cuotas"/"Fondo reserva" en el flujo.
- **Egresos y otros ingresos**: movimientos reales de la cuenta del condominio (servicios, jardinería, seguros, multas, etc.) desde `flujo`.

La pestaña muestra el balance por periodo, el % de recaudación, los gráficos y las dos tablas de detalle (cuotas por parcela y movimientos).

ID del tab: `finanzas`
Contenedor: `<div id="tab-finanzas">`
Reemplaza a: `tab-cuenta` (Gastos Comunes) y `tab-flujo` (Ingresos/Egresos)

## 2. Modelo de datos

### Cambio de datos (migración nueva + demo)

1. **`gastos.pagado`**: columna ya existe en prod. Se agrega a `data/gastos.json` (backfill: "pendiente" en descripción → `"No"`, resto → `"Sí"`). Ver `deudores.md` §2.
2. **`flujo`**: se eliminan del demo los movimientos tipo `Ingreso` con concepto `Cuotas` y `Fondo reserva` (quedan duplicados). Se conservan `Multa` y otros ingresos manuales no derivables.
3. **Regla de código**: `formFlujo()` ya no ofrece los conceptos `Cuotas`/`Fondo reserva` como opción de ingreso. `CONFIG.conceptos_flujo` deja de incluir `"Cuotas"` y `"Fondo reserva"`.

Sin cambio de schema SQL: ni `gastos` ni `flujo` necesitan columnas nuevas.

### Ingresos derivados

```js
// Ingreso derivado por periodo: cuotas pagadas de gastos
function ingresosDerivados(periodo, GASTOS) {
  return recaudadoPorPeriodo(periodo, GASTOS);
}
```

Los egresos e ingresos manuales vienen de `FLUJO` tal cual.

## 3. HTML structure (index.html — reemplaza tab-cuenta y tab-flujo)

```html
<div id="tab-finanzas" class="tab-content active" role="region" aria-label="Finanzas" aria-busy="true">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap">
    <md-filled-button class="admin-only" onclick="formGastos()"><md-icon slot="icon">add</md-icon>Agregar Cuota</md-filled-button>
    <md-filled-button class="admin-only" onclick="formFlujo()"><md-icon slot="icon">add</md-icon>Agregar Movimiento</md-filled-button>
  </div>

  <!-- Balance del periodo -->
  <section class="stats" id="finanzasStats">
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
  </section>

  <!-- Filtros -->
  <div class="filters">
    <md-filled-select id="finanzasPeriodoFilter" label="Periodo"></md-filled-select>
  </div>

  <!-- Charts -->
  <section class="charts">
    <div class="chart-box"><h3>Recaudado vs Esperado por período</h3><canvas id="chartRecaudado"></canvas></div>
    <div class="chart-box"><h3>Monto por parcela</h3><canvas id="chartParcelas"></canvas></div>
  </section>
  <div class="chart-box" style="margin-bottom:1.5rem">
    <h3>Ingresos vs Egresos por mes</h3>
    <canvas id="chartFlujo"></canvas>
  </div>

  <!-- Cuotas por parcela -->
  <h3 class="section-title">Cuotas por parcela</h3>
  <div class="table-wrap">
    <div id="cuotasLoading"><div class="skeleton skeleton-row"></div></div>
    <table style="display:none" id="tableGastos">
      <thead>
        <tr>
          <th>Parcela</th><th>Periodo</th><th>Monto</th><th>Estado</th><th>Comprobante</th>
          <th style="width:1%;white-space:nowrap"></th>
        </tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>

  <!-- Movimientos -->
  <h3 class="section-title">Movimientos</h3>
  <div class="filter-chips" id="flujoFilter">
    <md-filter-chip label="Todos" selected onclick="filterFlujo('todos')"></md-filter-chip>
    <md-filter-chip label="Ingresos" onclick="filterFlujo('Ingreso')"></md-filter-chip>
    <md-filter-chip label="Egresos" onclick="filterFlujo('Egreso')"></md-filter-chip>
  </div>
  <div class="table-wrap" id="flujoList">
    <div class="skeleton skeleton-row"></div>
  </div>
</div>
```

## 4. Stats de balance (`renderFinanzasStats`)

4 cards (con `filterPeriod` = periodo seleccionado en `#finanzasPeriodoFilter`, default el más reciente):

| Label | Valor |
|-------|-------|
| Recaudado | `recaudadoPorPeriodo(periodo)` — color azul |
| Esperado | `esperadoPorPeriodo(periodo)` |
| Recaudación | `pctRecaudado(periodo)`% — con color: ≥90 verde, ≥60 ámbar, <60 rojo |
| Egresos | suma `FLUJO` tipo Egreso del mes del periodo (o del periodo completo si el filtro es "Todos") |

Con filtro "Todos": Recaudado/Esperado/Recaudación/Egresos acumulados de todo el historial.

## 5. Gráficos

### 5.1 `renderRecaudadoChart()` (reemplaza `renderPeriodChart`)

Dos líneas por periodo: **Esperado** (gris, `--text-muted`) y **Recaudado** (primario azul). El área entre ambas visualiza lo no recaudado. Reusa el patrón de `renderPeriodChart` de charts.js (línea con puntos, tooltip con `formatMoney`). Agrupa por `periodo` de `GASTOS`.

### 5.2 `renderParcelaChart()`

Sin cambios (doughnut monto por parcela, mismo código actual).

### 5.3 `renderFlujoChart()`

Gráfico de dos líneas por mes (mantiene el formato actual). Los **ingresos** suman las cuotas derivadas más los ingresos manuales:

```js
// Ingresos del mes M = cuotas pagadas del periodo M + ingresos manuales (flujo) con fecha en M
function ingresosMes(periodo, GASTOS, FLUJO) {
  var cuotas = recaudadoPorPeriodo(periodo, GASTOS);
  var manual = FLUJO.filter(function(f) {
    return f.tipo === 'Ingreso' && (f.fecha || '').slice(0, 7) === periodo;
  }).reduce(function(s, f) { return s + parseFloat(f.monto || 0); }, 0);
  return cuotas + manual;
}
```

- Egresos del mes: suma de `FLUJO` tipo Egreso con fecha en el mes.
- Nota de doble conteo: no existe porque el demo elimina los ingresos manuales de concepto `Cuotas`/`Fondo reserva` (quedan solo derivados) y en prod `formFlujo` ya no ofrece esos conceptos.

### 5.4 `updateChartTheme()`

Se extiende para actualizar también `chartRecaudado` en dark mode.

## 6. Tabla de cuotas por parcela (sección dentro de Finanzas)

Es la tabla actual de gastos con una columna nueva **Estado** (chip):

```js
// en renderTable de cuotas
function estadoChip(g) {
  return isPagado(g)
    ? '<span class="chip-chip pagado">Pagado</span>'
    : '<span class="chip-chip pendiente">Pendiente</span>';
}
```

- Chip `Pagado`: verde (`--color-positive`), chip `Pendiente`: ámbar (`--color-extraordinaria-*`), siguiendo el patrón de chips de estado de Parcelas (sections.css).
- El form de edición de cuota (`formGastos`) agrega el campo **Estado** (select Pagado/Pendiente) para que el admin marque el pago.
- Filtros: la tabla de cuotas se filtra por `#finanzasPeriodoFilter` (periodo único de la pestaña) y por parcela (select de parcela, que aplica también a stats y gráficos).

## 7. Tabla de movimientos (egresos + ingresos manuales)

Es la tabla actual de Ingresos/Egresos con una condición nueva: **se filtra por el mes del periodo seleccionado** en `#finanzasPeriodoFilter` (si el filtro es un periodo concreto, `(f.fecha || '').slice(0, 7) === periodo`; si es "Todos", sin filtro de fecha). Los chips Todos/Ingresos/Egresos se mantienen y filtran por tipo **dentro** del mes/periodo elegido.

## 8. Decisiones abiertas

- **Filtro de periodo unificado**: **resuelto** — el `#finanzasPeriodoFilter` controla todo: stats, gráficos, tabla de cuotas y tabla de movimientos (por mes). Las cuotas conservan además su filtro de parcela y los movimientos sus chips de tipo dentro del periodo.
- **Ingreso total del gráfico flujo**: **resuelto** — incluye cuotas derivadas + ingresos manuales (`ingresosMes`, §5.3). Las cuotas son un tipo de ingreso.

## 9. Carga de datos

```js
finanzas: function() {
  return Promise.all([loadJson('GASTOS'), loadJson('FLUJO'), loadJson('PARCELAS')])
    .then(function() { renderFinanzas(); });
}
```

## 10. RLS / Seguridad

- Sin cambios: `gastos` y `flujo` mantienen sus políticas (SELECT autenticado, escritura admin).
- La columna `pagado` se rige por las políticas de `gastos` (solo admin la actualiza).

## 11. Migraciones

No se requiere migración SQL para `finanzas` (columnas existentes). El cambio de datos es:
- `data/gastos.json`: agregar `pagado` a cada registro
- `data/ingresos_egresos.json`: eliminar ingresos de concepto `Cuotas` y `Fondo reserva`
- `data/config.json`: quitar `Cuotas` y `Fondo reserva` de `conceptos_flujo`
