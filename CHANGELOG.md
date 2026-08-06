# Changelog

## Registro de cambios

### 05/08/2026 - Archivos demo reales (boleta y PDF)
- **Feat**: Los 23 `comprobante` del demo que tenían links fake de Google Drive ahora apuntan a `assets/demo_comprobante_transferencia.png` (imagen real de boleta/transferencia) — el click en "Ver"/ícono abre la imagen en pestaña nueva igual que en producción
- **Feat**: Los 7 documentos del demo llevan `archivo: assets/demo_documento.pdf` (PDF real de 1 página) — el ícono de ver documento abre el PDF en el visor del navegador
- **Feat**: Los 27 gastos del demo llevan `archivo: assets/demo_comprobante_transferencia.png` — la columna de la tabla de gastos comunes muestra la boleta
- **Style**: La columna de comprobante en la tabla de Gastos usa el mismo ícono `receipt` de Ingresos/Egresos en vez del texto "Ver" (`renderers.js`)
- **Style**: En los modales de editar Gasto y Movimiento, el "Archivo actual: ver" ahora usa el ícono `receipt` (`modals.js`)
- **Style**: El ícono `receipt` y el input de archivo comparten una fila (`.comprobante-row` en `components.css`) — input crece y el ícono queda a la derecha

### 05/08/2026 - Modo demo: fixes de guardado y subida de archivos en memoria
- **Fix**: Los botones "+ Agregar" admin aparecen tras iniciar sesión en demo — `checkAdmin()` en demo ahora llama `updateAuthUI()` (`supabase-config.js`)
- **Fix**: Guardar Gasto/Reclamo en demo ahora sí agrega/actualiza en los arrays — `tableToArray()` mapea `gastos` y `reclamos` (`modals.js`)
- **Fix**: Subir archivo en demo ya no aborta el guardado ni sube al storage real de producción — el upload queda limitado a `!DEMO_MODE` (`modals.js`)
- **Feat**: En demo los archivos se guardan localmente en memoria: se comprimen con `browser-image-compression` (mismos parámetros que producción) y se almacenan como blob URL (`blob:...`) en `archivo`/`comprobante` — no se toca el bucket de producción y el click en "Ver"/ícono abre la imagen en pestaña nueva igual que en producción (los `data:` quedan bloqueados por el navegador, los `blob:` no)
- **Feat**: El modo demo no re-fetchea tablas ya cargadas (`loadJson` usa `loaded[target]`), así lo guardado sobrevive al cambiar de pestaña; se resetea solo al recargar la página (`data.js`)

### 05/08/2026 - Espaciado uniforme entre campos de los forms en mobile
- **Fix**: En mobile los campos apilados dentro de un `.form-row` quedaban con 1.5rem de separación (margin del `.form-group` + gap del grid), más grande que entre los demás campos (1rem)
- **Fix**: `.form-row .form-group { margin-bottom: 0 }` y `margin-bottom: 1rem` en `.form-row` (`components.css`); gap del `.form-row` en mobile pasa de `0.5rem` a `1rem` (`layout.css`). Desktop sin cambios

### 05/08/2026 - Tooltip del gráfico de torta con separador de miles consistente
- **Fix**: El tooltip del doughnut (Ingresos/Egresos) mostraba el separador de miles con coma (`12,500`) por usar el formateo por defecto de Chart.js; ahora usa `formatMoney` (`$12.500`) como el resto del sitio (`charts.js`)

### 05/08/2026 - Popups ya no se cierran al hacer click fuera
- **UX**: Los popups (`md-dialog`) ya no se cierran al hacer click fuera de su área — evita perder datos tipeados por accidente. Aplica a todos: forms, confirmaciones y login
- **Feat**: `patchScrimClose()` en `modals.js` anula `handleDialogClick`/`handleCancel` del prototype de `md-dialog` (bloquea el cierre por backdrop pero preserva Escape y los botones), invocado desde `openModal()` y `showConfirm()`
- **Note**: No existe atributo `scrimClickAction` en `@material/web@2.5.0` (verificado en source); el cierre por click fuera lo maneja el componente con dos rutas (click en backdrop + evento nativo `cancel`)

### 05/08/2026 - Ancho único de popups en desktop
- **Style**: Todos los popups de forms (Gastos, Parcelas, Propietarios, Noticias, Ingresos/Egresos, Documentos, Reclamos, Proveedores, Asambleas, Encuestas) usan un ancho fijo de `560px` en desktop (`#mainDialog`, media query `min-width: 701px` en `base.css`) — antes cada diálogo se autodimensionaba según su contenido
- **Style**: Se elimina la clase `modal-wide` (única excepción de ancho) y el parámetro `wide` de `openModal()` — todos los popups quedan con el mismo ancho
- **Chore**: Limpieza de parámetros `, true` huérfanos en las llamadas a `openModal` (`modals.js`)

### 04/08/2026 - Date picker M3 custom (rama experimental/datepicker-m3-custom)
- **Feat**: Los 4 campos de fecha (Noticias, Ingresos/Egresos, Asambleas, Encuestas) pasan de `md-filled-text-field type="date"` a un date picker M3 custom: campo filled con ícono calendario que abre un popup anclado al campo (`<dialog>` nativo `showModal()` con flip arriba/abajo según espacio) con calendario en español (meses y días en ES, semana L-D) y navegación de mes
- **Feat**: `dateFieldHtml()` en `modals.js` genera el campo (input display no-editable + hidden input con ISO + label flotante + estado de error), `openDatePicker()`/`renderDatePicker()`/`pickDate()` manejan el calendario
- **Style**: Estilos `.m3-date-group` (tokens M3 de filled field: `surface-container-highest`, línea 1px→3px en focus, label flotante) y `.date-picker-*` para el grid de días en `base.css`
- **Fix**: `dateFieldOk` acepta elemento o evento (antes crasheaba con `undefined.closest` al recibir el input desde `pickDate`/`dateFieldTyped`, dejando el dialog abierto y rompiendo selecciones posteriores)
- **Fix**: En `dateFieldHtml` el `<label>` vuelve a ir inmediatamente después del input display (el hidden input lo separaba y rompía el selector `.m3-date + .m3-date-label`, dejando el label centrado y superpuesto a la fecha)
- **Fix**: El popup ya no depende del idioma del browser/SO (antes el calendar nativo salía en inglés aunque el sitio es ES)
- **Note**: `md-datepicker` no existe en `@material/web` (verificado en source 2.5.0); el popup usa un `<dialog>` nativo `showModal()` (top layer, queda sobre el modal) con backdrop transparente y grid propio, sin dependencias nuevas

### 03/08/2026 - Copy de confirmación de borrado en Configuración
- **Fix**: Mensajes de confirmación de categorías, rubros y conceptos ya no dicen "pero quedarán sin X": como los items en uso muestran candado, no se pueden eliminar, así que el confirm solo aparece para items no usados (`config-page.js`)

### 02/08/2026 - Auditoría de seguridad + plan de fixes
- **Security**: Auditoría completa del sitio (frontend, RLS, Edge Functions, storage, Code.gs) documentada en `docs/audit/security.md`
- **Security**: 2 hallazgos críticos (Edge Functions `create-user`/`delete-user` sin autorización y con password derivada del RUT), 3 altos (votación manipulable, PII expuesta, stored XSS) y 7 medios
- **Docs**: Plan de fixes priorizado en 7 fases (con SQL y pasos de verificación) integrado en el mismo `docs/audit/security.md`

### 02/08/2026 - Iconos Material Symbols (Fase 8 auditoría)
- **Style**: Documentos: emojis por categoría reemplazados por Material Symbols (`book`, `description`, `contract`, `shield`, `map`)
- **Style**: Proveedores: emojis de contacto reemplazados por Material Symbols (`person`, `phone`, `mail`, `language`)
- **Style**: Propietarios: emojis reemplazados por Material Symbols (`phone`, `mail`, `badge`)
- **A11y**: Cada ícono lleva `aria-label` y `title` descriptivo
- **Docs**: Checklist de Fase 8 completado en `docs/audit/frontend-design.md`

### 02/08/2026 - Motion y foco accesible (Fase 7 auditoría)
- **Feat**: Bloque `@media (prefers-reduced-motion: reduce)` global en `base.css` — desactiva skeleton, `tabFadeIn`, snackbar y transiciones de tema para usuarios con "Reducir movimiento" activado
- **Feat**: Regla global `:focus-visible` con outline `--md-sys-color-primary` — indica el foco en navegación por teclado (antes no había ningún estilo de focus)
- **Docs**: Checklist de Fase 7 completado en `docs/audit/frontend-design.md`

### 02/08/2026 - Copy de botones (Fase 6 auditoría)
- **Style**: Botón de login "Entrar" → "Iniciar sesión" (`index.html`)
- **Style**: Botón de parcelas "Aplicar" → "Crear parcelas" con estado de carga "Creando..." (`config-page.js`)
- **Docs**: Specs `auth.md` y `config-admin.md` actualizadas; checklist de Fase 6 completado

### 02/08/2026 - Empty states unificados (Fase 5 auditoría)
- **Feat**: Componente `.empty-state` en `components.css` (borde punteado, ícono `inbox` y texto corto) + helper `emptyState(texto)` en `renderers.js`
- **Feat**: Empty state aplicado a las 9 listas: Gastos, Flujo, Noticias, Documentos, Reclamos, Proveedores, Asambleas, Encuestas y Parcelas (antes varias mostraban "Sin registros" a mano y Asambleas no tenía nada)
- **Style**: Sin botón en el empty state: cada pestaña ya tiene su "+ Agregar" en el header, y las Parcelas se crean desde Configuración
- **Docs**: Checklist de Fase 5 completado en `docs/audit/frontend-design.md`

### 02/08/2026 - Deuda técnica: código muerto eliminado (Fase 4 auditoría)
- **Refactor**: Selectores duplicados en `handleForm` unificados (`modals.js`)
- **Refactor**: Eliminado `var style` muerto en `renderNoticiaCard` (`renderers.js`)
- **Refactor**: Eliminada `getInitials` (`utils.js`) y sus asserts en `test.html`
- **Refactor**: `.flujo-card` renombrado a `.item-card` (usado en asambleas y encuestas; el flujo ya es tabla)
- **Refactor**: `.stat-card .value.green` usa el token `--color-positive` en vez del literal `#059669`
- **Style**: Eliminadas reglas muertas `#userInfo` (`layout.css`) y `.avatar*` (`components.css`, sin uso en HTML/JS)
- **Style**: Favicon emoji 🌳 agregado (SVG inline en `index.html`, placeholder hasta la Fase 9 de identidad)
- **Docs**: Checklist de Fase 4 completado en `docs/audit/frontend-design.md`

### 02/08/2026 - Contraste AA (Fase 3 auditoría)
- **Style**: `--text-muted` pasa de `var(--md-sys-color-outline)` a valor semántico custom: `#6b7280` en light (4.6:1) y `#9ca3af` en dark (6.9:1); el outline M3 no llegaba a AA en light
- **Style**: `#loginError` usa `var(--md-sys-color-error)` (rojo claro `#fca5a5` en dark, antes ilegible)
- **Style**: Watermark "TERMINADA" de encuestas cerradas usa `var(--md-sys-color-error)` con `opacity: 0.7` (rojo claro en dark; antes rojo oscuro fijo)

### 02/08/2026 - test.html arreglado (Fase 2 auditoría)
- **Fixed**: `test.html` volvió a correr los tests. Ahora incluye solo `js/utils.js` y prueba únicamente funciones puras
- **Fixed**: Eliminados los asserts de `SHEET_NAMES` (no existía), `toggleDemoMode` (recargaba la página en loop infinito), `DEMO_FILES` y `loaded` (dependían de `config.js`, que no aplica a tests de funciones puras)
- **Fixed**: Agregados asserts de `escHtml` y `nl2br` (regresión de la Fase 1)
- **Docs**: Checklist de Fase 2 completado en `docs/audit/frontend-design.md`

### 02/08/2026 - Seguridad: escape de contenido de usuario (XSS)
- **Fixed**: `nl2br` ahora escapa el texto antes de insertar `<br>` (`js/utils.js`)
- **Fixed**: Todos los campos de usuario se escapan con `escHtml` antes de inyectarse: noticias (título, descripción), flujo (concepto, descripción, tipo), documentos (nombre, descripción), reclamos (asunto, descripción, tipo), proveedores (rubro, nombre, contacto, teléfono, email, web, observaciones), asambleas (temario, acuerdos, tipo), encuestas (título, descripción, opciones), propietarios (nombre, tipo, teléfono, email, RUT)
- **Fixed**: `votarEncuesta` ahora recibe el índice de la opción en vez del texto (elimina la inyección de datos en `onclick`)
- **Docs**: Checklist de Fase 1 completado en `docs/audit/frontend-design.md`

### 31/07/2026 - Menú de usuario centralizado en el header
- **Changed**: Login, logout, modo demo y dark/light mode se centralizan en un único menú de usuario (`md-menu`) abierto desde el avatar (`#userMenuButton`) en la app bar
- **Changed**: `#userInfo`, `#loginBtn`, `#logoutBtn`, `#demoToggle` y `#themeToggle` eliminados del header; ahora son `#menuUserInfo` (email/Invitado), `#menuLogin`, `#menuLogout`, `#menuDemo` y `#menuTheme` (`md-menu-item`)
- **Style**: `positioning="fixed"` + `anchor-corner="end-end"`/`menu-corner="start-end"` para que el menú abra bajo el avatar alineado a la derecha (sin overflow en mobile)
- **Changed**: Labels dinámicos con `updateDemoMenu()` y `updateThemeMenu()`; helper global `setMenuHeadline(id, text)` en config.js
- **Docs**: Specs `auth.md` y `dark-light-mode.md` actualizadas

### 31/07/2026 - Header como app bar
- **Style**: El header sale del `.container` y pasa a ser una app bar full-width con `position: sticky` (fondo `--md-sys-color-surface-container`, borde inferior)
- **Style**: `#themeToggle` y `#userInfo` adaptados al nuevo fondo de surface (ícono `--md-sys-color-on-surface-variant`, círculo `surface-container-high`)
- **Docs**: Specs `auth.md` y `dark-light-mode.md` actualizadas

### 31/07/2026 - Tabla de gastos sin título; loader y doble submit
- **Style**: Quitado el título "Registros" de la tabla de gastos comunes; gráfico "Por parcela" renombrado a "Monto por parcela"
- **Fixed**: El loader `#modalLoading` ahora se muestra (estaba fuera de un slot de `md-dialog`) y el botón submit de los modales se deshabilita durante el guardado (el lookup lo buscaba dentro del form cuando estaba en `#modalFooter`); aplica también a login/signup y modales de config
- **Style**: Divider del listado de propietarios con nueva variable `--divider` (oscuro en light, blanco en dark); tipo de propietario pasa de `--text-muted` a `--text-2` (visible en dark)
- **Style**: Parcelas sin rol muestran "—" en vez de "XXXX-XXXX"; quitado el avatar circular del listado de propietarios
- **Fixed**: Correo del usuario logueado usa `--md-sys-color-on-primary` (adaptable a dark/light)
- **Fixed**: RUT y Email obligatorios en form de propietarios (requeridos por edge function `create-user`)
- **Docs**: Specs `gastos-comunes.md`, `ingresos-egresos.md` y `propietarios.md` actualizadas

### 31/07/2026 - Ingresos/Egresos como tabla
- **Changed**: El listado de movimientos pasa de cards (`flujo-card`) a tabla con columnas Fecha, Tipo, Concepto, Comprobante, Monto y Acciones
- **Changed**: `#flujoList` ahora es `.table-wrap` (scroll horizontal en mobile, min-width 640px); skeletons de fila en vez de cards
- **Docs**: Spec `ingresos-egresos.md` actualizada con el nuevo render

### 30/07/2026 - Theme toggle: fondo circular y color on-primary
- **Style**: `#themeToggle` ahora resalta sobre el header con fondo circular translúcido blanco, ícono en `--md-sys-color-on-primary` y state layers blancos (css/base.css)
- **Style**: En dark mode el ícono mantiene color blanco (specificity `header md-icon-button#themeToggle md-icon`)

### 21/07/2026 - Propietarios: editar/eliminar desde card; demo mode fixes
- **Feat**: Íconos ✏️ y 🗑️ en cada propietario dentro del card de parcela
- **Feat**: `formPropietarios` soporta edición (recibe objeto data)
- **Fixed**: Demo mode ahora guarda nuevos items en array (no solo log)
- **Fixed**: `tableToArray` incluye `propietarios` y `parcelas`
- **Changed**: Propietarios demo JSON ahora incluye `id`

### 21/07/2026 - Modal: sin cierre al click fuera; menos espacio en confirm
- **Changed**: Se desactiva el cierre del modal al hacer click fuera (ya hay botones Cerrar/Cancelar)
- **Style**: Sacado `margin-bottom` extra en mensaje de confirmación

### 21/07/2026 - Parcelas: editar y agregar propietario desde card
- **Feat**: Ícono ✏️ para editar parcela (formParcelas soporta edición)
- **Feat**: Botón `+` en card para agregar propietario con parcela pre-seleccionada
- **Removed**: Botón global "+ Agregar Propietario" de pestaña Parcelas

### 21/07/2026 - Cards: bordes izquierdos en Parcelas, Documentos y Proveedores
- **Style**: Parcelas borde lila `#8b5cf6`, Documentos azul `#3b82f6`, Proveedores ámbar `#f59e0b`

### 21/07/2026 - Modal footer customizable: botones en footer, no duplicados
- **Changed**: `openModal(title, html, footerHtml)` — footer configurable
- **Changed**: Todos los forms mueven Cancelar/Guardar al footer vía `form="modalForm"`
- **Changed**: `showConfirm` mueve botones al footer (body solo mensaje)
- **Style**: Footer buttons con `gap` y `flex: 1` (ancho completo)

### 21/07/2026 - Modal: responsive width, scrollbar estilizado
- **Changed**: Modal mide 500px en mobile, 600px en desktop (≥700px)
- **Style**: Scrollbar fino con `scrollbar-width: thin` y thumb `var(--text-muted)`

### 21/07/2026 - Modal: header fijo, scroll interno, botón Cerrar; fix editar archivo
- **Changed**: Modal con flex column, header y footer fijos, body scrollable
- **Feat**: Botón "Cerrar" centrado en footer del modal
- **Style**: Scrollbar fino con `scrollbar-width: thin`
- **Fixed**: `handleForm` no sobreescribe archivo si no se selecciona uno nuevo

### 21/07/2026 - Parcelas: botón mover a Config; Asambleas: Temario/Acuerdos como título
- **Removed**: Botón "+ Agregar Parcela" de pestaña Parcelas (se configura desde Configuración)
- **Changed**: "Temario:" y "Acuerdos:" en cards de asambleas ahora son título con contenido abajo

### 21/07/2026 - Encuestas: fin de día en fecha_termino y tiempo restante
- **Fixed**: `fecha_termino` se compara contra end of day (23:59:59) en hora local, no UTC
- **Feat**: Muestra tiempo restante ("2h 30m") si la encuesta cierra hoy
- **Changed**: `getTimeRemaining()` extraída a `utils.js` para reuso

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

### 20/07/2026 - Descripción de documentos en modal, iconos en cards
- **Changed**: Document cards: "Ver" reemplazado por iconos ⓘ (descripción) y 📄 (archivo)
- **Added**: `showDescripcion()` abre modal con descripción completa del documento
- **Removed**: Descripción inline truncada de las cards de documentos

### 20/07/2026 - CRUD admin: editar y eliminar registros
- **Added**: `supabaseUpdate()` y `supabaseDelete()` en supabase-config.js
- **Added**: `handleForm` ahora soporta UPDATE (detecta `data.id`) en todos los módulos
- **Added**: Formularios de Noticias, Flujo, Documentos, Proveedores, Asambleas, Encuestas aceptan datos para edición
- **Added**: Iconos ✏️ y 🗑️ visibles solo para admin en cards de esos 6 módulos
- **Added**: Funciones `editX()` y `deleteX()` por módulo, con confirmación y limpieza de datos relacionados (votos, asistentes)
- **Added**: `escHtml()` en utils.js para escape seguro de valores en formularios
- **Changed**: Al editar Encuesta, el modo de alternativas es estático (no editable si ya tiene votos)
- **Changed**: `showConfirm()` reemplaza `confirm()` nativo por modal HTML en todas las confirmaciones de eliminación y cierre de formularios
- **Fixed**: Demo mode update usa `Object.assign` para preservar campos no enviados en el form

### 20/07/2026 - Noticias: chips de filtro, encuestas: reorden de fechas
- **Added**: Noticias ahora tiene chips Vigentes/No vigentes/Todas (reemplaza toggle "Ver anteriores")
- **Changed**: Noticias: fecha inline con título, sin etiqueta "Publicado:", sin "Vigente hasta"
- **Changed**: Encuestas: fecha de publicación en header row (der), Termina + Quorum arriba de opciones, Total abajo a la der

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
