# Publicaciones de Venta de Productos/Servicios (idea)

> **Estado**: Idea / backlog — sin implementar. A revisar.

## 1. Descripción general

Sección para que los vecinos publiquen ventas de productos o servicios dentro del condominio (ej: muebles en venta, clases particulares, flete, etc.). Cada publicación sería un post con título, descripción, foto opcional y datos de contacto del publicador.

## 2. Decisión pendiente: ¿pestaña propia o categoría en Comentarios?

### Opción A — Pestaña propia (ej. "Ventas" / "Anuncios")
- **Pros**: Enfoque claro del módulo; filtros dedicados (categoría: Productos/Servicios); lugar visible en la barra de navegación; no contamina el feed de Comentarios.
- **Contras**: Una pestaña más en un navbar que ya tiene muchos módulos; más código/UI nueva de cero.

### Opción B — Categoría dentro de Comentarios (reclamos.json o tabla nueva tipo "anuncios")
- **Pros**: Cero pestañas nuevas; reutiliza el patrón de chips de filtro existente (como Reclamos/Sugerencias); menos código y mantenimiento.
- **Contras**: Mezcla "comentarios/comunicación" con "transacciones"; el chip de filtro de categoría quedaría más recargado; el contexto de compra/venta se pierde.

### Opción C (híbrida) — Pestaña propia que reutiliza componentes
- Reutilizar el patrón de Comentarios (card + chips + modal) pero con schema y contenedor propios. Misma experiencia, pestaña dedicada.

## 3. Preguntas abiertas

- ¿Quién puede publicar? (cualquier usuario autenticado, como Comentarios, o solo admin)
- ¿Se necesita foto? → subida a Supabase Storage
- ¿Cómo contactar al vendedor? (teléfono, email, mensaje interno)
- ¿El post expira o se marca como "Vendido"?
- ¿Filtros por categoría (Producto / Servicio) y por estado (Disponible / Vendido)?
- ¿Notificar a los vecinos al publicar algo nuevo?

## 4. Alcance aproximado si se implementa

- Tabla nueva (ej. `publicaciones`) con `titulo`, `descripcion`, `categoria`, `precio?`, `contacto`, `parcela_id`, `estado`, `created_at`
- Mock data en `data/` para demo
- Renderer + modal (patrón de `renderEncuestas`/`renderReclamos`)
- Supabase migration + RLS

## 5. Referencias de patrones existentes

- Comentarios: `docs/features/reclamos.md` — patrón de chips y permisos (cualquier user autenticado)
- Fotos: `docs/features/file-upload.md` — subida a Storage
- Tabs: `index.html` — cómo se agrega una pestaña nueva
