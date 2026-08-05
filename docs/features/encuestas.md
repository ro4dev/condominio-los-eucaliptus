# Encuestas

## 1. Descripción general

Sistema de votación para propuestas del condominio. Soporta modo simple ("A favor" / "En contra") y modo alternativas personalizadas. Control de voto único por parcela (UNIQUE constraint), quorum opcional, fecha de cierre automática, y resultados visuales con barras de progreso.

ID del tab: `encuestas`
Contenedor: `<div id="tab-encuestas">`

## 2. Schema SQL

```sql
CREATE TABLE encuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  alternativas JSONB DEFAULT '[]'::jsonb,    -- array de strings
  fecha_termino DATE,                        -- NULL = sin cierre
  quorum INTEGER,                            -- NULL = sin quorum
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE encuestas_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id UUID REFERENCES encuestas(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  seleccion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(encuesta_id, parcela_id)            -- un voto por parcela
);
```

## 3. DDL exacto de las tablas (migración 001_tables.sql)

```sql
CREATE TABLE encuestas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  alternativas JSONB DEFAULT '[]'::jsonb,
  fecha_termino DATE,
  quorum INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE encuestas_votos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id UUID REFERENCES encuestas(id) ON DELETE CASCADE,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  seleccion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(encuesta_id, parcela_id)
);
```

## 4. Mock data (data/encuestas.json)

```json
[
  {
    "id": "e1",
    "titulo": "Aprobación fondo de reserva 2026",
    "descripcion": "Se propone aumentar el fondo de reserva de $15.000 a $20.000 mensuales a partir de abril 2026.",
    "alternativas": [],
    "fecha_termino": "2026-04-15",
    "quorum": 10,
    "created_at": "2026-03-01T12:00:00Z"
  },
  {
    "id": "e2",
    "titulo": "¿Qué mejora priorizamos?",
    "descripcion": "Votación para decidir la próxima mejora del condominio.",
    "alternativas": ["Jardín", "Estacionamiento", "Seguridad perimetral", "Pintura fachada"],
    "fecha_termino": "2026-05-01",
    "quorum": 8,
    "created_at": "2026-03-15T12:00:00Z"
  }
]
```

### Mock data (data/encuestas_votos.json)

```json
[
  {
    "id": "v1",
    "encuesta_id": "e1",
    "parcela_id": "p1",
    "seleccion": "A favor",
    "created_at": "2026-03-02T10:00:00Z"
  },
  {
    "id": "v2",
    "encuesta_id": "e1",
    "parcela_id": "p2",
    "seleccion": "En contra",
    "created_at": "2026-03-03T15:00:00Z"
  }
]
```

## 5. HTML structure (index.html lines 214-226)

```html
<div id="tab-encuestas" class="tab-content" role="region" aria-label="Encuestas">
  <!-- Botón admin -->
  <md-filled-button class="admin-only" id="formEncuestas" onclick="formEncuestas()">
    <md-icon slot="icon">add</md-icon>Nueva Encuesta
  </md-filled-button>

  <!-- Filtros -->
  <div class="filter-chips" id="encuestasChips">
    <md-filter-chip label="Abiertas" selected onclick="filterEncuestas('Abiertas')"></md-filter-chip>
    <md-filter-chip label="Cerradas" onclick="filterEncuestas('Cerradas')"></md-filter-chip>
    <md-filter-chip label="Todas" onclick="filterEncuestas('Todos')"></md-filter-chip>
  </div>

  <!-- Lista de encuestas -->
  <div id="encuestasList">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
  </div>
</div>
```

## 6. Global state

```js
var ENCUESTAS = [];        // en config.js
var ENCUESTAS_VOTOS = [];  // en config.js
var PROPIETARIOS = [];     // para vincular voto por email
var encuestasFilter = 'Abiertas';  // default
```

## 7. Tab data loading (data.js:53)

```js
encuestas: function() {
  return Promise.all([
    loadJson('ENCUESTAS'),
    loadJson('ENCUESTAS_VOTOS'),
    loadJson('PARCELAS')     // para renderizar nombres de parcela
  ]).then(function() { renderEncuestas(); });
}
```

## 8. JS Functions

### 8.1 getOpciones(encuesta)

```js
function getOpciones(encuesta) {
  var alt = encuesta.alternativas;
  if (!alt || !alt.length || (alt.length === 1 && alt[0] === '')) {
    return ['A favor', 'En contra'];
  }
  return alt;
}
```

Casos que produce modo simple:
- `undefined` → `['A favor', 'En contra']`
- `[]` → `['A favor', 'En contra']`
- `['']` → `['A favor', 'En contra']`
- Cualquier otro array → se usa tal cual

### 8.2 filterEncuestas(filtro)

```js
function filterEncuestas(filtro) {
  encuestasFilter = filtro;
  document.querySelectorAll('#encuestasChips md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderEncuestas();
}
```

### 8.3 renderEncuestas()

**Propósito**: Renderiza todas las encuestas con sus votos, barras de progreso y opciones de voto.

**Flujo completo**:

```
1. ahora = new Date()
2. Por cada encuesta en ENCUESTAS:
   a. votos = ENCUESTAS_VOTOS filtrados por encuesta_id
   b. opciones = getOpciones(encuesta)
   c. conteo = {opcion: 0} para cada opción
   d. Por cada voto: conteo[v.seleccion]++
   e. total = votos.length
   f. Determinar cerrada:
      - Si fecha_termino existe:
        - Parsear fecha, set hora a 23:59:59
        - cerrada = ahora > fecha_termino
      - Si no existe fecha_termino: cerrada = false
   g. Determinar miVoto (si currentUser):
      - Buscar PROPIETARIOS donde prop.email === currentUser.email
      - Si existe: buscar voto donde v.parcela_id === prop.parcela_id
      - miVoto = voto encontrado (o null)
3. Aplicar filtro:
   - 'Abiertas': data = data.filter(!d.cerrada)
   - 'Cerradas': data = data.filter(d.cerrada)
   - 'Todos': sin filtrar
4. Ordenar por created_at descendente
5. Si data.length === 0: mensaje "No hay encuestas para mostrar."
6. Renderizar cada encuesta:
   a. Badge estado (Abierta/Cerrada)
   b. Título + fecha
   c. Descripción (si existe)
   d. Info extra (tiempo restante o fecha término)
   e. Quorum (si configurado)
   f. Opciones con barra de progreso y botón Votar
   g. Mensaje "Ya votaste" (si aplica)
   h. Total de votos
```

**Código exacto** (renderEncuestas completo, 130 líneas):

```js
function renderEncuestas() {
  var container = document.getElementById('encuestasList');
  var ahora = new Date();

  var data = ENCUESTAS.map(function(e) {
    var votos = ENCUESTAS_VOTOS.filter(function(v) { return v.encuesta_id === e.id; });
    var opciones = getOpciones(e);
    var conteo = {};
    opciones.forEach(function(op) { conteo[op] = 0; });
    votos.forEach(function(v) {
      if (conteo[v.seleccion] !== undefined) conteo[v.seleccion]++;
    });
    var total = votos.length;
    var cerrada = false;
    if (e.fecha_termino) {
      var f = e.fecha_termino.split('T')[0].split('-');
      var fin = new Date(+f[0], +f[1] - 1, +f[2], 23, 59, 59);
      cerrada = ahora > fin;
    }
    var miVoto = null;
    if (currentUser) {
      var miPropietario = (typeof PROPIETARIOS !== 'undefined') ? PROPIETARIOS.find(function(p) { return p.email === currentUser.email; }) : null;
      if (miPropietario) {
        miVoto = votos.find(function(v) { return v.parcela_id === miPropietario.parcela_id; });
      }
    }
    return { encuesta: e, opciones: opciones, conteo: conteo, total: total, cerrada: cerrada, miVoto: miVoto };
  });

  if (encuestasFilter === 'Abiertas') { data = data.filter(function(d) { return !d.cerrada; }); }
  if (encuestasFilter === 'Cerradas') { data = data.filter(function(d) { return d.cerrada; }); }
  data.sort(function(a, b) { return new Date(b.encuesta.created_at) - new Date(a.encuesta.created_at); });

  if (!data.length) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No hay encuestas para mostrar.</p>';
    return;
  }

  var colores = ['#22c55e', '#3b82f6', '#f59e0b', '#b91c1c', '#8b5cf6', '#ec4899'];

  container.innerHTML = data.map(function(d) {
    var e = d.encuesta;
    var quorumAlcanzado = e.quorum ? d.total >= e.quorum : true;
    var estadoBg = d.cerrada ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-tertiary-container)';
    var estadoText = d.cerrada ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-tertiary-container)';

    var infoExtra = '';
    if (e.fecha_termino) {
      var remaining = getTimeRemaining(e.fecha_termino);
      if (remaining && !d.cerrada) { infoExtra = 'Termina en: ' + remaining; }
      else if (d.cerrada) { infoExtra = 'Terminada: ' + formatDate(e.fecha_termino); }
      else { infoExtra = 'Termina: ' + formatDate(e.fecha_termino); }
    }

    var fechaPub = formatDate(e.fecha || e.created_at);

    var quorumHtml = '';
    if (e.quorum) {
      quorumHtml = '<span style="font-size:0.8rem;color:' + (quorumAlcanzado ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)') + '">Quorum: ' + d.total + '/' + e.quorum + (quorumAlcanzado ? ' ✓' : '') + '</span>';
    }

    var opcionesHtml = d.opciones.map(function(op, i) {
      var count = d.conteo[op];
      var pct = d.total > 0 ? Math.round((count / d.total) * 100) : 0;
      var color = colores[i % colores.length];
      var esMiVoto = d.miVoto && d.miVoto.seleccion === op;
      var barra = '<div style="display:flex;height:6px;border-radius:var(--md-sys-shape-corner-extra-small);overflow:hidden;margin:0.3rem 0;background:var(--skeleton-1)">'
        + '<div style="width:' + pct + '%;background:' + color + ';transition:width 0.3s"></div></div>';
      var boton = '';
      if (!d.cerrada && currentUser && !d.miVoto) {
        boton = ' <md-filled-button onclick="votarEncuesta(\'' + e.id + '\', \'' + op.replace(/'/g, "\\'") + '\')" style="font-size:0.75rem;padding:0.2rem 0.6rem;--md-filled-button-container-color:' + color + '">Votar</md-filled-button>';
      }
      return '<div style="margin-bottom:0.4rem;' + (esMiVoto ? 'background:var(--skeleton-1);padding:0.3rem 0.5rem;border-radius:var(--md-sys-shape-corner-extra-small);' : '') + '">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem">'
          + '<span' + (esMiVoto ? ' style="font-weight:600"' : '') + '>' + op + (esMiVoto ? ' ✓' : '') + '</span>'
          + '<span style="color:var(--text-muted)">' + count + ' (' + pct + '%)' + boton + '</span>'
        + '</div>'
        + barra
      + '</div>';
    }).join('');

    var accion = '';
    if (d.miVoto) { accion = '<div style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-muted)">Ya votaste</div>'; }

    return '<div class="flujo-card' + (d.cerrada ? ' cerrada' : '') + '">'
      + (d.cerrada ? '<div class="watermark">TERMINADA</div>' : '')
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">'
        + '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:' + estadoBg + ';color:' + estadoText + '">' + (d.cerrada ? 'Cerrada' : 'Abierta') + '</span>'
        + '<div style="display:flex;gap:0.3rem;align-items:center">'
          + '<span style="font-size:0.8rem;color:var(--text-muted)">' + fechaPub + '</span>'
          + adminActions("editEncuesta('" + e.id + "')", "deleteEncuesta('" + e.id + "')")
        + '</div>'
      + '</div>'
      + '<div style="font-size:1rem;font-weight:600;margin-bottom:0.3rem;color:var(--text)">' + e.titulo + '</div>'
      + (e.descripcion ? '<div style="font-size:0.85rem;color:var(--text-2);margin-bottom:0.4rem">' + nl2br(e.descripcion) + '</div>' : '')
      + (infoExtra || quorumHtml ? '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--text-muted);margin-bottom:0.3rem"><span>' + (infoExtra || '') + '</span>' + quorumHtml + '</div>' : '')
      + opcionesHtml + accion
      + '<div style="text-align:right;font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem">Total: ' + d.total + ' votos</div>'
    + '</div>';
  }).join('');
}
```

### 8.4 votarEncuesta(encuestaId, seleccion)

**Propósito**: Registrar un voto para la parcela del usuario actual.

```js
async function votarEncuesta(encuestaId, seleccion) {
  if (!currentUser) {
    showSnackbar('Debes iniciar sesión para votar.', 'info');
    return;
  }
  var miPropietario = (typeof PROPIETARIOS !== 'undefined')
    ? PROPIETARIOS.find(function(p) { return p.email === currentUser.email; })
    : null;
  if (!miPropietario || !miPropietario.parcela_id) {
    showSnackbar('No se encontró una parcela asociada a tu cuenta.', 'error');
    return;
  }
  if (DEMO_MODE) {
    ENCUESTAS_VOTOS.push({
      id: generateUUID(),
      encuesta_id: encuestaId,
      parcela_id: miPropietario.parcela_id,
      seleccion: seleccion,
      created_at: new Date().toISOString()
    });
    renderEncuestas();
    return;
  }
  showLoading();
  var { error } = await supabaseClient.from('encuestas_votos').insert({
    encuesta_id: encuestaId,
    parcela_id: miPropietario.parcela_id,
    seleccion: seleccion
  });
  hideLoading();
  if (error) {
    if (error.code === '23505') {
      showSnackbar('Ya votaste en esta encuesta.', 'warning');
    } else {
      showSnackbar('Error al votar: ' + error.message, 'error');
    }
    return;
  }
  await loadJson('ENCUESTAS_VOTOS');
  renderEncuestas();
}
```

### 8.5 formEncuestas(data?)

**Propósito**: Modal para crear/editar encuesta.

**Flujo**:
```
1. Si isEdit:
   - alternativasHtml = texto plano con las opciones (no editable)
   - Mensaje: "(no editable al tener votos)"
2. Si NO isEdit:
   - Switch "Con alternativas" (#encuestaModoAlt)
   - Div #encuestaAlternativas (hidden por defecto)
     - 2 inputs vacíos con placeholder "Opción 1", "Opción 2"
     - Cada uno con botón X para eliminar
   - Botón "+ Alternativa" (#btnAddAlt, hidden por defecto)
   - Info: "Modo simple: 'A favor' / 'En contra'"
3. Abrir modal con form:
   - data-table="encuestas"
   - Título (required)
   - Descripción (textarea, required)
    - Fecha de término (date, required — BD permite NULL = sin cierre)
   - Quorum (number, optional)
   - Alternativas (según modo)
```

**Código exacto**:

```js
function formEncuestas(data) {
  var isEdit = !!data;
  var alternativasHtml = '';
  if (isEdit) {
    var ops = (data.alternativas && data.alternativas.length && !(data.alternativas.length === 1 && data.alternativas[0] === ''))
      ? data.alternativas : ['A favor', 'En contra'];
    alternativasHtml = '<div style="font-size:0.85rem;color:var(--text-muted);padding:0.5rem;background:var(--skeleton-1);border-radius:var(--md-sys-shape-corner-small)">Opciones:<br>'
      + ops.map(function(op) { return '- ' + op; }).join('<br>')
      + '<br><span style="font-size:0.75rem">(no editable al tener votos)</span></div>';
  } else {
    alternativasHtml =
      '<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.5rem">'
        + '<span style="margin:0;font-size:0.9rem">Con alternativas</span>'
        + '<md-switch id="encuestaModoAlt" onchange="toggleEncuestaAlternativas()"></md-switch>'
      + '</div>'
      + '<div id="encuestaAlternativas" style="display:none">'
        + '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><md-filled-text-field class="encuesta-alt-input" placeholder="Ej: Opción 1" style="flex:1"></md-filled-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:var(--md-sys-color-error)"><md-icon>close</md-icon></md-icon-button></div>'
        + '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><md-filled-text-field class="encuesta-alt-input" placeholder="Ej: Opción 2" style="flex:1"></md-filled-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:var(--md-sys-color-error)"><md-icon>close</md-icon></md-icon-button></div>'
      + '</div>'
      + '<md-filled-tonal-button id="btnAddAlt" onclick="addEncuestaAlt()" style="display:none"><md-icon slot="icon">add</md-icon>Alternativa</md-filled-tonal-button>'
      + '<div id="encuestaModoInfo" style="font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem">Modo simple: "A favor" / "En contra"</div>';
  }
  openModal(isEdit ? 'Editar Encuesta' : 'Agregar Encuesta',
    '<form id="modalForm" data-table="encuestas" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-group"><md-filled-text-field label="Título" name="titulo" placeholder="Ej: Título de la propuesta" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalle de la propuesta..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-row">'
      + dateFieldHtml('fecha_termino', 'Fecha de término*', isEdit ? data.fecha_termino : '')
      + '<div class="form-group"><md-filled-text-field label="Quorum (mín. votos)" type="number" name="quorum" min="0" placeholder="Ej: Sin límite" style="width:100%"' + (isEdit && data.quorum ? ' value="' + data.quorum + '"' : '') + '></md-filled-text-field></div>'
    + '</div>'
    + '<div class="form-group" style="margin-top:1rem">' + alternativasHtml + '</div>'
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Crear') + '</md-filled-button>', true);
}
```

### 8.6 toggleEncuestaAlternativas()

```js
function toggleEncuestaAlternativas() {
  var on = document.getElementById('encuestaModoAlt').selected;
  document.getElementById('encuestaAlternativas').style.display = on ? '' : 'none';
  document.getElementById('btnAddAlt').style.display = on ? '' : 'none';
  document.getElementById('encuestaModoInfo').textContent = on ? 'Alternativas personalizadas' : 'Modo simple: "A favor" / "En contra"';
}
```

### 8.7 addEncuestaAlt()

```js
function addEncuestaAlt() {
  var container = document.getElementById('encuestaAlternativas');
  var count = container.querySelectorAll('.encuesta-alt-input').length + 1;
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:0.4rem;align-items:center';
  div.innerHTML = '<md-filled-text-field class="encuesta-alt-input" placeholder="Ej: Opción ' + count + '" style="flex:1"></md-filled-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:var(--md-sys-color-error)"><md-icon>close</md-icon></md-icon-button>';
  container.appendChild(div);
  div.querySelector('md-filled-text-field').focus();
}
```

### 8.8 removeEncuestaAlt(btn)

```js
function removeEncuestaAlt(btn) {
  btn.parentElement.remove();
}
```

### 8.9 editEncuesta(id) / deleteEncuesta(id)

```js
function editEncuesta(id) {
  var item = ENCUESTAS.find(function(e) { return e.id === id; });
  if (item) formEncuestas(item);
}

function deleteEncuesta(id) {
  if (!IS_ADMIN) return;
  showConfirm('¿Eliminar esta encuesta? También se eliminarán todos los votos.', function() {
    if (DEMO_MODE) {
      ENCUESTAS = ENCUESTAS.filter(function(e) { return e.id !== id; });
      ENCUESTAS_VOTOS = ENCUESTAS_VOTOS.filter(function(v) { return v.encuesta_id !== id; });
      showSnackbar('Eliminado (demo).', 'success');
      renderEncuestas();
    } else {
      showLoading();
      supabaseClient.from('encuestas_votos').delete().eq('encuesta_id', id).then(function() {
        supabaseDelete('encuestas', id).then(function(result) {
          hideLoading();
          if (result) { showSnackbar('Eliminada correctamente.', 'success'); reloadTab(getCurrentTab()); }
        });
      });
    }
  });
}
```

### 8.10 Manejo de alternativas en handleForm() (DEMO)

```js
if (table === 'encuestas') {
  if (!isEdit) {
    var altInputs = document.querySelectorAll('.encuesta-alt-input');
    var alternativas = [];
    altInputs.forEach(function(inp) {
      var val = inp.value.trim();
      if (val) { alternativas.push(val); }
    });
    data.alternativas = alternativas;
  }
  if (!data.fecha_termino) { delete data.fecha_termino; }
  if (data.quorum) { data.quorum = parseInt(data.quorum) || null; }
  if (isEdit) {
    var idx = ENCUESTAS.findIndex(function(e) { return e.id === data.id; });
    if (idx !== -1) ENCUESTAS[idx] = Object.assign({}, ENCUESTAS[idx], data);
  } else {
    data.id = generateUUID();
    data.created_at = new Date().toISOString();
    ENCUESTAS.push(data);
  }
  afterSave();
  renderEncuestas();
}
```

## 9. Estado cerrada vs abierta

| Condición | Estado | Watermark | Badge |
|-----------|--------|-----------|-------|
| Sin `fecha_termino` | Abierta (nunca se cierra) | No | Abierta |
| `fecha_termino` en futuro | Abierta | No | Abierta |
| `fecha_termino` pasado | Cerrada | "TERMINADA" | Cerrada |

## 10. Cálculo de tiempo restante (getTimeRemaining)

```js
function getTimeRemaining(fechaStr) {
  if (!fechaStr) return null;
  var parts = fechaStr.split('T')[0].split('-');
  var now = new Date();
  if (+parts[0] !== now.getFullYear() || +parts[1] !== now.getMonth() + 1 || +parts[2] !== now.getDate()) return null;
  var fin = new Date(+parts[0], +parts[1] - 1, +parts[2], 23, 59, 59);
  var diff = fin - now;
  if (diff <= 0) return null;
  var horas = Math.floor(diff / 3600000);
  var minutos = Math.floor((diff % 3600000) / 60000);
  return horas + 'h ' + minutos + 'm';
}
```

**Comportamiento**: Solo retorna valor si la fecha de término es HOY. Si termina en otro día, retorna null y se muestra "Termina: DD/MM/AAAA".

## 11. Filtros

| Chip | Filtro | Default |
|------|--------|---------|
| Abiertas | `!d.cerrada` | ✅ Sí |
| Cerradas | `d.cerrada` | No |
| Todas | Sin filtro | No |

## 12. Render output exacto (HTML generado)

```html
<div class="flujo-card">
  <!-- Watermark solo para cerradas -->
  <div class="watermark">TERMINADA</div>

  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
    <span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:[bg];color:[text]">Abierta</span>
    <div style="display:flex;gap:0.3rem;align-items:center">
      <span style="font-size:0.8rem;color:var(--text-muted)">01/03/2026</span>
      [admin actions: edit/delete]
    </div>
  </div>

  <!-- Título -->
  <div style="font-size:1rem;font-weight:600;margin-bottom:0.3rem;color:var(--text)">Aprobación fondo de reserva 2026</div>

  <!-- Descripción (opcional) -->
  <div style="font-size:0.85rem;color:var(--text-2);margin-bottom:0.4rem">Se propone aumentar...</div>

  <!-- Info extra + Quorum -->
  <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--text-muted);margin-bottom:0.3rem">
    <span>Termina en: 5h 30m</span>
    <span style="color:[tertiary|error]">Quorum: 3/5 ✓</span>
  </div>

  <!-- Opciones -->
  <div style="margin-bottom:0.4rem">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem">
      <span style="font-weight:600">A favor ✓</span>
      <span style="color:var(--text-muted)">3 (60%) <md-filled-button ...>Votar</md-filled-button></span>
    </div>
    <div style="display:flex;height:6px;border-radius:...;overflow:hidden;margin:0.3rem 0;background:var(--skeleton-1)">
      <div style="width:60%;background:#22c55e;transition:width 0.3s"></div>
    </div>
  </div>

  <!-- Ya votaste (si aplica) -->
  <div style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-muted)">Ya votaste</div>

  <!-- Total -->
  <div style="text-align:right;font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem">Total: 5 votos</div>
</div>
```

## 13. RLS Policies

```sql
-- ENCUESTAS
CREATE POLICY "encuestas_select" ON encuestas FOR SELECT TO authenticated USING (true);
CREATE POLICY "encuestas_insert" ON encuestas FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "encuestas_update" ON encuestas FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "encuestas_delete" ON encuestas FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- ENCUESTAS_VOTOS
CREATE POLICY "encuestas_votos_select" ON encuestas_votos FOR SELECT TO authenticated USING (true);
CREATE POLICY "encuestas_votos_insert" ON encuestas_votos FOR INSERT TO authenticated USING (true);  -- cualquier authenticated
CREATE POLICY "encuestas_votos_delete" ON encuestas_votos FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 14. Colores de opciones

Array cíclico de 6 colores:
```js
var colores = ['#22c55e', '#3b82f6', '#f59e0b', '#b91c1c', '#8b5cf6', '#ec4899'];
```

Cada opción usa `colores[i % colores.length]`. El color se aplica a:
- Barra de progreso (`background`)
- Botón Votar (`--md-filled-button-container-color`)

## 15. Comportamiento de voto

### Condiciones para mostrar botón "Votar":
1. Encuesta NO cerrada
2. `currentUser` NO es null (hay sesión)
3. `d.miVoto` es null (no ha votado)

### Condiciones para "Ya votaste":
1. `d.miVoto` NO es null

### Error si no hay parcela asociada:
- Snackbar: "No se encontró una parcela asociada a tu cuenta."
- Ocurre cuando el email del auth user no coincide con ningún propietario

### Error si ya votó (prod):
- Supabase devuelve error code `23505` (unique violation)
- Snackbar: "Ya votaste en esta encuesta."

### En demo:
- No hay validación de unique
- Se pushea directamente al array `ENCUESTAS_VOTOS`
- Si se vota múltiples veces, aparecen múltiples votos en los resultados

## 16. Empty state

```
<p style="color:var(--text-muted);text-align:center;padding:2rem">No hay encuestas para mostrar.</p>
```

## 17. Manejo de alternativas en handleForm() (PROD)

```js
if (table === 'encuestas') {
  if (data.quorum) data.quorum = parseInt(data.quorum) || null;
  if (!data.fecha_termino) delete data.fecha_termino;
  if (!isEdit) {
    var altInputs = document.querySelectorAll('.encuesta-alt-input');
    var alternativas = [];
    altInputs.forEach(function(inp) {
      var val = inp.value.trim();
      if (val) alternativas.push(val);
    });
    data.alternativas = alternativas;
  }
  doUpdate(table, data).then(function(result) {
    if (result) {
      showSnackbar(isEdit ? 'Encuesta actualizada.' : 'Encuesta creada.', 'success');
      closeModal();
      reloadTab(getCurrentTab());
    }
  });
}
```

## 18. Dependencias

- Requiere `PARCELAS` y `PROPIETARIOS` cargados (para vincular voto por email)
- Requiere `ENCUESTAS_VOTOS` cargados (para mostrar resultados)
- Los propietarios deben tener email coincidente con auth user para poder votar
