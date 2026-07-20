# Autenticación

## Qué es
Sistema de autenticación y control de roles.

## Implementación
- Supabase Auth (email/password)
- Rol admin via JWT `app_metadata.role` (no user_metadata por seguridad)

## Cómo funciona
1. Usuarios se registran/inician sesión via modal
2. Al loguearse, se obtiene sesión y se verifica role en `app_metadata`
3. `IS_ADMIN = true` si `app_metadata.role === 'admin'`
4. Admin se asigna manualmente via SQL:
   ```sql
   UPDATE auth.users 
   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb 
   WHERE email = 'email@ejemplo.com';
   ```
5. Después de asignar, usuario debe cerrar sesión y volver a entrar para regenerar JWT

## Seguridad
- **NUNCA usar `user_metadata` para autorización** — es editable por el usuario
- **Usar `app_metadata`** — no es editable por el usuario
- RLS policies: `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`
- JS: `currentUser.app_metadata.role`

## UI
- Botón "Iniciar sesión" / "Cerrar sesión" en header
- Email del usuario logueado visible
- Botones "+ Agregar" ocultos para no-logueados
- Botones "+ Agregar" admin-only (excepto Reclamos)
- Tab Configuración visible solo para admin

## Permisos por tabla
| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| Todas (excepto reclamos y encuestas_votos) | auth | admin | admin | admin |
| reclamos | auth | **auth** | admin | admin |
| encuestas_votos | auth | **auth** | - | admin |

## Propósito
Control de acceso por roles para proteger operaciones de escritura.
