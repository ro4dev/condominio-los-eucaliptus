# Noticias pinnables en Home

## 1. Descripción general

Las noticias del módulo Noticias pueden ser "pinnadas" por el admin para que aparezcan destacadas en la pestaña Home. Esto permite comunicar avisos importantes (cortes de agua, recordatorios de pago, etc.) sin que el residente tenga que ir a la pestaña Noticias.

**Estado**: Implementado (08/2026).

## 2. Comportamiento

- El admin puede pinnear/despinear una noticia desde la lista de Noticias (ícono de pin) o desde el form de edición (toggle)
- Solo noticias **vigentes** pueden ser pinneadas (una noticia vencida pinneada no se muestra en Home)
- En Home se muestra una card "Noticias destacadas" con las noticias pinneadas, debajo de las stat cards y antes del aviso de aumento
- Si no hay noticias pinneadas, la card no se muestra (no mostrar empty state)
- Máximo visible en Home: 3 noticias pinneadas (las más recientes); en Noticias se puede pinnear más, pero Home muestra solo las 3 más nuevas
- Click en una noticia pinneada en Home → sin acción (solo informativo)

## 3. Schema SQL

```sql
ALTER TABLE noticias ADD COLUMN pinned BOOLEAN DEFAULT false;
```

Migración: `supabase/migrations/008_noticias_pinned.sql`

## 4. Mock data (data/noticias.json)

Campo `pinned` agregado a registros existentes. Solo 2 noticias vigentes tienen `pinned: true`:
- "Nueva seguridad nocturna"
- "Pintura de fachadas aprobada"

## 5. HTML en Home (index.html)

Contenedor `#homePinnedNews` entre `#homeStats` y `#homeAviso`:

```html
<div id="homePinnedNews" class="card" style="display:none;margin-bottom:1rem">
  <h4>Noticias destacadas</h4>
  <div id="homePinnedNewsList"></div>
</div>
```

## 6. JS Functions

### 6.1 renderPinnedNews()

Filtra `NOTICIAS` por `pinned === true` y `fecha_hasta >= hoy`, ordena por fecha desc, toma max 3. Renderiza cards `.home-pinned-card` con título y preview de descripción.

### 6.2 togglePinned(id)

Función admin para cambiar el estado `pinned` de una noticia. En prod: `supabase.from('noticias').update({ pinned: ... }).eq('id', id)`.

### 6.3 Integración en renderHome()

`renderPinnedNews()` se llama al final de `renderHome()`, junto con `renderMorosos()` y `renderAvisoAumento()`.

## 7. UI en pestaña Noticias

### 7.1 Ícono de pin en la card

En `renderNoticiaCard()`, ícono `push_pin` admin-only entre el título y la fecha:
- Pin activo: color primario
- Pin inactivo: `--text-muted`

### 7.2 Switch en form de edición

Admin-only: `md-switch` "Destacar en Home" + hidden input `name="pinned"`. Patrón idéntico a `gastoPagado` en `formGastos`.

## 8. CSS

```css
.home-pinned-card { padding: 0.6rem 0; border-bottom: 1px solid var(--divider); }
.home-pinned-card:last-child { border-bottom: none; }
```

## 9. Orden de secciones en Home

```
1. Stat cards (Esperado, Recaudado, Egresos, Morosos)
2. Noticias pinneadas (si las hay)
3. Aviso de aumento (si aplica)
4. Barra de recaudación + Cómo pagar
5. Parcelas morosas
```

## 10. Reglas de negocio

- Solo admin puede pinnear/despinear
- Solo noticias vigentes se muestran en Home (una pinneada vencida se oculta automáticamente)
- Máximo 3 noticias visibles en Home (las más recientes)
- Si no hay pinneadas, la card no se renderiza (display: none)
- El contenido completo de la noticia se ve en la pestaña Noticias; Home muestra título + preview (1 línea)

## 11. Checklist de implementación

- [x] Migración SQL: `008_noticias_pinned.sql`
- [x] Actualizar `renderHome()` para incluir `renderPinnedNews()`
- [x] Agregar `renderPinnedNews()` en renderers.js
- [x] Agregar `togglePinned()` en renderers.js
- [x] Actualizar `renderNoticiaCard()` con ícono de pin (admin-only)
- [x] Agregar HTML contenedor en index.html (sección Home)
- [x] Agregar CSS `.home-pinned-card` en sections.css
- [x] Actualizar data/noticias.json con campo `pinned`
- [x] Switch en formNoticias() + syncNoticiaPinned() + parseo en handleForm()
- [x] Agregar NOTICIAS al load del home en data.js
- [x] Actualizar docs
