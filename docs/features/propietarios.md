# Propietarios

## 1. Descripción general

Personas asociadas a cada parcela. Se renderizan inline dentro de las cards de Parcelas. Tienen CRUD completo con modal propio. En producción, al crear/eliminar un propietario se invocan Edge Functions de Supabase que gestionan también el auth user.

## 2. Schema SQL

```sql
CREATE TABLE propietarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo TEXT NOT NULL,
  rut TEXT,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE CASCADE,
  telefono TEXT,
  email TEXT,
  tipo TEXT DEFAULT 'Propietario',   -- Propietario | Inquilino | Administrador
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Mock data (data/propietarios.json)

```json
[
  { "id": "pr1", "nombre_completo": "Juan Pérez", "rut": "12.345.678-9", "parcela_id": "p1", "telefono": "+56 9 1234 5678", "email": "juan@ejemplo.com", "tipo": "Propietario", "created_at": "2026-01-01T00:00:00Z" },
  { "id": "pr2", "nombre_completo": "María González", "rut": "23.456.789-0", "parcela_id": "p2", "telefono": "+56 9 2345 6789", "email": "maria@ejemplo.com", "tipo": "Propietario", "created_at": "2026-01-01T00:00:00Z" },
  { "id": "pr3", "nombre_completo": "Pedro Soto", "rut": "34.567.890-1", "parcela_id": "p1", "telefono": "", "email": "pedro@ejemplo.com", "tipo": "Inquilino", "created_at": "2026-01-01T00:00:00Z" }
]
```

## 4. Global state

```js
var PROPIETARIOS = [];   // en config.js
```

## 5. JS Functions

### 5.1 formPropietarios(opt)

**Parámetros**:
- `opt = null` → modo creación (sin parcela preseleccionada)
- `opt = "parcela_id_string"` → modo creación con parcela preseleccionada
- `opt = { id, nombre_completo, rut, parcela_id, telefono, email, tipo }` → modo edición

**Flujo**:
```
1. Determinar isEdit (typeof opt === 'object')
2. parcelaId = isEdit ? data.parcela_id : opt
3. isFromParcela = !!parcelaId (si viene de botón "+" en card)
4. Generar options de parcelas (si isFromParcela: hidden input + disabled select)
5. Abrir modal con:
   - data-table="propietarios"
   - Nombre completo (required)
   - RUT (opcional)
   - Parcela: select con todas las parcelas (o hidden si preseleccionada)
   - Teléfono (opcional)
   - Email (opcional)
   - Tipo (select: Propietario/Inquilino/Administrador)
```

**Código exacto**:
```js
function formPropietarios(opt) {
  var isEdit = opt && typeof opt === 'object';
  var data = isEdit ? opt : null;
  var parcelaId = isEdit ? (data.parcela_id || null) : (opt || null);
  var isFromParcela = !!parcelaId;
  var parcelas = PARCELAS.map(function(p) {
    var sel = parcelaId === p.id ? ' selected' : '';
    return '<md-select-option value="' + p.id + '"' + sel + '><span slot="headline">' + p.numero + '</span></md-select-option>';
  }).join('');
  openModal(isEdit ? 'Editar Propietario' : 'Agregar Propietario',
    '<form id="modalForm" data-table="propietarios" onsubmit="handleForm(event)">'
    + (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '')
    + '<div class="form-group"><md-filled-text-field label="Nombre completo" name="nombre_completo" placeholder="Ej: Juan Pérez" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre_completo) + '"' : '') + '></md-filled-text-field></div>'
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-text-field label="RUT" name="rut" placeholder="Ej: 12.345.678-9" style="width:100%"' + (isEdit && data.rut ? ' value="' + escHtml(data.rut) + '"' : '') + '></md-filled-text-field></div>'
      + (isFromParcela
        ? '<input type="hidden" name="parcela_id" value="' + parcelaId + '"><div class="form-group"><md-filled-select label="Parcela" disabled style="width:100%"><md-select-option value="' + parcelaId + '" selected><span slot="headline">' + (PARCELAS.find(function(p) { return p.id === parcelaId; }) || {}).numero + '</span></md-select-option></md-filled-select></div>'
        : '<div class="form-group"><md-filled-select label="Parcela" name="parcela_id" required style="width:100%">' + parcelas + '</md-filled-select></div>')
    + '</div>'
    + '<div class="form-row">'
      + '<div class="form-group"><md-filled-text-field label="Teléfono" type="tel" name="telefono" placeholder="Ej: +56 9 1234 5678" style="width:100%"' + (isEdit && data.telefono ? ' value="' + escHtml(data.telefono) + '"' : '') + '></md-filled-text-field></div>'
      + '<div class="form-group"><md-filled-text-field label="Email" type="email" name="email" placeholder="Ej: correo@ejemplo.com" style="width:100%"' + (isEdit && data.email ? ' value="' + escHtml(data.email) + '"' : '') + '></md-filled-text-field></div>'
    + '</div>'
    + '<div class="form-group"><md-filled-select label="Tipo" name="tipo" style="width:100%">'
      + '<md-select-option value="Propietario"' + (isEdit && data.tipo === 'Propietario' ? ' selected' : '') + '><span slot="headline">Propietario</span></md-select-option>'
      + '<md-select-option value="Inquilino"' + (isEdit && data.tipo === 'Inquilino' ? ' selected' : '') + '><span slot="headline">Inquilino</span></md-select-option>'
      + '<md-select-option value="Administrador"' + (isEdit && data.tipo === 'Administrador' ? ' selected' : '') + '><span slot="headline">Administrador</span></md-select-option>'
    + '</md-filled-select></div>'
    + '</form>',
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>', true);
}
```

### 5.2 editPropietario(id)

```js
function editPropietario(id) {
  var data = PROPIETARIOS.find(function(p) { return p.id === id; });
  if (data) formPropietarios(data);
}
```

### 5.3 Manejo de propietarios en handleForm() — PRODUCCIÓN

**Creación** (table === 'propietarios' && !isEdit):
```js
supabaseClient.functions.invoke('create-user', { body: data }).then(function(res) {
  if (res.error) { submitError(res.error.message || 'Error al crear usuario'); }
  else { afterSave(); }
});
```

**Edición**: cae en el else final (doUpdate normal).

### 5.4 Manejo en DEMO

```js
// Creación: tableToArray('propietarios') → 'PROPIETARIOS'
// Pushea al array con id generado
data.id = generateUUID();
window['PROPIETARIOS'].push(data);

// Edición: reemplaza en el array
```

### 5.5 Eliminación

```js
// En deleteItem(), cuando table === 'propietarios':
if (table === 'propietarios') {
  supabaseClient.functions.invoke('delete-user', { body: { propietario_id: id } }).then(function(res) {
    if (res.error) { showSnackbar(res.error.message || 'Error al eliminar', 'error'); }
    else { showSnackbar('Eliminado correctamente.', 'success'); reloadTab(getCurrentTab()); }
  });
}
```

## 6. Vinculación con encuestas

Cuando un usuario vota en una encuesta, se busca su propietario asociado por email:
```js
var miPropietario = PROPIETARIOS.find(function(p) { return p.email === currentUser.email; });
```
Si el email del auth user coincide con el email de un propietario, el voto se asocia a `miPropietario.parcela_id`.

## 7. Render inline (dentro de cards de Parcelas)

Cada propietario se renderiza con:
```
┌──────────────────────────────────────────┐
│  [JP]  Juan Pérez                [✏️][🗑️] │
│        Propietario                       │
│        📱 +56 9 1234 5678                │
│        ✉️ juan@ejemplo.com               │
│        📄 RUT: 12.345.678-9              │
├──────────────────────────────────────────┤
│  [PS]  Pedro Soto               [✏️][🗑️] │
│        Inquilino                         │
│        ✉️ pedro@ejemplo.com              │
└──────────────────────────────────────────┘
```

## 8. RLS Policies

```sql
CREATE POLICY "propietarios_select" ON propietarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "propietarios_insert" ON propietarios FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "propietarios_update" ON propietarios FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "propietarios_delete" ON propietarios FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

## 9. Dependencias

- FK `parcela_id` con ON DELETE CASCADE (al eliminar parcela, se eliminan sus propietarios)
- En producción: requiere Edge Functions `create-user` y `delete-user` desplegadas en Supabase
- La creación de propietario en producción crea también un auth user (no se puede crear propietario sin crear usuario)

## 10. Edge Functions

### create-user
**Input**: `{ nombre_completo, rut, parcela_id, telefono, email, tipo }`
**Acciones**: 
1. Crea usuario en `auth.users` con email y contraseña temporal
2. Crea registro en `propietarios`
3. Envía email de invitación

### delete-user
**Input**: `{ propietario_id }`
**Acciones**:
1. Busca el auth user por email del propietario
2. Elimina el auth user
3. Elimina el registro en `propietarios`
