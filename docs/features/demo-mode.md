# Modo Demo

## Descripción general

Modo de operación que permite probar la aplicación sin necesidad de configurar ni conectar a Supabase. Todos los datos se cargan desde archivos JSON locales y las operaciones de escritura se realizan en memoria (arrays globales).

## Implementación

### Variable global
```js
var DEMO_MODE = localStorage.getItem('demoMode') !== 'false';
```
Por defecto `true`. Persiste en localStorage: si `demoMode` es `'false'` → modo producción; cualquier otro valor (o null) → modo demo.

### Toggle
```js
function toggleDemoMode() {
  DEMO_MODE = !DEMO_MODE;
  localStorage.setItem('demoMode', DEMO_MODE);
  document.getElementById('demoToggle').textContent = DEMO_MODE ? 'Salir de modo demo' : 'Ir a modo demo';
  location.reload();
}
```
- Recarga la página para que todos los datos se carguen desde la fuente correspondiente
- El texto del botón se actualiza: "Salir de modo demo" / "Ir a modo demo"

### Archivos JSON

| Variable global | Archivo JSON |
|----------------|--------------|
| `GASTOS` | `data/gastos.json` |
| `PARCELAS` | `data/parcelas.json` |
| `PROPIETARIOS` | `data/propietarios.json` |
| `NOTICIAS` | `data/noticias.json` |
| `FLUJO` | `data/ingresos_egresos.json` |
| `DOCUMENTOS` | `data/documentos.json` |
| `RECLAMOS` | `data/reclamos.json` |
| `PROVEEDORES` | `data/proveedores.json` |
| `ASAMBLEAS` | `data/asambleas.json` |
| `ASAMBLEA_ASISTENTES` | `data/asamblea_asistentes.json` |
| `ENCUESTAS` | `data/encuestas.json` |
| `ENCUESTAS_VOTOS` | `data/encuestas_votos.json` |
| `CONFIG` | `data/config.json` |

## Carga de datos (`loadJson`)
```js
async function loadJson(target) {
  if (DEMO_MODE) {
    var res = await fetch(DEMO_FILES[target], { cache: 'no-store' });
    window[target] = await res.json();
  } else if (supabaseClient) {
    var table = TABLE_MAP[target];
    var { data, error } = await supabaseClient.from(table).select('*');
    window[target] = data;
  }
}
```

## Operaciones de escritura

### Creación/Edición en demo
`handleForm()` detecta `DEMO_MODE` y:
1. Genera un UUID local (`generateUUID()`)
2. Setea `created_at` manualmente
3. Pushea al array global o reemplaza en el array existente
4. Llama al render correspondiente

### Eliminación en demo
`deleteItem()`:
1. Filtra el elemento del array global
2. Muestra snackbar "Eliminado (demo)."
3. Re-renderiza

### Upload de archivos en demo
No se realiza upload real. El campo de archivo se ignora y no se guarda ninguna URL.

### Votación en demo
```js
ENCUESTAS_VOTOS.push({
  id: generateUUID(),
  encuesta_id: encuestaId,
  parcela_id: miPropietario.parcela_id,
  seleccion: seleccion,
  created_at: new Date().toISOString()
});
```
No hay validación de voto duplicado (no existe UNIQUE constraint en memoria).

### Config en demo
`saveConfig()` solo actualiza el objeto global `CONFIG[key]`. No persiste en ningún lado.

## Diferencias clave con producción

| Aspecto | Demo | Producción |
|---------|------|------------|
| Datos | JSON locales (`data/*.json`) | Supabase DB |
| Escritura | Arrays en memoria | Supabase INSERT/UPDATE/DELETE |
| Archivos | No se suben | Supabase Storage |
| Auth | No hay auth real | Supabase Auth |
| Propietarios | CRUD en array local | Edge Function `create-user`/`delete-user` |
| Votación | Sin validación unique | UNIQUE(encuesta_id, parcela_id) |
| Config | Solo en memoria (`CONFIG` object) | Tabla `config` upsert |
| Fechas `created_at` | Manuales (JS) | DB `DEFAULT now()` |

## Reglas importantes
- **NUNCA** romper funcionalidad de producción al editar archivos de demo
- Los JSON de demo deben mantener el mismo schema que las tablas de Supabase
- `created_at` se genera solo en Supabase, no enviar en inserts
- Las fechas en JSON: formato ISO `YYYY-MM-DD`

## Propósito
Permitir probar la interfaz completa sin necesidad de configurar Supabase, facilitando el desarrollo, testing y demostración del sistema.
