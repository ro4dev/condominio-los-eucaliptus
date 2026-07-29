# Auditoría Material M3

## Findings

Ver [conversación con opencode](https://github.com/anomalyco/opencode) para el análisis detallado.

### ❌ Bloqueantes

| # | Issue | Archivo |
|---|-------|---------|
| 1 | Faltan 11 de 15 tokens typescale | `css/base.css` |
| 2 | Faltan `--md-sys-elevation-level{0-5}` | `css/base.css` |
| 3 | Falta `--md-sys-color-surface-tint` | `css/base.css` |
| 4 | Shape tokens definidos pero no usados (todo hardcodeado) | `css/*.css` |
| 5 | Selector duplicado `md-filled-text-field` x2, falta `md-outlined-text-field` | `css/base.css:106-107` |
| 6 | Dos bloques `body.dark` separados (código duplicado) | `css/base.css:55,131` |
| 7 | Header colores hardcodeados, no usa tokens M3 | `css/base.css:147-148` |
| 8 | `#userInfo` color hardcodeado en inline style | `index.html:41` |
| 9 | Filter chips ocultan checkmark (pierden affordance selected) | `css/base.css:137-145` |
| 10 | Reset CSS frágil (lista manual de tags, cualquier md-\* nuevo se rompe) | `css/base.css:1` |
| 11 | Sombras no-M3 (`0 1px 3px` en vez de elevation tokens) | `css/components.css`, `sections.css` |

### ⚠️ Observaciones

- Snackbar custom usa `--md-sys-color-inverse-surface/on-surface` → bien
- Inline styles en config page (`style="..."`) no usan variables CSS
- Cards/skeletons con border-radius y sombras hardcodeadas

---

## Plan de corrección

### Fase 1: Tokens faltantes en `css/base.css`

1. Agregar todos los typescale tokens faltantes:
   `display-{large,medium,small}`, `headline-{large,medium}`, `title-{large,medium,small}`, `body-{large,small}`, `label-small`

2. Agregar elevation tokens:
   ```css
   --md-sys-elevation-level0: 0px 0px 0px 0px rgba(0,0,0,0);
   --md-sys-elevation-level1: 0px 1px 3px 0px rgba(0,0,0,0.3), 0px 1px 2px 0px rgba(0,0,0,0.15);
   --md-sys-elevation-level2: 0px 1px 5px 0px rgba(0,0,0,0.3), 0px 2px 2px 0px rgba(0,0,0,0.15);
   --md-sys-elevation-level3: 0px 1px 8px 0px rgba(0,0,0,0.3), 0px 3px 4px 0px rgba(0,0,0,0.15);
   --md-sys-elevation-level4: 0px 1px 10px 0px rgba(0,0,0,0.3), 0px 4px 5px 0px rgba(0,0,0,0.15);
   --md-sys-elevation-level5: 0px 1px 12px 0px rgba(0,0,0,0.3), 0px 5px 6px 0px rgba(0,0,0,0.15);
   ```

3. Agregar `--md-sys-color-surface-tint: var(--md-sys-color-primary)` en light y dark.

4. Corregir selector duplicado (cambiar segunda línea a `md-outlined-text-field`).

5. Unificar los dos bloques `body.dark` en uno solo.

### Fase 2: Shape tokens en `css/components.css` y `sections.css`

Reemplazar todos los `border-radius` hardcodeados:

| Valor actual | Token M3 |
|-------------|----------|
| `border-radius: 10px` (cards, tabla) | `var(--md-sys-shape-corner-medium)` → 12px |
| `border-radius: 12px` (header) | `var(--md-sys-shape-corner-large)` → 16px |
| `border-radius: 8px` (skeleton, doc-icon) | `var(--md-sys-shape-corner-small)` → 8px |
| `border-radius: 999px` (chips, badges) | `var(--md-sys-shape-corner-full)` → 9999px |

### Fase 3: Sombras con elevation tokens

Reemplazar `box-shadow: 0 1px 3px rgba(...)` por `var(--md-sys-elevation-level1)`.

### Fase 4: Header con tokens M3

Reemplazar colores hardcodeados del header:
```css
header {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}
```

### Fase 5: Inline styles → variables CSS

- `#userInfo` color → `var(--text-2)` o `var(--md-sys-color-on-surface-variant)`
- Revisar otros inline styles en `index.html`

### Fase 6: Reset CSS robusto

Reemplazar la giant `:not()` list por un enfoque más mantenible, ej:
```css
*:not([class*="md-"]):not([id*="md-"]) {
  margin: 0; padding: 0; box-sizing: border-box;
}
```
O usar `:where()` para zero-specificity reset.

### Fase 7: Filter chips — evaluar si restaurar checkmark

Decidir si se quiere el affordance visual de M3 (checkmark en selected) o mantener el diseño actual sin icono.

---

## Verificación

| Test | Cómo |
|------|------|
| Typescale | Inspeccionar cualquier texto con clase `md-typescale-*` |
| Elevation | Verificar sombras en cards, dialog, stat-cards |
| Shape | Medir border-radius de cards, dialog, chips |
| Dark mode | Toggle dark, verificar que botones/inputs usen colores correctos |
| Dialog date field | Abrir form con date input, debe medir 56px |
| Header dark mode | El header debe adaptarse en dark |
| Chips selected | Al seleccionar chip, debe verse diferente |
| No regresiones | Cargar demo mode, ver todas las tabs, abrir modales |
