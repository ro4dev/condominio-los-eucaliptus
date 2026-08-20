# Home

## 1. Descripción general

Nueva pestaña inicial (primer tab, activa por defecto). Es la vista resumen del condominio: noticias destacadas (pinneadas), balance del periodo vigente con % de recaudación, listado de morosos y la card "Cómo pagar" con datos de transferencia + QR. Reemplaza a Gastos Comunes como punto de entrada; la información de detalle vive en Finanzas.

ID del tab: `home`
Contenedor: `<div id="tab-home">`
Clase: `tab-content active` (pasa de `tab-cuenta` a `tab-home` el rol de tab inicial)

## 2. HTML structure (index.html)

```html
<md-primary-tab class="tab-btn" data-tab="home" onclick="switchTab('home')" active>Home</md-primary-tab>

<div id="tab-home" class="tab-content active" role="region" aria-label="Home" aria-busy="true">
  <!-- Balance del periodo vigente -->
  <section class="stats" id="homeStats">
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
    <div class="skeleton skeleton-stat"></div>
  </section>

  <!-- Noticias pinneadas -->
  <div id="homePinnedNews" class="card" style="display:none;margin-bottom:1rem">
    <h4>Noticias destacadas</h4>
    <div id="homePinnedNewsList"></div>
  </div>

  <!-- Aviso de aumento -->
  <div id="homeAviso" style="margin-bottom:1rem"></div>

  <!-- Progreso de recaudación + Cómo pagar -->
  <div class="home-duo">
    <div class="card" id="homeRecaudacion">
      <h4>Recaudación del periodo</h4>
      <div class="progress-track"><div class="progress-fill" id="homeRecaudacionFill"></div></div>
      <p class="progress-label" id="homeRecaudacionLabel"></p>
    </div>

    <div class="card" id="homeComoPagar">
      <h4>Cómo pagar</h4>
      <p id="homePagoResumen"></p>
      <md-filled-button onclick="openComoPagar()">Ver datos de pago</md-filled-button>
    </div>
  </div>

  <!-- Morosos -->
  <div class="card" id="homeMorosos">
    <h4>Parcelas morosas</h4>
    <div id="homeMorososList"></div>
  </div>
</div>
```

## 3. Stats de Home (`renderHome`)

Periodo vigente = el `periodo` más reciente en `GASTOS`. Si el usuario logueado es admin, se calculan para el periodo vigente; si es propietario, se calculan para **su** parcela.

| Label | Valor |
|-------|-------|
| Esperado (periodo) | `esperadoPorPeriodo(periodoVigente, GASTOS)` |
| Recaudado (periodo) | `recaudadoPorPeriodo(periodoVigente, GASTOS)` |
| Egresos (periodo) | suma `FLUJO` tipo Egreso del mes del periodo vigente |
| Morosos | `morosos(GASTOS, PARCELAS).length` (o "Al día"/deuda propia para propietario) |

### Progreso de recaudación

Barra de progreso (`.progress-track`/`.progress-fill` nuevos en components.css) con `pctRecaudado(periodoVigente, GASTOS)`, coloreada: ≥90 verde, ≥60 ámbar, <60 rojo. Label: "X% de las cuotas del periodo pagadas".

## 4. Listado de morosos

`renderMorosos()` consume `morosos(GASTOS, PARCELAS)` (ver `deudores.md` §3.8).

**Visibilidad**:
- **Admin**: ve todas las parcelas morosas (parcela + deuda acumulada), ordenadas por deuda descendente, cada una con botón "Cómo pagar" que abre el modal pre-cargado con los datos de pago del condominio.
- **Propietario autenticado**: ve su propia parcela y su deuda (via match email ↔ propietario.email, mismo patrón que la corrección de votos de la auditoría). Si está al día, muestra "Tu parcela está al día".
- **Sin login**: solo ve el balance global y la card "Cómo pagar" (los datos de pago son públicos por definición).

Empty state: si no hay morosos, `emptyState('Todas las parcelas están al día.')`.

## 5. Card "Cómo pagar" + modal (QR / datos de transferencia)

### Datos de origen

Viven en `CONFIG.datos_pago` (config key nueva, ver `config-admin.md` §datos de pago):

```js
// CONFIG.datos_pago
{
  banco: "Banco Estado",
  tipo_cuenta: "CuentaRut",
  numero_cuenta: "12-345678-9",
  rut: "77.123.456-7",
  titular: "Comunidad Condominio Eucaliptus",
  email: "tesoreria@eucaliptus.cl",
  qr: "assets/qr_pago.png"   // imagen QR estática subida por admin (bucket 'documentos' o URL)
}
```

### `openComoPagar()`

Modal "Cómo pagar tu cuota" (`openModal`, mismo patrón de ancho 560px) con:
- Monto adeudado (si el usuario es propietario deudor): "Tu deuda: $XX.XXX"
- Datos de transferencia en filas copiables (botón copiar por fila, usa `navigator.clipboard`)
- Imagen QR (`<img src="CONFIG.datos_pago.qr">`) si está configurada
- Botón "Copiar todos los datos"

**Alcance v1**: QR estático (lo sube el admin). El QR dinámico con monto (pasarela de pago) queda fuera de GitHub Pages — ver `docs/research/supabase.md` para la limitación.

## 6. Carga de datos

```js
home: function() {
  return Promise.all([loadJson('GASTOS'), loadJson('PAGOS'), loadJson('FLUJO'), loadJson('PARCELAS'), loadJson('PROPIETARIOS'), loadJson('NOTICIAS'), loadConfig()])
    .then(function() { renderHome(); });
}
```

`renderHome()` es la carga inicial por defecto (`loadInitialData()` de data.js apunta a `home` en vez de `cuenta`).

## 7. CSS nuevas clases

| Clase | Elemento | Estilo |
|-------|----------|--------|
| `.progress-track` | div | fondo `--border-light`, border-radius full, height 0.6rem, overflow hidden |
| `.progress-fill` | div interno | height 100%, border-radius full, transición width 0.3s, color por pct |
| `.pago-row` | fila de dato de pago | flex, gap 0.5rem, padding, border-bottom `--border-light` |
| `.pago-row .value` | dato | `--text`, selectable (user-select: all) |
| `.home-pinned-card` | fila de noticia pinneada | padding, border-bottom `--divider` |

## 8. Reglas de negocio

- **Periodo vigente** = último `periodo` en `GASTOS` (los periodos vienen de las cuotas emitidas).
- **Moroso por deuda acumulada**: parcela con ≥1 cuota pendiente (cualquier periodo).
- **"Cómo pagar" siempre visible** (incluso sin login): el condominio quiere facilitar el pago.
- La card morosos para admin es la herramienta de cobranza: de ahí se copian los datos y se persigue al deudor.

## 9. RLS / Privacidad

- `gastos`, `flujo`, `parcelas`, `propietarios`: políticas actuales (SELECT autenticado).
- **Pendiente de auditoría de seguridad**: `propietarios_select` expone RUT/teléfono/email a todo `authenticated` (hallazgo alto del security audit). El match email↔parcela de Home debe usar solo `propietarios.email` y `propietarios.parcela_id`; si la RLS no lo permite aún, en v1 el propietario ve solo su deuda si su email matchea un propietario (query restringida), sin exponer el resto.
