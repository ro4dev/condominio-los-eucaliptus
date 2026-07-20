# Proveedores

## Qué es
Directorio de proveedores del condominio.

## Tablas involucradas
- `proveedores` — proveedores de servicios

## Campos
- `rubro` (TEXT) — área de servicio (Jardinería, Plomería, Electricidad, etc.)
- `nombre` (TEXT) — nombre o empresa
- `contacto` (TEXT) — persona de contacto
- `telefono` (TEXT) — teléfono
- `email` (TEXT) — email
- `web_instagram` (TEXT) — sitio web o Instagram
- `observaciones` (TEXT) — notas adicionales

## Cómo funciona
1. Admin crea proveedores via modal
2. Rubros con selector predefinido (configurables en config page)
3. Grid de cards con información de contacto
4. Links clickeables para teléfono, email y web

## Permisos
- SELECT: usuarios autenticados
- INSERT/UPDATE/DELETE: solo admin

## Propósito
Mantenimiento de directorio de proveedores para referencia y contacto.
