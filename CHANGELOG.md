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

## Próximos pasos
- [x] Reorganizar CSS y JS en carpetas
- [x] Configurar Supabase (tablas, auth)
- [x] Migrar datos demo a Supabase
- [ ] Implementar auth (email/password o magic link)
- [ ] Habilitar INSERT con autenticación
- [ ] Evaluar storage para archivos (Supabase Storage)
