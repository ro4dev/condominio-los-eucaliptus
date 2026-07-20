# Configuración Admin

## Qué es
Pestaña de configuración visible solo para administradores.

## Tablas involucradas
- `config` — store key-value para configuraciones

## Keys de config
- `montos` → `{"gasto_comun_base": N, "fondo_reserva": N}`
- `categorias_documentos` → `["Estatuto", "Actas", ...]`
- `rubros_proveedores` → `["Jardinería", "Limpieza", ...]`

## Funcionalidades
1. **Montos Base**: configurar gasto_comun_base y fondo_reserva
2. **Crear Parcelas**: creación masiva con prefijo + cantidad
3. **Categorías Documentos**: chips para agregar/quitar categorías
4. **Rubros Proveedores**: chips para agregar/quitar rubros
5. **Conceptos Ingreso/Egreso**: chips para agregar/quitar conceptos

## Cómo funciona
1. Tab visible solo si `IS_ADMIN = true`
2. Chips se guardan automáticamente al agregar/eliminar
3. Chips en uso muestran candado (no se pueden eliminar)
4. Montos y Parcelas en grid 2 columnas desktop, apilados mobile

## Permisos
- Solo admin puede ver y editar

## Propósito
Configuración centralizada de parámetros del sistema sin tocar código.
