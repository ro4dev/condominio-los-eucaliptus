# Changelog

## Registro de cambios

### 18/08/2026 - Vista unificada de períodos: card periodo en curso + tabla histórica
- **Refactor**: La pestaña Finanzas ahora muestra el período vigente como card destacada (con stats, progress bar y acciones) y el resto de períodos en una tabla compacta dentro de un `.table-wrap`. Se elimina la tabla resumen anterior y la card separada de config
- **Changed**: Nueva función `renderHistoricoPeriodos()` que renderiza la tabla histórica (excluye el período vigente ya mostrado en la card)
- **Changed**: Eliminadas `renderResumenPeriodos()` y `renderListaPeriodos()`; la config de períodos (monto, fondo reserva) se muestra inline en la tabla (columna "Monto", solo admin)
- **Changed**: Acciones por fila: ver cuotas, ver movimientos, editar config (admin). Botón "Generar Cuotas" por período
- **Changed**: `showSkeletons('finanzas')` usa los nuevos IDs (`#historicoPeriodosSkeleton`, `#tableHistoricoPeriodos`, `#historicoPeriodosEmpty`)
- **Changed**: Títulos "Resumen por periodo" y "Configuración de períodos" movidos dentro de sus cards como `<h4>`
- **Removed**: Fila de totales de la tabla resumen (cada mes es independiente), CSS muerto `.resumen-totales`
- **Docs**: `README.md`, `docs/features/finanzas.md` y `docs/features/config-admin.md` actualizados

### 18/08/2026 - Unificación de períodos: config migrada de Configuración a Finanzas
- **Refactor**: La sección "Periodos de Cuota" (configuración de montos por período) se mueve de la pestaña **Configuración** a la pestaña **Finanzas**, debajo de la tabla resumen por período. El admin ahora configura montos y ve el resultado financiero en el mismo lugar, sin saltar entre pestañas
- **Changed**: Funciones `renderPeriodos`, `openModalPeriodo`, `savePeriodoForm` y `removePeriodo` migradas de `config-page.js` a `renderers.js`
- **Changed**: `renderFinanzas()` ahora llama `renderPeriodos()` al final
- **Changed**: `renderConfig()` ya no llama `renderPeriodos()`
- **Changed**: Card "Periodos de Cuota" eliminada del HTML de Configuración; nueva sección "Configuración de períodos" con clase `admin-only` en Finanzas
- **Docs**: `README.md`, `docs/features/config-admin.md` y `docs/features/finanzas.md` actualizados

### 15/08/2026 - Fase 7 auditoría: hardening (M3, M4, M5, M6, M7)
- **Security**: Nueva migración `supabase/migrations/007_update_with_check.sql` — las 11 UPDATE policies admin (parcelas, propietarios, gastos, flujo, noticias, documentos, reclamos, proveedores, asambleas, encuestas, config) ahora tienen `WITH CHECK (admin)` además del `USING`, cerrando la manipulación vía UPDATE (`asamblea_asistentes`/`encuestas_votos` no tienen UPDATE policy)
- **Security**: `Code.gs` (prototipo de Apps Script sin auth) **eliminado** del repo a pedido del usuario (M5)
- **Security**: Password policy en `create-user/index.ts`: la contraseña derivada del RUT debe cumplir mín. 8 caracteres + un número, si no responde 400. Con el signup cerrado (Fase 4), `handleSignup` quedó como código muerto y la validación vive server-side (M6)
- **Docs**: `README.md` corregido `raw_user_meta_data.role` → `raw_app_meta_data` y lista de migraciones alineada con la carpeta real (001 → 007)
- **Chore**: `.gitignore` agrega `js/supabase-config.local.js` como respaldo
- **Note**: Rol stale (M4) documentado como aceptable — el admin re-loguea tras asignar rol por SQL

### 15/08/2026 - Fase 4 auditoría: signup público cerrado (A2)
- **Security**: Se cierra el signup público (decisión de producto: los propietarios **siguen viendo** el directorio de contactos — RUT/teléfono/email — para poder contactarse; la protección es impedir que terceros se autoregistren). Botón "Crear cuenta" eliminado del login dialog (`index.html`)
- **Security**: Nueva migración `supabase/migrations/006_block_public_signup.sql` — trigger `BEFORE INSERT ON auth.users` que rechaza cualquier cuenta sin `app_metadata.role`. El signup vía API pública (anon key) no setea ese campo y falla server-side; ya no depende solo de ocultar el botón
- **Security**: `supabase/functions/create-user/index.ts` ahora setea `app_metadata.role = 'propietario'` al crear usuarios, requisito para que pasen el trigger
- **Note**: `showSignupForm()`/`handleSignup()` quedan como código muerto en `js/supabase-config.js` (archivo intocable por regla de credenciales); el vector queda cerrado igual por el trigger
- **Docs**: decisión y checklist Fase 4 actualizados en `docs/audit/security.md`

### 15/08/2026 - Fase 3 auditoría: stored XSS mitigado (A3)
- **Security**: Nuevo helper `safeUrl()` en `js/utils.js` para sanitizar URLs antes de ponerlas en `href`. En vez de la allowlist original del doc de auditoría (que rompía el demo con rutas relativas `assets/...` y URLs `blob:` del upload), **bloquea esquemas peligrosos**: `javascript:`, `vbscript:`, `file:` y `data:` no-imagen; permite http(s), rutas relativas, `#`, `data:image/` y `blob:`. Elimina caracteres de control/espacios antes de detectar el esquema (evita obfuscación tipo `java\nscript:`)
- **Security**: Todos los `href` de `js/renderers.js` con datos de usuario pasan por `safeUrl()`: `n.archivo` (noticias) y `d.archivo` (documentos) no renderizan el link si no es segura; `p.web_instagram` (proveedores) renderiza solo el texto escapado si no es segura
- **Security**: Los `href` de `js/modals.js` también pasan por `safeUrl()`: `data.archivo` (formGastos), `data.comprobante` (formFlujo), `data.archivo` (formDocumentos), `data.foto` (formPublicaciones), `p.comprobante` (popup de pagos) y `d.qr` de "Cómo pagar" (`safeUrl` + `escHtml` para el atributo `src`)
- **Security**: Escapados con `escHtml()` los campos que faltaban: `d.categoria` de documentos (`aria-label`, `title` y `doc-meta`) y `formatPeriodo(...)` en todos los renders de `renderers.js` (tabla resumen, popups de cuotas/movimientos, deuda y aviso de aumento) — `formatPeriodo` se mantiene puro, se escapa en el punto de render
- **Note**: `p.numero`/`p.rol`/`p.estado` de Parcelas ya estaban escapados; `r.archivo`/`f.comprobante` ya no existen (tabs fusionados en Finanzas)
- **Docs**: checklist Fase 3 marcado en `docs/audit/security.md` con la decisión de `safeUrl` documentada
- **Tests**: `test.html` suma 16 asserts de `safeUrl` → **149/149** (verificados en harness con los renderers reales: documento con `<img onerror>` sale escapado, `javascript:` no genera link, `assets/` y `https://` conservan link)

### 15/08/2026 - Fix: chips estandarizados de nuevo en todas las pestañas
- **Fix**: El merge `1d121ee` con origin/main había revertido parte del refactor de chips en `js/renderers.js` (volvieron `.reclamo-tipo`, `.proveedor-rubro` y pills inline), dejando chips con **2 alturas**: 22px (Comentarios, por `label-small`) y 26.39px (resto). Se re-aplica la estandarización en todo `renderers.js`
- **Changed**: `.chip` ahora fija `line-height: 1.25rem` (antes heredaba de `body`), así el alto es uniforme (~26.4px) sin depender del contexto (`css/sections.css`)
- **Refactor**: Se eliminan las clases muertas `.reclamo-tipo` y `.proveedor-rubro`; los pills "Periodo" de los modales de Finanzas pasan a `.chip chip-neutral`
- **Changed**: Los chips de estado de Parcelas/Gastos agregan variante neutra (`.chip-neutral`) para el caso "Pendiente" que antes usaba `surface-container-highest`
- **Fix**: El merge `1d121ee` también había revertido la **auditoría de DELETE** en `deleteItem` (`js/renderers.js`): borrar gastos, movimientos, parcelas, noticias, documentos, comentarios, asambleas, encuestas o proveedores ya no se registraba en "Actividad reciente". Se restaura `logAudit(table, 'DELETE', ...)` en los 3 caminos (demo, prod, delete-user de propietarios), igual que lo tenía la rama local

### 13/08/2026 - Chips de estado/etiqueta estandarizados
- **Changed**: Nuevo sistema de chips `.chip` + variantes de color (`.chip-positive`, `.chip-warning`, `.chip-error`, `.chip-primary`, `.chip-secondary`, `.chip-tertiary`, `.chip-neutral`) con tamaño uniforme (12px, padding 0.2rem 0.6rem) en **todas** las pestañas
- **Changed**: Reemplazados ~11 chips inline/duplicados por la clase estándar: Comentarios (reclamo/sugerencia), Proveedores (rubro), Ventas (producto/servicio y disponible/vendido), Asambleas (ordinaria/extraordinaria), Encuestas (abierta/cerrada, quorum, total), Gastos (pagado/pendiente), Flujo (ingreso/egreso), Parcelas (estado)
- **Changed**: Comentarios pasa de 11px (label-small) a 12px como el resto; quorum/total de Encuestas y tipo de Asambleas normalizan su padding (0.15/0.5 → 0.2/0.6)
- **Refactor**: Se eliminan clases sueltas y bloques inline de `renderers.js` (menos CSS duplicado); se borra `.timeline-tipo` que era código muerto

### 13/08/2026 - Ícono info en INSERT + demo auditable para infinite scroll
- **Changed**: El ícono `info` ahora aparece en **todas** las acciones (INSERT incluido) si tienen `datos` no vacíos (`js/config-page.js`)
- **Feat**: `data/audit_log.json` pasa de 11 a **37 entradas** para poder probar el infinite scroll en demo (2 chunks de 20)
- **Docs**: actualizado `docs/features/auditoria.md` (§8 resuelto: el `info` muestra datos de cualquier acción)

### 13/08/2026 - Actividad reciente en timeline con infinite scroll
- **Changed**: "Actividad reciente" (Configuración) deja de ser una fila de texto que se desbordaba en mobile y pasa a un **timeline** con ícono por acción (creó/actualizó/eliminó), usuario, tabla y fecha — funciona igual en desktop y mobile (`js/config-page.js`, `css/sections.css`)
- **Feat**: **Infinite scroll**: se cargan chunks de 20 registros al llegar al final (`IntersectionObserver` + sentinel); en prod usa `range()` de Supabase con filtro server-side, en demo se corta el array de `AUDIT_LOG`
- **Changed**: La tabla ahora muestra la etiqueta legible del módulo (ej: "Ventas") en vez del nombre interno (`publicaciones`)
- **Docs**: actualizado `docs/features/auditoria.md` con la decisión y la alternativa descartada (tabla con paginación)

### 13/08/2026 - Placeholder "Sin imagen" en Ventas
- **Feat**: Las publicaciones sin foto ahora muestran un placeholder (ícono `image_not_supported` + "Sin imagen") al mismo alto de 180px, manteniendo la grilla alineada y uniforme (`js/renderers.js`, `css/sections.css`)
- **Feat**: 2 publicaciones demo sin foto agregadas a `data/publicaciones.json` (Reparaciones de gasfitería y Maceteros de greda) para probar el placeholder
- **Docs**: decisión documentada en `docs/features/publicaciones-ventas.md` junto con la alternativa descartada (nunca mostrar foto en card, verla solo por ícono)

### 12/08/2026 - Demo Ventas con fotos de ejemplo
- **Feat**: Las 5 publicaciones demo en `data/publicaciones.json` ahora llevan foto con placeholders locales (`assets/demo_venta_mesa.svg`, `demo_venta_clases_ingles.svg`, `demo_venta_bicicleta.svg`, `demo_venta_jardinero.svg`, `demo_venta_sillon.svg`)
- **Feat**: La foto de cada card de Ventas ahora es clicable y abre un popup (`verFotoPublicacion`) con la imagen completa — reutiliza `openModal`, título de la publicación como encabezado

### 11/08/2026 - Pestaña Ventas: publicaciones de productos/servicios
- **Feat**: Nueva pestaña **Ventas** (`tab-publicaciones`, tab `publicaciones`) para que los vecinos publiquen ventas de productos y servicios dentro del condominio (`index.html`, `data.js`)
- **Feat**: Migración `004_publicaciones.sql` con tabla `publicaciones` (titulo, descripcion, categoria Producto/Servicio, precio, contacto, parcela_id, estado Disponible/Vendido, foto, usuario, created_at) y RLS: SELECT cualquier autenticado, INSERT cualquier autenticado (autor forzado por email), **UPDATE/DELETE el autor o admin**
- **Feat**: `renderPublicaciones()` en cards (`.publicacion-card`) con foto opcional, chips de categoría (Producto/Servicio) y estado (Disponible/Vendido), precio, parcela y contacto; ordenadas por `created_at` desc
- **Feat**: Doble filtro por chips: categoría (Todas/Productos/Servicios) y estado (Disponibles/Vendidos) — función pura `filtrarPublicaciones()` en `utils.js`
- **Feat**: Botón "Publicar Venta" para cualquier usuario autenticado; editar/eliminar **solo el autor o admin** (helper `ownActions`); modal `formPublicaciones` con foto opcional (storage bucket `publicaciones` en prod, blob URL en demo)
- **Feat**: `handleForm` registra `usuario` (email del autor) y audita INSERT/UPDATE vía `logAudit`; DELETE audita en `deletePublicacion`; tabla `publicaciones` agregada al filtro de "Actividad reciente"
- **Docs**: demo seed en `data/publicaciones.json` (5 entradas), entrada de ejemplo en `data/audit_log.json`, `test.html` con 7 asserts de `filtrarPublicaciones`

### 11/08/2026 - Auditoría de cambios (Configuración → Actividad reciente)
- **Feat**: Nueva migración `003_audit_log.sql` con tabla `audit_log` (tabla, accion INSERT/UPDATE/DELETE, registro_id, datos jsonb, usuario, created_at) y RLS: SELECT solo admin, INSERT usuarios autenticados
- **Feat**: API `logAudit(tabla, accion, registro, usuario)` en `js/audit.js` con `sanitizeAudit()` que oculta PII (rut, telefono, email) del payload auditado; los INSERT/UPDATE se loguean en `handleForm` (`auditSave`) y los DELETE en `deleteItem`
- **Feat**: Sección "Actividad reciente" en Configuración (`renderAuditLog`) con chips de filtro por tabla, fecha/hora, usuario, acción y botón ⓘ para ver los datos del cambio (UPDATE/DELETE)
- **Feat**: Demo seed en `data/audit_log.json` (11 entradas de ejemplo) que se carga en modo demo al abrir Configuración
- **Feat**: Se loguean también cambios de la propia configuración (`saveConfig`, `bulkCreateParcelas`) y encuestas en producción
- **Docs**: `test.html` con asserts de `sanitizeAudit`

### 09/08/2026 - Fix separadores de tablas + acceso rápido en Periodo en curso
- **Fix**: Las filas de las tablas (incluidos los popups de Cuotas/Movimientos) usaban `border-bottom: 1px solid var(--border-light)` (casi invisible: `#f5f7fa` light, `#111827` dark). Ahora usan `var(--divider)` (= `--md-sys-color-outline`: `#9ca3af` light, `#6b7280` dark), el mismo separador que ya usaba `.pago-row`, visible en ambos modos. Se aplica también al separador de la fila de totales (`css/components.css`)
- **Feat**: La card "Periodo en curso" ahora tiene los mismos 2 íconos 🧾 Cuotas / ⇅ Movimientos junto al título, para abrir el detalle del periodo vigente sin buscar la fila en la tabla resumen (`js/renderers.js`)

### 09/08/2026 - Finanzas: detalle del periodo en 2 popups (cuotas / movimientos)
- **Changed**: En la tabla "Resumen por periodo" cada fila ahora tiene **2 íconos**: 🧾 Cuotas (`verCuotasPeriodo`, icono `receipt_long`) y ⇅ Movimientos (`verMovimientosPeriodo`, icono `swap_vert`). Reemplazan al ícono único que abría el detalle combinado (`verPeriodo`/`resumenPeriodoDetail`). Cada popup muestra su resumen propio (Cuotas: esperado/recaudado/% — Movimientos: ingresos/egresos) y su tabla con acciones admin (`js/renderers.js`, `index.html`)

### 09/08/2026 - Fix Finanzas: contraste de sub-cards y loader que no desaparecía
- **Fix**: Los sub-cards de la card "Periodo en curso" usaban el mismo fondo que el card (`--md-sys-color-surface`); ahora usan `--surface-hover` y sin sombra, así se distinguen en light y dark (`css/components.css`)
- **Fix**: El loader de "Resumen por periodo" nunca desaparecía: `showSkeletons` destruía la `<table>` al reemplazar el contenedor, y en el primer render los skeletons quedaban como hermanos visibles de la tabla. Ahora skeleton, empty-state y tabla viven en contenedores separados (`#resumenPeriodosSkeleton`, `#resumenPeriodosEmpty`) que se muestran/ocultan sin destruir el DOM (`index.html`, `js/data.js`, `js/renderers.js`)

### 09/08/2026 - Finanzas: balance por periodo (rediseño del tab)
- **Changed**: El tab Finanzas pasa de "stats globales + filtro por periodo + tabla de cuotas + lista de movimientos" a un **balance por periodo**: una card "Periodo en curso" (recaudado, esperado, egresos, saldo y % de recaudación con barra de progreso) y una tabla resumen por periodo (Esperado / Recaudado / % / Egresos / Saldo) con un ícono 👁 que abre el **detalle del periodo en popup** (`verPeriodo`): resumen de montos + tablas de cuotas (con estado, pagos y acciones admin) y movimientos del periodo (`js/renderers.js`, `index.html`)
- **Removed**: Filtro de periodo `#finanzasPeriodoFilter`, chips Todos/Ingresos/Egresos de movimientos (`filterFlujo`/`flujoFilter`) y el gráfico "Monto por parcela" (`chartParcelas`/`renderParcelaChart`)
- **Changed**: "Ingresos vs Egresos por mes" ahora siempre muestra ambas líneas (sin filtrado por chips) (`js/charts.js`)
- **Feat**: Funciones puras nuevas en `utils.js`: `periodosFinanzas` (periodos con cuotas o movimientos, orden desc) y `saldoPeriodo` (ingresos − egresos del periodo)
- **Docs**: `test.html` con asserts de `periodosFinanzas` y `saldoPeriodo`

### 09/08/2026 - Cuotas y pagos: modelo de cobranza completo
- **Feat**: Nueva tabla `pagos` (`supabase/migrations/005_pagos.sql`): `gasto_id`, `parcela_id`, `periodo` (denormalizado), `monto`, `fecha`, `comprobante` + RLS (SELECT autenticado, INSERT/UPDATE/DELETE admin) y migración idempotente que convierte los `gastos` con `pagado='Sí'` en cuota + 1 pago
- **Feat**: Motor de pagos en `utils.js` (funciones puras): `getPagos`, `pagosDeGasto`, `sumPagosGasto`, `pagosDeParcela`, `pagoLegado`, `recaudadoGasto` y nueva semántica de `isPagado` (pagos registrados ≥ monto, con fallback a `pagado='Sí'` si no hay pagos). `recaudadoPorPeriodo` suma por `gasto_id` (funciona también en la vista de propietario)
- **Feat**: Saldo a favor: `deudaParcela` = `max(0, Σcuotas − Σpagos)` y `deudaPorPeriodo` absorbe el excedente de los periodos más recientes hacia atrás
- **Feat**: Tabla "Cuotas por parcela" con columna **Pagado** (`sumPagosGasto`), botón `verPagos` (modal con listado de pagos, comprobante y eliminar admin) y chip de estado en 3 niveles: **Pagado / Parcial / Pendiente** (`estadoChip`)
- **Feat**: Modal `formPago` (monto, fecha, comprobante) con prefill del saldo pendiente; `formPagoParcela` abre el pago del periodo más antiguo adeudado desde el modal de deuda de Home; botón "Registrar pago" solo admin (`modals.js`)
- **Feat**: "Generar Cuotas" (`formGenerarCuotas`): crea una cuota (y fondo reserva si aplica) por parcela para un periodo, respetando el configurador de periodos y sin duplicar parcelas que ya tienen cuota (`modals.js`, botón en pestaña Finanzas)
- **Feat**: Configurador de periodos en Configuración: card "Periodos de Cuota" con agregar/editar/eliminar (auto-save en `CONFIG.periodos`); periodos sin config usan el Monto Base (`config-page.js`)
- **Feat**: Aviso de aumento de cuota en Home (`renderAvisoAumento`): banner ámbar cuando el próximo periodo configura un total mayor que el vigente, con botón "Generar cuotas" para admin
- **Feat**: `formGastos` muestra hint con la cuota del periodo configurada y prefill automático del monto al crear (`modals.js`); gráfico "Recaudado vs Esperado" usa `recaudadoGasto`
- **Feat**: `data/pagos.json` generado (1.491 pagos para las cuotas `pagado='Sí'` del demo); `data/config.json` agrega `periodos` (incluye `2026-08` más alto para disparar el aviso de aumento)
- **Docs**: `test.html` ampliado a 116 asserts (pagos, saldo a favor, config de periodos, `siguientePeriodo`, `avisoAumento`)


### 09/08/2026 - Fix alineación de votos/porcentaje en Encuestas
- **Fix**: El conteo y porcentaje de cada opción se centran verticalmente junto al botón "Votar" (`inline-flex` + `align-items:center`), ya que antes el texto quedaba desalineado por la altura del `md-filled-button` (`js/renderers.js`)

### 09/08/2026 - Fix visibilidad barra de progreso de recaudación (Home)
- **Fix**: El fondo de la barra de progreso del Home pasa de `var(--border-light)` a `var(--border)`. En light era `#f5f7fa` (casi invisible sobre el card blanco) y en dark era `#111827` (idéntico al fondo del card). Ahora usa `#e5e7eb` / `#374151`, visible en ambos modos (`css/components.css`)

### 09/08/2026 - Pestaña Reclamos/Sugerencias renombrada a Comentarios
- **Changed**: La pestaña "Reclamos/Sugerencias" ahora se llama **Comentarios** (tab, aria-label, botón "Agregar Comentario", modal y empty state). Los chips internos de filtro (Reclamos/Sugerencias) se mantienen igual

### 09/08/2026 - Fix cards de documentos en mobile
- **Fix**: En mobile los cards de documentos ya no se desbordan del borde: `.doc-item` permite wrap, los botones (editar/eliminar/ver) bajan a su propia fila alineados a la derecha, y el nombre se trunca con elipsis (`css/sections.css`)

### 09/08/2026 - Espaciado de cards unificado
- **Fix**: Escala única de espaciado en todo el sitio: **1rem** entre cards apiladas y contenedores (stats, charts, tablas, filtros, home, config) y en gaps de grids; **1.2rem** de padding interno en cards. Se eliminó la mezcla de `0.5rem`/`1rem`/`1.5rem`
- **Changed**: Encuestas y Asambleas (`.item-card`), Reclamos (`.reclamo-item`) y Documentos en lista (`.doc-item`) pasan de `margin-bottom: 0.5rem` a `1rem` (antes se veían más compactos que Noticias); su padding interno pasa a `1.2rem`
- **Changed**: Gráficos y tablas de Finanzas unifican su ritmo a `1rem` (`.charts` gap y `margin-bottom`, chart full-width en `index.html`, `.table-wrap`) — antes usaban `1.5rem`, distinto a los indicadores (`css/sections.css`, `css/components.css`)
- **Changed**: Gaps de grids a `1rem`: Documentos (`.docs-grid` 0.5→1rem), morosos del Home (`.morosos-grid` 0.6→1rem); Proveedores (`.cards-grid`) ya usaba 1rem
- **Changed**: `margin-bottom` de `.news-card` se mueve del inline de `renderers.js` al CSS (mantiene 1rem) y `.skeleton-doc` pasa a `1rem` para igualar el nuevo ritmo de lista
- **Fix**: `.stats` con `margin-bottom: 1rem` (antes 1.5rem) para que el espacio sobre las cards "Recaudación del periodo" y "Cómo pagar" quede igual que el resto de los gaps del tab
- **Fix**: En el modal "Cómo pagar", las filas de datos (`.pago-row`) son más compactas: label a la izquierda y valor alineado a la derecha en una sola línea (hace wrap con `word-break: break-all`, sin sobreponerse); se quitaron los botones copiar individuales, queda solo "Copiar datos" del footer

### 08/08/2026 - Finanzas: pestaña unificada (reemplaza Gastos Comunes + Ingresos/Egresos)
- **Feat**: Nueva pestaña **Finanzas** (`tab-finanzas`, tab `finanzas`) que reemplaza a "Gastos Comunes" y "Ingresos/Egresos" (`index.html`, `data.js`). Dos botones admin: "Agregar Cuota" (`formGastos`) y "Agregar Movimiento" (`formFlujo`)
- **Feat**: Los ingresos por cuotas y fondo de reserva ahora se **derivan** de los gastos pagados (`recaudadoPorPeriodo`), no se cargan a mano: `data/ingresos_egresos.json` pierde los 162 ingresos de concepto `Cuotas`/`Fondo reserva` (quedan solo `Multa` y manuales) y `CONFIG.conceptos_flujo` deja de incluir esos conceptos; `formFlujo()` los filtra (mantiene el concepto actual al editar registros legacy)
- **Feat**: Stats de balance por periodo (`renderFinanzasStats`): Recaudado, Esperado, Recaudación % (verde ≥90, ámbar ≥60, rojo <60 — nuevo `.value.amber`) y Egresos; con filtro "Todos" acumula todo el historial
- **Feat**: Filtro único `#finanzasPeriodoFilter` controla stats, gráficos, tabla de cuotas y movimientos (los movimientos se filtran por el mes del periodo); `renderMovimientos()` mantiene los chips Todos/Ingresos/Egresos dentro del periodo
- **Feat**: Gráfico **"Recaudado vs Esperado por período"** (`renderRecaudadoChart` en `charts.js`): dos líneas por periodo (Esperado gris punteado, Recaudado primario) con relleno entre ambas; reemplaza el viejo "Monto por período". El gráfico "Ingresos vs Egresos por mes" ahora suma las cuotas derivadas + ingresos manuales por mes (`ingresosMes`) y cubre todos los periodos de gastos
- **Feat**: Tabla "Cuotas por parcela" con columna **Estado** (chip verde "Pagado" / ámbar "Pendiente", `estadoChip`) — el form de gastos ya marcaba el pago con su switch "Cuota pagada"
- **Feat**: Funciones puras nuevas en `utils.js`: `mesDeFecha` (normaliza DD/MM/YYYY e ISO a YYYY-MM), `ingresosDerivados`, `egresosMes`, `ingresosMes`; `egresosDelMes` ahora delega en `egresosMes`
- **Docs**: `test.html` con asserts de `mesDeFecha`, `ingresosDerivados`, `egresosMes`, `ingresosMes`

### 08/08/2026 - Home: listado de morosos rediseñado
- **Changed**: El card "Parcelas morosas" deja de repetir un botón "Cómo pagar" por fila. Ahora es un **grid de cards compactas** (`.morosos-grid`/`.moroso-card` en `components.css`, auto-fill con mínimo 135px: 2 cards por fila en mobile/iPhone, más en desktop) que aprovecha el ancho; ordenado por **número de parcela** (`morosos()` en `utils.js` ordena por el número extraído de `numero`). Cada card clicable muestra parcela, deuda total y cantidad de periodos adeudados
- **Changed**: Las cards "Recaudación del periodo" y "Cómo pagar" quedan **lado a lado en desktop** (`.home-duo`, 2 columnas) y apiladas en mobile; "Cómo pagar" se muestra arriba del listado de morosos, que ocupa todo el ancho
- **Feat**: Click en una parcela abre el modal `openDeudaParcela()` con el **desglose por periodo** (cada periodo adeudado con su monto, orden cronológico) y el total — el "Cómo pagar" se mantiene aparte en su card
- **Feat**: Nuevas funciones puras en `utils.js`: `periodosPendientes` (cantidad de periodos adeudados) y `deudaPorPeriodo` (desglose monto por periodo, agrupando los sin periodo)
- **Docs**: `test.html` ampliado con asserts de `periodosPendientes`, `deudaPorPeriodo` (incl. sin periodo y orden) y del orden natural por número de parcela

### 08/08/2026 - Home: balance, morosos y "Cómo pagar"
- **Feat**: Nueva pestaña **Home** (primer tab, activa por defecto). Reemplaza a Gastos Comunes como punto de entrada (`index.html`, `data.js`)
- **Feat**: Stats del periodo vigente (último `periodo` en GASTOS): Recaudado, Esperado, Egresos del mes y cantidad de morosos; para un propietario autenticado se calculan para **su** parcela (Pagado, Cuota, Estado Al día/Deudor, Deuda acumulada) via match email ↔ `propietarios.email` (`renderHome`, `miParcelaId` en `renderers.js`)
- **Feat**: Card "Recaudación del periodo" con barra de progreso (`.progress-track`/`.progress-fill`) coloreada por pct (≥90 verde, ≥60 ámbar, <60 rojo) y label "X% de las cuotas del periodo pagadas"
- **Feat**: Card "Parcelas morosas": admin ve todas con deuda acumulada ordenada desc; propietario ve su parcela (o "Tu parcela está al día"); sin login se oculta. Cada fila tiene botón "Cómo pagar" (`renderMorosos`)
- **Feat**: Card "Cómo pagar" siempre visible + modal `openComoPagar()` con monto adeudado, filas de transferencia copiables (`.pago-row`, botón copiar por fila), QR opcional y botón "Copiar todos los datos" (`navigator.clipboard` con fallback)
- **Feat**: Config → nueva card "Datos de Pago" (banco, tipo, número, RUT, titular, email, URL QR) que alimenta el modal de Home (`renderDatosPago`/`saveDatosPago` en `config-page.js`); demo seed en `data/config.json`
- **Feat**: Motor de deudores en `utils.js` (funciones puras): `isPagado`, `esperadoPorPeriodo`, `recaudadoPorPeriodo`, `pctRecaudado`, `pendientesDeParcela`, `deudaParcela`, `estadoParcelaPago`, `morosos`
- **Feat**: `data/gastos.json` normalizado con campo `pagado` (`"Sí"`/`"No"`): 141 registros "pendiente" (sin `archivo`) y 1.491 pagados — la columna ya existía en SQL, el demo ahora la usa
- **Feat**: Form de gastos ahora permite marcar "Cuota pagada" (switch `md-switch`, default No) al agregar/editar (`modals.js`)
- **Docs**: `test.html` con asserts de las funciones de deudores

### 08/08/2026 - Specs: Home + Finanzas unificado + deudores + auditoría + notificaciones
- **Docs (fase de diseño, sin código)**: se definieron 5 specs nuevas y se actualizó `config-admin.md`:
  - `docs/features/deudores.md` — motor de cobranza: normaliza `gastos.pagado` (la columna ya existe en SQL pero el demo la tiene codificada como texto "pendiente" en la descripción), y expone funciones puras `isPagado`, `esperadoPorPeriodo`, `recaudadoPorPeriodo`, `pctRecaudado`, `deudaParcela`, `estadoParcelaPago` y `morosos`
  - `docs/features/finanzas.md` — pestaña única Finanzas/Balance que reemplaza a Gastos Comunes + Ingresos/Egresos. Los ingresos por cuotas/fondo reserva se **derivan** de los gastos pagados (se elimina la carga manual duplicada en `flujo`); la tabla de cuotas por parcela queda como sección con columna Estado (chip Pagado/Pendiente); gráfico "Recaudado vs Esperado" por periodo
  - `docs/features/home.md` — nueva pestaña inicial: balance del periodo vigente con % de recaudación, listado de morosos (admin ve todos, propietario ve su parcela) y card "Cómo pagar" con datos de transferencia + QR estático (v1, desde `CONFIG.datos_pago`)
  - `docs/features/auditoria.md` — auditoría de cambios **log en JS** (sin triggers): tabla `audit_log`, API `logAudit()` con sanitización de PII, puntos de inserción en `handleForm`/`deleteItem`, y sección "Actividad reciente" en Configuración
  - `docs/features/notificaciones.md` — **diseño solamente** (sin email operativo): casos de uso, match email↔parcela como prerrequisito, canal in-app (tabla `notificaciones` + badge) recomendado como v1, y email vía Edge Function + Resend/SendGrid como fase B
  - `docs/features/config-admin.md` — nueva card "Datos de Pago" (banco, tipo, número, RUT, titular, email, QR) que alimenta el "Cómo pagar" de Home
  - `gastos-comunes.md` e `ingresos-egresos.md` marcados como deprecados (fusionados en `finanzas.md`)
- **Next**: implementación en modo demo (Home ✅ → Finanzas → Parcelas chip → auditoría), luego migración SQL (`audit_log`)

### 08/08/2026 - Proveedores: nombres completos en el demo
- **Style**: Los nombres de proveedores en `data/proveedores.json` pasan a formato nombre + apellido paterno + materno (ej: "Fernando Torres Aguilar" en vez de "Fernando Torres") — solo datos de demo, sin cambios de código

### 08/08/2026 - Documentos en grid de 2 columnas
- **Style**: La lista de Documentos pasa de `.cards-grid` (auto-fill, 3 por fila en desktop) a `.docs-grid` con exactamente 2 columnas en desktop (`repeat(2, 1fr)`) y 1 en mobile; el `.doc-item` pierde su `margin-bottom` dentro del grid (`css/sections.css`)

### 08/08/2026 - Gráficos de tendencia (línea/puntos)
- **Changed**: El gráfico "Monto por período" pasa de barras a línea con puntos (`renderPeriodChart` en `charts.js`) — mejor para leer la evolución/tendencia a lo largo de los 24 periodos; se mantiene el color primario y se actualiza en dark mode (`updateChartTheme`)
- **Feat**: Nueva pestaña Ingresos/Egresos con gráfico "Ingresos vs Egresos por mes" (`renderFlujoChart` en `charts.js`): dos líneas (verde `--color-positive` y rojo `--md-sys-color-error`) agrupadas por mes, que responde al filtro de chips (Todos/Ingresos/Egresos); se renderiza desde `renderFlujo`, actualiza colores en dark mode y usa todo el ancho en desktop (sin wrapper `.charts` de 2 columnas)

### 07/08/2026 - Columna de acciones admin con ancho mínimo
- **Fix**: En las tablas de Gastos, Parcelas e Ingresos/Egresos la columna de acciones admin (editar/eliminar) ya no se estira — se le aplica `width:1%;white-space:nowrap` en `<th>` y `<td>` (`renderers.js`, `index.html`)

### 07/08/2026 - Parcelas en modo tabla
- **Changed**: La pestaña Parcelas pasa de cards a tabla (`renderParcelas` en `renderers.js`) con columnas Parcela, Rol, Metros², Estado, Propietarios y acciones — mismo patrón que la tabla de Ingresos/Egresos (`.table-wrap`, scroll horizontal en mobile con `min-width:560px`)
- **Style**: Estado como chip coloreado con tokens de dark mode: Habitada verde (`--color-positive-*`), En construcción ámbar (`--color-extraordinaria-*`), resto gris (`surface-container-highest`)
- **Changed**: `#parcelasGrid` pasa de `.cards-grid` a `.table-wrap` (`index.html`) y el skeleton de la pestaña pasa de cards a filas (`data.js`)
- **Docs**: `docs/features/parcelas.md` actualizado (render, HTML, output y CSS classes)

### 07/08/2026 - Datos de prueba expandidos (60 parcelas y 2 años)
- **Feat**: `parcelas.json` pasa de 13 a 60 parcelas (Parcela 1-60, rol `00521-001` a `00521-060`) con estados variados (Habitada, En construcción, Baldío); se mantienen los IDs existentes de las primeras 13
- **Feat**: `propietarios.json` pasa de 16 a 67 propietarios (todos con id, RUT, teléfono y email generados)
- **Feat**: `gastos.json` pasa de 27 a 1.632 registros cubriendo 24 periodos (2024-08 a 2026-07): mensualidad por parcela por mes + fondo de reserva; montos históricos ($42.000 en 2024, $46.000 en 2025, $50.000 en 2026) y registros "pendiente" distribuidos
- **Feat**: `ingresos_egresos.json` pasa de 86 a 418 movimientos con 2 años de historia (egresos recurrentes de servicios/jardinería/limpieza/mantenimiento/seguros + ingresos por cuotas/fondo reserva/multas); todos llevan `comprobante: assets/demo_comprobante_transferencia.png`
- **Feat**: `noticias.json` pasa de 4 a 36 avisos (vigentes y vencidos) desde 2024-08
- **Feat**: `documentos.json` pasa de 7 a 18 (actas 2025-2026, contratos, pólizas, planos)
- **Feat**: `asambleas.json` pasa de 3 a 12 con `asamblea_asistentes.json` ampliado a 199 registros
- **Feat**: `encuestas.json` pasa de 2 a 6 (abiertas y cerradas) con `encuestas_votos.json` ampliado a 47 votos
- **Feat**: `reclamos.json` pasa de 5 a 15 (reclamos y sugerencias con fecha 2025-2026) y `proveedores.json` pasa de 7 a 10
- **Feat**: Gastos, noticias, movimientos, documentos, reclamos y proveedores del demo ahora llevan `id` (edit/eliminar en modo demo funciona por registro y no por lote)

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
