# Reclamos/Sugerencias

## 1. Descripción general

Sistema de comunicación para reportar problemas o sugerir mejoras. Es el único módulo donde **cualquier usuario autenticado** puede crear contenido. Soporta tipo Reclamo o Sugerencia, con identificación opcional de parcela.

ID del tab: `reclamos`
Contenedor: `<div id="tab-reclamos">`

## 2. Schema SQL

```sql
CREATE TABLE reclamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('Reclamo', 'Sugerencia')),
  parcela_id UUID REFERENCES parcelas(id) ON DELETE SET NULL,  -- NULL = anónimo
  asunto TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/reclamos.json)

```json
[
  {
    "id": "r1",
    "tipo": "Reclamo",
    "parcela_id": "p1",
    "asunto": "Ruido excesivo durante la noche",
    "descripcion": "La parcela 5 está haciendo ruido después de las 23:00 hrs constantemente.",
    "created_at": "2026-03-10T22:30:00Z"
  },
  {
    "id": "r2",
    "tipo": "Sugerencia",
    "parcela_id": null,
    "asunto": "Instalar cámaras de seguridad",
    "descripcion": "Sugiero evaluar la instalación de cámaras en la entrada principal para mayor seguridad.",
    "created_at": "2026-03-12T15:00:00Z"
  }
]
```

## 4. HTML structure (index.html lines 175-188)

```html
<div id="tab-reclamos" class="tab-content" role="region" aria-label="Reclamos/Sugerencias">
  <md-filled-button id="formReclamos" onclick="formReclamos()">
    <md-icon slot="icon">add</md-icon>Agregar Reclamo/Sugerencia
  </md-filled-button>

  <div class="filter-chips" id="reclamosFilter">
    <md-filter-chip label="Todos" selected onclick="filterReclamos('todos')"></md-filter-chip>
    <md-filter-chip label="Reclamos" onclick="filterReclamos('Reclamo')"></md-filter-chip>
    <md-filter-chip label="Sugerencias" onclick="filterReclamos('Sugerencia')"></md-filter-chip>
  </div>

  <div id="reclamosList">
    <div class="skeleton skeleton-doc"></div>
    <div class="skeleton skeleton-doc"></div>
    <div class="skeleton skeleton-doc"></div>
  </div>
</div>
```

## 5. Global state

```js
var RECLAMOS = [];
var reclamosFilter = 'todos';
```

## 6. Tab data loading

```js
reclamos: function() {
  return loadJson('RECLAMOS').then(function() { renderReclamos(); });
}
```

## 7. JS Functions

### 7.1 filterReclamos(tipo)

```js
function filterReclamos(tipo) {
  reclamosFilter = tipo;
  document.querySelectorAll('#reclamosFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderReclamos();
}
```

### 7.2 renderReclamos()

**Flujo**:
```
1. Filtrar RECLAMOS según reclamosFilter
2. Por cada reclamo:
   a. tipoClass = r.tipo.toLowerCase()
   b. Renderizar item con clase CSS según tipo
   c. Badge de tipo + fecha
   d. Asunto (title)
   e. Descripción (nl2br)
   f. Parcela: parcelName(r.parcela_id) o "Anónimo"
3. Si filtered.length === 0: mostrar "Sin registros"
4. NO hay botones admin (no hay edit/delete visual en reclamos)
```

**Código exacto**:
```js
function renderReclamos() {
  var list = document.getElementById('reclamosList');
  var filtered = reclamosFilter === 'todos' ? RECLAMOS : RECLAMOS.filter(function(r) { return r.tipo === reclamosFilter; });
  list.innerHTML = filtered.map(function(r) {
    var tipoClass = r.tipo.toLowerCase();
    return '<div class="reclamo-item ' + tipoClass + '">'
      + '<div class="reclamo-header">'
        + '<span class="reclamo-tipo ' + tipoClass + '">' + r.tipo + '</span>'
        + '<span class="reclamo-fecha">' + formatDate(r.fecha || r.created_at) + '</span>'
      + '</div>'
      + '<div class="reclamo-title">' + r.asunto + '</div>'
      + '<div class="reclamo-desc">' + nl2br(r.descripcion) + '</div>'
      + (r.parcela_id ? '<div class="reclamo-parcela">' + parcelName(r.parcela_id) + '</div>' : '<div class="reclamo-parcela">Anónimo</div>')
    + '</div>';
  }).join('');
  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--md-sys-color-outline);padding:2rem">Sin registros</div>';
  }
}
```

### 7.3 formReclamos()

```js
function formReclamos() {
  var parcelas = PARCELAS.map(function(p) {
    return '<md-select-option value="' + p.id + '"><span slot="headline">' + p.numero + '</span></md-select-option>';
  }).join('');
  openModal('Agregar Reclamo/Sugerencia',
    '<form id="modalForm" data-table="reclamos" onsubmit="handleForm(event)">'
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-select label="Tipo" name="tipo" required style="width:100%">'
        + '<md-select-option value="Reclamo"><span slot="headline">Reclamo</span></md-select-option>'
        + '<md-select-option value="Sugerencia"><span slot="headline">Sugerencia</span></md-select-option>'
      + '</md-filled-select></div>'
      + '<div class="form-group"><md-filled-select label="Parcela" name="parcela_id" required style="width:100%">' + parcelas + '</md-filled-select></div>'
    + '</div>'
    + '<div class="form-group"><md-filled-text-field label="Asunto" name="asunto" placeholder="Ej: Ruido excesivo, Fuga de agua" required style="width:100%"></md-filled-text-field></div>'
    + '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Describa el problema o sugerencia..." type="textarea" rows="3" required style="width:100%"></md-filled-text-field></div>'
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">Guardar</md-filled-button>', true);
}
```

Nota: `formReclamos()` **no acepta parámetro de edición**. Solo creación.

## 8. Render output exacto

```html
<div class="reclamo-item reclamo">
  <div class="reclamo-header">
    <span class="reclamo-tipo reclamo">Reclamo</span>
    <span class="reclamo-fecha">10/03/2026</span>
  </div>
  <div class="reclamo-title">Ruido excesivo durante la noche</div>
  <div class="reclamo-desc">La parcela 5 está haciendo ruido después de las 23:00 hrs constantemente.</div>
  <div class="reclamo-parcela">1</div>
</div>
```

### Anónimo:
```html
<div class="reclamo-parcela">Anónimo</div>
```

## 9. CSS classes de reclamos (sections.css)

```css
.reclamo-item {
  padding: 1rem;
  margin-bottom: 0.8rem;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--bg-card);
  border-left: 4px solid var(--border);
}

.reclamo-item.reclamo {
  border-left-color: var(--md-sys-color-error);
}

.reclamo-item.sugerencia {
  border-left-color: var(--md-sys-color-primary);
}

.reclamo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reclamo-tipo {
  padding: 0.2rem 0.6rem;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: 0.75rem;
  font-weight: 600;
}

.reclamo-tipo.reclamo {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.reclamo-tipo.sugerencia {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.reclamo-fecha {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.reclamo-title {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 0.4rem;
}

.reclamo-desc {
  font-size: 0.85rem;
  color: var(--text-2);
  margin-bottom: 0.4rem;
  line-height: 1.5;
}

.reclamo-parcela {
  font-size: 0.8rem;
  color: var(--text-muted);
}
```

## 10. Filtros

| Chip | Filtro |
|------|--------|
| Todos (default) | Sin filtro |
| Reclamos | `r.tipo === 'Reclamo'` |
| Sugerencias | `r.tipo === 'Sugerencia'` |

## 11. RLS Policies

```sql
CREATE POLICY "reclamos_select" ON reclamos FOR SELECT TO authenticated USING (true);
CREATE POLICY "reclamos_insert" ON reclamos FOR INSERT TO authenticated USING (true);  -- cualquier autenticado
CREATE POLICY "reclamos_update" ON reclamos FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "reclamos_delete" ON reclamos FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 12. Comportamientos especiales

### No tiene edición
No existe `editReclamo()` ni botón de edición en el render. Los reclamos no se pueden editar desde la UI.

### ON DELETE SET NULL
Si se elimina una parcela referenciada, el reclamo queda con `parcela_id = NULL` (se vuelve anónimo).

### Botón "+" siempre visible
El botón `#formReclamos` **no tiene clase `admin-only`**. Es visible para cualquier usuario autenticado.

## 13. Dependencias

- Requiere `PARCELAS` cargado para el selector de parcela en el form
- `parcela_id` es FK a parcelas con ON DELETE SET NULL
- No tiene auto-fecha (usa created_at de DB)
