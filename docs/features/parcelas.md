# Parcelas

## Qué es
Gestión de las parcelas (unidades habitacionales) del condominio y sus propietarios.

## Tablas involucradas
- `parcelas` — unidades del condominio
- `propietarios` — personas asociadas a cada parcela

## Campos parcelas
- `numero` (TEXT UNIQUE) — identificador de la parcela (ej: "1", "2A", "15")
- `rol` (TEXT) — rol de la propiedad (opcional)
- `metros` (NUMERIC) — superficie en m²
- `estado` (TEXT) — "Habitada", "Desocupada" o "En construcción"

## Campos propietarios
- `nombre_completo` (TEXT) — nombre del propietario/inquilino
- `rut` (TEXT) — RUT (opcional)
- `parcela_id` (UUID FK) — parcela asociada
- `telefono` (TEXT) — teléfono de contacto
- `email` (TEXT) — email de contacto
- `tipo` (TEXT) — "Propietario", "Inquilino" o "Administrador"

## Cómo funciona
1. Admin crea parcelas individualmente o en bulk (config page: prefijo + cantidad)
2. Se muestra grid de cards con datos de cada parcela
3. Cada card muestra propietarios asociados con联系方式
4. Permite renombrar parcelas en lote desde config

## Permisos
- SELECT: usuarios autenticados
- INSERT/UPDATE/DELETE: solo admin

## Propósito
Mantenimiento del directorio de parcelas y propietarios del condominio.
