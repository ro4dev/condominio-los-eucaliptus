# Finanzas / Balance

## 1. Descripción general

Pestaña unificada que reemplaza a **Gastos Comunes** y **Ingresos/Egresos**. Muestra el **balance por periodo** del condominio. Distingue dos flujos:

- **Ingresos por cuotas**: se **derivan** de los pagos registrados (tabla `pagos`) contra las cuotas emitidas (`gastos`). Ya no se cargan a mano como movimiento en el flujo.
- **Egresos y otros ingresos**: movimientos reales de la cuenta del condominio (servicios, jardinería, seguros, multas, etc.) desde `flujo`.

La pestaña muestra: una card "Periodo en curso", dos gráficos, una tabla resumen por periodo (con popups de detalle de cuotas y de movimientos) y los botones admin de carga.

ID del tab: `finanzas`
Contenedor: `<div id="tab-finanzas">`
Reemplaza a: `tab-cuenta` (Gastos Comunes) y `tab-flujo` (Ingresos/Egresos)

## 2. Modelo de datos

### Cuotas (`gastos`) y pagos (`pagos`)

- **Cuota** = registro en `gastos` (una por parcela por periodo y concepto: gasto común `GC_MM_AAAA`, fondo reserva `GC_FR_MM_AAAA`).
- **Pago** = registro en `pagos` asociado a una cuota (`gasto_id`). Una cuota puede tener **varios pagos parciales** (con `monto`, `fecha` y `comprobante` opcional).

```sql
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gasto_id UUID REFERENCES gastos(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,        -- denormalizado (YYYY-MM), copia del de la cuota
  monto NUMERIC(12,2) NOT NULL,
  fecha DATE NOT NULL,
  comprobante TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Migración SQL: `supabase/migrations/005_pagos.sql` (incluye backfill idempotente: los `gastos` con `pagado='Sí'` y sin pagos se convierten en cuota + 1 pago). Demo: `data/pagos.json`.

### `gastos.pagado` (legado)

La columna `pagado` sigue existiendo para datos históricos. `pagoLegado(g)` devuelve `true` si la cuota tiene `pagado === 'Sí'` pero **no tiene pagos registrados**: en ese caso se trata como pagada completa. Las cuotas nuevas (por "Generar Cuotas" o "Agregar Cuota") se crean con `pagado: 'No'` y su estado se resuelve por pagos.

### Regla de código

`formFlujo()` no ofrece los conceptos `Cuotas`/`Fondo reserva` como ingreso manual (quedan duplicados con los derivados).

## 3. HTML structure (index.html)

```html
<div id="tab-finanzas" class="tab-content" role="region" aria-label="Finanzas" aria-busy="true">
  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem">
    <md-filled-button class="admin-only" onclick="formGastos()"><md-icon slot="icon">add</md-icon>Agregar Cuota</md-filled-button>
    <md-filled-button class="admin-only" onclick="formGenerarCuotas()"><md-icon slot="icon">add</md-icon>Generar Cuotas</md-filled-button>
    <md-filled-button class="admin-only" onclick="formFlujo()"><md-icon slot="icon">add</md-icon>Agregar Movimiento</md-filled-button>
  </div>

  <section class="charts">
    <div class="chart-box"><h3>Recaudado vs Esperado por período</h3><canvas id="chartRecaudado"></canvas></div>
    <div class="chart-box"><h3>Ingresos vs Egresos por mes</h3><canvas id="chartFlujo"></canvas></div>
  </section>

  <div id="finanzasPeriodoEnCurso" style="margin-bottom:1rem"></div>

  <h3 class="section-title">Resumen por periodo</h3>
  <div class="table-wrap" id="resumenPeriodosWrap">
    <div id="resumenPeriodosSkeleton">...</div>
    <div id="resumenPeriodosEmpty" style="display:none"></div>
    <table style="display:none" id="tableResumenPeriodos">
      <thead>
        <tr>
          <th>Periodo</th><th>Esperado</th><th>Recaudado</th><th>%</th>
          <th>Egresos</th><th>Saldo</th>
          <th title="Ver cuotas del periodo">Cuotas</th>
          <th title="Ver movimientos del periodo">Mov.</th>
        </tr>
      </thead>
      <tbody id="resumenPeriodosBody"></tbody>
    </table>
  </div>
</div>
```

Nota: skeleton, empty-state y tabla viven en contenedores **separados** (`#resumenPeriodosSkeleton`, `#resumenPeriodosEmpty`, `#tableResumenPeriodos`) que se muestran/ocultan sin destruir el DOM. `showSkeletons('finanzas')` muestra el skeleton de la card "Periodo en curso" (`#finanzasPeriodoEnCurso`) y el de la tabla, sin reemplazar el contenido (js/data.js).

## 4. Render (`renderFinanzas`)

```js
function renderFinanzas() {
  renderRecaudadoChart();
  renderFlujoChart();
  renderPeriodoEnCurso();
  renderResumenPeriodos();
}
```

### 4.1 Card "Periodo en curso" (`renderPeriodoEnCurso`)

- Periodo vigente = el más reciente de `periodosFinanzas(GASTOS, FLUJO)`.
- 4 stats: **Esperado**, **Recaudado** (azul), **Egresos** (rojo), **Saldo** (verde/rojo según signo).
- Barra de progreso con el % de recaudación (verde ≥90, ámbar ≥60, rojo <60).
- 2 íconos junto al título: 🧾 `verCuotasPeriodo(p)` y ⇅ `verMovimientosPeriodo(p)`.

### 4.2 Tabla "Resumen por periodo" (`renderResumenPeriodos`)

Una fila por periodo (más reciente primero), columnas:

| Columna | Cálculo |
|---------|---------|
| Esperado | `esperadoPorPeriodo(p, GASTOS)` — suma de montos emitidos |
| Recaudado | `recaudadoPorPeriodo(p, GASTOS)` — suma de `recaudadoGasto` |
| % | `pctRecaudado(p, GASTOS)` con color según umbrales |
| Egresos | `egresosMes(p, FLUJO)` |
| Saldo | `saldoPeriodo(p, GASTOS, FLUJO)` con color por signo |
| Cuotas | ícono → `verCuotasPeriodo(p)` |
| Mov. | ícono → `verMovimientosPeriodo(p)` |

Última fila `.resumen-totales` con los totales acumulados. Sin periodos con datos: empty state.

## 5. Popups de detalle del periodo

### 5.1 `verCuotasPeriodo(periodo)` — cuotas del periodo

Resumen: **Esperado / Recaudado / %** del periodo. Tabla de cuotas con columnas Parcela, Monto, Pagado (`sumPagosGasto`), Estado (chip `estadoChip`: **Pagado / Parcial / Pendiente**) y acciones admin: `verPagos(gastoId)` (listado de pagos, comprobante, registrar pago y eliminar pago) y editar cuota.

### 5.2 `verMovimientosPeriodo(periodo)` — movimientos del periodo

Resumen: **Ingresos / Egresos / Saldo** del periodo. Tabla de movimientos (`FLUJO`) filtrados por mes del periodo (tipo, concepto, fecha, monto, comprobante), con acciones admin (editar/eliminar).

## 6. Gráficos (charts.js)

### 6.1 `renderRecaudadoChart()` (`#chartRecaudado`)

Dos líneas por periodo: **Esperado** (gris `--text-muted`) y **Recaudado** (primario azul). Agrupa por `periodo` de `GASTOS`. El valor Recaudado usa `recaudadoGasto(r)` (pagos registrados, nunca mayor que el monto de la cuota; cuotas legacy `pagado='Sí'` cuentan completas).

### 6.2 `renderFlujoChart()` (`#chartFlujo`)

Dos líneas por mes: **Ingresos** (`--color-positive`) y **Egresos** (`--md-sys-color-error`). Muestra **siempre ambas series** (ya no responde a chips). Los ingresos suman las cuotas recaudadas del mes más los ingresos manuales de `FLUJO`:

```js
function ingresosMes(periodo, GASTOS, FLUJO) {
  var cuotas = recaudadoPorPeriodo(periodo, GASTOS);
  var manual = FLUJO.filter(function(f) {
    return f.tipo === 'Ingreso' && mesDeFecha(f.fecha) === periodo;
  }).reduce(function(s, f) { return s + parseFloat(f.monto || 0); }, 0);
  return cuotas + manual;
}
```

### 6.3 `updateChartTheme()`

Actualiza los colores de `chartRecaudado` y `chartFlujo` en dark mode. `renderParcelaChart`/`chartParcelas` fueron **eliminados**.

## 7. Funciones puras de apoyo (utils.js)

- `getPagos()`, `pagosDeGasto(id)`, `sumPagosGasto(id)`, `pagosDeParcela(pid)` — acceso a `PAGOS`
- `pagoLegado(g)`, `isPagado(g)` (`sumPagosGasto >= monto` con fallback a legado), `recaudadoGasto(g)` (mínimo entre monto y pagos)
- `esperadoPorPeriodo`, `recaudadoPorPeriodo`, `pctRecaudado`
- `mesDeFecha`, `egresosMes`, `ingresosMes`, `ingresosDerivados` (alias de `recaudadoPorPeriodo`)
- `periodosFinanzas(GASTOS, FLUJO)` — union de periodos con cuotas o movimientos, orden desc
- `saldoPeriodo(periodo, GASTOS, FLUJO)` — `ingresosMes − egresosMes`
- Cobranza: `deudaParcela`, `deudaPorPeriodo`, `periodosPendientes`, `estadoParcelaPago`, `morosos` (ver `deudores.md`)
- Cuota configurada: `configPeriodos`, `periodoConfig`, `montosBase`, `cuotaDelPeriodo` (ver §9)

## 8. Acciones admin

### 8.1 Agregar Cuota (`formGastos`)

- Al elegir periodo, muestra un **hint** con la cuota configurada del periodo (`cuotaDelPeriodo`) y **prefill del monto** (`updateGastoMontoPrefill`).
- Excluye parcelas que ya tienen cuota en el periodo (`updateGastoParcelas`).

### 8.2 Generar Cuotas (`formGenerarCuotas`)

Crea una cuota por parcela para el periodo elegido (y fondo reserva si aplica), sin duplicar parcelas que ya tienen cuota:

- `buildCuotasRows(data)` → filas `{parcela_id, periodo, concepto, monto, descripcion, pagado:'No'}` (conceptos `GC_MM_AAAA` y `GC_FR_MM_AAAA`).
- Demo: `generarCuotasDemo(data)` agrega a `GASTOS` (con `id`/`created_at`). Prod: insert a `gastos`.
- Prefill desde el configurador de periodos (`updateGenCuotasPrefill`).

### 8.3 Registrar pago (`formPago`)

- Monto prefilled con el saldo pendiente (`monto − sumPagosGasto`), fecha y comprobante opcional.
- En demo agrega a `PAGOS`; en prod inserta a `pagos`.
- `formPagoParcela(parcelaId)`: abre el pago del **periodo más antiguo adeudado** desde el modal de deuda de Home.
- `verPagos(gastoId)`: modal con los pagos de la cuota, comprobante, eliminar (admin) y registrar pago (admin).

### 8.4 Editar / eliminar

- Cuotas: `editGasto` / `deleteGasto` (tabla `gastos`).
- Movimientos: editar/eliminar de `flujo`.
- Pagos: `deletePago` (tabla `pagos`).

## 9. Configurador de periodos (Cuota por periodo)

Card "Periodos de Cuota" en Configuración (ver `config-admin.md`). Define el **monto por periodo** (gasto común + fondo reserva). Los periodos sin config usan el **Monto Base**.

```js
function cuotaDelPeriodo(periodo) {
  var base = montosBase();
  var conf = periodoConfig(periodo);
  if (conf) {
    if (conf.monto != null && conf.monto !== '') base.monto = parseFloat(conf.monto) || 0;
    if (conf.fondo_reserva != null && conf.fondo_reserva !== '') base.fondo_reserva = parseFloat(conf.fondo_reserva) || 0;
  }
  return { monto: base.monto, fondo_reserva: base.fondo_reserva, total: base.monto + base.fondo_reserva };
}
```

- `montosBase()` lee `CONFIG.montos` (`gasto_comun_base`, `fondo_reserva`).
- `periodoConfig(periodo)` busca en `CONFIG.periodos`.
- `siguientePeriodo()` devuelve el periodo posterior al último con cuotas registradas (o el actual si no hay).
- `avisoAumento()` detecta si la cuota del próximo periodo configurado sube respecto al vigente → card de aviso en **Home** con botón "Generar cuotas" (solo admin).

## 10. Carga de datos (data.js)

```js
finanzas: function() {
  return Promise.all([loadJson('GASTOS'), loadJson('PAGOS'), loadJson('FLUJO'), loadJson('PARCELAS')])
    .then(function() { renderFinanzas(); });
}
```

`PAGOS` se agrega a `TABLE_MAP` (prod: tabla `pagos`) y a `DEMO_FILES` (demo: `data/pagos.json`). Home también carga `PAGOS` (para morosos y balance).

## 11. RLS / Seguridad

- `gastos` y `flujo`: SELECT autenticado, escritura admin (políticas existentes).
- `pagos`: SELECT autenticado; INSERT/UPDATE/DELETE solo admin (migración 003).
- `pagado` se rige por las políticas de `gastos` (solo admin lo actualiza).

## 12. Migraciones

- `supabase/migrations/005_pagos.sql`: tabla `pagos` + índices + RLS + backfill idempotente.
- Demo: `data/pagos.json` (pagos por cuota) y `data/config.json` (campo `periodos`).
- No se modifican las migraciones existentes.
