# Proveedores

## 1. Descripción general

Directorio de proveedores de servicios clasificados por rubros configurables. Cada ficha incluye nombre, contacto, teléfono, email, web/Instagram y observaciones. Los rubros se gestionan desde la Configuración admin.

ID del tab: `proveedores`
Contenedor: `<div id="tab-proveedores">`

## 2. Schema SQL

```sql
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro TEXT NOT NULL,
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  web_instagram TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/proveedores.json)

```json
[
  {
    "id": "prov1",
    "rubro": "Jardinería",
    "nombre": "Jardines Ltda.",
    "contacto": "Carlos Muñoz",
    "telefono": "+56 9 1111 2222",
    "email": "carlos@jardines.cl",
    "web_instagram": "https://instagram.com/jardinesltda",
    "observaciones": "Visita cada 15 días"
  },
  {
    "id": "prov2",
    "rubro": "Electricidad",
    "nombre": "ElectroService",
    "contacto": "Ana Rojas",
    "telefono": "+56 9 3333 4444",
    "email": "ana@electro.cl",
    "web_instagram": "",
    "observaciones": "Disponible 24/7 para emergencias"
  }
]
```

## 4. HTML structure (index.html lines 190-198)

```html
<div id="tab-proveedores" class="tab-content" role="region" aria-label="Proveedores">
  <md-filled-button class="admin-only" id="formProveedores" onclick="formProveedores()">
    <md-icon slot="icon">add</md-icon>Agregar Proveedor
  </md-filled-button>
  <div class="cards-grid" id="proveedoresGrid">
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
    <div class="skeleton skeleton-card"></div>
  </div>
</div>
```

## 5. Global state

```js
var PROVEEDORES = [];
```

## 6. Tab data loading

```js
proveedores: function() {
  return loadJson('PROVEEDORES').then(function() { renderProveedores(); });
}
```

## 7. JS Functions

### 7.1 renderProveedores()

**Flujo**:
```
1. Mapea PROVEEDORES a cards
2. Por cada proveedor:
   a. Header: rubro badge + admin actions
   b. Nombre
   c. Contacto (ícono 📞)
   d. Teléfono (link tel:, si existe)
   e. Email (link mailto:, si existe)
   f. Web/Instagram (link externo, si existe)
   g. Observaciones (muted)
3. Setea innerHTML de #proveedoresGrid
```

**Código exacto**:
```js
function renderProveedores() {
  var grid = document.getElementById('proveedoresGrid');
  grid.innerHTML = PROVEEDORES.map(function(p) {
    return '<div class="proveedor-card">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">'
        + '<div class="proveedor-rubro" style="margin:0">' + p.rubro + '</div>'
        + adminActions("editProveedor('" + p.id + "')", "deleteProveedor('" + p.id + "')")
      + '</div>'
      + '<div class="proveedor-nombre">' + p.nombre + '</div>'
      + '<div class="proveedor-contacto">'
        + '<div>&#128205; ' + p.contacto + '</div>'
        + (p.telefono ? '<div>&#128222; <a href="tel:' + p.telefono + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + p.telefono + '</a></div>' : '')
        + (p.email ? '<div>&#9993; <a href="mailto:' + p.email + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + p.email + '</a></div>' : '')
        + (p.web_instagram ? '<div>&#127760; <a href="' + p.web_instagram + '" target="_blank" style="color:var(--md-sys-color-primary);text-decoration:none">' + p.web_instagram + '</a></div>' : '')
        + '<div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.3rem">' + p.observaciones + '</div>'
      + '</div>'
    + '</div>';
  }).join('');
}
```

### 7.2 formProveedores(data?)

```js
function formProveedores(data) {
  var isEdit = !!data;
  var rubros = CONFIG.rubros_proveedores && CONFIG.rubros_proveedores.length
    ? CONFIG.rubros_proveedores
    : ['Jardinería', 'Plomería', 'Electricidad', 'Albañilería', 'Pintura', 'Limpieza', 'Seguridad', 'Carpintería', 'Herrería', 'Tecnología', 'Otro'];
  var rubroOpts = rubros.map(function(r) {
    return '<md-select-option value="' + r + '"' + (isEdit && data.rubro === r ? ' selected' : '') + '><span slot="headline">' + r + '</span></md-select-option>';
  }).join('');
  openModal(isEdit ? 'Editar Proveedor' : 'Agregar Proveedor',
    '<form id="modalForm" data-table="proveedores" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-select label="Rubro" name="rubro" required style="width:100%"><md-select-option value=""><span slot="headline">Seleccionar...</span></md-select-option>' + rubroOpts + '</md-filled-select></div>'
      + '<div class="form-group"><md-filled-text-field label="Nombre" name="nombre" placeholder="Ej: Nombre del proveedor o empresa" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></md-filled-text-field></div>'
    + '</div>'
    + '<div class="form-group"><md-filled-text-field label="Contacto" name="contacto" placeholder="Ej: Nombre de la persona de contacto" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.contacto) + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-text-field label="Teléfono" type="tel" name="telefono" placeholder="Ej: +56 9 1234 5678" style="width:100%"' + (isEdit && data.telefono ? ' value="' + escHtml(data.telefono) + '"' : '') + '></md-filled-text-field></div>'
      + '<div class="form-group"><md-filled-text-field label="Email" type="email" name="email" placeholder="Ej: correo@ejemplo.com" style="width:100%"' + (isEdit && data.email ? ' value="' + escHtml(data.email) + '"' : '') + '></md-filled-text-field></div>'
    + '</div>'
    + '<div class="form-group"><md-filled-text-field label="Web/Instagram" name="web_instagram" placeholder="Ej: https://..." style="width:100%"' + (isEdit && data.web_instagram ? ' value="' + escHtml(data.web_instagram) + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-group"><md-filled-text-field label="Observaciones" name="observaciones" placeholder="Ej: Notas adicionales sobre el proveedor..." type="textarea" rows="3" style="width:100%"' + (isEdit ? ' value="' + escHtml(data.observaciones || '') + '"' : '') + '></md-filled-text-field></div>'
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
}
```

## 8. Validaciones en handleForm() para proveedores

### Auto-https
```js
if (table === 'proveedores' && data.web_instagram && data.web_instagram.indexOf('http') !== 0) {
  data.web_instagram = 'https://' + data.web_instagram;
}
```

### Validación de caracteres
```js
if (table === 'proveedores' && data.web_instagram && /[\s,]/.test(data.web_instagram)) {
  showSnackbar('El campo Web/Instagram contiene caracteres inválidos (espacios, comas).', 'warning');
  submitError();
  return;
}
```

## 9. Render output exacto

```html
<div class="proveedor-card">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
    <div class="proveedor-rubro" style="margin:0">Jardinería</div>
    [edit] [delete]
  </div>
  <div class="proveedor-nombre">Jardines Ltda.</div>
  <div class="proveedor-contacto">
    <div>📞 Carlos Muñoz</div>
    <div>📱 <a href="tel:+56 9 1111 2222" style="color:var(--md-sys-color-primary);text-decoration:none">+56 9 1111 2222</a></div>
    <div>✉️ <a href="mailto:carlos@jardines.cl" style="color:var(--md-sys-color-primary);text-decoration:none">carlos@jardines.cl</a></div>
    <div>🌐 <a href="https://instagram.com/jardinesltda" target="_blank" style="color:var(--md-sys-color-primary);text-decoration:none">https://instagram.com/jardinesltda</a></div>
    <div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.3rem">Visita cada 15 días</div>
  </div>
</div>
```

## 10. CSS classes (sections.css)

```css
.proveedor-card {
  background: var(--bg-card);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 1rem;
}

.proveedor-rubro {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.proveedor-nombre {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.proveedor-contacto {
  font-size: 0.85rem;
  line-height: 1.6;
}
```

## 11. Fallback de rubros

Si `CONFIG.rubros_proveedores` está vacío o no existe:
```js
['Jardinería', 'Plomería', 'Electricidad', 'Albañilería', 'Pintura', 'Limpieza', 'Seguridad', 'Carpintería', 'Herrería', 'Tecnología', 'Otro']
```

## 12. RLS Policies

```sql
CREATE POLICY "proveedores_select" ON proveedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "proveedores_insert" ON proveedores FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "proveedores_update" ON proveedores FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "proveedores_delete" ON proveedores FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 13. Dependencias

- Rubros configurables desde Config page (ver `config-admin.md`)
- No tiene FK a otras tablas (entidad independiente)
- No tiene filtros (solo grid de todas las cards)
