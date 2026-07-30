# Auditoría Material M3

## Findings

### Historial de correcciones anteriores

| # | Issue | Estado |
|---|-------|--------|
| 1 | Faltaban tokens typescale | ✅ Corregido (todos los 15 presentes) |
| 2 | Faltaban elevation tokens | ✅ Corregido (level0-5 presentes) |
| 3 | Faltaba surface-tint | ✅ Corregido |
| 4 | Shape tokens definidos pero no usados | ✅ Parcial — ahora se usan en cards/badges |
| 5 | Selector duplicado md-filled-text-field | ✅ Corregido |
| 7 | Header colores hardcodeados | ✅ Corregido (usa tokens M3) |
| 9 | Filter chips ocultan checkmark | ⚠️ Sin cambios (diseño intencional) |
| 6 | Dos bloques body.dark separados | ❌ Sigue igual (base.css:79 y 162) |
| 8 | #userInfo color hardcodeado | ❌ Sigue igual (index.html:41 — usa `var(--text-2)`, que es custom no M3) |
| 10 | Reset CSS frágil | ❌ Sigue igual |
| 11 | Sombras no-M3 | ❌ Sigue igual (usa elevation tokens, pero el enfoque de sombras como profundidad primaria no es M3) |

### ❌ Bloqueantes actuales

| # | Issue | Archivo | Gravedad |
|---|-------|---------|----------|
| B1 | **30+ hardcoded hex colors** en inline styles y CSS (azul `#2563eb`, verde `#059669`, rojo `#b91c1c`, etc.) | `renderers.js`, `modals.js`, `components.css`, `sections.css`, `charts.js` | **Crítica** |
| B2 | `import '@material/web/all.js'` — antipatrón explícito M3 | `index.html:23` | Alta |
| B3 | **Tipografía**: los 15 `--md-sys-typescale-*` tokens definidos pero **0 usados** en la app | `base.css:54-68` vs todos los CSS/HTML | Alta |
| B4 | **Elevación por sombras** en vez de tonal surface color (principio M3 fundamental) | `components.css`, `sections.css` — todas las cards | Alta |
| B5 | Variables custom (`--bg`, `--bg-card`, `--text`) **desalineadas** de M3 — ej: `--bg-card:#fff` ≠ `--md-sys-color-surface-container-low:#f5f7fa` | `base.css:4-14` vs `base.css:17-45` | Alta |
| B6 | **Dos sistemas de variables paralelos** — la app usa el custom, M3 tokens existen solo para `@material/web` | Todos los CSS | Alta |
| B7 | Sin clases `md-typescale-*` aplicadas a ningún elemento (importadas pero ignoradas) | `index.html:24-25` | Media |
| B8 | Dark mode elevation tokens **idénticos** a light mode | `base.css:122-127` | Media |
| B9 | `<select multiple>` nativo en form asambleas — no es M3 | `modals.js:535` | Media |
| B10 | `style="--md-filled-button-container-color:#b91c1c"` — override inline de token M3 | `modals.js:21`, `renderers.js:530` | Media |

### ⚠️ Observaciones

- ✅ Snackbar usa `--md-sys-color-inverse-surface/on-surface` y easing M3 — correcto
- ✅ Header usa `--md-sys-color-primary/on-primary` y shape tokens — correcto
- ✅ Shape tokens (`--md-sys-shape-corner-*`) se usan consistentemente en cards/badges
- ✅ Elevation tokens se usan en box-shadow de todos los contenedores
- ✅ Toggle dark/light mode funcional con persistencia en localStorage
- ⚠️ Skeleton animation usa keyframe custom, no M3 motion tokens
- ⚠️ Sin focus indicators visibles más allá de lo que provee `@material/web`
- ⚠️ Sin `aria-busy` en regiones con skeleton loading
- ⚠️ Sin navegación adaptativa (tabs en mobile, rail en desktop)
- ⚠️ Sin transiciones M3 en tabs, modales, filtros (todo instantáneo)
- ⚠️ `border-radius: 50%` en avatars — podría ser `var(--md-sys-shape-corner-full)`
- ⚠️ `border-radius: 6px` y `3px` hardcodeados en encuestas

---

## Plan de corrección

### Convenciones
- **Una fase por PR/sesión**
- **No mezclar fases** — cada fase es revisable y testeable independientemente
- Después de cada fase: cargar demo mode, revisar todas las tabs, abrir modales, toggle dark mode
- No tocar `js/supabase-config.js`
- No romper modo producción

---

### Fase 1: Unificar variables CSS (--bg → --md-sys-color-surface)

**Objetivo**: Eliminar el sistema duplicado de variables custom y mapear todo a M3 tokens.

**Archivos**: `css/base.css`, `css/components.css`, `css/sections.css`, `css/layout.css`

**Pasos**:

1. En `base.css`: agregar mapeo explícito de variables legacy a M3 tokens:
   ```css
   :root {
     /* Legacy aliases (para transición) */
     --bg: var(--md-sys-color-surface-container-low);
     --bg-card: var(--md-sys-color-surface);
     --text: var(--md-sys-color-on-surface);
     --text-2: var(--md-sys-color-on-surface-variant);
     --text-muted: var(--md-sys-color-outline);
     --border: var(--md-sys-color-outline-variant);
     --border-light: var(--md-sys-color-surface-container-low);
     --surface-hover: var(--md-sys-color-surface-container-high);
   }
   ```
   (idem en `body.dark`)

2. Verificar que no haya cambios visuales (los valores legacy quedan igual, solo se referencian contra M3).

**Test**: toggle dark/light, verificar que todos los fondos y textos se vean igual que antes.

---

### Fase 2: Reemplazar colores hardcodeados en CSS

**Objetivo**: Eliminar todos los hex colors en archivos CSS.

**Archivos**: `css/components.css`, `css/sections.css`, `css/base.css`

**Pasos por archivo**:

**`css/components.css`:**
- `.stat-card .value.blue { color: #2563eb }` → `var(--md-sys-color-primary)`
- `.stat-card .value.green { color: #059669 }` → `var(--md-sys-color-tertiary)` (o crear variable semántica)
- `.stat-card .value.red { color: #b91c1c }` → `var(--md-sys-color-error)`
- `.avatar { background: #3b82f6 }` → `var(--md-sys-color-primary-container)`
- `.avatar.green { background: #10b981 }` → `var(--md-sys-color-tertiary-container)`
- `.avatar.purple { background: #8b5cf6 }` → `var(--md-sys-color-secondary-container)`
- `.avatar.orange { background: #f97316 }` → (definir variable o usar tonal)
- `.avatar.pink { background: #ec4899 }` → (definir variable o usar tonal)

**`css/sections.css`:**
- `.doc-icon { background: #dbeafe; color: #2563eb }` → `background: var(--md-sys-color-primary-container); color: var(--md-sys-color-on-primary-container)`
- `.reclamo-tipo.reclamo { background: #fee2e2; color: #991b1b }` → `background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container)`
- `.reclamo-tipo.sugerencia { background: #d1fae5; color: #065f46 }` → `background: var(--md-sys-color-tertiary-container); color: var(--md-sys-color-on-tertiary-container)`
- `.proveedor-rubro { background: #dbeafe; color: #1e40af }` → `background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container)`
- `.timeline-item::before { background: #3b82f6 }` → `var(--md-sys-color-primary)`
- `.timeline-item.extra::before { background: #f59e0b }` → `var(--md-sys-color-tertiary)`
- `.timeline-tipo { background: #dbeafe; color: #1e40af }` → `var(--md-sys-color-secondary-container) / var(--md-sys-color-on-secondary-container)`
- `.timeline-tipo.extra { background: #fef3c7; color: #92400e }` → `var(--md-sys-color-tertiary-container) / var(--md-sys-color-on-tertiary-container)`

**`css/base.css`:**
- `.snackbar-icon.success { color: #4ade80 }` → `var(--md-sys-color-tertiary)`
- `.snackbar-icon.warning { color: #fbbf24 }` → (variable temporal o `var(--md-sys-color-secondary)`)
- `.snackbar-icon.error { color: #f87171 }` → `var(--md-sys-color-error)`
- `.snackbar-icon.info { color: #60a5fa }` → `var(--md-sys-color-primary)`

**Test**: cada cambio individual verificar que el elemento se vea correcto en light y dark mode.

---

### Fase 3: Reemplazar colores hardcodeados en JS (renderers.js)

**Objetivo**: Eliminar hex colors en inline styles generados por JS.

**Archivo**: `js/renderers.js`

**Estrategia**: No se pueden usar variables CSS en strings de template HTML inline? Sí se puede:
```js
'style="color:var(--md-sys-color-primary)"'
```

**Reemplazos**:

- `color:#9ca3af` → `color:var(--md-sys-color-outline)`
- `color:#2563eb` (links) → `color:var(--md-sys-color-primary)`
- `#059669` / `#b91c1c` (flujo) → `var(--md-sys-color-tertiary)` / `var(--md-sys-color-error)`
- `#d1fae5` / `#fee2e2` (bg tipo badges) → `var(--md-sys-color-tertiary-container)` / `var(--md-sys-color-error-container)`
- `#065f46` / `#991b1b` (text tipo badges) → `var(--md-sys-color-on-tertiary-container)` / `var(--md-sys-color-on-error-container)`
- `#22c55e`, `#3b82f6`, `#f59e0b`, etc. (colores encuesta) → array de variables M3
- `#f3f4f6` / `#dcfce7` (encuesta estado bg) → `var(--md-sys-color-surface-container)` / `var(--md-sys-color-tertiary-container)`
- `#374151` / `#166534` (encuesta estado text) → `var(--md-sys-color-on-surface-variant)` / `var(--md-sys-color-on-tertiary-container)`
- `#16a34a` / `#b91c1c` (quorum) → `var(--md-sys-color-tertiary)` / `var(--md-sys-color-error)`
- `--md-filled-button-container-color:#b91c1c` → `--md-filled-button-container-color:var(--md-sys-color-error)`

**Test**: ver cada badge, chip, link, y chart en light y dark mode.

---

### Fase 4: Reemplazar colores hardcodeados en JS (modals.js + charts.js)

**Archivo**: `js/modals.js`, `js/charts.js`

**`modals.js`:**
- `--md-filled-button-container-color:#b91c1c` (confirm delete) → `var(--md-sys-color-error)`
- `border-radius:6px` (encuesta info box) → `var(--md-sys-shape-corner-small)`
- `color:#b91c1c` (close icon btn, encuesta alt) → `var(--md-sys-color-error)`

**`charts.js`:**
- `backgroundColor: '#3b82f6'` (bar chart) → `getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-primary').trim()`
- Array de colores doughnut → leer de CSS variables programáticamente

**Test**: ver gráficos en ambos modos.

---

### Fase 5: Aplicar typescale tokens en CSS

**Objetivo**: Reemplazar `font-size` hardcodeados por las variables `--md-sys-typescale-*`.

**Archivo**: `css/base.css`, `css/components.css`, `css/sections.css`

**Propuesta de mapeo**:

| Elemento actual | font-size actual | Token M3 |
|----------------|-----------------|----------|
| `header h1` | `1.8rem / 600` | `var(--md-sys-typescale-title-large)` |
| `header p` | `0.9rem` | `var(--md-sys-typescale-body-medium)` |
| `.stat-card .value` | `1.6rem / 700` | `var(--md-sys-typescale-headline-small)` |
| `.stat-card .label` | `0.8rem / uppercase` | `var(--md-sys-typescale-label-small)` |
| `table, td, th` | `0.85rem` | `var(--md-sys-typescale-body-small)` |
| `.card h4` | `1rem` | `var(--md-sys-typescale-title-medium)` |
| `.card .field` | `0.85rem` | `var(--md-sys-typescale-body-medium)` |
| `.news-card .desc` | `0.9rem` | `var(--md-sys-typescale-body-medium)` |
| `.news-card .dates` | `0.8rem` | `var(--md-sys-typescale-body-small)` |
| `.reclamo-title` | `0.95rem` | `var(--md-sys-typescale-title-small)` |
| `.reclamo-desc` | `0.85rem` | `var(--md-sys-typescale-body-medium)` |
| `.proveedor-nombre` | `1rem` | `var(--md-sys-typescale-title-medium)` |
| `.proveedor-contacto` | `0.85rem` | `var(--md-sys-typescale-body-medium)` |
| `.flujo-card .monto` | `1.1rem / 700` | `var(--md-sys-typescale-title-medium)` |
| `.flujo-card .concepto` | `500` | `var(--md-sys-typescale-body-medium)` |
| `.timeline-title` | `1rem` | `var(--md-sys-typescale-title-medium)` |
| `.chart-box h3` | `0.95rem` | `var(--md-sys-typescale-title-small)` |
| `.table-wrap h3` | `0.95rem` | `var(--md-sys-typescale-title-small)` |
| `.reclamo-tipo` | `0.75rem` | `var(--md-sys-typescale-label-small)` |
| `body` | browser default | `var(--md-sys-typescale-body-medium)` |

**Test**: comparar visualmente antes/después, asegurar que no cambia drasticamente.

---

### Fase 6: Elevación tonal (reemplazar sombras por surface containers)

**Objetivo**: Que la profundidad se comunique por color de superficie, no por sombras.

**Archivos**: `css/components.css`, `css/sections.css`

**Estrategia**:
- No eliminar las sombras de golpe (breaking change visual)
- Agregar transición: usar `background` de surface-container según nivel de elevación
- Cards nivel 1: `background: var(--md-sys-color-surface-container-low)` en vez de `var(--bg-card)`
- Dialog/modal nivel 3: mantener sombra + `background: var(--md-sys-color-surface-container-high)`

**Mapeo propuesto**:
| Elemento | bg actual | bg M3 propuesto |
|---------|-----------|-----------------|
| `.stat-card` | `var(--bg-card)` | `var(--md-sys-color-surface-container-low)` |
| `.table-wrap` | `var(--bg-card)` | `var(--md-sys-color-surface-container-low)` |
| `.card` (grid) | `var(--bg-card)` | `var(--md-sys-color-surface)` |
| `.news-card` | `var(--bg-card)` | `var(--md-sys-color-surface)` |
| `.flujo-card` | `var(--bg-card)` | `var(--md-sys-color-surface)` |
| `.doc-item` | `var(--bg-card)` | `var(--md-sys-color-surface)` |
| `.reclamo-item` | `var(--bg-card)` | `var(--md-sys-color-surface)` |
| `.proveedor-card` | `var(--bg-card)` | `var(--md-sys-color-surface)` |
| `.chart-box` | `var(--bg-card)` | `var(--md-sys-color-surface-container-low)` |
| `.timeline-item` | `var(--bg-card)` | `var(--md-sys-color-surface)` |

**Test**: verificar que la jerarquía visual se mantiene sin sombras fuertes.

---

### Fase 7: Unificar body.dark y fix reset CSS

**Objetivo**: Código más mantenible.

**Archivo**: `css/base.css`

1. Mover las reglas del segundo `body.dark` (línea 162-167) al primer bloque (línea 79).
2. Simplificar reset CSS:
   ```css
   *, *::before, *::after {
     box-sizing: border-box;
   }
   /* aplicar margin/padding reset a elementos específicos */
   body, h1, h2, h3, h4, h5, h6, p, ul, ol { margin: 0; padding: 0; }
   ```
   (En vez de la lista `:not()`)

**Test**: no debe cambiar nada visual, solo estructura del código.

---

### Fase 8: Fix import @material/web

**Objetivo**: Importar solo los componentes usados.

**Archivo**: `index.html:22-26`

Reemplazar:
```js
import '@material/web/all.js';
```
Por imports individuales:
```js
import '@material/web/tabs/tabs.js';
import '@material/web/tabs/primary-tab.js';
import '@material/web/button/filled-button.js';
import '@material/web/button/filled-tonal-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import '@material/web/fab/fab.js';
import '@material/web/chips/filter-chip.js';
import '@material/web/chips/input-chip.js';
import '@material/web/chips/assist-chip.js';
import '@material/web/textfield/filled-text-field.js';
import '@material/web/textfield/outlined-text-field.js';
import '@material/web/select/filled-select.js';
import '@material/web/select/select-option.js';
import '@material/web/dialog/dialog.js';
import '@material/web/checkbox/checkbox.js';
import '@material/web/switch/switch.js';
import '@material/web/radio/radio.js';
import '@material/web/progress/linear-progress.js';
import '@material/web/progress/circular-progress.js';
import '@material/web/icon/icon.js';
```

**Test**: la app debe cargar igual, sin errores en consola.

---

### Fase 9: Transiciones M3 y motion tokens

**Objetivo**: Agregar transiciones suaves a tabs, modales, skeletons.

**Archivos**: `css/base.css`, `css/layout.css`

1. Tab content transition:
   ```css
   .tab-content {
     transition: opacity 0.2s cubic-bezier(0.2, 0, 0, 1);
   }
   .tab-content.active { opacity: 1; }
   .tab-content:not(.active) { opacity: 0; position: absolute; }
   ```

2. Dialog open transition viene de `@material/web` nativo.

3. Skeleton animation: mantener la actual, no hay equivalente M3 directo en web.

**Test**: tabs deben tener fade suave, no instantáneo.

---

### Fase 10: Accesibilidad

**Objetivo**: ARIA, focus, contraste.

1. Agregar `aria-busy="true"` en regiones con skeletons.
2. Agregar `role="region"` y `aria-label` a cada tab panel.
3. Verificar contraste de colores hardcodeados (los que ya fueron reemplazados en fases anteriores).
4. Touch targets: verificar que botones icono tengan mínimo 48x48dp (vienen por defecto en `@material/web`).

---

## Orden de ejecución propuesto

```
Fase 1  → Unificar variables (sin cambio visual)
   ↓
Fase 7  → Unificar body.dark + fix reset (refactor, sin cambio visual)
   ↓
Fase 8  → Fix imports (sin cambio visual)
   ↓
Fase 2  → Hardcoded colors en CSS
   ↓
Fase 3  → Hardcoded colors en renderers.js
   ↓
Fase 4  → Hardcoded colors en modals.js + charts.js
   ↓
Fase 5  → Typescale tokens
   ↓
Fase 6  → Elevación tonal
   ↓
Fase 9  → Transiciones
   ↓
Fase 10 → Accesibilidad
```

Cada fase se prueba individualmente en demo mode antes de pasar a la siguiente.

---

## Verificación por fase

| Fase | Test |
|------|------|
| 1 | Toggle light/dark, ver que fondos y textos no cambien |
| 2 | Cada badge, avatar, icono en light y dark |
| 3 | Cada elemento dinámico (flujo, reclamos, encuestas) en light y dark |
| 4 | Modales, confirm dialog, charts en light y dark |
| 5 | Todos los textos usan tipos de letra consistentes |
| 6 | Cards se distinguen por color de fondo, no sombra |
| 7 | Sin errores de CSS, dark mode completo |
| 8 | Consola sin errores, app carga |
| 9 | Transiciones suaves en tabs |
| 10 | Lighthouse / axe devtools sin errores críticos |
