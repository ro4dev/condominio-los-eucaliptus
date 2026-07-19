# AGENTS.md — Condominio Los Eucaliptus

## Qué es

Sistema de gestión de gastos comunes para un condominio. Frontend estático en GitHub Pages, backend en Supabase.

## Stack

- HTML + CSS + JS vanilla (sin frameworks)
- Chart.js para gráficos
- Supabase JS client para auth, database y storage
- GitHub Pages para hosting

## Estructura del código

```
index.html              # SPA completa (una sola página)
css/
  base.css              # Reset, variables CSS (light/dark), tipografía
  layout.css            # Tabs, header responsive, filtros
  components.css        # Cards, modals, chips, skeletons, botones
  sections.css          # Estilos específicos por módulo
js/
  config.js             # DEMO_MODE, toggle demo, toggle theme, variables globales
  supabase-config.js    # Credenciales Supabase (no commitear secrets)
  data.js               # Carga de datos (demo: JSON, prod: Supabase)
  renderers.js          # Renderizado de cada módulo (una función por pestaña)
  charts.js             # Gráficos Chart.js
  modals.js             # Formularios modales (una función por formulario)
  utils.js              # formatMoney, formatDate, formatPeriodo, etc.
data/                   # JSON de demo (solo modo demo)
supabase/migrations/    # Migraciones SQL
```

## Convenciones

### CSS
- Usar variables CSS (`var(--text)`, `var(--bg-card)`, etc.) para colores
- Colores de acento (azul, verde, rojo) hardcodeados están OK
- Dark mode: clase `.dark` en `<body>`, overrides en `:root` y `body.dark`
- Responsive: breakpoint en 700px

### JS
- Sin frameworks, vanilla JS
- Globales: `DEMO_MODE`, `GASTOS`, `PARCELAS`, `NOTICIAS`, etc.
- Renderers: una función `renderX()` por módulo que escribe en un contenedor por ID
- Modals: una función `formX()` que genera el HTML del modal
- Filtros: variable `xFilter` + función `filterX()` + chips con clase `.active`

### Inline styles
- En renderers.js se usan inline styles para colores dinámicos (tipos, bordes)
- Para dark mode, usar `var(--text)`, `var(--text-2)`, `var(--text-muted)` en inline styles

## Modo Demo vs Producción

- `DEMO_MODE = true`: carga JSON de `data/`, no toca Supabase
- `DEMO_MODE = false`: carga de Supabase, formularios envían a DB
- Toggle: botón "Salir de modo demo" / "Ir a modo demo" en header
- **NUNCA** romper funcionalidad de producción al editar demo

## Modo Dark/Light

- Toggle: botón ☀️/🌙 en header
- Persistencia: `localStorage('theme')`
- Variables CSS en `css/base.css`: `:root` (light) y `body.dark` (dark)
- Colores clave: `--bg`, `--bg-card`, `--text`, `--text-2`, `--text-muted`, `--border`, `--border-light`, `--surface-hover`, `--skeleton-1`, `--skeleton-2`

## Módulos y sus chips de filtro

| Módulo | Filtros |
|--------|---------|
| Gastos | Periodo, Parcela (selects) |
| Noticias | Toggle "Ver anteriores" |
| Ingresos/Egresos | Todos / Ingresos / Egresos |
| Documentos | Todos / Estatuto / Actas / Contratos / Seguros / Planos |
| Reclamos | Todos / Reclamos / Sugerencias |
| Asambleas | Todos / Ordinarias / Extraordinarias |

## Reglas importantes

- **NO ejecutar `git commit`** salvo pedido explícito del usuario
- **NO tocar `js/supabase-config.js`** (credenciales)
- **NO romper modo producción** al editar archivos de demo
- **Actualizar `CHANGELOG.md` y `README.md`** cuando corresponda (nuevas features, fixes relevantes, cambios de UX)
- Fechas en JSON de demo: formato ISO `YYYY-MM-DD`
- Supabase: `created_at` se genera solo, no enviar en inserts
- El usuario testea en iPhone 12 Mini — mobile first

## Cómo probar

1. Abrir `index.html` en browser (modo demo por defecto)
2. Cambiar pestañas, probar filtros, modales, dark mode
3. Para prostrar prod: toggle "Ir a modo demo" (requiere Supabase configurado)
