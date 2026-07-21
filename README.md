# Condominio Los Eucaliptus

Sistema de gestión y visualización de gastos comunes para el condominio. Backend en Supabase con frontend estático en GitHub Pages.

## Módulos

| Pestaña | Descripción |
|---------|-------------|
| **Gastos Comunes** | Gráficos y tabla de expensas por período y parcela. Filtros por periodo y parcela. |
| **Parcelas** | Listado de parcelas con datos catastrales, metros², estado y propietarios/asociados. |
| **Noticias** | Avisos activos del condominio con fechas de vigencia. |
| **Ingresos/Egresos** | Flujo de caja con tabla de movimientos, comprobantes y balance. Filtros por tipo. |
| **Documentos** | Repositorio de estatutos, actas, contratos, seguros y planos. Filtros por categoría. |
| **Reclamos/Sugerencias** | Registro de reclamos y sugerencias de los residentes. |
| **Proveedores** | Directorio de proveedores por rubro con datos de contacto. |
| **Asambleas** | Timeline de asambleas ordinarias y extraordinarias con temario, acuerdos y asistentes. Filtros por tipo. |
| **Encuestas** | Sistema de votación: propuestas con votos a favor/en contra, quorum opcional y fecha de término. |
| **Configuración** | Panel admin: montos base, creación masiva de parcelas, categorías de docs, rubros de proveedores y conceptos de ingreso/egreso. Solo visible para administradores. |

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
│   └── utils.js                   # Utilidades (formatMoney, etc.)
├── css/
│   ├── base.css                   # Reset y tipografía
│   ├── layout.css                 # Layout general
│   ├── components.css             # Componentes reutilizables
│   └── sections.css               # Estilos por sección
├── data/                          # JSON demo (modo demo)
│   ├── gastos.json
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
│   └── config.json
├── supabase/
│   ├── config.toml                # Configuración proyecto Supabase
│   └── migrations/                # Migraciones SQL
│       ├── 001_crear_tablas.sql
│       ├── 002_datos_ejemplo.sql
│       ├── 003_rls_auth.sql
│       ├── 004_fix_rls_select_policies.sql
│       ├── 005_block_inserts.sql
│       ├── 006_fix_asistentes_text.sql
│       ├── 007_fix_gastos_parcela.sql
│       ├── 008_gastos_parcela_text.sql
│       ├── 009_standardize_fields.sql
│       ├── 010_auth_insert_authenticated.sql
│       ├── 011_gastos_add_archivo.sql
│       ├── 012_storage_comprobantes.sql
│       ├── 013_storage_flujo_documentos.sql
│       ├── 014_fix_not_null_constraints.sql
│       ├── 015_gastos_drop_not_null_concepto.sql
│       ├── 016_config_admin.sql
│       ├── 017_fix_admin_rls_recursion.sql
│       ├── 018_grant_admin_tables.sql
│       ├── 019_revoke_custom_grants.sql
│       ├── 021_remove_condominio_config.sql
│       ├── 022_rename_montos_config.sql
│       ├── 023_parcela_foreign_keys.sql
│       ├── 024_roles_jwt.sql
│       ├── 025_fix_rls_policies.sql
│       ├── 026_fix_rls_correct.sql
│       └── 027_encuestas.sql
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

Luego ejecutar en **Supabase → SQL Editor** para habilitar subida/lectura:

```sql
CREATE POLICY "auth upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('gastos_comunes', 'ingresos_egresos', 'documentos'));

CREATE POLICY "auth select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('gastos_comunes', 'ingresos_egresos', 'documentos'));
```

### Modo Demo

Los formularios modales funcionan en ambos modos. En modo demo guarda en JSON local, en producción envía a Supabase.

## Funcionalidades

- **Gráficos interactivos**: barras por período, doughnut por parcela
- **Filtros**: por periodo y parcela en la pestaña de gastos
- **Chips de filtro**: en Reclamos, Ingresos/Egresos, Documentos y Asambleas
- **Chips de config**: gestión de categorías, rubros y conceptos con modal, guardado automático, indicador de uso
- **Skeletons**: estados de carga animados en todas las pestañas
- **Modal forms**: formularios de carga para cada módulo, con placeholders y campos obligatorios marcados con *
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
- Roles via JWT: `raw_user_meta_data.role = 'admin'`
- Asignar admin: `UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE email = 'email';`
- Auth via Supabase Auth (email/password)

## Notas

- `js/supabase-config.js` contiene las credenciales de Supabase y está commiteado intencionalmente (es la anon key, segura con RLS)
- Las migraciones SQL se ejecutan manualmente desde el SQL Editor de Supabase
