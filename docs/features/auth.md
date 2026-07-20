# Autenticación

## Qué es
Sistema de autenticación y control de roles.

## Implementación
- Supabase Auth (email/password)
- Rol admin via JWT `raw_user_meta_data.role`

## Cómo funciona
1. Usuarios se registran/inician sesión via modal
2. Al loguearse, se obtiene sesión y se verifica role en metadata
3. `IS_ADMIN = true` si `user_metadata.role === 'admin'`
4. Admin se asigna manualmente via SQL:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb 
   WHERE email = 'email@ejemplo.com';
   ```
5. Después de asignar, usuario debe cerrar sesión y volver a entrar para regenerar JWT

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
