# Modo Demo

## Qué es
Modo de demostración que carga datos de JSON sin tocar Supabase.

## Implementación
- Variable global `DEMO_MODE` en `js/config.js`
- Datos en `data/*.json`
- Toggle en header

## Archivos JSON
| Variable | Archivo |
|----------|---------|
| GASTOS | data/gastos.json |
| PARCELAS | data/parcelas.json |
| PROPIETARIOS | data/propietarios.json |
| NOTICIAS | data/noticias.json |
| FLUJO | data/flujo.json |
| DOCUMENTOS | data/documentos.json |
| RECLAMOS | data/reclamos.json |
| PROVEEDORES | data/proveedores.json |
| ASAMBLEAS | data/asambleas.json |
| ASAMBLEA_ASISTENTES | data/asamblea_asistentes.json |
| ENCUESTAS | data/encuestas.json |
| ENCUESTAS_VOTOS | data/encuestas_votos.json |

## Cómo funciona
1. Por defecto `DEMO_MODE = true`
2. Toggle "Salir de modo demo" / "Ir a modo demo" en header
3. En demo: carga JSON, formularios simulados (no guardan)
4. En prod: carga de Supabase, formularios envían a DB
5. Fechas en JSON: formato ISO `YYYY-MM-DD`

## Reglas
- **NUNCA** romper modo producción al editar archivos de demo
- `created_at` se genera solo en Supabase, no enviar en inserts

## Propósito
Permitir probar la UI sin configurar Supabase.
