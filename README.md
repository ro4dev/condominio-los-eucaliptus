# Condominio Los Eucaliptus

Sistema de gestión y visualización de gastos comunes para el condominio. Los datos se cargan desde Google Sheets y se exponen vía Google Apps Script como web app.

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

- **Frontend**: HTML + Chart.js (servido por Apps Script)
- **Backend**: Google Apps Script (`Code.gs`)
- **Datos**: Google Sheets (una pestaña por módulo)
- **Formularios**: Google Forms para carga de datos

## Estructura

```
condominio-los-eucaliptus/
├── Code.gs                        # Backend Google Apps Script
├── index.html                     # Frontend (una sola página)
├── datos_gastos.json              # Datos demo: gastos comunes
├── datos_parcelas.json            # Datos demo: parcelas
├── datos_propietarios.json        # Datos demo: propietarios
├── datos_noticias.json            # Datos demo: noticias
├── datos_ingresos_egresos.json    # Datos demo: flujo de caja
├── datos_documentos.json          # Datos demo: documentos
├── datos_reclamos.json            # Datos demo: reclamos/sugerencias
├── datos_proveedores.json         # Datos demo: proveedores
└── datos_asambleas.json           # Datos demo: asambleas
```

## Arquitectura

### Backend (`Code.gs`)

El script expone una función `doGet()` que:

1. Recibe un parámetro `sheet` (nombre de la pestaña del Google Sheet)
2. Busca el archivo en una carpeta de Google Drive (configurada con `FOLDER_ID`)
3. Lee los datos de la primera pestaña del sheet
4. Normaliza los headers (minúsculas, sin tildes, espacios → guiones bajos)
5. Devuelve los registros como JSON

### Frontend (`index.html`)

SPA con dos modos de carga de datos:

- **Modo Demo** (por defecto): carga los archivos JSON locales (`datos_*.json`)
- **Modo Producción**: consulta la API de Apps Script

El modo se controla con el botón "Ir a modo demo / Salir de modo demo" y se persiste en `localStorage`.

## Setup

### Google Sheet

Crear un Google Sheet con las siguientes pestañas (una por módulo):

| Pestaña | Columnas sugeridas |
|---------|-------------------|
| `Gastos Comunes (respuestas)` | Fecha, Concepto, Descripción, Monto, Periodo, Parcela, Pagado |
| `Parcelas (respuestas)` | Número, Rol, Metros, Estado |
| `Propietarios (respuestas)` | Nombre completo, RUT, Parcela, Teléfono, Email, Tipo |
| `Noticias (respuestas)` | Título, Descripción, Fecha publicación, Fecha hasta |
| `Ingresos/Egresos (respuestas)` | Fecha, Tipo, Concepto, Descripción, Monto, Comprobante |
| `Documentos (respuestas)` | Nombre, Categoría, Fecha, Descripción |
| `Reclamos/Sugerencias (respuestas)` | Fecha, Tipo, Parcela, Asunto, Descripción |
| `Proveedores (respuestas)` | Rubro, Nombre, Teléfono, Email, Contacto, Observaciones |
| `Asambleas (respuestas)` | Fecha, Tipo, Temario, Acuerdos, Asistentes |

### Google Apps Script

1. En el sheet: **Extensiones → Apps Script**
2. Pegar el contenido de `Code.gs`
3. Configurar `FOLDER_ID` con el ID de la carpeta de Google Drive que contiene los sheets
4. **Desplegar → Nuevo despliegue → Web app**
   - Ejecutar como: `Yo`
   - Acceso: `Cualquier usuario`
5. Copiar la URL generada

### Google Forms (opcional)

Los formularios de Google Forms están vinculados en cada pestaña para facilitar la carga de datos. Las URLs están hardcodeadas en `index.html`.

### Producción

1. Reemplazar `API_URL` en `index.html` con la URL del despliegue de Apps Script
2. Desactivar el modo demo

## Funcionalidades

- **Gráficos interactivos**: barras por período, doughnut por parcela
- **Filtros**: por periodo y parcela en la pestaña de gastos
- **Skeletons**: estados de carga animados en todas las pestañas
- **Recarga**: botón de recarga por pestaña
- **Responsive**: diseño adaptable a móviles
- **Modo demo**: permite probar la interfaz sin backend
