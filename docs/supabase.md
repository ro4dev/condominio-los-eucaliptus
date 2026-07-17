# Migración a Supabase

## Descripción

Reemplazar Google Sheets (DB) + Google Drive (storage) + Google Apps Script (backend) por Supabase, que ofrece PostgreSQL, autenticación, storage y API REST en un solo servicio.

## Problema actual

- Google Sheets no es una DB real (sin relaciones, sin tipos, sin índices)
- Google Apps Script tiene límites de ejecución y concurrencia
- Google Drive tiene URLs temporales
- No hay autenticación real en el dashboard
- Los Google Forms son incómodos para gestión de datos

## Qué resuelve Supabase

| Necesidad      | Solución Supabase                  |
|----------------|------------------------------------|
| Base de datos  | PostgreSQL real                    |
| API            | REST + GraphQL automático          |
| Auth           | Login con Google, email, etc.      |
| Storage        | Archivos con URLs permanentes      |
| Dashboard      | UI para manage datos               |

## Arquitectura propuesta

```
Usuario → Frontend (HTML/JS) → Supabase API
                                    ↓
                              PostgreSQL + Storage
```

### Eliminaría

- `Code.gs` (backend de Apps Script)
- Google Forms (reemplazados por formularios propios)
- Google Sheets (reemplazado por PostgreSQL)
- Google Drive (reemplazado por Supabase Storage)

### Estructura de tablas

```sql
-- Parcelas
CREATE TABLE parcelas (
  id SERIAL PRIMARY KEY,
  numero TEXT UNIQUE NOT NULL,
  rol TEXT,
  metros INTEGER,
  estado TEXT
);

-- Propietarios
CREATE TABLE propietarios (
  id SERIAL PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  rut TEXT,
  parcela_id INTEGER REFERENCES parcelas(id),
  telefono TEXT,
  email TEXT,
  tipo TEXT
);

-- Gastos comunes
CREATE TABLE gastos (
  id SERIAL PRIMARY KEY,
  parcela_id INTEGER REFERENCES parcelas(id),
  periodo TEXT NOT NULL,
  concepto TEXT,
  descripcion TEXT,
  monto NUMERIC,
  pagado BOOLEAN DEFAULT false,
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Ingresos/Egresos
CREATE TABLE flujo_caja (
  id SERIAL PRIMARY KEY,
  tipo TEXT CHECK (tipo IN ('Ingreso', 'Egreso')),
  concepto TEXT,
  descripcion TEXT,
  monto NUMERIC,
  comprobante_url TEXT,
  registrado_por TEXT,
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Noticias
CREATE TABLE noticias (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_publicacion TIMESTAMPTZ DEFAULT now(),
  fecha_hasta TIMESTAMPTZ
);

-- Documentos
CREATE TABLE documentos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT,
  archivo_url TEXT,
  descripcion TEXT,
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Reclamos/Sugerencias
CREATE TABLE reclamos (
  id SERIAL PRIMARY KEY,
  tipo TEXT CHECK (tipo IN ('Reclamo', 'Sugerencia')),
  parcela_id INTEGER REFERENCES parcelas(id),
  asunto TEXT,
  descripcion TEXT,
  fecha TIMESTAMPTZ DEFAULT now()
);

-- Proveedores
CREATE TABLE proveedores (
  id SERIAL PRIMARY KEY,
  rubro TEXT,
  nombre TEXT,
  telefono TEXT,
  email TEXT,
  contacto TEXT,
  observaciones TEXT
);

-- Asambleas
CREATE TABLE asambleas (
  id SERIAL PRIMARY KEY,
  tipo TEXT CHECK (tipo IN ('Ordinaria', 'Extraordinaria')),
  temario TEXT,
  acuerdos TEXT,
  asistentes TEXT,
  fecha TIMESTAMPTZ DEFAULT now()
);
```

## Pros

- **Solución todo-en-uno**: DB + auth + storage + API
- **Free tier generoso**: 500MB DB, 1GB storage, 50k usuarios/mes
- **PostgreSQL real**: relaciones, tipos, índices, consultas complejas
- **Auth integrado**: login con Google sin código extra
- **Dashboard admin**: para manage datos sin tocar código
- **Migración fácil**: tiene herramientas para importar desde CSV
- **API automática**: no necesitan backend custom
- **Persistencia real**: no se borra como los free tiers de Railway

## Contras

- **Rebuild completo**: hay que reescribir el frontend para usar la API de Supabase
- **Dependencia de un servicio**: si Supabase cae, todo cae
- **Curva de aprendizaje**: SQL, RLS (Row Level Security), etc.
- **Los formularios de Google Forms se pierden**: hay que crear formularios propios
- **Los datos existentes hay que migrar manualmente**

## Nivel de esfuerjo

**Alto** (~3-5 días)

- Configurar proyecto + tablas: 2-4 horas
- Migrar datos existentes: 2-4 horas
- Reescribir frontend (HTML → JS con Supabase client): 8-16 horas
- Crear formularios de carga: 4-6 horas
- Auth + testing: 2-4 horas

## Dependencias

- Se recomienda implementar `auth.md` primero si se mantiene el stack actual
- Si se migra a Supabase, el auth viene incluido
- Combina bien con la idea de eliminar Google Forms

## Requisitos

- **No requiere tarjeta de crédito** para el plan Free
- Solo la pide si se hace upgrade a Pro ($25/mes)

## Storage: Supabase vs Backblaze B2

Supabase Storage Free tiene solo 1GB. Para archivos pesados (documentos, comprobantes), conviene combinar con Backblaze B2:

| Servicio         | Uso                | Free tier                  | Tarjeta |
|------------------|--------------------|----------------------------|---------|
| **Supabase**     | DB + Auth + API    | 500MB DB, 50k usuarios     | No      |
| **Backblaze B2** | Archivos grandes   | 10GB + egress gratis       | No      |

### Arquitectura combinada

```
Usuario → Frontend (HTML/JS) → Supabase API (DB + Auth)
                                    ↓
                              PostgreSQL
                                    ↓
                         Backblaze B2 (archivos)
```

## Pricing (si se crece)

| Plan    | Precio    | DB          | Storage   |
|---------|-----------|-------------|-----------|
| Free    | $0        | 500MB       | 1GB       |
| Pro     | $25/mes   | 8GB         | 100GB     |
| Team    | $599/mes  | hasta 64GB  | 200GB     |

## Referencias

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Backblaze B2 Docs](https://www.backblaze.com/docs/cloud-storage)
