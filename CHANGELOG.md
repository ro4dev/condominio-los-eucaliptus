# Changelog

## Registro de cambios

### 19/07/2026 - Corrección auth: usar app_metadata
- **Changed**: `checkAdmin()` lee `currentUser.app_metadata.role` en vez de `user_metadata`
- **Security**: Role admin se almacena en `raw_app_meta_data` (no user-editable)
- **Note**: Asignar admin: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'email';`

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

### 17/07/2026 - Upload de archivos y validaciones
- **Added**: Supabase Storage para archivos (3 buckets: gastos_comunes, ingresos_egresos, documentos)
- **Added**: Upload de fotos en form de gastos (comprobante de transferencia)
- **Added**: Upload de fotos en form de flujo (comprobantes)
- **Added**: Upload de archivos en form de documentos
- **Added**: Campo `archivo` en tabla gastos
- **Changed**: Campo "pagado" eliminado del form de gastos (queda en "No" por defecto)
- **Changed**: SQL NOT NULL en parcelas.metros, propietarios.parcela, proveedores.contacto
- **Fixed**: Form gastos carga parcelas automáticamente si no estaban cargadas
- **Fixed**: Validación `min="0"` en campos monto y metros (no acepta negativos)
- **Fixed**: Fecha se autogenera al guardar en noticias, documentos y reclamos
- **Fixed**: `registrado_por` se autellena con email del usuario en flujo

### 18/07/2026 - UX de formularios y responsive
- **Added**: Placeholders descriptivos en todos los campos de formulario
- **Added**: Indicador `*` en labels de campos obligatorios
- **Added**: confirmCloseModal() advierte si hay datos ingresados al cerrar modal
- **Added**: Loading spinner al enviar formularios
- **Added**: Upload de archivos organizado por carpeta (periodo, tipo, categoría)
- **Added**: Filtros chips en Reclamos/Sugerencias (Todos, Reclamos, Sugerencias)
- **Added**: Filtros chips en Ingresos/Egresos (Todos, Ingresos, Egresos)
- **Added**: Filtros chips en Documentos (Todos, Estatuto, Actas, Contratos, Seguros, Planos)
- **Added**: Filtros chips en Asambleas (Todos, Ordinarias, Extraordinarias)
- **Added**: Noticias ordenadas por fecha, con vista de noticias anteriores
- **Changed**: Rubro de proveedores cambiado de input a selector con opciones predefinidas
- **Changed**: Header responsive: email truncado en desktop, email y botones en filas separadas en mobile
- **Changed**: Campo concepto eliminado del form de gastos
- **Changed**: Campo asistentes de asambleas cambiado a selector múltiple con parcelas
- **Changed**: Campo web/instagram de proveedores cambiado de URL a text (acepta cualquier formato)
- **Changed**: Asambleas ordenadas por fecha, cards con borde coloreado por tipo
- **Changed**: Ingresos/Egresos cards con borde coloreado por tipo
- **Changed**: JSON demo actualizados con schema actual y formato ISO de fechas
- **Fixed**: Gastos valida parcelas duplicadas por periodo
- **Fixed**: Reclamos no envía columna `fecha` (usa `created_at`)
- **Added**: Modo dark/light con toggle, persistencia en localStorage

### 19/07/2026 - Página de configuración admin
- **Added**: Nueva pestaña "Configuración" visible solo para administradores
- **Added**: Creación masiva de parcelas (cantidad + prefijo)
- **Added**: Configuración de montos base (gasto común base, fondo reserva)
- **Added**: Gestión de categorías de documentos (agregar/quitar via modal)
- **Added**: Gestión de rubros de proveedores (agregar/quitar via modal)
- **Added**: Gestión de conceptos de ingreso/egreso (agregar/quitar via modal)
- **Added**: Gestión de usuarios admin (agregar por email, quitar)
- **Added**: Tabla `config` (key-value) y `admin_users` en Supabase
- **Added**: RLS para tablas config y admin_users (solo admins)
- **Added**: Chips en uso muestran candado (no se pueden eliminar)
- **Added**: Loader en todas las operaciones de guardado de config
- **Changed**: Datos del condominio hardcodeados en HTML (no en BD)
- **Changed**: Botones de config uniformes con estilo `btn-primary`
- **Changed**: Montos Base y Crear Parcelas lado a lado en desktop, apilados en mobile
- **Changed**: Estilos form-group, form-row, btn, btn-primary globales (no scopeados a modal-body)
- **Changed**: Chips se guardan automáticamente al agregar/eliminar (sin botón "Guardar" separado)
- **Changed**: Tab "Configuración" oculta por defecto, se muestra solo si el usuario es admin

### 19/07/2026 - Foreign keys UUID para parcelas
- **Changed**: Referencias de parcela migradas de texto a UUID (`parcela_id`)
- **Added**: Junction table `asamblea_asistentes` (reemplaza string comma-separated)
- **Added**: Helper `parcelName()` para resolver UUID a nombre
- **Changed**: Filtros, tablas, modals y charts usan `parcela_id` con UUID
- **Changed**: `renameParcelas()` solo actualiza `parcelas.numero` (ya no toca otras tablas)
- **Changed**: Demo JSONs actualizados con UUIDs
- **Changed**: Config de cantidad/prefijo de parcelas se guarda y carga de BD

### 19/07/2026 - Roles con Supabase Auth
- **Changed**: Rol admin detectado desde JWT (`raw_user_meta_data.role`) en vez de tabla `admin_users`
- **Added**: RLS corregido: SELECT autenticado, INSERT/UPDATE/DELETE admin (excepto reclamos INSERT = user)
- **Removed**: Tabla `admin_users` y toda su lógica en JS
- **Removed**: Función `is_admin()` (referenciaba admin_users)
- **Note**: Para asignar admin: `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'tu-email@ejemplo.com';` (re-loguear después)
- **Removed**: Sección de gestión de admins en página de configuración
- **Note**: Admin se asigna manualmente desde Supabase Dashboard → Auth → Users → Edit → user_metadata → `{ "role": "admin" }`

### 19/07/2026 - Sistema de encuestas
- **Added**: Nueva pestaña "Encuestas" con sistema de votación
- **Added**: Tabla `encuestas` (título, descripción, fecha_termino, quorum)
- **Added**: Tabla `encuestas_votos` (1 voto por parcela por encuesta)
- **Added**: Barra de progreso a favor/en contra
- **Added**: Filtros: Todas / Abiertas / Cerradas
- **Added**: Botones "A favor" / "En contra" (solo si está abierta y no votó)
- **Added**: Indicador de quorum alcanzado
- **Added**: Auto-cierre por fecha_termino
- **Added**: Admin puede crear encuestas via modal
- **Note**: RLS: SELECT autenticado, INSERT votos autenticado, INSERT/UPDATE/DELETE encuestas admin
- **Fixed**: Botones "+ Agregar" ahora son admin-only (excepto Reclamos que es para cualquier user autenticado)

## Próximos pasos
- [x] Reorganizar CSS y JS en carpetas
- [x] Configurar Supabase (tablas, auth)
- [x] Migrar datos demo a Supabase
- [x] Implementar auth (email/password)
- [x] Habilitar INSERT con autenticación
- [x] Evaluar storage para archivos (Supabase Storage)
- [x] Placeholders descriptivos en formularios
- [x] Indicador de campos obligatorios (*)
- [x] Validación antes de cerrar modal con datos
- [x] Header responsive (mobile)

### Bugs - Schema Supabase
- [x] Tabla `reclamos` no tiene columna `fecha` → eliminado de autoDateTables (usa created_at)
- [ ] Tabla `flujo` — revisar error al guardar con comprobante (columna archivo existe en schema)

### Gastos Comunes
- [x] Campo concepto eliminado
- [x] Validar parcelas duplicadas por periodo

### Noticias
- [x] Ordenar por fecha de publicación
- [x] Vista para ver noticias anteriores/vencidas

### Ingresos/Egresos
- [ ] Revisar que el popup se cierre correctamente al guardar

### Reclamos/Sugerencias
- [x] Chips/filtros: Todos, Reclamos, Sugerencias

### Proveedores
- [x] Campo web/instagram cambiado a text (accepts any format)

### Asambleas
- [x] Campo asistentes: selector múltiple con parcelas disponibles
- [x] Ordenar asambleas por fecha
