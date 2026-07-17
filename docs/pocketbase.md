# Migración a PocketBase

## Descripción

Reemplazar Google Sheets + Drive + Apps Script por PocketBase, un backend open-source en Go que incluye SQLite, API REST, auth y admin UI, todo en una sola binaria.

## Problema actual

Mismo que en `supabase.md` y `firebase.md`: Sheets no es DB real, Apps Script tiene límites, no hay auth, etc.

## Qué es PocketBase

PocketBase es un backend embebido (single binary) que incluye:
- SQLite como base de datos
- API REST automática para todas las colecciones
- Auth con OAuth (Google, GitHub, etc.)
- Admin dashboard para manage datos
- Storage para archivos
- Real-time subscriptions

## Arquitectura propuesta

```
Usuario → Frontend (HTML/JS) → PocketBase API
                                    ↓
                              SQLite + Storage
```

### Deploy options

| Opción           | Free tier              | Persistencia    |
|------------------|------------------------|-----------------|
| **Railway**      | $5 crédito/mes         | Sí (volume)     |
| **Fly.io**       | 3 VMs compartidas      | Sí (volumes)    |
| **Render**       | Free tier con sleep    | No (efímero)    |
| **VPS (Hetzner)**| ~€4/mes               | Sí              |
| **Docker local** | Gratis                 | Sí              |

**Recomendación**: Hetzner VPS por €4/mes o Railway con volume.

### Estructura de colecciones

PocketBase crea colecciones desde su admin UI, pero conceptualmente serían:

```
parcelas          → numero, rol, metros, estado
propietarios      → nombre_completo, rut, parcela (relación), telefono, email, tipo
gastos            → parcela (relación), periodo, concepto, monto, pagado, fecha
flujo_caja        → tipo, concepto, monto, comprobante (file), fecha
noticias          → titulo, descripcion, fecha_hasta
documentos        → nombre, categoria, archivo (file), descripcion
reclamos          → tipo, parcela (relación), asunto, descripcion
proveedores       → rubro, nombre, telefono, email, contacto
asambleas         → tipo, temario, acuerdos, asistentes, fecha
```

### API automática

Una vez creadas las colecciones, PocketBase genera automáticamente:

```bash
# Listar parcelas
GET /api/collections/parcelas/records

# Obtener una parcela
GET /api/collections/parcelas/records/{id}

# Crear parcela
POST /api/collections/parcelas/records

# Filtrar gastos por período
GET /api/collections/gastos/records?filter=(periodo='2026-07')

# Subir archivo
POST /api/collections/documentos/records
Content-Type: multipart/form-data
```

### Frontend: SDK oficial

```javascript
import PocketBase from 'pocketbase';

const pb = new PocketBase('https://tu-pocketbase.railway.app');

// Obtener parcelas
const parcelas = await pb.collection('parcelas').getFullList();

// Login con Google
const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });

// Subir archivo
const formData = new FormData();
formData.append('archivo', fileInput.files[0]);
await pb.collection('documentos').create(formData);
```

## Pros

- **Self-hosted**: control total sobre los datos
- **Open source**: sin vendor lock-in
- **SQLite**: base de datos simple y confiable
- **API automática**: no necesitan backend custom
- **Admin dashboard**: UI para manage datos sin código
- **Auth integrado**: login con Google sin código extra
- **Storage integrado**: archivos con URLs permanentes
- **Real-time**: subscripciones en tiempo real
- **Una sola binaria**: fácil de deployar y mantener
- **Barato**: un VPS de €4/mes lo corre

## Contras

- **Requiere un servidor**:不同于 Supabase/Firebase que son managed
- **SQLite no escala horizontalmente**: para miles de usuarios concurrentes no sirve (pero para un condominio es más que suficiente)
- **Migración manual**: hay que mover datos de Sheets a PocketBase
- **Backup manual**: hay que configurar backups del SQLite
- **No hay hosting free**:不同于 Firebase que tiene hosting gratis
- **Menos ecosistema**: menos tutoriales y librerías que Firebase/Supabase

## Comparación

| Aspecto           | PocketBase                | Supabase              | Firebase              |
|-------------------|---------------------------|-----------------------|-----------------------|
| Tipo              | Self-hosted               | Managed               | Managed               |
| DB                | SQLite                    | PostgreSQL            | Firestore (NoSQL)     |
| Free tier         | No (necesita servidor)    | Sí                    | Sí                    |
| Control total     | Sí                        | Parcial               | No                    |
| Complejidad deploy| Media                     | Baja                  | Baja                  |
| Costo mensual     | €4+                       | $0                    | $0                    |
| Curva aprendizaje | Baja                      | Media-Alta            | Media                 |

## Nivel de esfuerzo

**Medio** (~2-4 días)

- Setup PocketBase + deploy: 2-4 horas
- Crear colecciones: 1-2 horas
- Migrar datos: 2-4 horas
- Reescribir frontend con SDK: 6-12 horas
- Auth + formularios: 2-4 horas
- Testing: 1-2 horas

## Dependencias

- Necesita un servidor (Railway, VPS, etc.)
- Se puede combinar con Cloudflare R2 para storage de archivos grandes
- Rebuild del frontend (similar a Supabase/Firebase)

## Backup strategy

```bash
# Cron job para backup diario del SQLite
cp /data/pb_data/data.db /backups/data_$(date +%Y%m%d).db

# O usar PocketBase hooks
```

## Referencias

- [PocketBase Docs](https://pocketbase.io/docs/)
- [PocketBase GitHub](https://github.com/pocketbase/pocketbase)
- [PocketBase + Railway](https://pocketbase.io/docs/going-to-production/#railway)
