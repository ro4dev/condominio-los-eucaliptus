# Condominio Los Eucaliptus

Sistema de gestión y visualización de gastos comunes para el condominio. Backend en Supabase con frontend estático en GitHub Pages.

## Módulos

| Pestaña | Descripción |
|---------|-------------|
| **Home** | Vista resumen: balance del periodo vigente (% de recaudación con barra de progreso), listado de parcelas morosas (admin ve todas, el propietario su parcela) y card "Cómo pagar" con datos de transferencia. Es la pestaña inicial. |
| **Finanzas** | Balance por periodo: card "Periodo en curso" (stats, progress bar, botones de cuotas/movimientos), gráficos "Recaudado vs Esperado" e "Ingresos vs Egresos por mes", tabla "Histórico de períodos" (Período, Monto config, Esperado, Recaudado, %, Saldo) con acciones para ver cuotas, movimientos y editar config. Admin: config de períodos (monto/fondo reserva), generar cuotas. Los ingresos por cuotas se derivan de los pagos registrados. |
| **Parcelas** | Listado de parcelas con datos catastrales, metros², estado y propietarios/asociados. |
| **Noticias** | Avisos activos del condominio con fechas de vigencia. |
| **Documentos** | Repositorio de estatutos, actas, contratos, seguros y planos. Filtros por categoría. |
| **Comentarios** | Registro de comentarios, reclamos y sugerencias de los residentes (filtros por tipo). |
| **Proveedores** | Directorio de proveedores por rubro con datos de contacto. |
| **Asambleas** | Timeline de asambleas ordinarias y extraordinarias con temario, acuerdos y asistentes. Filtros por tipo. |
| **Encuestas** | Sistema de votación: propuestas con votos a favor/en contra, quorum opcional y fecha de término. |
| **Ventas** | Publicaciones de productos/servicios entre vecinos: foto opcional, precio, contacto, estado Disponible/Vendido. Cualquier usuario autenticado publica; edita/elimina solo el autor o admin. |
| **Configuración** | Panel admin: montos base, datos de pago (Home → "Cómo pagar"), creación masiva de parcelas, categorías de docs, rubros de proveedores, conceptos de ingreso/egreso y **actividad reciente** (auditoría de cambios). Solo visible para administradores. |

## Stack

- **Frontend**: HTML + Chart.js + Supabase JS (estático en GitHub Pages)
- **Backend**: Supabase (PostgreSQL + PostgREST + Auth)
- **Datos**: Supabase Database
- **Formularios**: Modal HTML nativo

## Estructura

```
condominio-los-eucaliptus/
├── index.html                     # Frontend (una sola página)
├── js/
│   ├── config.js                  # Configuración global
│   ├── supabase-config.js         # Credenciales Supabase (no commitear)
│   ├── data.js                    # Carga de datos
│   ├── renderers.js               # Renderizado de cada módulo
│   ├── charts.js                  # Gráficos Chart.js
│   ├── modals.js                  # Formularios modales
│   ├── config-page.js             # Pestaña de configuración admin
│   ├── audit.js                   # Auditoría de cambios (logAudit, sanitizeAudit)
│   └── utils.js                   # Utilidades (formatMoney, etc.)├── css/
│   ├── base.css                   # Reset y tipografía
│   ├── layout.css                 # Layout general
│   ├── components.css             # Componentes reutilizables
│   └── sections.css               # Estilos por sección
├── data/                          # JSON demo (modo demo)
│   ├── gastos.json
│   ├── pagos.json
│   ├── parcelas.json
│   ├── propietarios.json
│   ├── noticias.json
│   ├── ingresos_egresos.json
│   ├── documentos.json
│   ├── reclamos.json
│   ├── proveedores.json
│   ├── asambleas.json
│   ├── asamblea_asistentes.json
│   ├── encuestas.json
│   ├── encuestas_votos.json
│   ├── publicaciones.json
│   ├── audit_log.json
│   └── config.json
├── supabase/
│   ├── config.toml                # Configuración proyecto Supabase
│   └── migrations/                # Migraciones SQL
│       ├── 001_tables.sql
│       ├── 002_rls_policies.sql
│       ├── 003_audit_log.sql
│       ├── 004_publicaciones.sql
│       ├── 005_pagos.sql
│       ├── 006_block_public_signup.sql
│       └── 007_update_with_check.sql
└── test.html                      # Tests unitarios
```

## Setup

### Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → API** y copiar URL y anon key
3. Pegarlas en `js/supabase-config.js`
4. Las migraciones se aplican automáticamente con la integración de GitHub

### Storage Buckets

Crear los siguientes buckets en **Supabase → Storage**, todos públicos:

| Bucket | Uso |
|--------|-----|
| `gastos_comunes` | Comprobantes de gastos |
| `ingresos_egresos` | Comprobantes de ingresos/egresos |
| `documentos` | Archivos adjuntos de documentos |
| `publicaciones` | Fotos de publicaciones de venta |

Luego ejecutar en **Supabase → SQL Editor** para habilitar subida/lectura:

```sql
CREATE POLICY "storage_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('gastos_comunes', 'ingresos_egresos', 'documentos', 'publicaciones'));

CREATE POLICY "storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('gastos_comunes', 'ingresos_egresos', 'documentos')
    AND auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  );

CREATE POLICY "storage_insert_publicaciones" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'publicaciones');
```

> Los buckets deben ser **no públicos** en el Dashboard (desmarcar "Public bucket").

### Modo Demo

Los formularios modales funcionan en ambos modos. En modo demo los cambios se guardan en memoria del navegador (los archivos se comprimen con `browser-image-compression` y se almacenan como blob URL, sin tocar el storage real) y se pierden al recargar la página; en producción envía a Supabase.

## Funcionalidades

- **Gráficos interactivos**: línea de recaudado vs esperado por período y línea de ingresos vs egresos por mes
- **Home / Cobranza**: balance del periodo vigente, % de recaudación, listado de morosos con deuda acumulada (saldo a favor aplicado automáticamente), aviso de aumento de cuota y modal "Cómo pagar" con datos de transferencia copiables
- **Finanzas**: balance por periodo — card "Periodo en curso" (recaudado, esperado, egresos, saldo, % de recaudación con barra de progreso), gráfico "Recaudado vs Esperado por período", ingresos derivados de los pagos registrados, tabla resumen por periodo con 2 íconos que abren popups separados: cuotas (monto/pagado/estado y botón "Ver pagos") y movimientos de caja del periodo; registro de pagos por cuota (monto, fecha, comprobante) y generación masiva de cuotas por periodo
- **Chips de config**: gestión de categorías, rubros y conceptos con modal, guardado automático, indicador de uso
- **Skeletons**: estados de carga animados en todas las pestañas
- **Auditoría de cambios**: Configuración → "Actividad reciente" registra INSERT/UPDATE/DELETE de todos los módulos (tabla, fecha, usuario, datos del cambio sanitizados), con filtros por tabla. Los datos quedan en memoria en modo demo y en la tabla `audit_log` en producción
- **Modal forms**: formularios de carga para cada módulo, con placeholders y campos obligatorios marcados con *
- **CRUD admin**: iconos ✏️ editar y 🗑️ eliminar en tablas/cards (Gastos, Parcelas, Noticias, Flujo, Documentos, Proveedores, Asambleas, Encuestas) — solo visible para admin
- **Confirmación modal**: todas las eliminaciones y cierre de formularios usan modal HTML en vez de `confirm()` nativo
- **Descripción en modal**: documentos con descripción larga la muestran en un popup al hacer clic en ⓘ
- **Confirmación de cierre**: advierte antes de cerrar un modal si hay datos ingresados
- **Recarga**: botón de recarga por pestaña
- **Responsive**: diseño adaptable a móviles (header, tabs, gráficos)
- **Modo demo**: permite probar la interfaz con JSON locales
- **Modo dark/light**: toggle en el header, persiste la preferencia en localStorage
- **Auth opcional**: login/logout, usuarios sin login ven datos, con login agregan

## Seguridad

- RLS (Row Level Security) habilitado en todas las tablas
- SELECT: requiere autenticación
- INSERT: solo admin (excepto reclamos y votos encuestas = usuario autenticado)
- UPDATE/DELETE: solo admin
- Roles via JWT: `raw_app_meta_data.role = 'admin'`
- Asignar admin: `UPDATE auth.users SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'email';` (re-loguear después)
- Auth via Supabase Auth (email/password)

## Notas

- `js/supabase-config.js` contiene las credenciales de Supabase y está commiteado intencionalmente (es la anon key, segura con RLS)
- Las migraciones SQL se ejecutan manualmente desde el SQL Editor de Supabase
