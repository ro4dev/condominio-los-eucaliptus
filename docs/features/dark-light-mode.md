# Modo Dark/Light

## Descripción general

Toggle de tema oscuro/claro con persistencia en localStorage. Se adapta automáticamente a las variables CSS de Material Design 3 y actualiza los gráficos de Chart.js.

## Implementación

### Toggle
```js
var isDark = localStorage.getItem('theme') === 'dark';
if (isDark) document.body.classList.add('dark');

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  // actualiza icono del botón ☀️/🌙
  document.getElementById('themeToggle').querySelector('md-icon').textContent = isDark ? 'light_mode' : 'dark_mode';
  // actualiza colores de charts
  if (typeof updateChartTheme === 'function') updateChartTheme();
}
```

### Persistencia
- `localStorage.getItem('theme')` al cargar la página
- Si es `'dark'`: agrega clase `.dark` al body
- Si no existe o es `'light'`: tema claro (default)

### Toggle en menú de usuario
El toggle de tema ya no es un botón en el header: vive dentro del menú de usuario (`#userMenu`), como un `md-menu-item` (`#menuTheme`):
```html
<md-menu-item id="menuTheme" onclick="toggleTheme()">
  <md-icon slot="start">dark_mode</md-icon>
  <div slot="headline">Modo oscuro</div>
</md-menu-item>
```
- Ícono: `dark_mode` en modo light (para cambiar a dark)
- Ícono: `light_mode` en modo dark (para cambiar a light)
- Los labels/íconos se actualizan con `updateThemeMenu()` (js/config.js), que setea el headline y el ícono de `#menuTheme` según `isDark`.
- El ícono del botón del menú (`#userMenuButton`) usa `--md-sys-color-on-surface-variant`, con state layers de hover/pressed en `on-surface` (css/base.css):

```css
header md-icon-button#userMenuButton {
  --md-icon-button-icon-color: var(--md-sys-color-on-surface-variant);
  --md-icon-button-hover-state-layer-color: var(--md-sys-color-on-surface);
  --md-icon-button-pressed-state-layer-color: var(--md-sys-color-on-surface);
}
```

## Variables CSS

### `:root` (light)
```css
:root {
  --bg: #f9fafb;
  --bg-card: #ffffff;
  --text: #111827;
  --text-2: #374151;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --border-light: #f3f4f6;
  --surface-hover: #f3f4f6;
}
```

### `body.dark` (dark)
```css
body.dark {
  --bg: #111827;
  --bg-card: #1f2937;
  --text: #f9fafb;
  --text-2: #d1d5db;
  --text-muted: #9ca3af;
  --border: #374151;
  --border-light: #4b5563;
  --surface-hover: #374151;
}
```

### Otras variables afectadas
Las variables de Material Web Components (`--md-sys-color-*`) también se actualizan mediante el atributo `theme` en el HTML. El dark mode aplica un theme oscuro de Material 3.

### Colores fijos (no cambian con tema)
- `--color-positive: #22c55e` (verde, ingresos)
- `--color-positive-bg: rgba(34, 197, 94, 0.1)`
- `--md-sys-color-error: #b91c1c` (rojo, egresos)
- `--color-extraordinaria-bg` / `--color-extraordinaria-text` (asambleas)

## Uso en inline styles
En `renderers.js` se usan variables CSS para colores dinámicos en los templates HTML:
```js
'<div style="color:var(--text)">...</div>'
'<div style="color:var(--text-2)">...</div>'
'<div style="color:var(--text-muted)">...</div>'
'<div style="background:var(--skeleton-1)">...</div>'
```

## Charts
La función `updateChartTheme()` se ejecuta al togglear el tema. Los gráficos actuales son `chartRecaudado` (Recaudado vs Esperado, Finanzas) y `chartFlujo` (Ingresos vs Egresos, Finanzas):
```js
function updateChartTheme() {
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  // chartRecaudado: recalculan colores de escalas y líneas
  // chartFlujo: color de líneas según --color-positive (ingresos) y --md-sys-color-error (egresos)
  // si (chartRecaudado) chartRecaudado.update();
  // si (chartFlujo) chartFlujo.update();
}
```
El gráfico "Monto por parcela" (`chartParcelas`/`renderParcelaChart`) y `chartPeriodos` fueron **eliminados** con el rediseño de Finanzas.

`getCSS()` obtiene el valor actual de una variable CSS:
```js
function getCSS(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}
```

## Material Web Components
Los componentes de Material Web (`<md-filled-button>`, `<md-select>`, etc.) usan su propio sistema de theming via CSS custom properties. El dark mode se aplica automáticamente al cambiar la clase del body porque los componentes referencian `--md-sys-color-*` que se actualizan con el theme.

## Propósito
Mejorar la experiencia del usuario permitiendo elegir entre tema claro y oscuro según preferencia personal o condiciones de iluminación, con persistencia entre sesiones.
