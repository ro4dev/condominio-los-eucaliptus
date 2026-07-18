# Condominio Los Eucaliptus

Sistema de gestión y visualización de gastos comunes para el condominio. Backend en Supabase con frontend estático en GitHub Pages.

## Módulos

| Pestaña | Descripción |
|---------|-------------|
| **Gastos Comunes** | Gráficos y tabla de expensas por período y parcela. Filtros por periodo y parcela. |
| **Parcelas** | Listado de parcelas con datos catastrales, metros², estado y propietarios/asociados. |
| **Noticias** | Avisos activos del condominio con fechas de vigencia. |
| **Ingresos/Egresos** | Flujo de caja con tabla de movimientos, comprobantes y balance. |
| **Documentos** | Repositorio de estatutos, actas, contratos, seguros y planos. |
| **Reclamos/Sugerencias** | Registro de reclamos y sugerencias de los residentes. |
| **Proveedores** | Directorio de proveedores por rubro con datos de contacto. |
| **Asambleas** | Timeline de asambleas ordinarias y extraordinarias con temario, acuerdos y asistentes. |

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
│   └── asambleas.json
├── supabase/
│   ├── config.toml                # Configuración proyecto Supabase
│   └── migrations/                # Migraciones SQL
│       ├── 001_crear_tablas.sql
│       ├── 002_datos_ejemplo.sql
│       ├── 003_rls_auth.sql
│       ├── 004_fix_rls_select_policies.sql
│       └── 005_block_inserts.sql
└── test.html                      # Tests unitarios
```

## Setup

### Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Settings → API** y copiar URL y anon key
3. Pegarlas en `js/supabase-config.js`
4. Las migraciones se aplican automáticamente con la integración de GitHub

### Modo Demo

Los formularios modales funcionan solo en modo demo. En modo producción se usa Supabase directamente.

## Funcionalidades

- **Gráficos interactivos**: barras por período, doughnut por parcela
- **Filtros**: por periodo y parcela en la pestaña de gastos
- **Skeletons**: estados de carga animados en todas las pestañas
- **Modal forms**: formularios de carga para cada módulo
- **Recarga**: botón de recarga por pestaña
- **Responsive**: diseño adaptable a móviles
- **Modo demo**: permite probar la interfaz con JSON locales

## Seguridad

- RLS (Row Level Security) habilitado en todas las tablas
- Lectura pública (USING true) - se restringirá con auth
- Escritura bloqueada hasta implementar autenticación
- Anon key visible (diseño de Supabase, seguro con RLS)
