# Auditoría de cambios

## 1. Descripción general

Registra quién crea, edita o elimina qué en el sistema (INSERT / UPDATE / DELETE) desde la UI. Alcance elegido: **log en JS** (no triggers de BD) — registra las acciones que pasan por el frontend, que son las que la interfaz permite. No caza SQL directo ni cambios fuera de la app (limitación aceptada).

ID del tab donde se consulta: `config` (sección "Actividad", solo admin)
Estado global: `var AUDIT_LOG = [];` (demo: en memoria)

## 2. Schema SQL (migración nueva)

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tabla TEXT NOT NULL,
  accion TEXT NOT NULL CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  registro_id TEXT,
  datos JSONB,            -- snapshot del registro (solo UPDATE/DELETE)
  usuario TEXT,           -- email del usuario autenticado
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Lectura: solo admin
CREATE POLICY "audit_log_select" ON audit_log
  FOR SELECT TO authenticated
  USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- Escritura: cualquier autenticado (insert desde JS)
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
```

La política de INSERT con `WITH CHECK (true)` permite que el frontend inserte con la anon key; la integridad la da la UI (solo se inserta desde `logAudit`). Si se quisiera endurecer, se agrega la columna `usuario` y una política que verifique `auth.jwt() ->> 'email' = usuario`.

## 3. API en JS (`js/audit.js` nuevo, o funciones en utils.js)

### 3.1 `logAudit(tabla, accion, registro, usuario)`

```js
var AUDIT_LOG = [];  // en config.js, memoria de demo

function logAudit(tabla, accion, registro, usuario) {
  var entry = {
    tabla: tabla,
    accion: accion,
    registro_id: registro && registro.id ? String(registro.id) : null,
    datos: registro,
    usuario: usuario || (currentUser && currentUser.email) || 'anónimo',
    created_at: new Date().toISOString()
  };
  if (DEMO_MODE) {
    AUDIT_LOG.unshift(entry);
    return Promise.resolve();
  }
  if (!supabaseClient) return Promise.resolve();
  return supabaseClient.from('audit_log').insert(entry);
}
```

### 3.2 Puntos de inserción

| Punto | Acción | Dónde |
|-------|--------|-------|
| `handleForm()` — create (todos los módulos) | INSERT | modals.js, antes de `afterSave()` |
| `handleForm()` — edit | UPDATE | modals.js, antes de `afterSave()` |
| `deleteItem()` / `supabaseDelete` | DELETE | modals.js, tras confirmar |
| `bulkCreateParcelas()` | INSERT (masivo, 1 por parcela) | config-page.js |
| `saveConfig()` | INSERT/UPDATE (config) | config-page.js — **sí** (la config admin es sensible) |

En demo, `handleForm` también debe loguear (la memoria lo conserva mientras no se recargue).

### 3.3 Sanitización de PII

Antes de guardar `datos`, se eliminan campos sensibles para no duplicar PII en un log:

```js
var PII_FIELDS = ['rut', 'telefono', 'email'];
function sanitizeAudit(registro) {
  var copy = Object.assign({}, registro);
  PII_FIELDS.forEach(function(f) { if (f in copy) copy[f] = '[oculto]'; });
  return copy;
}
```

(En `propietarios`, `telefono`/`email`/`rut` quedan ocultos; en el resto de tablas no hay PII crítica.)

## 4. UI — sección "Actividad" en Configuración

Card nueva al final de `tab-config` (solo admin, como el resto de la pestaña):

```html
<div class="card" style="margin-bottom:1rem">
  <h4>Actividad reciente</h4>
  <div id="cfgAuditLog"></div>
</div>
```

`renderAuditLog()`:
- Carga `audit_log` (prod) o usa `AUDIT_LOG` (demo), ordenado por `created_at` desc, últimos 50.
- Filtro por tabla (chips o select): Todas / gastos / flujo / noticias / documentos / reclamos / proveedores / asambleas / encuestas / parcelas.
- Cada fila: `<fecha> · <usuario> · <ACCION> en <tabla> · registro <id>`.
- En UPDATE/DELETE, un ícono `info` abre modal con el `datos` (JSON formateado, sin PII — ya sanitizado).
- Empty state: `emptyState('Sin actividad registrada.')`.

## 5. Demo mode

- No toca Supabase. `logAudit` hace `AUDIT_LOG.unshift(entry)` en memoria.
- Se pierde al recargar la página (igual que el resto del demo).
- `renderAuditLog` en demo lee `AUDIT_LOG`.

## 6. Testeabilidad

Función pura extraíble: `sanitizeAudit`. Assert en `test.html`:

```js
var s = sanitizeAudit({ nombre: 'A', rut: '1-9', email: 'a@b.cl' });
assert(s.rut === '[oculto]' && s.email === '[oculto]' && s.nombre === 'A', 'sanitizeAudit oculta PII');
```

## 7. Reglas

- **No se registra**: lectura de datos, votos de encuestas (acciones masivas) — salvo decisión en §8.
- `usuario` = email de `currentUser`; si no hay sesión (no debería pasar, las escrituras requieren auth) se registra `anónimo`.
- Los errores de `logAudit` se loguean a console y **no bloquean** el flujo principal (log best-effort).
- **Limpieza**: el log crece; se documenta un cron/SQL de purga opcional (> 1 año) para la fase de prod.

## 8. Decisiones abiertas

- **Votos de encuestas**: **resueltos** — no se loguean. Son acciones masivas y el voto es anónimo respecto a la selección (una parcela = un voto, sin registro del contenido en el log). Si algún día se requiere comprobación de voto, se audita en la propia tabla `encuestas_votos` con RLS, no en `audit_log`.
- **¿Mostrar `datos` completos en la UI de actividad o solo un resumen?** Recomendado: solo el `datos` del UPDATE/DELETE tras el ícono `info` (el INSERT ya está en la tabla de origen).
