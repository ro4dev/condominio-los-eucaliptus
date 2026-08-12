# Publicaciones de Venta de Productos/Servicios

> **Estado**: Implementado — pestaña "Ventas" (Opción C: pestaña propia que reutiliza componentes).

## 1. Descripción general

Sección para que los vecinos publiquen ventas de productos o servicios dentro del condominio (ej: muebles en venta, clases particulares, flete, etc.). Cada publicación es un post con título, descripción, foto opcional, precio, estado, parcela y datos de contacto del publicador.

## 2. Decisiones tomadas

- **Pestaña propia "Ventas"** (Opción C): reutiliza el patrón de cards + chips + modal, con schema y contenedor propios.
- **Quién publica**: cualquier usuario autenticado (como Comentarios).
- **Edición/eliminación**: **el autor o admin** (columna `usuario` = email del autor; RLS con `auth.jwt() ->> 'email'`).
- **Foto**: opcional, subida a Supabase Storage bucket `publicaciones` (blob URL en demo).
- **Estado**: Disponible / Vendido, con chips de filtro.
- **Contacto**: campo libre del publicador (parcela + forma de contacto).

## 3. Schema SQL (migración 004_publicaciones.sql)

```sql
CREATE TABLE publicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  categoria TEXT NOT NULL CHECK (categoria IN ('Producto', 'Servicio')),
  precio NUMERIC,
  contacto TEXT,
  parcela_id UUID REFERENCES parcelas(id) ON DELETE SET NULL,
  estado TEXT NOT NULL DEFAULT 'Disponible' CHECK (estado IN ('Disponible', 'Vendido')),
  foto TEXT,
  usuario TEXT,               -- email del autor
  created_at TIMESTAMPTZ DEFAULT now()
);
```

RLS: SELECT cualquier autenticado; INSERT cualquier autenticado con `auth.jwt() ->> 'email' = usuario`; UPDATE/DELETE el autor o admin.

## 4. UI

- Tab `publicaciones` ("Ventas") con botón "Publicar Venta" (no admin-only).
- Filtros por chips: categoría (Todas/Productos/Servicios) y estado (Disponibles/Vendidos).
- Cards `.publicacion-card` con foto, chips de categoría/estado, título, descripción, precio, parcela y contacto.
- Acciones editar/eliminar solo visibles para el autor o admin (helper `ownActions`).

## 5. Demo mode

- `data/publicaciones.json` con 5 entradas de ejemplo.
- Fotos: blob URL (igual que el resto del demo).
- Auditoría: se loguea INSERT/UPDATE/DELETE en `AUDIT_LOG`.

## 6. Storage

- Bucket `publicaciones` (público) + política `storage_insert_publicaciones` para cualquier autenticado.
