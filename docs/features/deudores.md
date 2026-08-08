# Deudores / Estado de pago

## 1. Descripción general

Motor de cálculo de cobranza del condominio. Determina, para cada gasto, si fue pagado o está pendiente; para cada periodo, cuánto se esperaba recaudar vs cuánto se recaudó; y para cada parcela, si está al día o es deudora (con su deuda acumulada). Es la base de la pestaña Home (listado de morosos) y de la pestaña Finanzas (gráfico recaudado vs esperado), y alimenta el chip de estado de pago en Parcelas.

No es un módulo de UI propio: expone funciones de cálculo y estado derivado que consumen los renderers.

## 2. Modelo de datos

### Estado del gasto

La tabla `gastos` **ya tiene la columna `pagado`** (`TEXT DEFAULT 'No'`, migración 001). El problema es que el demo no la usa: el estado "pendiente" está codificado como texto en `descripcion` (ej: `"Isabel Guerrero pendiente"`) y los pagados no llevan ninguna marca. Se normaliza:

| Campo | Demo (data/gastos.json) | Producción (tabla `gastos`) |
|-------|--------------------------|-----------------------------|
| `pagado` | `"Sí"` / `"No"` (agregar a cada registro) | `"Sí"` / `"No"` (ya existe) |

**Convención**: `pagado` es la fuente de verdad. `archivo` (comprobante) es solo evidencia: se puede marcar pagado sin comprobante (pago en efectivo), pero lo normal es que un registro pagado lleve `archivo`.

**Backfill del demo** (regla de migración de datos, no de código):
- `descripcion` contiene "pendiente" → `pagado: "No"`, sin `archivo`
- resto → `pagado: "Sí"`

No se toca el schema SQL de `gastos` (la columna ya existe). Solo se agrega el campo a `data/gastos.json`.

### Parcela

El estado de pago de una parcela es **derivado**, no se almacena. `parcelas.estado` (Habitada/En construcción/Baldío) es el estado catastral y no cambia su semántica.

## 3. Funciones de cálculo (nuevas, en `utils.js`)

Todas reciben los arrays globales (`GASTOS`, `PARCELAS`) y son puras (testeables en `test.html`).

### 3.1 `isPagado(gasto)`

```js
function isPagado(gasto) {
  return gasto && gasto.pagado === 'Sí';
}
```

### 3.2 `esperadoPorPeriodo(periodo, GASTOS)`

Suma de `monto` de todos los registros de cuota del periodo (la emisión total: mensualidades + fondo reserva emitido).

### 3.3 `recaudadoPorPeriodo(periodo, GASTOS)`

Suma de `monto` de los registros del periodo con `pagado === 'Sí'`.

### 3.4 `pctRecaudado(periodo, GASTOS)`

```js
function pctRecaudado(periodo, GASTOS) {
  var esp = esperadoPorPeriodo(periodo, GASTOS);
  if (!esp) return 0;
  return Math.round((recaudadoPorPeriodo(periodo, GASTOS) / esp) * 100);
}
```

### 3.5 `pendientesDeParcela(parcela_id, GASTOS)`

Retorna los gastos de la parcela con `pagado !== 'Sí'`.

### 3.6 `deudaParcela(parcela_id, GASTOS)`

Suma de `monto` de `pendientesDeParcela(parcela_id, GASTOS)`.

### 3.7 `estadoParcelaPago(parcela_id, GASTOS)`

```js
function estadoParcelaPago(parcela_id, GASTOS) {
  return pendientesDeParcela(parcela_id, GASTOS).length === 0 ? 'Al día' : 'Deudor';
}
```

### 3.8 `morosos(GASTOS, PARCELAS)`

Retorna array ordenado por deuda descendente, solo parcelas con deuda > 0:

```js
[{ parcela_id, numero, deuda }]
```

Las parcelas sin ningún registro de gastos (sin cuotas emitidas) **no** cuentan como morosas (no tienen obligación registrada).

## 4. Consumidores

| Consumidor | Función usada |
|------------|---------------|
| Home — stats balance | `esperadoPorPeriodo`, `recaudadoPorPeriodo`, `pctRecaudado` del periodo vigente |
| Home — listado morosos | `morosos()` |
| Home — "Cómo pagar" | `deudaParcela()` (deuda de la parcela del usuario logueado) |
| Finanzas — gráfico recaudado vs esperado | `esperadoPorPeriodo` / `recaudadoPorPeriodo` por cada periodo |
| Finanzas — tabla cuotas | `isPagado()` por fila |
| Parcelas — chip Al día/Deudor | `estadoParcelaPago()` |

## 5. Reglas de negocio

- **Moroso** = parcela con al menos una cuota emitida (`pagado !== 'Sí'`). Un periodo pendiente ya lo hace deudor.
- **Deuda acumulada** = suma de montos pendientes de TODOS los periodos (no solo el vigente).
- **% recaudado de un periodo** = pagado / emitido. No cuenta como esperado una parcela sin registro.
- **Parcela sin cuotas emitidas** nunca es morosa.
- `pagado` solo lo cambia el admin (edit del gasto). No hay self-service de pago en v1 (la UI no marca pagos solos).

## 6. Demo mode

Todo es derivado de `GASTOS` en memoria, no requiere backend. Al agregar/editar un gasto en demo, `handleForm` debe incluir `pagado` (default `"No"`).

## 7. Testeabilidad

Funciones puras → agregar asserts en `test.html`:

```js
assert(esperadoPorPeriodo('2026-07', GASTOS) > 0, 'esperado por periodo');
assert(deudaParcela('p1', GASTOS) >= 0, 'deuda parcela');
assert(['Al día', 'Deudor'].indexOf(estadoParcelaPago('p1', GASTOS)) !== -1, 'estado parcela');
```

## 8. Dependencias

- Requiere `GASTOS` cargado (Home y Finanzas lo cargan)
- Requiere `PARCELAS` para resolver `numero` de parcela en `morosos()`
- No toca `parcelas.estado` (catastral)
