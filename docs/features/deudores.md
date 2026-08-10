# Deudores / Estado de pago

## 1. Descripción general

Motor de cálculo de cobranza del condominio. Determina, para cada cuota, si fue pagada o está pendiente (con pagos **parciales**); para cada periodo, cuánto se esperaba recaudar vs cuánto se recaudó; y para cada parcela, si está al día o es deudora (con su deuda acumulada y desglose por periodo). Es la base de la pestaña Home (listado de morosos, balance y aviso de aumento), de la pestaña Finanzas (gráfico recaudado vs esperado y tabla resumen) y del chip de estado en Parcelas.

No es un módulo de UI propio: expone funciones de cálculo y estado derivado que consumen los renderers.

## 2. Modelo de datos

### Cuota (`gastos`) + Pagos (`pagos`)

- **Cuota** = registro en `gastos` (monto emitido por parcela y periodo).
- **Pago** = registro en `pagos` asociado a una cuota (`gasto_id`). Una cuota puede tener varios pagos parciales.
- La columna `gastos.pagado` (`'Sí'/'No'`) queda como **legado**: solo cuenta para cuotas sin pagos registrados (ver `pagoLegado` §3.1).

### Parcela

El estado de pago de una parcela es **derivado**, no se almacena. `parcelas.estado` (Habitada/En construcción/Baldío) es el estado catastral y no cambia su semántica.

## 3. Funciones de cálculo (en `utils.js`)

Todas son puras (testeables en `test.html`).

### 3.1 `pagoLegado(g)`

```js
function pagoLegado(g) {
  return !!(g && g.pagado === 'Sí' && !pagosDeGasto(g.id).length);
}
```

True si la cuota se marcó pagada (`pagado='Sí'`) antes del modelo de pagos y no tiene pagos registrados → cuenta como pagada completa.

### 3.2 `isPagado(gasto)`

```js
function isPagado(gasto) {
  if (!gasto) return false;
  if (pagoLegado(gasto)) return true;
  var monto = parseFloat(gasto.monto || 0);
  if (!monto) return false;
  return sumPagosGasto(gasto.id) >= monto;
}
```

Pagada si los pagos registrados ≥ monto de la cuota (o por legado). Permite estados **Parcial** (pagos > 0 pero < monto).

### 3.3 `recaudadoGasto(gasto)`

Monto efectivamente cobrado de una cuota: `Math.min(monto, sumPagosGasto(gasto.id))` (nunca supera el monto; legado cuenta completo).

### 3.4 `sumPagosGasto(gastoId)` / `pagosDeGasto(gastoId)` / `pagosDeParcela(parcelaId)`

Acceso a `PAGOS`. `sumPagosGasto` suma los `monto` de los pagos de la cuota.

### 3.5 `esperadoPorPeriodo(periodo, GASTOS)`

Suma de `monto` de todos los registros de cuota del periodo (la emisión total: mensualidades + fondo reserva emitido).

### 3.6 `recaudadoPorPeriodo(periodo, GASTOS)`

```js
function recaudadoPorPeriodo(periodo, GASTOS) {
  return (GASTOS || []).filter(function(g) { return g.periodo === periodo; })
    .reduce(function(s, g) { return s + recaudadoGasto(g); }, 0);
}
```

### 3.7 `pctRecaudado(periodo, GASTOS)`

```js
function pctRecaudado(periodo, GASTOS) {
  var esp = esperadoPorPeriodo(periodo, GASTOS);
  if (!esp) return 0;
  return Math.round((recaudadoPorPeriodo(periodo, GASTOS) / esp) * 100);
}
```

### 3.8 `deudaParcela(parcela_id, GASTOS)`

```js
function deudaParcela(parcela_id, GASTOS) {
  var cuotas = 0, pagado = 0;
  (GASTOS || []).forEach(function(g) {
    if (g.parcela_id !== parcela_id) return;
    cuotas += parseFloat(g.monto || 0);
    if (pagoLegado(g)) pagado += parseFloat(g.monto || 0);
  });
  pagado += pagosDeParcela(parcela_id).reduce(function(s, p) { return s + parseFloat(p.monto || 0); }, 0);
  return Math.max(0, cuotas - pagado);
}
```

Deuda total = `max(0, Σcuotas − Σpagos)`. **Nunca negativa**: el saldo a favor no se cobra ni se devuelve, pero absorbe deudas de otros periodos.

### 3.9 `deudaPorPeriodo(parcela_id, GASTOS)`

Desglose de la deuda por periodo (`[{periodo, monto}]`, `monto > 0`). El excedente (saldo a favor) se **absorbe primero en los periodos más recientes** hacia atrás.

### 3.10 `periodosPendientes(parcela_id, GASTOS)`

```js
function periodosPendientes(parcela_id, GASTOS) {
  return deudaPorPeriodo(parcela_id, GASTOS).map(function(d) { return d.periodo; });
}
```

### 3.11 `estadoParcelaPago(parcela_id, GASTOS)`

```js
function estadoParcelaPago(parcela_id, GASTOS) {
  return deudaParcela(parcela_id, GASTOS) <= 0 ? 'Al día' : 'Deudor';
}
```

### 3.12 `morosos(GASTOS, PARCELAS)`

```js
[{ parcela_id, numero, deuda }]
```

Ordenado por número de parcela (numérico natural, ej: Parcela 2 antes que Parcela 10). Solo parcelas con `deuda > 0`; las parcelas sin cuotas emitidas **no** cuentan como morosas.

## 4. Consumidores

| Consumidor | Función usada |
|------------|---------------|
| Home — card recaudación | `esperadoPorPeriodo`, `recaudadoPorPeriodo`, `pctRecaudado` del periodo vigente |
| Home — listado morosos | `morosos()`; propietario ve su parcela con `deudaParcela()` y `periodosPendientes()` |
| Home — "Cómo pagar" | `deudaParcela()` (deuda de la parcela del usuario logueado) |
| Home — aviso de aumento | `avisoAumento()` / `cuotaDelPeriodo()` |
| Home — "Pagar ahora" (deuda) | `deudaPorPeriodo()` + `formPagoParcela()` (pago del periodo más antiguo) |
| Finanzas — gráfico recaudado vs esperado | `esperadoPorPeriodo` / `recaudadoPorPeriodo` por cada periodo |
| Finanzas — resumen por periodo | `periodosFinanzas`, `saldoPeriodo`, `pctRecaudado` |
| Finanzas — popup de cuotas | `isPagado()`, `sumPagosGasto()`, `estadoChip()` por fila; `verPagos()` |
| Parcelas — chip Al día/Deudor | `estadoParcelaPago()` |

## 5. Reglas de negocio

- **Moroso** = parcela con `deudaParcela > 0`. Un periodo pendiente ya lo hace deudor.
- **Deuda acumulada** = suma de montos pendientes de TODOS los periodos (no solo el vigente).
- **% recaudado de un periodo** = pagado / emitido. No cuenta como esperado una parcela sin registro.
- **Parcela sin cuotas emitidas** nunca es morosa.
- **Pagos parciales**: una cuota puede tener varios pagos; estado Parcial mientras `0 < pagado < monto`.
- **Saldo a favor**: un pago mayor que la cuota reduce la deuda de otros periodos (primero los más recientes).
- Los pagos los registra el admin (`formPago`). No hay self-service de pago.

## 6. Demo mode

Todo es derivado de `GASTOS` y `PAGOS` en memoria. `handleForm` con `table === 'pagos'` agrega el pago a `PAGOS` (con `id` y `created_at`); `table === 'generar_cuotas'` agrega las cuotas a `GASTOS`.

## 7. Testeabilidad

Funciones puras → asserts en `test.html` (bloque "Pagos (nuevo modelo)"): pagos por gasto/parcela, saldo a favor, absorción del excedente, legado, estados.

## 8. Dependencias

- Requiere `GASTOS` y `PAGOS` cargados (Home y Finanzas los cargan).
- Requiere `PARCELAS` para resolver `numero` de parcela en `morosos()`.
- No toca `parcelas.estado` (catastral).
