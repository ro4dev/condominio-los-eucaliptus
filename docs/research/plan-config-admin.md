# Plan: Página de Configuración (Admin)

## Obetivo

Crear una pestaña "Configuración" visible solo para administradores donde se pueda gestionar:
- Parcelas (creación masiva)
- Datos del condominio
- Montos base
- Categorías de documentos
- Rubros de proveedores
- Usuarios admin

## 1. Nueva tabla Supabase: `config`

```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Valores iniciales (seed data):

| key | value |
|-----|-------|
| `condominio` | `{ "nombre": "Condominio Eucaliptus", "direccion": "", "contacto": "" }` |
| `montos` | `{ "monto_mensual": 50000, "fondo_reserva": 15000, "moneda": "CLP" }` |
| `categorias_documentos` | `["Estatuto", "Actas", "Contratos", "Seguros", "Planos"]` |
| `rubros_proveedores` | `["Jardinería", "Limpieza", "Electricidad", "Plomería", "Seguridad", "Mantenimiento", "Otro"]` |

## 2. Nueva tabla: `admin_users`

```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Nuevos archivos

| Archivo | Qué hace |
|---------|----------|
| `js/config-page.js` | Lógica de la pestaña Configuración (carga, guardado, bulk parcelas) |
| `supabase/migrations/016_config_admin.sql` | Tablas `config` + `admin_users` + RLS + seed data |
| `data/config.json` | Datos de config para modo demo |

## 4. Cambios en archivos existentes

| Archivo | Cambio |
|---------|--------|
| `index.html` | Nueva pestaña "Configuración" (solo visible si es admin), contenido de la tab |
| `js/config.js` | Variable global `IS_ADMIN`, función `checkAdmin()` |
| `js/data.js` | `loadTabData` y `showSkeletons` con caso `config` |
| `js/supabase-config.js` | Función `checkAdmin()` consulta `admin_users` |

## 5. Funcionalidades de la pestaña

### 5.1 Parcelas (creación masiva)
- Input "Cantidad" (número) + "Prefijo" (texto, default "Parcela")
- Botón "Crear" → genera "Parcela 1" a "Parcela N" (o "1" a "N" si prefijo vacío)
- Lista de parcelas existentes con opción de editar nombre y eliminar
- Validación: no crear parcelas que ya existan

### 5.2 Condominio
- Form: nombre, dirección, contacto
- Botón "Guardar"

### 5.3 Montos base
- Form: monto mensual, fondo reserva, moneda (selector)
- Botón "Guardar"

### 5.4 Categorías de documentos
- Lista de chips editables
- Input + botón "Agregar" para nueva categoría
- Botón ✕ en cada chip para eliminar
- Guardar cambios

### 5.5 Rubros de proveedores
- Lista de chips editables
- Input + botón "Agregar" para nuevo rubro
- Botón ✕ en cada chip para eliminar
- Guardar cambios

### 5.6 Usuarios admin
- Lista de admins actuales con email
- Input email + botón "Agregar admin"
- Botón "Quitar" para cada admin
- No se puede quitar a sí mismo

## 6. Orden de implementación

1. Migración SQL (`016_config_admin.sql`)
2. JSON demo (`data/config.json`)
3. `js/config-page.js` — toda la lógica
4. `index.html` — tab + contenido
5. `js/data.js` — integrar carga
6. `js/config.js` + `js/supabase-config.js` — checkAdmin
7. CSS si hace falta (probablemente con componentes existentes)

## 7. Dependencias

- Supabase Auth ya configurado
- Tabla `config` creada y con seed data
- Tabla `admin_users` al menos con un admin inicial
- RLS: solo admins pueden leer/escribir `config` y `admin_users`
