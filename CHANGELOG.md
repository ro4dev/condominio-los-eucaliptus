# Changelog

## Registro de cambios

### 03/07/2026 - Inicio del proyecto
- HTML monolítico con CSS y JS inline
- Backend: Google Apps Script (Code.gs)
- 8 módulos: Gastos, Parcelas, Noticias, Flujo, Documentos, Reclamos, Proveedores, Asambleas
- Google Forms para carga de datos

### 17/07/2026 - Documentación y planificación
- Carpeta docs/ con opciones de mejora (auth, S3, Supabase, Firebase, PocketBase, VMs gratis)
- Migración de JSONs a carpeta data/ (quitar prefijo datos_)
- README completo
- Decisión: migrar a Supabase
- Plan de reorganización: CSS 4 archivos, JS 5 archivos

### 17/07/2026 - Migración a Supabase
- **Added**: Supabase integration para backend de datos
- **Added**: Modal forms nativos para todos los módulos
- **Added**: Skeleton loading para tabla de registros y stats cards
- **Added**: Supabase database migrations (schema + seed data + RLS)
- **Fixed**: formatPeriodo ahora maneja fechas completas (YYYY-MM-DD)
- **Fixed**: Nombres de campos compatibles con Supabase (fecha, asistentes)
- **Fixed**: RLS policies con USING (true) en lugar de auth.role()
- **Changed**: Eliminado Google Apps Script backend
- **Changed**: Eliminados Google Forms (reemplazados por modales HTML)
- **Changed**: Frontend usa Supabase JS client para fetch de datos
- **Security**: RLS habilitado, lectura pública, escritura bloqueada hasta auth

### 17/07/2026 - Auth opcional y estandarización de campos
- **Added**: Autenticación opcional (email/password) via Supabase Auth
- **Added**: Login/logout UI con modal de login
- **Added**: Botones "+ Agregar" visibles solo para usuarios autenticados
- **Added**: Muestra email del usuario logueado en el header
- **Changed**: Campos estandarizados a snake_case en todo (JSON, JS, SQL)
- **Changed**: `parcela_id` (UUID) → `parcela` (texto) en propietarios y reclamos
- **Changed**: Eliminados fallbacks muertos (marca_temporal, metros2, prop.nombre)
- **Changed**: `fechaHasta` → `fecha_hasta`, `registradoPor` → `registrado_por`, `web/instagram` → `web_instagram`
- **Changed**: Form asistentes ahora acepta lista de parcelas (texto), no cantidad
- **Fixed**: Reload loaders para tabs cuenta y flujo
- **Fixed**: Gastos comunes muestra columna Parcela en modo prod

## Próximos pasos
- [x] Reorganizar CSS y JS en carpetas
- [x] Configurar Supabase (tablas, auth)
- [x] Migrar datos demo a Supabase
- [x] Implementar auth (email/password)
- [x] Habilitar INSERT con autenticación
- [ ] Evaluar storage para archivos (Supabase Storage)
