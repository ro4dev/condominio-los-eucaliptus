# Migración de archivos a S3

## Descripción

Mover el almacenamiento de archivos (documentos, comprobantes, adjuntos) de Google Drive a un servicio de almacenamiento compatible con S3. Esto da más control sobre las URLs, la persistencia y los costos.

## Problema actual

- Google Drive como storage tiene URLs temporales que expiran
- No hay control sobre caché o headers de descarga
- Los archivos están vinculados a una cuenta de Google específica
- Los Google Forms suben archivos a Drive de forma automática pero sin control

## Opciones de proveedor

| Proveedor             | Free tier                              | Egress               | Tarjeta crédito |
|-----------------------|----------------------------------------|----------------------|-----------------|
| **Backblaze B2**      | 10GB + egress gratis hasta 3x          | Gratis hasta 3x      | **No**          |
| **Cloudflare R2**     | 10GB + 1M Class A + 10M Class B        | Siempre gratis       | **Sí**          |
| **IDrive e2**         | 10GB                                   | $0.01/GB             | Sí              |

### Backblaze B2 (recomendado)

- **10GB gratis para siempre**
- **Sin tarjeta de crédito** para empezar
- Egress gratis hasta 3x lo que almacenás
- API compatible con S3 (mismos SDKs y comandos de AWS)
- Si crece: $6/TB/mes (muy barato)

### Cloudflare R2

- Free tier generoso (10GB, 1M writes, 10M reads)
- **Egress siempre gratis** (ni en free ni en pago)
- Pero **pide tarjeta de crédito** para activar el servicio

**Recomendación**: Backblaze B2 por no pedir tarjeta y ser suficiente para este proyecto.

## Arquitectura propuesta

```
Usuario → Frontend → API Gateway (Cloudflare Workers) → R2 Bucket
                                    ↓
                              Google Sheets (DB)
```

### Opción A: Backend en Apps Script

Apps Script no tiene SDK de S3 nativo, pero se puede usar `UrlFetchApp` para llamadas HTTP firmadas:

```javascript
function uploadToR2(file, fileName) {
  var accessKey = 'TU_ACCESS_KEY';
  var secretKey = 'TU_SECRET_KEY';
  var bucket = 'condominio-eucaliptus';
  
  // Crear firma AWS Signature V4
  // POST a https://{account}.r2.cloudflarestorage.com/{bucket}/{fileName}
}
```

**Problema**: la firma AWS V4 es compleja de implementar en Apps Script.

### Opción B: Cloudflare Workers como proxy

Crear un Worker en Cloudflare que maneje uploads/downloads:

```javascript
// Worker en Cloudflare
export default {
  async fetch(request, env) {
    if (request.method === 'POST') {
      // Recibir archivo, subir a R2
      await env.BUCKET.put(key, request.body);
    }
    if (request.method === 'GET') {
      // Servir archivo desde R2
      return env.BUCKET.get(key);
    }
  }
}
```

El frontend enviaría archivos al Worker en lugar de a Apps Script.

## Migración de datos existentes

1. Descargar archivos de Google Drive
2. Subirlos a R2
3. Actualizar las URLs en Google Sheets

## Pros

- URLs permanentes y estables
- Sin cargos de egress (R2)
- Control total sobre headers HTTP
- Independencia de Google Drive
- Fácil de combinar con CDN de Cloudflare

## Contras

- Requiere configurar cuenta en Cloudflare/Backblaze
- Necesita Worker o backend intermedio (Apps Script no habla S3 directamente)
- Migración manual de archivos existentes
- Las keys de acceso son un punto de seguridad
- Los Google Forms seguirían subiendo a Drive (a menos que se reemplacen)

## Nivel de esfuerzo

**Medio-Alto** (~1-2 días)

- Configurar cuenta + bucket: 1 hora
- Crear Worker/proxy: 4-8 horas
- Migrar archivos existentes: 1-2 horas
- Actualizar frontend: 2-4 horas
- Testing: 1-2 horas

## Dependencias

- Puede combinarse con `auth.md` para proteger uploads
- No requiere migración de DB
- Los Google Forms seguirían funcionando con Drive (parcialmente)

## Referencias

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Backblaze B2 Docs](https://www.backblaze.com/docs/cloud-storage)
