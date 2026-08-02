# Autenticación

## 1. Descripción general

Sistema de autenticación basado en Supabase Auth con email/password. Control de roles mediante `app_metadata.role`. Separa usuarios en dos categorías: **admin** (operaciones de escritura + configuración) y **user** (solo lectura + reclamos + votación).

## 2. Variables globales

```js
// En supabase-config.js (se carga primero)
var supabaseClient;
var currentUser = null;
var IS_ADMIN = false;
```

## 3. HTML structure (index.html lines 33-88, 313-327)

### Header auth section (app bar full-width + menú de usuario)
```html
<header>
  <div style="display:flex;justify-content:space-between;align-items:center;gap:1rem">
    <div>
      <h1>CONDOMINIO EUCALIPTUS</h1>
      <p>Control de gastos comunes</p>
    </div>
    <div style="display:flex;align-items:center">
      <md-icon-button id="userMenuButton" onclick="toggleUserMenu()" title="Menú de usuario">
        <md-icon>account_circle</md-icon>
      </md-icon-button>
    </div>
  </div>
  <md-menu id="userMenu" anchor="userMenuButton" anchor-corner="end-end" menu-corner="start-end" positioning="fixed">
    <md-menu-item id="menuUserInfo" disabled>
      <div slot="headline" style="font-weight:500">Invitado</div>
    </md-menu-item>
    <md-divider></md-divider>
    <md-menu-item id="menuLogin" onclick="showLoginModal()">
      <md-icon slot="start">login</md-icon>
      <div slot="headline">Iniciar sesión</div>
    </md-menu-item>
    <md-menu-item id="menuLogout" onclick="handleLogout()" style="display:none">
      <md-icon slot="start">logout</md-icon>
      <div slot="headline">Cerrar sesión</div>
    </md-menu-item>
    <md-divider></md-divider>
    <md-menu-item id="menuDemo" onclick="toggleDemoMode()">
      <md-icon slot="start">science</md-icon>
      <div slot="headline">Salir de modo demo</div>
    </md-menu-item>
    <md-menu-item id="menuTheme" onclick="toggleTheme()">
      <md-icon slot="start">dark_mode</md-icon>
      <div slot="headline">Modo oscuro</div>
    </md-menu-item>
  </md-menu>
</header>
```
- El `<header>` vive **fuera** de `.container`: es una app bar full-width con `position: sticky` (queda fija arriba al scrollear). Estilos en `css/base.css` (fondo `--md-sys-color-surface-container`, borde inferior).
- Login, logout, modo demo y theme se centralizan en un único menú de usuario (`md-menu`). `positioning="fixed"` + `anchor-corner="end-end"`/`menu-corner="start-end"` para que el menú abra exactamente bajo el avatar, alineado a la derecha (no se sale de pantalla en mobile).
- `updateAuthUI()` (supabase-config.js) muestra/oculta `#menuLogin`/`#menuLogout` y setea el email en `#menuUserInfo` según `currentUser`.
- Labels dinámicos: `updateDemoMenu()` y `updateThemeMenu()` (config.js) setean headline/ícono de `#menuDemo` y `#menuTheme`; helper global `setMenuHeadline(id, text)`.

### Login dialog
```html
<md-dialog id="loginDialog">
  <div slot="headline">Iniciar sesión</div>
  <form slot="content" id="loginForm" onsubmit="handleLogin(event)" style="display:flex;flex-direction:column;gap:0.5rem">
    <md-filled-text-field label="Email" type="email" name="email" required style="width:100%"></md-filled-text-field>
    <md-filled-text-field label="Contraseña" type="password" name="password" required style="width:100%"></md-filled-text-field>
    <div id="loginError" style="color:#b91c1c;font-size:0.85rem;margin-bottom:0.5rem"></div>
  </form>
  <div slot="actions">
    <md-text-button onclick="closeLoginModal()">Cancelar</md-text-button>
    <md-filled-button type="submit" form="loginForm">Iniciar sesión</md-filled-button>
  </div>
  <div style="text-align:center;padding:0 1.5rem 1rem">
    <md-text-button onclick="showSignupForm()">Crear cuenta</md-text-button>
  </div>
</md-dialog>
```

## 4. JS Functions

Todas las funciones de auth están en `supabase-config.js` (no se debe modificar).

### 4.1 initSupabase()

**Propósito**: Inicializa cliente Supabase, restaura sesión, escucha cambios de auth.

```js
function initSupabase() {
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Restaurar sesión
  supabaseClient.auth.getSession().then(function(res) {
    if (res.data.session) {
      currentUser = res.data.session.user;
      IS_ADMIN = currentUser.app_metadata && currentUser.app_metadata.role === 'admin';
      updateAuthUI();
    }
  });

  // Escuchar cambios de auth
  supabaseClient.auth.onAuthStateChange(function(event, session) {
    if (session) {
      currentUser = session.user;
      IS_ADMIN = currentUser.app_metadata && currentUser.app_metadata.role === 'admin';
    } else {
      currentUser = null;
      IS_ADMIN = false;
    }
    updateAuthUI();
  });
}
```

### 4.2 updateAuthUI()

**Propósito**: Actualiza la UI según estado de auth.

```js
function updateAuthUI() {
  var loginBtn = document.getElementById('loginBtn');
  var logoutBtn = document.getElementById('logoutBtn');
  var userInfo = document.getElementById('userInfo');
  var configTab = document.getElementById('configTabBtn');

  if (currentUser) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = '';
    userInfo.textContent = currentUser.email;
    document.body.classList.toggle('is-admin', IS_ADMIN);
    if (configTab) configTab.style.display = IS_ADMIN ? '' : 'none';
  } else {
    loginBtn.style.display = '';
    logoutBtn.style.display = 'none';
    userInfo.textContent = '';
    document.body.classList.remove('is-admin');
    if (configTab) configTab.style.display = 'none';
  }
}
```

### 4.3 showLoginModal()

```js
function showLoginModal() {
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').textContent = '';
  document.getElementById('loginDialog').show();
}
```

### 4.4 closeLoginModal()

```js
function closeLoginModal() {
  document.getElementById('loginDialog').close();
}
```

### 4.5 handleLogin(event)

```js
async function handleLogin(event) {
  event.preventDefault();
  var form = event.target;
  var email = form.querySelector('input[name="email"]').value;
  var password = form.querySelector('input[name="password"]').value;
  var errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  var { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    errorEl.textContent = error.message;
    return;
  }
  closeLoginModal();
  reloadTab(getCurrentTab());
}
```

### 4.6 showSignupForm()

```js
function showSignupForm() {
  // Cambia el contenido del modal login a formulario de registro
  var dialog = document.getElementById('loginDialog');
  dialog.querySelector('[slot="headline"]').textContent = 'Crear cuenta';
  var form = document.getElementById('loginForm');
  form.onsubmit = handleSignup;
  var actions = dialog.querySelector('[slot="actions"]');
  actions.innerHTML = '<md-text-button onclick="closeLoginModal()">Cancelar</md-text-button>' +
    '<md-filled-button type="submit" form="loginForm">Crear cuenta</md-filled-button>';
  var footer = dialog.querySelector('div[style*="text-align:center"]');
  footer.innerHTML = '<md-text-button onclick="showLoginForm()">Ya tengo cuenta</md-text-button>';
}
```

### 4.7 showLoginForm()

```js
function showLoginForm() {
  // Restaura el modal a login
  var dialog = document.getElementById('loginDialog');
  dialog.querySelector('[slot="headline"]').textContent = 'Iniciar sesión';
  var form = document.getElementById('loginForm');
  form.onsubmit = handleLogin;
  var actions = dialog.querySelector('[slot="actions"]');
  actions.innerHTML = '<md-text-button onclick="closeLoginModal()">Cancelar</md-text-button>' +
    '<md-filled-button type="submit" form="loginForm">Iniciar sesión</md-filled-button>';
  var footer = dialog.querySelector('div[style*="text-align:center"]');
  footer.innerHTML = '<md-text-button onclick="showSignupForm()">Crear cuenta</md-text-button>';
}
```

### 4.8 handleSignup(event)

```js
async function handleSignup(event) {
  event.preventDefault();
  var form = event.target;
  var email = form.querySelector('input[name="email"]').value;
  var password = form.querySelector('input[name="password"]').value;
  var errorEl = document.getElementById('loginError');
  errorEl.textContent = '';

  var { error } = await supabaseClient.auth.signUp({ email, password });
  if (error) {
    errorEl.textContent = error.message;
    return;
  }
  showSnackbar('Cuenta creada. Revisá tu correo para verificar tu cuenta.', 'success');
  closeLoginModal();
}
```

### 4.9 handleLogout()

```js
async function handleLogout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  IS_ADMIN = false;
  updateAuthUI();
  reloadTab(getCurrentTab());
}
```

## 5. UI States

### No autenticado
- `#loginBtn`: visible
- `#logoutBtn`: hidden
- `#userInfo`: vacío
- Botones `.admin-only`: ocultos (display:none via CSS)
- `#configTabBtn`: oculto
- `#formReclamos`: visible (no tiene clase admin-only)

### Autenticado (user)
- `#loginBtn`: hidden
- `#logoutBtn`: visible
- `#userInfo`: email del usuario
- Botones `.admin-only`: ocultos
- `#configTabBtn`: oculto
- `#formReclamos`: visible

### Autenticado (admin)
- `#loginBtn`: hidden
- `#logoutBtn`: visible
- `#userInfo`: email del usuario
- Botones `.admin-only`: visibles (`body.is-admin .admin-only { display: inline-flex; }`)
- `#configTabBtn`: visible
- `#formReclamos`: visible

## 6. CSS admin-only

```css
/* components.css */
.admin-only { display: none; }
body.is-admin .admin-only { display: inline-flex; }

/* config tab button */
#configTabBtn { display: none; }  /* se setea inline via JS */
```

## 7. RLS Policies

Patrón general para tablas admin-write:
```sql
CREATE POLICY "{tabla}_select" ON {tabla} FOR SELECT TO authenticated USING (true);
CREATE POLICY "{tabla}_insert" ON {tabla} FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "{tabla}_update" ON {tabla} FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "{tabla}_delete" ON {tabla} FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```

Tablas que aplican: `parcelas`, `propietarios`, `gastos`, `flujo`, `noticias`, `documentos`, `proveedores`, `asambleas`, `asamblea_asistentes`, `encuestas`, `config`

### Excepciones (INSERT público)

**reclamos**:
```sql
CREATE POLICY "reclamos_insert" ON reclamos FOR INSERT TO authenticated USING (true);
```

**encuestas_votos**:
```sql
CREATE POLICY "encuestas_votos_insert" ON encuestas_votos FOR INSERT TO authenticated USING (true);
```

## 8. Jerarquía de permisos

| Operación | Admin | User autenticado | No autenticado |
|-----------|-------|------------------|----------------|
| Ver datos | ✅ | ✅ | ❌ |
| Crear gastos | ✅ | ❌ | ❌ |
| Crear noticias | ✅ | ❌ | ❌ |
| Crear movimientos flujo | ✅ | ❌ | ❌ |
| Crear documentos | ✅ | ❌ | ❌ |
| Crear proveedores | ✅ | ❌ | ❌ |
| Crear asambleas | ✅ | ❌ | ❌ |
| Crear encuestas | ✅ | ❌ | ❌ |
| Editar/Eliminar | ✅ | ❌ | ❌ |
| **Crear reclamos** | ✅ | ✅ | ❌ |
| **Votar encuestas** | ✅ | ✅ | ❌ |
| Ver Configuración | ✅ | ❌ | ❌ |
| Editar Configuración | ✅ | ❌ | ❌ |
| Admin bulk parcelas | ✅ | ❌ | ❌ |

## 9. Asignación de admin (SQL manual)

```sql
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@ejemplo.com';
```

**Post-requisito**: El usuario debe cerrar sesión y volver a iniciar para regenerar el JWT.

## 10. Seguridad

- **NUNCA** usar `user_metadata` para autorización (es editable por el usuario)
- **Siempre** usar `app_metadata` para roles
- RLS verifica: `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`
- JS verifica: `currentUser.app_metadata.role === 'admin'`
- Las Edge Functions (`create-user`, `delete-user`) se invocan desde cliente autenticado

## 11. Edge Functions

### create-user (al crear propietario)
```js
// En handleForm(), table === 'propietarios' && !isEdit && !DEMO_MODE
supabaseClient.functions.invoke('create-user', { body: data });
```
Crea auth user + registro propietarios + email invitación.

### delete-user (al eliminar propietario)
```js
// En deleteItem(), table === 'propietarios' && !DEMO_MODE
supabaseClient.functions.invoke('delete-user', { body: { propietario_id: id } });
```
Elimina auth user + registro propietarios.

## 12. Events

| Evento | Origen | Handler |
|--------|--------|---------|
| Login | `handleLogin()` | `supabaseClient.auth.signInWithPassword()` |
| Logout | `handleLogout()` | `supabaseClient.auth.signOut()` |
| Signup | `handleSignup()` | `supabaseClient.auth.signUp()` |
| Sesión restaurada | `getSession()` | `updateAuthUI()` |
| Auth state change | `onAuthStateChange` | `updateAuthUI()`, recarga tab |

## 13. Dependencias

- Requiere Supabase project con Auth habilitado (email/password)
- Requiere Edge Functions `create-user` y `delete-user` desplegadas (para gestión de propietarios)
- Las RLS policies dependen de que Supabase Auth esté configurado
