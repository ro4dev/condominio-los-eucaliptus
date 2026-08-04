# Auditoría de seguridad y plan de fixes — Condominio Los Eucaliptus

**Fecha**: 02/08/2026
**Alcance**: frontend estático (`index.html`, `js/`), migraciones SQL (`supabase/migrations/`), Edge Functions (`supabase/functions/`), `Code.gs`, `test.html`, config y README.
**Resultado**: 2 hallazgos críticos, 3 altos, 7 medios. Sin secretos filtrados (la única key en el repo es la anon, que es pública por diseño).

---

## Resumen ejecutivo

| Severidad | Cantidad | Tema |
|-----------|----------|------|
| 🔴 Crítica | 2 | Edge Functions sin autorización; contraseñas derivadas del RUT |
| 🟠 Alta | 3 | Votación manipulable; PII expuesta; stored XSS |
| 🟡 Media | 7 | Sin CSP/SRI; signed URLs 7 días; UPDATE sin WITH CHECK; rol stale; Code.gs; signup débil; .gitignore |

**Prioridad**: los 2 críticos son explotables por *cualquier usuario autenticado* y usan `service_role`. Corregir primero. Plan de fixes en la segunda mitad de este documento.

---

# Parte 1 — Hallazgos

## 🔴 CRÍTICAS

### C1. Edge Functions sin autorización (IDOR/BOLA con `service_role`)

**Archivos**: `supabase/functions/delete-user/index.ts`, `supabase/functions/create-user/index.ts`

Ninguna función valida que el llamador sea admin. El gateway de Supabase solo exige un JWT válido (default `verify_jwt = true`), y ese JWT lo tiene **cualquier usuario autenticado** (un residente que se registró).

- **`delete-user`** (`delete-user/index.ts:9`): recibe `propietario_id` y borra el propietario **y su cuenta auth** (`auth.admin.deleteUser`, `index.ts:37`) con `service_role`. Un atacante autenticado puede eliminar las cuentas y datos de cualquier vecino.
- **`create-user`** (`create-user/index.ts:9`): recibe `email`, `nombre`, `rut`, etc. y crea un usuario **confirmado** (`email_confirm: true`, `index.ts:31`) e inserta un propietario en cualquier `parcela_id`, todo con `service_role`.

**Impacto**: eliminación de cuentas ajenas, creación de cuentas falsas, inserción de propietarios en parcelas ajenas, y —combinado con la votación (A1)— manipulación de encuestas.

**Mitigación**: verificar rol admin a partir del JWT del llamador dentro de la función (nunca confiar solo en el gateway). Detalle en Fase 1 del plan.

### C2. Contraseñas predecibles + cuentas auto-confirmadas

**Archivo**: `supabase/functions/create-user/index.ts:20,31`

```ts
const password = rut.replace(/[\.\-]/g, '')  // la contraseña ES el RUT
```

- El RUT es un dato semi-público → cualquier cuenta creada por esta función es accesible por adivinación trivial.
- `email_confirm: true` omite la verificación del email → el atacante puede "tomar" el email de una víctima antes de que la registre.
- No hay política de contraseñas para el signup abierto (`supabase-config.js:138`).

**Mitigación**: password temporal aleatorio + obligar cambio, o usar `inviteUserByEmail`. Detalle en Fase 1.

---

## 🟠 ALTAS

### A1. Votación manipulable en encuestas

**Archivo**: `supabase/migrations/002_rls_policies.sql:219`

```sql
CREATE POLICY "encuestas_votos_insert" ON encuestas_votos
  FOR INSERT TO authenticated USING (true);
```

La política no valida el `parcela_id` contra el votante ni el `seleccion` contra las alternativas:

- Un usuario puede insertar votos con `parcela_id` de **parcelas ajenas** (vote stuffing) simplemente iterando IDs.
- `seleccion` es texto libre (no hay CHECK) → se pueden insertar opciones inexistentes.
- `UNIQUE(encuesta_id, parcela_id)` solo evita el doble voto por parcela, no por usuario.
- Combinado con C1 (create-user), un atacante puede crear propietarios vinculados a parcelas ajenas y votar por ellas.

**Nota**: la política usa `USING (true)` en un `FOR INSERT`. En PostgreSQL el check de INSERT es `WITH CHECK`; el efecto neto es "cualquier autenticado inserta lo que quiera". Lo mismo aplica a `reclamos_insert` (menos grave: un vecino puede atribuir el reclamo a otra parcela).

**Mitigación**: vincular `parcela_id` al propietario del usuario autenticado en `WITH CHECK`. Detalle en Fase 2.

### A2. Exposición de PII a cualquier usuario registrado

**Archivos**: `002_rls_policies.sql:41` (SELECT propietarios), `supabase-config.js:124` (signup abierto)

- `propietarios_select` otorga lectura total a todo `authenticated`: nombre, **RUT, teléfono y email** de todos los propietarios.
- El signup está abierto en la UI → cualquier persona con un email se registra, se autentica y lee los datos personales del condominio (más gastos, flujo, proveedores, etc.).

**Mitigación**: restringir campos/filas por rol (admin ve todo; usuario solo su parcela) y/o cerrar el signup público. Decisión de producto — opciones en Fase 4.

### A3. Stored XSS en campos no escapados (defensa en profundidad)

**Archivo**: `js/renderers.js` (+ `js/utils.js` para el helper)

La mayoría de campos se escapan con `escHtml`/`nl2br`, pero quedan rutas sin escapar:

| Ubicación | Campo | Problema |
|-----------|-------|----------|
| `renderers.js:146,153,155` | `p.numero`, `p.rol`, `p.estado` | texto crudo en `innerHTML` |
| `renderers.js:118-121` | `r.archivo` (href), `formatPeriodo(r.periodo)` | URL cruda; periodo sin escapar |
| `renderers.js:318` | `f.comprobante` (href) | URL cruda |
| `renderers.js:264` | `n.archivo` (href) | URL cruda |
| `renderers.js:358-361` | `d.categoria` (aria-label/title/meta), `d.archivo` | texto crudo |
| `renderers.js:422` | `p.web_instagram` (href) | permite `javascript:` |

Hoy los write-paths son admin-only, pero un admin comprometido (o un bypass tipo C1) convierte estos campos en XSS ejecutado en el navegador de **todos** los usuarios. Además, los `<a href>` con `javascript:` se ejecutan aunque estén escapados.

**Mitigación**: escapar todo + sanitizar URLs (solo `http`/`https`) con un helper `safeUrl()`. Detalle en Fase 3.

---

## 🟡 MEDIAS

### M1. Sin CSP ni SRI; dependencias sin fijar

**Archivo**: `index.html:11-22`

- Sin `Content-Security-Policy` (GitHub Pages no permite headers, pero CSP por `<meta>` sí).
- Scripts de CDN (jsdelivr, **`esm.run` sin versión** en `index.html:19`, Google Fonts) sin Subresource Integrity. Si un CDN se compromete, ejecuta código en la página.

### M2. Storage: signed URLs de 7 días persistidas en DB

**Archivo**: `js/supabase-config.js:223`

- `createSignedUrl(path, 7 días)` se guarda en `archivo`/`comprobante`. Cualquier autenticado (que lee la tabla) accede al archivo sin permisos de storage; y a los 7 días el link se rompe (disponibilidad).
- Las políticas de los buckets (`gastos_comunes`, `ingresos_egresos`, `documentos`) no están en el repo → no auditable.
- No se borra el objeto del bucket al editar/eliminar el registro (basura acumulada).

### M3. UPDATE policies sin `WITH CHECK`

**Archivo**: `002_rls_policies.sql` (todos los UPDATE)

`USING (admin)` sin `WITH CHECK`. El riesgo es bajo porque el `USING` no referencia filas, y PostgreSQL usa el `USING` como check por defecto en UPDATE; pero es mala práctica y rompe el patrón recomendado por Supabase.

### M4. Rol admin stale hasta el refresh del JWT

**Archivo**: `js/supabase-config.js:42`

`checkAdmin()` lee `app_metadata.role` del JWT. Un admin degradado conserva privilegios hasta que el token se refresca (~1h). Usar `app_metadata` (no `user_metadata`) es correcto; el staleness es inherente a JWT. Menor.

### M5. `Code.gs` legacy expone datos sin autenticación

**Archivo**: `Code.gs:3-10`

`doGet()` devuelve JSON de Google Sheets sin auth si se despliega con un `FOLDER_ID` real (hoy placeholder `'TU_FOLDER_ID'`). No lo usa el frontend → eliminar o documentar que es un prototipo descartado.

### M6. Signup con password débil

**Archivo**: `js/supabase-config.js:138`

Sin validación de fortaleza (solo el mínimo de Supabase, 6 caracteres). Combinado con el signup abierto (A2) y C2, es un vector más.

### M7. `.gitignore` mínimo y README desincronizado

- `.gitignore` solo contiene `.DS_Store`. La anon key es pública (ok, documentado en README), pero conviene blindar contra el futuro: si alguna vez se commitea una key real, no hay red de seguridad.
- `README.md:63-88` referencia migraciones `001–027` que no existen (la carpeta solo tiene `001` y `002`), y `README.md:156-157` dice `raw_user_meta_data.role` cuando el código usa `app_metadata` (corregido en CHANGELOG 19/07). Docs de seguridad desactualizados.

---

## ✅ Lo que está bien

- RLS habilitado en las 13 tablas; writes admin-only con check en `app_metadata` (no `user_metadata`).
- Sin `service_role`/secret keys en el repo (solo `Deno.env.get` dentro de las Edge Functions).
- `escHtml`/`nl2br` en la mayoría de campos de texto (reclamos, noticias, encuestas, proveedores).
- Firma de URLs en vez de buckets públicos; compresión de imágenes.
- `votarEncuesta` ya recibe índice en vez del texto de la opción (sin inyección en `onclick`).
- `test.html` es solo tests de funciones puras (sin datos sensibles).

---

# Parte 2 — Plan de fixes

**Reglas**: no modificar migraciones existentes → crear una nueva (`003_security_fixes.sql`). No romper modo demo ni producción.

## Fases en orden de prioridad

| Fase | Hallazgos | Riesgo | Esfuerzo |
|------|-----------|--------|----------|
| 1 | C1, C2 — Edge Functions | 🔴 Crítico | Medio |
| 2 | A1 — Votación manipulable | 🟠 Alto | Bajo |
| 3 | A3 — Stored XSS | 🟠 Alto | Medio |
| 4 | A2 — PII / signup abierto | 🟠 Alto | Decisión + medio |
| 5 | M2 — Storage | 🟡 Medio | Medio |
| 6 | M1 — CSP/SRI/deps | 🟡 Medio | Bajo |
| 7 | M3, M4, M5, M6, M7 — hardening | 🟡 Medio | Bajo |

## Fase 1 — Edge Functions con autorización (C1, C2)

### 1.1 Chequear admin en ambas funciones

Patrón a aplicar en `delete-user/index.ts` y `create-user/index.ts` (usando el JWT del llamador, **nunca** `service_role` para autorizar):

```ts
// 1. Cliente con el JWT del llamador para resolver su identidad
const supabaseUser = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
)

// 2. Autorización: solo admin
const { data: { user }, error } = await supabaseUser.auth.getUser()
if (error || !user || user.app_metadata?.role !== 'admin') {
  return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
}

// 3. Recién acá crear el cliente con service_role para la operación sensible
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
```

### 1.2 Contraseña no derivada del RUT (C2)

En `create-user/index.ts`, reemplazar:

```ts
const password = rut.replace(/[\.\-]/g, '')
```

por password temporal aleatorio y forzar cambio, o usar invite:

```ts
const tempPassword = crypto.randomUUID().replace(/-/g, '').slice(0, 12)
// createUser con email_confirm: true + password tempPassword
// Luego revocar password con admin.updateUserById(user.id, { password: null }) para forzar seteo
```

Alternativa preferida: `supabase.auth.admin.invokeUserByEmail(email)` (invitación por email, sin password en claro nunca).

### 1.3 Fijar `verify_jwt = true` en `supabase/config.toml`

El default ya es `true`, pero fijarlo explícitamente para que sobreviva a redeploys del CLI:

```toml
[project]
id = "kxacuszfhyhxngeazuze"

[functions.create-user]
verify_jwt = true

[functions.delete-user]
verify_jwt = true
```

### Verificación Fase 1
- Con un JWT de un usuario no-admin: `curl -X POST https://<ref>.supabase.co/functions/v1/delete-user -H "Authorization: Bearer <jwt>" -d '{"propietario_id":"<uuid>"}'` → debe responder **403**.
- Con JWT de admin → responde 200/404 (según el id), nunca borra de otro no-admin.
- Crear un usuario desde la UI como admin funciona; el password no es el RUT.

## Fase 2 — Votación manipulable (A1)

### 2.1 Nueva migración `supabase/migrations/003_security_fixes.sql`

Reescribir la política de insert de votos para que `parcela_id` pertenezca al votante (match por email contra `propietarios`):

```sql
-- VOTOS: el voto debe pertenecer a la parcela del usuario autenticado
DROP POLICY IF EXISTS "encuestas_votos_insert" ON encuestas_votos;

CREATE POLICY "encuestas_votos_insert" ON encuestas_votos
  FOR INSERT TO authenticated
  WITH CHECK (
    parcela_id = (
      SELECT propietarios.parcela_id
      FROM propietarios
      WHERE propietarios.email = auth.jwt() ->> 'email'
      LIMIT 1
    )
  );
```

Fijar también la sintaxis de `reclamos_insert` (mismo `USING (true)` confuso → `WITH CHECK (true)`), manteniendo la intención de "cualquier autenticado puede reclamar":

```sql
DROP POLICY IF EXISTS "reclamos_insert" ON reclamos;

CREATE POLICY "reclamos_insert" ON reclamos
  FOR INSERT TO authenticated
  WITH CHECK (true);
```

> Nota: si el producto quiere reclamos anónimos, `WITH CHECK (true)` es correcto. Si quiere atribuir el reclamo al autor, aplicar el mismo binding por parcela del voto.

### Verificación Fase 2
- Con usuario A logueado, intentar `insert into encuestas_votos (encuesta_id, parcela_id, seleccion)` con `parcela_id` de otra parcela → **violación de política**.
- Con su propia parcela → insert OK.
- `votarEncuesta()` (UI) sigue funcionando porque ya envía su propio `parcela_id` (`renderers.js:660`).

## Fase 3 — Stored XSS (A3)

### 3.1 Helper `safeUrl()` en `js/utils.js`

Permitir solo protocolos seguros:

```js
function safeUrl(u) {
  if (!u) return '';
  var s = String(u).trim();
  if (/^(https?:|#|\.\.?\/|\/|data:image\/)/i.test(s)) return s;
  return '';
}
```

### 3.2 Aplicar en `js/renderers.js`

- Envolver **todas** las URLs en `href` con `safeUrl()`:
  - `renderers.js:121` `r.archivo`
  - `renderers.js:264` `n.archivo`
  - `renderers.js:318` `f.comprobante`
  - `renderers.js:354` `d.archivo`
  - `renderers.js:422` `p.web_instagram` (y renderizar solo el texto si `safeUrl` devuelve vacío)
- Escapar campos faltantes con `escHtml()`:
  - `renderers.js:146` `p.numero`, `:153` `p.rol`, `:155` `p.estado`
  - `renderers.js:358-361` `d.categoria` (aria-label, title y `doc-meta`)
  - `formatPeriodo(r.periodo)` en la tabla de gastos: escapar la salida o hacer que `formatPeriodo` escape (cuidado: también se usa en selects/options; verificar que no rompa `fillFilters`).

### Verificación Fase 3
- En `test.html` agregar asserts de `safeUrl` (`javascript:alert(1)` → `''`, `https://x` → `https://x`).
- Insertar en modo demo un documento con `categoria = "<img src=x onerror=alert(1)>"` y una noticia con `archivo = "javascript:alert(1)"` → render sin ejecutar nada.

## Fase 4 — PII y signup abierto (A2) — requiere decisión

El modelo de acceso es una decisión de producto. Opciones:

**A. Cerrar signup público (recomendado)**
- Ocultar/eliminar "Crear cuenta" de `index.html` y `showSignupForm()` en `supabase-config.js`.
- Las cuentas se crean solo por admin vía `create-user` (ya existe la UI en `modals.js:193`).
- Reduce drásticamente la superficie: sin cuentas self-registradas, menos PII expuesta y menos abuso de C1/A1.

**B. Limitar lectura de PII**
- `propietarios_select` deja de dar RUT/telefono/email a todo `authenticated`:
  - Admin (`app_metadata.role = 'admin'`): ve todo.
  - Usuario: solo los propietarios de **su** parcela (mismo join por email), o solo campos no sensibles.
- Ajustar `showPropietarios()` (`renderers.js:165`) que hoy muestra teléfono/email/RUT.

**C. Ambas (máxima protección)**

> ⚠️ Requiere definir con el usuario qué ven los vecinos. No implementar sin confirmación.

### Verificación Fase 4
- Con una cuenta nueva (o no-admin) el botón "Crear cuenta" no existe.
- SELECT de `propietarios` desde un usuario no-admin no devuelve filas de otras parcelas (o sin campos sensibles).

## Fase 5 — Storage (M2)

### 5.1 Guardar la ruta del objeto, firmar al renderizar
- En `supabaseUpload` (`supabase-config.js:223`), devolver `{ path }` en vez de la URL firmada de 7 días.
- En renderers, al mostrar `archivo`/`comprobante`/`documentos`, generar signed URL con TTL corto (p.ej. 1 hora) y `cache` en memoria.
- Requiere distinguir en render si el valor es path o URL vieja (migrar filas existentes o detectar por prefijo).

### 5.2 Limpiar objetos huérfanos
- En `supabaseDelete` y en el edit de un registro con archivo, llamar `storage.from(bucket).remove([path])` con el path anterior.

### 5.3 Buckets auditable
- Mover las políticas de storage (`README.md:113-124`) a la migración `003_security_fixes.sql` (o una `004_storage.sql`) con `CREATE POLICY` sobre `storage.objects`.
- Validar tipo y tamaño de archivo antes de subir (hoy `accept="image/*"` es solo client-side; docs acepta cualquier cosa).

### Verificación Fase 5
- Subir archivo → en DB se guarda el path; el link renderizado funciona y expira en TTL corto.
- Eliminar un gasto con comprobante → el objeto desaparece del bucket.
- `supabase db advisors` sin warnings de storage.

## Fase 6 — CSP / SRI / dependencias (M1)

### 6.1 CSP por meta tag en `index.html`
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdn.jsdelivr.net https://esm.run https://fonts.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src https://fonts.gstatic.com;
  img-src 'self' data: https://*.supabase.co;
  connect-src 'self' https://kxacuszfhyhxngeazuze.supabase.co wss://kxacuszfhyhxngeazuze.supabase.co;
  frame-ancestors 'none';
">
```
> ⚠️ Material Web inyecta styles por JS (`adoptedStyleSheets`) → probablemente necesite `style-src 'unsafe-inline'` o refinar. Probar en iPhone 12 Mini (el navegador del usuario) antes de soltar.

### 6.2 Fijar y verificar dependencias
- Importmap `index.html:19`: `"@material/web/": "https://esm.run/@material/web/"` → fijar versión: `https://esm.run/@material/web@<version>/`.
- Agregar SRI (`integrity` + `crossorigin`) a los scripts de jsdelivr cuando haya hash publicado; si no, self-hostear el bundle de `@material/web`.

### Verificación Fase 6
- Cargar la página en incógnito con y sin dark mode: nada bloqueado en consola.
- Verificar que los gráficos Chart.js y los `md-*` componentes funcionan (CSP no rompe Material Web).

## Fase 7 — Hardening (M3, M4, M5, M6, M7)

### 7.1 `WITH CHECK` en UPDATE policies (M3)
En `003_security_fixes.sql`, agregar `WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')` a todos los UPDATE admin (parcelas, propietarios, gastos, flujo, noticias, documentos, reclamos, proveedores, asambleas, asamblea_asistentes, encuestas, encuestas_votos, config).

### 7.2 Rol stale (M4)
Documentar (aceptable). Opcional: `checkAdmin()` puede validar con `getUser()` al detectar la pestaña config, o re-login al cambiar rol.

### 7.3 `Code.gs` (M5)
Eliminar el archivo (es un prototipo descartado, `FOLDER_ID = 'TU_FOLDER_ID'`) o moverlo a `docs/legacy/` con nota "no desplegar sin auth".

### 7.4 Password policy (M6)
- En `handleSignup` (`supabase-config.js:124`): validar min 8 caracteres + al menos un número antes de llamar a Supabase.

### 7.5 Docs y repo hygiene (M7)
- `README.md:156-157`: corregir `raw_user_meta_data.role` → `raw_app_meta_data`.
- `README.md:63-88`: alinear la lista de migraciones con la carpeta real (001, 002, 003) o regenerarla.
- `.gitignore`: agregar `js/supabase-config.local.js` como patrón de respaldo (sin mover la key actual, que es pública por diseño).

## Orden de ejecución sugerido

1. Fase 1 (crítico) → deploy Edge Functions + config.toml
2. Fase 2 → migración SQL + verificación RLS
3. Fase 3 → helpers + renderers + tests
4. Fase 4 → **preguntar al usuario** el modelo de acceso antes de tocar RLS de propietarios/signup
5. Fases 5-7 → cuando aplique

## Verificación global (antes de cerrar)

- `supabase db advisors` sin issues.
- Probar login como no-admin: no puede votar por otras parcelas, no ve PII ajena, no puede invocar create/delete-user.
- Probar admin: todo el CRUD sigue funcionando.
- `test.html` con asserts nuevos (safeUrl, escapar campos).
- Modo demo intacto (los fixes de RLS/storage no tocan `data/`).

## Detalle por archivo

| Archivo | Hallazgos | Fix |
|---------|-----------|-----|
| `supabase/functions/create-user/index.ts` | C1, C2 | Fase 1 |
| `supabase/functions/delete-user/index.ts` | C1 | Fase 1 |
| `supabase/config.toml` | C1 | Fase 1 |
| `supabase/migrations/002_rls_policies.sql` | A1, A2, M3 | Fase 2, 4, 7 (vía nueva migración) |
| `js/renderers.js` | A3 | Fase 3 |
| `js/utils.js` | A3 | Fase 3 |
| `js/supabase-config.js` | M2, M4, M6 | Fase 5, 7 |
| `index.html` | M1 | Fase 6 |
| `Code.gs` | M5 | Fase 7 |
| `.gitignore`, `README.md` | M7 | Fase 7 |
