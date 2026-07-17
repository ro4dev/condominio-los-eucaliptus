# VMs Gratis (Google Cloud Free Tier)

## Descripción

Opción de self-hosting usando la VM gratuita de Google Cloud Compute Engine (e2-micro) para correr PocketBase u otro backend liviano.

## Google Cloud Always Free Tier

| Recurso | Cuota mensual | Regiones válidas |
|---------|---------------|------------------|
| VM e2-micro | 1 instancia | us-west1, us-central1, us-east1 |
| Persistent Disk | 30 GB standard | — |
| Egress | 1 GB desde N. América | — |
| Cloud Storage | 5 GB | — |

### Requisitos

- **Tarjeta de crédito/debito obligatoria** al hacer signup
- Se usa solo para verificar identidad (anti-bots)
- **No se cobra** durante el free trial ($300 por 90 días)
- **No se cobra automáticamente** cuando termina el trial
- Hay que hacer **upgrade manual** a cuenta paga para que empiece a cobrar
- El tier Always Free **no expira** y sigue siendo gratis después del trial

### Flujo de registro

1. Crear cuenta Google Cloud
2. Ingresar tarjeta de crédito (verificación)
3. Recibir $300 de crédito por 90 días
4. Crear VM e2-micro en una de las 3 regiones válidas
5. Cuando se acabán los $300, si no hacés upgrade, la cuenta se pausa
6. Si hacés upgrade, el e2-micro sigue gratis (siempre dentro de los límites)

### Límites a respetar

- **Solo e2-micro**: e2-small o cualquier otro tipo de máquina cobra inmediatamente
- **Solo 3 regiones**: cualquier otra región cobra (~$6-8/mes)
- **1 GB de egress**: más de eso genera cobros
- **Sin GPUs/TPUs**: siempre son cobrados

### Para PocketBase

PocketBase es una binaria liviana de Go que corre bien con:
- 1 vCPU (e2-micro tiene 0.25-2 vCPUs compartidos)
- 1 GB de RAM
- SQLite (no necesita servidor de DB separado)

**Funciona bien** para proyectos pequeños/medianos con poco tráfico.

## Pros

- **Gratis para siempre**: el tier Always Free no expira
- **Control total**: self-hosted, sin dependencia de servicios managed
- **PocketBase**: backend completo en una sola binaria
- **Sin vendor lock-in**: podés migrar a cualquier VPS después
- **Google ecosystem**: fácil integración con otros servicios de Google

## Contras

- **Tarjeta de crédito obligatoria**: aunque no se cobre, hay que ingresarla
- **Solo 3 regiones en US**: latency más alta para usuarios de LATAM
- **1 GB de egress**: puede ser poco si hay muchos archivos
- **VM pequeña**: 1 GB de RAM es justo para PocketBase
- **Riesgo de cobro**: si se configura mal o se pasa de los límites
- **Oracle cancela cuentas**: Oracle Cloud (otra opción gratis) es conocido por cancelar cuentas free sin aviso
- **Backup manual**: hay que configurar backups del SQLite

## Comparación general de opciones

| Opción | Costo | Tarjeta | Control | Pausa |
|--------|-------|---------|---------|-------|
| **Supabase Free** | $0 | No | Parcial | Sí (7 días inactividad) |
| **Backblaze B2** | $0 | No | Total | No |
| **GCP e2-micro** | $0 | Sí | Total | No |
| **Cloudflare R2** | $0 | Sí | Total | No |
| **Firebase Free** | $0 | No | Parcial | No |
| **PocketBase en VPS** | ~$4+ | Sí | Total | No |
| **Oracle Cloud Always Free** | $0 | No | Total | No |

### Combinación ganadora (gratis, sin tarjeta)

**Supabase (DB + Auth) + Backblaze B2 (storage)** = todo gratis, sin tarjeta, sin pausas si hay actividad regular.

## Configuración básica

```bash
# 1. Crear VM e2-micro en us-central1
# 2. Conectar vía SSH
sudo apt update && sudo apt upgrade -y

# 3. Instalar PocketBase
wget https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_linux_amd64.zip
unzip pocketbase_linux_amd64.zip
chmod +x pocketbase

# 4. Correr PocketBase
./pocketbase serve --http=0.0.0.0:8080

# 5. Abrir firewall en GCP (puerto 8080)
# 6. Acceder a http://IP_PUBLICA:8080/_/
```

## Backup strategy

```bash
# Cron job para backup diario
#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d)
cp /opt/pocketbase/pb_data/data.db "$BACKUP_DIR/data_$DATE.db"
# Subir a Google Cloud Storage (5GB gratis)
gsutil cp "$BACKUP_DIR/data_$DATE.db" gs://mi-bucket/backups/
```

## Notas

- La VM e2-micro es compartida (burstable), no tiene CPU dedicada
- Para producción real, conviene un VPS de pago (Hetzner €4/mes, DigitalOcean $4/mes)
- Google Cloud Free Tier es ideal para learning y prototipos
- Si el proyecto crece, migrar a un VPS dedicado es sencillo

## Referencias

- [GCP Free Tier Docs](https://cloud.google.com/free/docs/free-cloud-features)
- [Compute Engine Free Tier](https://cloud.google.com/free/docs/compute-getting-started)
- [GCP Free Tier Complete Guide (2026)](https://nicheelab.com/en/articles/gcp/gcp-free-tier-complete/)
