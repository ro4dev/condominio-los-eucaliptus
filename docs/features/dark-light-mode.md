# Modo Dark/Light

## Qué es
Toggle de tema oscuro/claro con persistencia.

## Implementación
- Clase `.dark` en `<body>`
- Variables CSS en `css/base.css`
- Persistencia en `localStorage('theme')`

## Variables CSS
| Variable | Light | Dark |
|----------|-------|------|
| `--bg` | #f9fafb | #111827 |
| `--bg-card` | #ffffff | #1f2937 |
| `--text` | #111827 | #f9fafb |
| `--text-2` | #374151 | #d1d5db |
| `--text-muted` | #6b7280 | #9ca3af |
| `--border` | #e5e7eb | #374151 |
| `--border-light` | #f3f4f6 | #4b5563 |
| `--surface-hover` | #f3f4f6 | #374151 |

## Cómo funciona
1. Botón ☀️/🌙 en header
2. Al hacer click, alterna clase `.dark` en body
3. Guarda preferencia en localStorage
4. Al cargar página, lee localStorage y aplica tema

## Inline styles
En renderers.js se usan variables CSS para colores dinámicos:
- `var(--text)` para texto principal
- `var(--text-2)` para texto secundario
- `var(--text-muted)` para texto deshabilitado

## Propósito
UX cómoda según preferencia del usuario, con persistencia entre sesiones.
