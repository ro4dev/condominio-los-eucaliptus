# Auditoría Frontend & Diseño — Condominio Los Eucaliptus

## Meta

Documento de referencia con la revisión completa del frontend (visual, UX, accesibilidad, seguridad y deuda técnica) usando la skill `frontend-design` (identidad, tipografía, estructura, copy, motion) + la guía Material Design 3 + revisión manual del código.

**Complementa** a `material-m3.md` (que ya cubrió la migración a tokens M3). Este doc cubre lo que quedó fuera: seguridad, tests, contraste, identidad y mantenibilidad.

## Alcance y método

Revisados: `index.html`, `css/*.css` (4), `js/*.js` (8), `test.html`, `data/*.json`, `docs/`, `CHANGELOG.md`, `README.md`, historial git.

Fecha: 2026-08-01.

## Resumen ejecutivo

**La ingeniería está sólida; el diseño es genérico.**

- ✅ Sistema de tokens M3 completo y funcional (light/dark), dark mode bien resuelto, snackbar correcto, patrón de filtros consistente, skeletons con `aria-busy`, acciones admin ocultas correctamente.
- 🔴 **Riesgo de seguridad real**: contenido de usuario renderizado sin escapar (XSS almacenado en producción).
- 🔴 **`test.html` roto**: no corre los asserts, lanza ReferenceError/TypeError.
- 🟠 Contraste insuficiente en varios textos (light y dark).
- 🎨 Sin identidad visual propia: el "Condominio Eucaliptus" (eucaliptos, naturaleza) no se refleja en nada del diseño.
- ⚙️ Deuda técnica: código muerto, selectores duplicados, paleta M3 tonalmente incoherente, iconos mezclados (Material Symbols + emoji).

### Tabla de hallazgos por gravedad

| # | Hallazgo | Tipo | Archivo(s) | Gravedad |
|---|----------|------|-----------|----------|
| C1 | Contenido de usuario sin escapar (XSS) | Seguridad | `renderers.js` | **Crítica** |
| C2 | `test.html` no corre los tests | Calidad | `test.html` | **Alta** |
| C3 | Contraste insuficiente (`--text-muted`, `#loginError`, verde) | Accesibilidad | `base.css`, `index.html` | Alta |
| D1 | Sin identidad visual distintiva | Diseño | `base.css`, `index.html` | Media |
| D2 | Tipografía sin personalidad (Roboto solo) | Diseño | `base.css` | Media |
| D3 | Iconos mezclados: Material Symbols + emojis | Diseño | `renderers.js` | Media |
| D4 | Copy inconsistente (Entrar / Iniciar sesión, Aplicar) | UX | `index.html`, `config-page.js` | Media |
| D5 | Empty states incompletos (parcelas, documentos, proveedores) | UX | `renderers.js` | Media |
| D6 | 10 tabs en scroll horizontal en mobile | UX | `index.html`, `layout.css` | Media |
| M1 | Paleta M3 tonalmente incoherente (tertiary púrpura vs container verde) | Sistema | `base.css` | Media |
| M2 | Colores paralelos/duplicados (3 formas de decir "verde") | Mantenibilidad | `components.css`, `renderers.js`, `base.css` | Baja |
| M3 | Selectores duplicados en `handleForm` | Mantenibilidad | `modals.js` | Baja |
| M4 | Código muerto (`#userInfo`, `.avatar*`, `getInitials`, `var style=''`) | Mantenibilidad | `layout.css`, `components.css`, `utils.js`, `renderers.js` | Baja |
| M5 | `.filters` en grid de 4 columnas con solo 2 selects | Visual | `layout.css` | Baja |
| M6 | Doughnut con leyenda gigante con ~40 parcelas | UX | `charts.js` | Baja |
| M7 | Sin `prefers-reduced-motion` ni `:focus-visible` custom | Accesibilidad | `base.css`, `components.css` | Baja |
| M8 | Elevation tokens idénticos en light y dark | Sistema | `base.css` | Baja |
| M9 | Sin favicon | Detalle | `index.html` | Baja |
| M10 | Inline `onclick` con datos del usuario (escape incompleto) | Seguridad | `renderers.js:565` | Baja |
| M11 | `.flujo-card` nombra cards de flujo, asambleas y encuestas | Mantenibilidad | `sections.css`, `renderers.js` | Baja |
| M12 | Watermark "TERMINADA" con rojo rgba hardcodeado | Visual | `sections.css` | Baja |

---

## ✅ Lo que está bien (mantener)

| Área | Detalle |
|------|---------|
| **Tokens M3** | Color, elevation, typescale (15) y shape (7) definidos en light y dark (`base.css:24-87`, `90-150`) |
| **Dark mode** | Clase `.dark`, persistencia en localStorage, `color-scheme: dark`, transición suave (`base.css:90,152`, `config.js:69-85`) |
| **Snackbar** | Inverse-surface, easing `cubic-bezier(0.2,0,0,1)`, iconos por tipo (`base.css:207-241`, `utils.js:76-92`) |
| **Patrón de filtros** | Filter chips idénticos en todos los módulos, estado `selected` manejado bien |
| **Skeletons + ARIA** | `aria-busy` en regiones, skeletons reutilizables (`data.js:73-111`, `components.css:31-37`) |
| **Admin-only** | Botones "+ Agregar" y acciones ocultas salvo `IS_ADMIN`; Reclamos accesible a todos (correcto según AGENTS.md) |
| **Copy en acción** | Confirm con verbo directo ("Eliminar"), "Seleccionar todas", mensajes de error específicos |
| **Utils testeadas** | `formatMoney`, `formatDate`, `formatPeriodo` con asserts en `test.html` |
| **Responsive** | Breakpoint 700px, grids colapsan, form-row se apilan |
| **Estructura de código** | Renderers/modals/charts/data separados, convenciones documentadas en AGENTS.md |
| **Fade de tabs** | `tabFadeIn` 0.2s (`layout.css:3-4`) |

---

## 🔴 Hallazgos críticos

### C1 — XSS: contenido de usuario renderizado sin escapar

**Problema**: En producción (datos de Supabase), casi todo el contenido de usuario se pinta en el DOM **sin pasar por `escHtml`**. `escHtml` solo se usa en `modals.js` para rellenar `value=` de formularios; nunca en el output de los renderers.

`nl2br` (`utils.js:53`) **no escapa**: solo reemplaza `\n` por `<br>`. Por lo tanto cualquier campo texto con `<script>` o `<img onerror>` ejecuta en el browser de quien vea la tab.

**Campos sin escapar**:

| Render | Línea(s) | Campo(s) |
|--------|----------|----------|
| `renderNoticiaCard` | `renderers.js:248,252` | `titulo`, `descripcion` |
| `renderFlujo` | `renderers.js:306` | `concepto`, `descripcion` |
| `renderDocumentos` | `renderers.js:349` | `nombre` |
| `renderReclamos` | `renderers.js:383-384` | `asunto`, `descripcion` |
| `renderProveedores` | `renderers.js:398-408` | `nombre`, `rubro`, `contacto`, `observaciones` |
| `renderAsambleas` | `renderers.js:447-448` | `temario`, `acuerdos` |
| `renderEncuestas` | `renderers.js:593-594` | `titulo`, `descripcion` |

**Solución (Fase 1)**: escapar todo el contenido antes de inyectar, y hacer `nl2br` seguro.

```js
// utils.js — reemplazar nl2br por versión segura
function nl2br(text) {
  return escHtml(text || '').replace(/\n/g, '<br>');
}
// y usar escHtml() para los campos que no pasan por nl2br:
//   (n.titulo||'') → escHtml(n.titulo)
//   f.concepto     → escHtml(f.concepto)
//   d.nombre       → escHtml(d.nombre)
//   r.asunto       → escHtml(r.asunto)
//   p.nombre       → escHtml(p.nombre), etc.
```

**Nota**: hay un caso límite con `votarEncuesta` (`renderers.js:565`) que inyecta `op` (dato del admin, no del usuario común) en un `onclick`. Ver M10.

---

### C2 — `test.html` está roto y no corre los asserts

**Problema**: La página de tests no funciona:

1. `config.js:94` llama `initSupabase()`, que está en `js/supabase-config.js`, **no incluido** en `test.html` → `ReferenceError`.
2. `test.html:109-110` referencia `SHEET_NAMES`, que ya no existe en el código → `ReferenceError` que aborta el script (el summary nunca se pinta).
3. `test.html` incluye `data.js`, `charts.js`, `renderers.js`, y `renderers.js:769` ejecuta `loadInitialData()`, que llama `fillFilters()` tocando `#periodFilter` (no existe en `test.html`) → `TypeError`.

**Solución (Fase 2)**: que `test.html` pruebe solo funciones puras:

1. Incluir solo `js/supabase-config.js` + `js/config.js` + `js/utils.js` (en ese orden) — o sacar `initSupabase()` de `config.js`.
2. Eliminar `data.js`, `charts.js`, `renderers.js` de `test.html`.
3. Eliminar los asserts de `SHEET_NAMES` (`test.html:108-110`).
4. Agregar asserts para `escHtml` y `nl2br` (regresión de la Fase 1).

**Alternativa si no se quiere mantener**: borrar `test.html` y mover los tests de `utils.js` a un archivo `test-utils.html` autocontenido (un solo script + una página con contenedor). Pero lo mínimo es arreglarlo porque hoy da falsa sensación de cobertura.

---

### C3 — Contraste insuficiente

| Elemento | Valor | Ratio | Verdict |
|----------|-------|-------|---------|
| `--text-muted` light (`base.css:9,48`) | `#9ca3af` sobre `#fff` | ~2.5:1 | ❌ Falla AA incluso para texto grande (3:1). Se usa en fechas, meta y placeholders a 0.75-0.8rem |
| `#loginError` dark (`index.html:318`) | `#b91c1c` sobre `#111827` | ~2.7:1 | ❌ Falla AA en dark mode |
| `--color-positive` dark (`base.css:104`) | `#059669` sobre `#111827` | ~4.7:1 | ⚠️ Pasa AA normal (4.5:1) pero justo; marginal |
| `.stat-card .value.green` (`components.css:6`) | `#059669` literal | igual que arriba | ⚠️ Pasa, pero es el mismo valor hardcodeado duplicado (ver M2) |
| `--text-muted` dark | `#6b7280` sobre `#111827` | ~4.6:1 | ✅ Pasa AA |

**Solución (Fase 3)**:
- `--text-muted` en light: usar `#6b7280` (gray-500, 4.6:1) o `var(--md-sys-color-on-surface-variant)`; en dark usar `#9ca3af` (6.9:1). Documentar como "muted semántico custom" porque el token `outline` M3 es demasiado claro.
- `#loginError` → `color: var(--md-sys-color-error)` (en dark = `#fca5a5`, pasa).
- Centralizar verde en `--color-positive` y usarlo en `.stat-card .value.green` (Fase 4/M2).

---

## 🎨 Identidad y diseño (lente frontend-design)

### D1 — No hay identidad visual distintiva

El sujeto es "Condominio **Eucaliptus**" (condominio de parcelas, naturaleza, eucaliptos) pero el diseño no lo expresa: azul default `#2563eb`, Roboto, cards con sombra. Es exactamente el "template answer" que la skill `frontend-design` pide evitar. No hay un **signature element** (ningún elemento por el que se recuerde).

**Solución**: ver **Fase 9 — Identidad visual** con propuestas de dirección. Es una decisión de diseño del usuario, no un fix mecánico.

### D2 — Tipografía sin personalidad

Una sola familia (Roboto 400/500/700), el título del header en caps con `letter-spacing: 1px` (`base.css:198`) es look de enterprise template. No hay display face ni pairing.

**Solución**: parte de la Fase 9. Mínimo viable sin cambiar branding: dar peso 600-700 al h1 del header y romper el all-caps (o al revés, mantener caps pero con una display face).

### D3 — Iconos mezclados (Material Symbols + emojis)

Documentos usan emoji (`renderers.js:329`), proveedores usan emoji para contacto (`renderers.js:404-407`), propietarios usan emoji en tel/email/rut (`renderers.js:169-171`), y el resto usa Material Symbols. Dos lenguajes de iconos conviviendo; los emojis varían por plataforma (iPhone 12 Mini, Android, desktop) y se ven distinto según el sistema.

**Solución (Fase 8)**: reemplazar los emojis por Material Symbols equivalentes:
- `📄` → `description`, `📇` → `folder`, `🛡` → `shield`, `📐` → `architecture`, `📜` → `menu_book`
- `📱` → `phone`, `✉️` → `mail`, `📄 RUT` → `badge`, `📍` → `place`, `📞` → `call`, `🌐` → `language`

**Alternativa** si el emoji aporta calidez que se quiere conservar: unificar *todo* en emojis (contra la convención M3, no recomendado) o mantener solo los de contacto con `aria-hidden` y un `title`.

### D4 — Copy inconsistente

| Dónde | Dice | Debería |
|-------|------|---------|
| Menú (`index.html:52`) | "Iniciar sesión" | unificar con modal |
| Modal login botón (`index.html:322`) | "Entrar" | "Iniciar sesión" |
| Config parcelas (`config-page.js:261,288,294,363`) | "Aplicar" | "Crear parcelas" / "Renombrar" (dice lo que hace) |
| Login modal footer | "Crear cuenta" | OK (coherente con signup) |

Regla de la skill: **la misma acción conserva el mismo nombre en todo el flujo** ("Iniciar sesión" → toast "Sesión iniciada"). Botones que dicen exactamente lo que hacen.

### D5 — Empty states incompletos

Gastos, noticias, flujo, reclamos y encuestas tienen mensaje vacío ("Sin registros"). **Parcelas, documentos y proveedores renderizan vacío sin nada** (`renderers.js:129-149`, `327-355`, `394-412`).

**Solución (Fase 5)**: mensaje vacío uniforme + CTA para admin:
```
Sin proveedores todavía.
[+ Agregar Proveedor]
```
Un componente `emptyState(texto, ctaHtml)` reutilizable en `renderers.js`.

### D6 — 10 tabs en scroll horizontal en mobile

`md-tabs` con 10 `md-primary-tab` (`index.html:71-82`) hace scroll horizontal en iPhone 12 Mini. La auditoría M3 ya lo anotó ("Sin navegación adaptativa"). Es el mayor problema de UX móvil.

No tiene una solución de un paso → ver **Alternativas** al final.

---

## ⚙️ Sistema M3 y deuda técnica

### M1 — Paleta M3 tonalmente incoherente

`tertiary` es púrpura `#7c3aed` pero `tertiary-container` es verde `#d1fae5` (`base.css:32-35`). En una paleta M3 tonal, cada role debe pertenecer a la misma familia de tono. Aquí los roles se armaron con colores Tailwind elegidos a mano, no con una paleta tonal generada:

- El "verde positivo" (ingresos/flujo) usa `tertiary-container` (`#d1fae5`/`#065f46`), pero `tertiary` es púrpura → incoherencia semántica.
- `avatar.purple` usa `tertiary` (`components.css:25`) → púrpura que no conversa con el container verde.
- `--color-extraordinaria-bg` (`#fef3c7` ámbar) sin token M3.

**Alternativas**:
1. **Generar paleta real** con Material Theme Builder (basada en un verde eucalipto) y reemplazar los tokens hardcodeados → la solución correcta a mediano plazo, alineada con la Fase 9 de identidad.
2. **Documentar como excepción**: mantener los valores pero renombrar los roles custom (`--color-positive*`, `--color-extraordinaria*`) y no usarlos como si fueran roles M3. Cambio mínimo, solo documentación + consistencia interna.

### M2 — Colores paralelos / duplicados (verde)

El mismo verde está en 3 lugares:
- `--color-positive: #059669` (`base.css:17`)
- `.stat-card .value.green { color: #059669 }` literal (`components.css:6`)
- `.avatar.green { background: #10b981 }` literal (`components.css:24`, código muerto)

**Solución (Fase 4)**: un solo token `--color-positive` y usarlo en `.stat-card .value.green`; borrar las variantes muertas de avatar.

### M3 — Selectores duplicados en `handleForm`

`modals.js:62-63`: `'md-filled-text-field, md-filled-text-field'` y `'md-filled-select, md-filled-select'` (duplicados idénticos).

**Solución (Fase 4)**: dejar un solo selector por línea.

### M4 — Código muerto

| Código | Dónde | Nota |
|--------|-------|------|
| `#userInfo` | `layout.css:12,17` | Ya no existe en `index.html` (se movió a md-menu) |
| `.avatar` + `.green/.purple/.orange/.pink` | `components.css:23-27` | Se eliminó el avatar del listado de propietarios |
| `getInitials` | `utils.js:49-51` | Solo lo usa `test.html` |
| `var style = ''` + `style="margin-bottom:1rem;'+style+'"` | `renderers.js:245-246` | Resto de refactor |
| `confirmCloseModal` | `modals.js:46-48` | Solo lo usa el listener de `cancel` (`modals.js:598-601`) |

**Solución (Fase 4)**: eliminar; re-verificar con grep después.

### M5 — `.filters` en grid de 4 columnas con 2 selects

`layout.css:7`: `grid-template-columns: repeat(4, 1fr)` pero hay solo 2 selects → espacio muerto a la derecha. Debería ser `repeat(2, 1fr)` (o auto-fit) y `1fr` en mobile.

### M6 — Doughnut con ~40 parcelas

`charts.js:63`: leyenda bottom con un color por parcela. Con un condominio real de 40 parcelas, la leyenda ocupa la pantalla completa y es ilegible. Ver **Alternativas**.

### M7 — Sin `prefers-reduced-motion` ni `:focus-visible` custom

- `skeleton` animación (`components.css:31`) y `tabFadeIn` (`layout.css:3`) ignoran `prefers-reduced-motion`.
- Links "Ver"/`tel:`/`mailto:` dependen del focus default del browser.

**Solución (Fase 7)**:
```css
@media (prefers-reduced-motion: reduce) {
  .skeleton { animation: none; }
  .tab-content.active { animation: none; }
  #appSnackbar, body { transition: none; }
}
:focus-visible { outline: 2px solid var(--md-sys-color-primary); outline-offset: 2px; }
```

### M8 — Elevation tokens idénticos en light y dark

`base.css:58-63` vs `144-149` tienen exactamente los mismos valores. En dark mode las sombras deberían ser más sutiles (o usar scrim con más opacidad). Bajo impacto; ver alternativa al final.

### M9 — Sin favicon

`index.html` no tiene `<link rel="icon">`. En GitHub Pages se ve el favicon default del browser.

**Solución (Fase 4)**: un favicon (se puede generar como parte de la identidad, Fase 9).

### M10 — Inline `onclick` con datos del usuario

`renderers.js:565`:
```js
onclick="votarEncuesta('ID', 'OPCION')"
```
`op` viene del admin (alternativas de encuesta), pero igualmente inyecta el valor escapando solo `'` → si una alternativa contiene `"` o `\` puede romper el atributo. Es bajo riesgo (lo crea admin), pero la práctica de inyectar datos en `onclick` es frágil.

**Alternativa**: guardar el estado en el elemento y delegar con `addEventListener` (ver alternativa en la sección final). Mínimo: escapar `'`, `"`, `\` y `</script>`.

### M11 — `.flujo-card` nombra 3 cosas distintas

`flujo-card` se usa en cards de Ingresos/Egresos, Asambleas (`renderers.js:438`) y Encuestas (`renderers.js:585`). El nombre no describe nada.

**Solución (Fase 4)**: renombrar a `.list-card` (o `.item-card`) y actualizar CSS + HTML generado. Cambio mecánico, sin impacto visual.

### M12 — Watermark "TERMINADA" con rojo rgba hardcodeado

`sections.css:7`: `rgba(220, 38, 38, 0.7)` / `rgba(220, 38, 38, 0.55)` — no responde a theme. En dark se ve igual (rojo brillante, aceptable) pero rompe la regla de tokens.

**Solución (Fase 3)**: usar `color-mix()` o variables:
```css
color: color-mix(in srgb, var(--md-sys-color-error) 70%, transparent);
border-color: color-mix(in srgb, var(--md-sys-color-error) 55%, transparent);
```

---

## Plan de corrección

### Convenciones

- **Una fase por sesión/PR**, testeable independientemente (mismo criterio que `material-m3.md`).
- Después de cada fase: cargar demo mode, recorrer todas las tabs, abrir modales, toggle dark/light.
- No tocar `js/supabase-config.js`.
- No romper modo producción.
- Reglas que **conviven** con el código actual (no hay que cambiar): inline styles en renderers (convención AGENTS.md), colores de acento hardcodeados OK (solo reemplazar los que rompen contraste o duplican tokens).
- Actualizar `CHANGELOG.md` y `README.md` cuando una fase se complete.

### Fase 1 — Seguridad: escapar todo el output

**Archivos**: `js/utils.js`, `js/renderers.js`

1. `nl2br` pasa a escapar: `escHtml(text || '').replace(/\n/g,'<br>')`.
2. Aplicar `escHtml` a todos los campos listados en C1 (titulo, concepto, nombre, asunto, rubro, contacto, observaciones, temario, acuerdos).
3. Ojo con `renderers.js:565`: aplicar escape mínimo de `op` o delegar (ver M10).
4. Verificar que las **8 ocurrencias** de `nl2br(` y los campos crudos quedaron cubiertos (grep `+ [a-z.]+ \||nl2br(`).

**Test**: en demo mode, crear una noticia/reclamo con `<b>x</b><img src=x onerror=alert(1)>` y confirmar que se ve como texto plano y no ejecuta.

### Fase 2 — Arreglar `test.html`

**Archivo**: `test.html`

1. Incluir `js/supabase-config.js` antes de `config.js` (por `initSupabase()`).
2. Quitar `data.js`, `charts.js`, `renderers.js` (no aplican a utils).
3. Quitar asserts de `SHEET_NAMES` (líneas 108-110).
4. Agregar asserts de `escHtml`/`nl2br`.

**Test**: abrir `test.html` → `N/N tests passed` y summary verde.

### Fase 3 — Contraste y colores duros restantes

**Archivos**: `css/base.css`, `index.html`, `css/sections.css`

1. `--text-muted`: light → `#6b7280`, dark → `#9ca3af` (documentar como muted semántico, fuera del token outline).
2. `index.html:318` `#loginError` → `var(--md-sys-color-error)`.
3. Watermark `sections.css:7` → `color-mix()` con `--md-sys-color-error`.
4. Verificar contraste con axe/Lighthouse en light y dark.

**Test**: axe DevTools sin violaciones de color en las 4 tabs principales + login (dark).

### Fase 4 — Deuda técnica y código muerto

**Archivos**: `modals.js`, `renderers.js`, `layout.css`, `components.css`, `utils.js`

1. `modals.js:62-63`: selectores duplicados → uno solo.
2. `renderers.js:245-246`: sacar `var style` muerto.
3. Eliminar `#userInfo` (layout.css:12,17), `.avatar*` (components.css:23-27), `getInitials` (utils.js:49-51) — salvo que se reincorpore el avatar (ver alternativas).
4. `.flujo-card` → `.item-card` (rename en `sections.css` y `renderers.js`).
5. `.stat-card .value.green` → `var(--color-positive)`.
6. `.filters` → `repeat(2, 1fr)`.
7. Agregar favicon (placeholder; el definitivo en Fase 9).

**Test**: grep de los símbolos eliminados = 0 resultados; app funciona igual.

### Fase 5 — Empty states uniformes

**Archivo**: `renderers.js`

1. Helper `emptyState(texto, ctaHtml)` reutilizable.
2. Aplicar a parcelas (`renderParcelas`), documentos (`renderDocumentos`), proveedores (`renderProveedores`).
3. CTA "+ Agregar" para admin en cada uno.

### Fase 6 — Copy unificado

**Archivos**: `index.html`, `config-page.js`

1. Botón login "Entrar" → "Iniciar sesión".
2. "Aplicar" de parcelas → "Crear parcelas" (y el estado "Procesando..." coherente).
3. Revisar el resto de botones con verbo de acción.

### Fase 7 — Motion y foco accesibles

**Archivos**: `css/base.css`, `css/components.css`

1. `@media (prefers-reduced-motion: reduce)` para skeleton, tabFadeIn, transiciones.
2. `:focus-visible` global con `--md-sys-color-primary`.

### Fase 8 — Iconos unificados (Material Symbols)

**Archivos**: `renderers.js`, `index.html` (si aplica)

1. Reemplazar emojis de documentos, proveedores y propietarios por `<md-icon>` de Material Symbols (mapa en D3).
2. Mantener `title`/`aria-label` en cada uno.

### Fase 9 — Identidad visual (decisión de diseño)

**Decisión de producto, requiere confirmación del usuario.** Propuestas:

**Dirección A — "Verde eucalipto" (recomendada)**
- **Paleta** (4-6 hex): verde eucalipto `#2F6B4F` (primary), hoja clara `#A8C3A8` / `#D8E6DD` (containers), arena cálida `#E9E4D8` (superficie alta), text `#1A2B22`, error `#B3261E`. Azul `#2563eb` → verde.
- **Tipografía**: display para el header (ej. serif eucalipto/geo cálida) + Roboto para cuerpo. Romper el all-caps plano o darle peso.
- **Signature**: marca con silueta de hoja de eucalipto (o la "E" estilizada) en el header + favicon + logo del login. Ese es el elemento memorable; el resto se queda quieto.
- **Riesgo justificado**: es el sujeto del producto; bajo costo (un archivo CSS de tokens + header).

**Dirección B — "Neutral institucional refinado"**
- Sin cambio de paleta; solo refinar jerarquía: header con peso 600, tabs con iconos, más aire en grids, focus visible. Cero riesgo, pero no genera identidad memorable.

**No recomendado**: seguir como está (genérico).

---

## Orden de ejecución propuesto

```
Fase 1  → Seguridad (XSS)              [crítica, inmediata]
   ↓
Fase 2  → test.html                    [calidad, inmediata]
   ↓
Fase 3  → Contraste y colores duros    [accesibilidad]
   ↓
Fase 4  → Deuda técnica + código muerto
   ↓
Fase 5  → Empty states
   ↓
Fase 6  → Copy
   ↓
Fase 7  → Motion/foco accesibles
   ↓
Fase 8  → Iconos unificados
   ↓
Fase 9  → Identidad (decisión + ejecución, puede paralelizarse con 3-8)
```

Las Fases 5-8 son independientes entre sí y pueden hacerse en cualquier orden. La 9 depende de la decisión de identidad y conviene hacerla junto con o después de la 3 (porque redefine tokens).

---

## Verificación por fase

| Fase | Test |
|------|------|
| 1 | Inyectar `<img onerror>` en una noticia → se ve plano, no ejecuta |
| 2 | `test.html` → summary verde |
| 3 | axe DevTools sin violaciones de contraste en light+dark |
| 4 | Grep de símbolos muertos = 0; app sin cambios visuales |
| 5 | Crear estado vacío (borrar todo en demo) → mensaje + CTA en los 3 módulos |
| 6 | Flujo login: menú y modal dicen "Iniciar sesión"; botón de parcelas dice lo que hace |
| 7 | Windows: activar "reducir animaciones" → sin skeleton animado ni fade |
| 8 | Recorrer tabs de documentos/proveedores/propietarios → sin emojis crudos |
| 9 | Header, favicon y login muestran la nueva identidad en light+dark, iPhone 12 Mini |

---

## Problemas sin solución directa → alternativas

### Navegación: 10 tabs en mobile (D6)

No hay un "fix de una línea". Alternativas:

| Opción | Esfuerzo | Efecto |
|--------|----------|--------|
| **A. Tabs con iconos + labels cortos** | Bajo | Mantiene el patrón M3, reduce ancho por tab, más escaneable |
| **B. Agrupar tabs en secciones** (p.ej. "Comunidad", "Administración") | Medio | Menos tabs visibles, requiere rediseño de la taxonomía |
| **C. Drawer/nav rail en desktop + tabs solo para las 4 tabs principales** | Medio | Patrón M3 recomendado para apps con 5+ destinos |
| **D. Tabs + iconos solo en mobile (scrolling con snap)** | Bajo | Más rápido de tocar, pero sigue scroll |
| **Recomendada**: A ahora (rápido, sin riesgo) y C como evolución cuando haya presupuesto de diseño |

### Paleta M3 tonal incoherente (M1)

1. **Regenerar con Material Theme Builder** partiendo de un verde eucalipto → reemplazar `base.css:24-54` y `111-141`. Correcto, alineado con Fase 9.
2. **Documentar como excepción**: renombrar los roles custom y no mezclar con roles M3. Mínimo, mantenible.

### Doughnut de 40 parcelas (M6)

| Opción | Esfuerzo |
|--------|----------|
| **Top 8 + "Otras" (sumado)** + tooltip con detalle | Bajo |
| **Bar chart horizontal** ordenado desc → legible con 40 items | Bajo |
| **Tabla de montos por parcela** (ya existe debajo) y quitar doughnut | Mínimo |
| **Doughnut solo con datos filtrados** (respecta el filtro de parcela) | Mínimo |
| **Recomendada**: doughnut top-N + "Otras" ahora; evaluar bar chart si sigue siendo ilegible |

### Iconos: emoji vs Material Symbols (D3)

- **Unificar a Material Symbols** (Fase 8): consistente con el resto de la app y M3. Recomendado.
- **Unificar a emojis**: contra M3, no recomendado, pero es una decisión legítima si se busca calidez.
- **Híbrido con regla**: Material Symbols para acciones/datos, emoji solo para contacto con `aria-hidden`. Intermedio.

### Inline `onclick` con datos (M10)

- **Mínimo (ahora)**: escapar `'`, `"`, `\` en `op`.
- **Correcto (mediano plazo)**: delegar eventos — `document.addEventListener('click', ...)` con `data-*` attributes en el botón (`data-encuesta`, `data-opcion`). Elimina la generación de código JS en strings.

### "Eucaliptus" vs "Eucalipto"

En español correcto es "Eucalipto". "Eucaliptus" es la transliteración del latín científico (*Eucalyptus*). Es nombre de marca del condominio, así que **no es un bug**: si el usuario lo quiere, se deja como está (documentarlo en README/CHANGELOG). Si se decide corregir, es un rename de `index.html:9,36` + README + CHANGELOG.

### Elevation dark = light (M8)

Bajo impacto. Alternativa: en `body.dark`, subir la opacidad del scrim (`--md-sys-elevation-*` con más negro o más alpha) o reducirla (sombras casi invisibles) y depender más del contraste de superficie. No bloquea nada; puede esperar a la Fase 9.

### Fase 8 revertida de la auditoría M3 (imports `@material/web/all.js`)

`material-m3.md` Fase 8 quedó **revertida** porque los imports individuales rompían componentes. No re-intentar sin testear componente por componente. Alternativa: mantener `all.js` (acepta el peso de bundle) o importar de a uno **verificando cada componente usado** (los que lista el módulo actual: tabs, buttons, chips, selects, dialogs, switch, icon, icon-button, menu, menu-item, divider, text-field, circular-progress, snackbar). Dejarlo fuera del scope de este doc.

---

## Checklist detallado

Instrucciones: marcar `[x]` cuando el cambio esté commiteado y verificado en demo mode.

### FASE 1 — Seguridad XSS
- [x] `nl2br` escapa antes de insertar `<br>` (`utils.js`)
- [x] `renderNoticiaCard`: `titulo` y `descripcion` escapados (`renderers.js:248,252`)
- [x] `renderFlujo`: `concepto` y `descripcion` escapados (`renderers.js:306`)
- [x] `renderDocumentos`: `nombre` escapado (`renderers.js:349`)
- [x] `renderReclamos`: `asunto` y `descripcion` escapados (`renderers.js:383-384`) — además `tipo` escapado (texto y class sanitizada)
- [x] `renderProveedores`: nombre/rubro/contacto/telefono/email/web/observaciones escapados (`renderers.js:398-408`)
- [x] `renderAsambleas`: `temario` y `acuerdos` escapados (`renderers.js:447-448`)
- [x] `renderEncuestas`: `titulo` y `descripcion` escapados (`renderers.js:593-594`)
- [x] `votarEncuesta` `onclick`: `op` delegado por índice (ya no inyecta texto de usuario) — además texto de `op` escapado (`renderers.js:565,570`)
- [x] Demo: inyectar `<img onerror>` en noticia/reclamo → no ejecuta — verificado por sanity test de `escHtml`/`nl2br` en node
- [x] Extra: `showDescripcion` (documento) escapado (`renderers.js:360`)
- [x] Extra: propietarios en `showPropietarios` escapados (nombre, tipo, tel, email, rut, título) (`renderers.js:163-186`)
- [x] Extra: `f.tipo` y `a.tipo` escapados (`renderers.js:305,440`)

### FASE 2 — test.html
- [x] `test.html` corre solo funciones puras: incluye únicamente `js/utils.js` (sin Supabase, sin `config.js`)
- [x] Eliminados asserts de `SHEET_NAMES` (no existía), de `toggleDemoMode` (recargaba la página en loop infinito vía `location.reload()` en `config.js:51`), de `DEMO_FILES` y de `loaded` (dependían de `config.js`)
- [x] Asserts de `escHtml`/`nl2br` agregados
- [x] Summary verde al abrir — 35/35 asserts de funciones puras verificados en node; confirmación visual en browser pendiente del usuario

### FASE 3 — Contraste
- [x] `--text-muted` light = `#6b7280` (4.6:1) — commiteado
- [x] `--text-muted` dark = `#9ca3af` (6.9:1) — commiteado
- [x] `#loginError` → `var(--md-sys-color-error)` (`index.html:318`) — commiteado
- [x] Watermark TERMINADA → `var(--md-sys-color-error)` + `opacity: 0.7` (versión intermedia elegida; no `color-mix`) (`sections.css:7`) — pendiente commit
- [ ] axe DevTools sin violaciones de color (light + dark) — verificación del usuario

### FASE 4 — Deuda técnica
- [x] Selectores duplicados en `handleForm` unificados (`modals.js:62-63`) — commiteado
- [x] `var style` muerto eliminado (`renderers.js:245-246`)
- [x] `#userInfo` eliminado (`layout.css:12,17`)
- [x] `.avatar*` eliminado (`components.css:23-27`) **o** avatar reincorporado con tokens
- [x] `getInitials` eliminado (`utils.js`) y sus asserts de `test.html` removidos
- [x] `.flujo-card` → `.item-card` (`sections.css` + `renderers.js`)
- [x] `.stat-card .value.green` → `var(--color-positive)`
- [x] `.filters` → descartado: se probó `repeat(2, 1fr)` y no gustó (demasiado espacio); se mantiene `repeat(4, 1fr)` original
- [x] Favicon agregado (SVG emoji 🌳 en `index.html`)

### FASE 5 — Empty states
- [x] Componente `.empty-state` + helper `emptyState(texto)` en `renderers.js` (borde punteado, ícono `inbox`, texto corto, sin CTA)
- [x] Parcelas con mensaje vacío (sin botón: se crean desde Configuración)
- [x] Documentos con mensaje vacío (el "+ Agregar" ya está en el header de la pestaña)
- [x] Proveedores con mensaje vacío (el "+ Agregar" ya está en el header de la pestaña)
- [x] Extendido a Gastos, Flujo, Noticias, Reclamos, Asambleas y Encuestas (consistencia; Asambleas no tenía nada)

### FASE 6 — Copy
- [x] Botón login "Entrar" → "Iniciar sesión" (`index.html`)
- [x] Botón parcelas "Aplicar" → "Crear parcelas" (`config-page.js`; estado de carga "Creando...")

### FASE 7 — Motion/foco
- [x] `prefers-reduced-motion: reduce` para skeleton, tabFadeIn, transitions (bloque global en `base.css`)
- [x] `:focus-visible` global con `--md-sys-color-primary` (`base.css`)

### FASE 8 — Iconos
- [x] Documentos sin emoji → Material Symbols (`book`/`description`/`contract`/`shield`/`map` en `renderers.js`)
- [x] Proveedores sin emoji → Material Symbols (`person`/`phone`/`mail`/`language`)
- [x] Propietarios sin emoji → Material Symbols (`phone`/`mail`/`badge`)
- [x] `aria-label`/`title` en cada ícono

### FASE 9 — Identidad (pendiente decisión)
- [ ] Dirección elegida (A verde eucalipto / B neutral / otra)
- [ ] Tokens de color actualizados (light+dark)
- [ ] Tipografía display + pairing
- [ ] Signature (hoja/E estilizada) en header + favicon
- [ ] Verificado en light/dark y iPhone 12 Mini

---

## Seguimiento

| Fase | Estado |
|------|--------|
| F1 — Seguridad | ✅ Completa (commit `d90c991` + `f1903b2`) |
| F2 — test.html | ✅ Completa (commit `f1903b2`) |
| F3 — Contraste | ✅ Completa (commits `cd543b3`, `a4a092c`, `fa5d754`; verificación axe en browser pendiente) |
| F4 — Deuda técnica | ✅ Completa (commits `8c67e2f`→`35964ad`; favicon es placeholder, definitivo en F9) |
| F5 — Empty states | ✅ Completa (commit `c198515`) |
| F6 — Copy | ✅ Completa (commit `7611867`) |
| F7 — Motion/foco | ✅ Completa (commit `a881cf0`) |
| F8 — Iconos | ✅ Completa (commit `8eaa783`) |
| F9 — Identidad | ⬜ Pendiente (decisión A / B) |

---

## Notas para el README/CHANGELOG

Cuando se complete cada fase, sumar una entrada en `CHANGELOG.md` con el formato usado (`style:`, `fix:`, `feat:`). Si se decide la Fase 9 (identidad), actualizar también el apartado de stack/descripción del `README.md` con la paleta y tipografía elegidas.
