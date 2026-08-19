# Noticias pinneables en Home

## 1. Descripción general

Las noticias del módulo Noticias pueden ser "pinneadas" por el admin para que aparezcan destacadas en la pestaña Home. Esto permite comunicar avisos importantes (cortes de agua, recordatorios de pago, etc.) sin que el residente tenga que ir a la pestaña Noticias.

**Alcance**: solo diseño del feature (`.md`). Implementación pendiente.

## 2. Comportamiento

- El admin puede pinneear/despinneear una noticia desde la lista de Noticias (ícono de pin) o desde el form de edición (toggle/chip)
- Solo noticias **vigentes** pueden ser pinneeadas (una noticia vencida pinneada no se muestra en Home)
- En Home se muestra una card "Avisos destacados" (o similar) con las noticias pinneeadas, debajo de las stat cards y antes de la barra de recaudación
- Si no hay noticias pinneeadas, la card no se muestra (no mostrar empty state)
- Máximo visible en Home: 3 noticias pinneeadas (las más recientes); en Noticias se puede pinneear más, pero Home muestra solo las 3 más nuevas
- Click en una noticia pinneada en Home → abre el detalle completo (modal o scroll a la noticia en la pestaña Noticias)

## 3. Schema SQL (nueva migración)

```sql
ALTER TABLE noticias ADD COLUMN pinneada BOOLEAN DEFAULT false;
```

Solo esto. No necesita índice adicional (las queries de Home filtran por `pinneada = true` y `fecha_hasta >= hoy`, el volumen es bajo).

## 4. Mock data (data/noticias.json)

Agregar `pinneada` a los registros existentes:

```json
{
  "id": "n1",
  "titulo": "Corte de agua programado",
  "pinneada": true,
  ...
}
```

## 5. HTML en Home (index.html)

Nueva sección en `#tab-home`, después de `#homeStats` y antes de `#homeAviso`:

```html
<div id="homeNoticiasPinneadas" class="card" style="display:none">
  <h4>Avisos destacados</h4>
  <div id="homeNoticiasPinneadasList"></div>
</div>
```

## 6. JS Functions

### 6.1 renderHomeNoticiasPinneadas()

```js
function renderHomeNoticiasPinneadas() {
  var el = document.getElementById('homeNoticiasPinneadas');
  var list = document.getElementById('homeNoticiasPinneadasList');
  if (!el || !list) return;

  var hoy = new Date();
  var hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

  var pinneadas = NOTICIAS.filter(function(n) {
    if (!n.pinneada) return false;
    if (n.fecha_hasta && n.fecha_hasta < hoyStr) return false;
    return true;
  });

  pinneadas.sort(function(a, b) {
    return new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at);
  });

  if (!pinneadas.length) {
    el.style.display = 'none';
    return;
  }

  el.style.display = '';
  list.innerHTML = pinneadas.slice(0, 3).map(function(n) {
    return '<div class="noticia-pinneada" style="padding:0.6rem 0;border-bottom:1px solid var(--border-light);cursor:pointer" onclick="verNoticiaPinneada(\'' + n.id + '\')">' +
      '<div style="font-weight:600;color:var(--text)">' + escHtml(n.titulo) + '</div>' +
      '<div style="font-size:0.8rem;color:var(--text-2);margin-top:0.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escHtml(n.descripcion) + '</div>' +
    '</div>';
  }).join('');
}
```

### 6.2 togglePinneearNoticia(id)

Función admin para cambiar el estado `pinneada` de una noticia:

```js
function togglePinneearNoticia(id) {
  var noticia = NOTICIAS.find(function(n) { return n.id === id; });
  if (!noticia) return;
  noticia.pinneada = !noticia.pinneada;
  // En prod: UPDATE noticias SET pinneada = !pinneada WHERE id = id
  renderNoticias();
  renderHomeNoticiasPinneadas();
}
```

### 6.3 Integración en renderHome()

Agregar llamada a `renderHomeNoticiasPinneadas()` al final de `renderHome()`.

## 7. UI en pestaña Noticias

### 7.1 Ícono de pin en la card

En `renderNoticiaCard()`, agregar un ícono de pin (admin-only) al lado del título:

```js
// Admin: ícono de pin para toggle
n.pinneada
  ? '<md-icon-button onclick="togglePinneearNoticia(\'' + n.id + '\')" title="Despinneear"><md-icon>push_pin</md-icon></md-icon-button>'
  : '<md-icon-button onclick="togglePinneearNoticia(\'' + n.id + '\')" title="Pinneear en Home"><md-icon style="color:var(--text-muted)">push_pin</md-icon></md-icon-button>'
```

El ícono se muestra en color primario cuando está pinneada, `--text-muted` cuando no.

### 7.2 Chip visual (alternativa al ícono)

O usar un chip/small badge en la card: "Pinneada" (admin-only), que al hacer click la despinneea.

## 8. CSS

```css
.noticia-pinneada:hover {
  background: var(--surface-hover);
  border-radius: var(--md-sys-shape-corner-small);
}
```

## 9. Orden de secciones en Home

```
1. Stat cards (Esperado, Recaudado, Egresos, Morosos)
2. Aviso de aumento (si aplica)
3. Noticias pinneadas (si las hay)  ← NUEVO
4. Barra de recaudación
5. Parcelas morosas
6. Cómo pagar
```

## 10. Reglas de negocio

- Solo admin puede pinneear/despinneear
- Solo noticias vigentes se muestran en Home (una pinneada vencida se oculta automáticamente)
- Máximo 3 noticias visibles en Home (las más recientes)
- Si no hay pinneadas, la card no se renderiza (display: none)
- El contenido completo de la noticia se ve en la pestaña Noticias; Home muestra título + preview (1 línea)

## 11. Pendiente para implementación

- [ ] Migración SQL: `ALTER TABLE noticias ADD COLUMN pinneada BOOLEAN DEFAULT false;`
- [ ] Actualizar `renderHome()` para incluir `renderHomeNoticiasPinneadas()`
- [ ] Agregar `renderHomeNoticiasPinneadas()` en renderers.js
- [ ] Agregar `togglePinneearNoticia()` en renderers.js
- [ ] Actualizar `renderNoticiaCard()` con ícono de pin (admin-only)
- [ ] Agregar HTML contenedor en index.html (sección Home)
- [ ] Agregar CSS `.noticia-pinneada` en sections.css
- [ ] Actualizar data/demo/data/noticias.json con campo `pinneada`
- [ ] Actualizar docs: home.md, noticias.md
