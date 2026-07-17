# Migración a Firebase

## Descripción

Reemplazar Google Sheets + Drive + Apps Script por Firebase, que ofrece Firestore (DB), Authentication, Cloud Storage y Hosting, todo integrado con la consola de Google.

## Problema actual

Mismo que en `supabase.md`: Sheets no es DB real, Apps Script tiene límites, no hay auth, etc.

## Qué resuelve Firebase

| Necesidad     | Solución Firebase                      |
|---------------|----------------------------------------|
| Base de datos | Firestore (NoSQL)                      |
| API           | SDK nativo (no hay REST automático)    |
| Auth          | Login con Google, email, etc.          |
| Storage       | Cloud Storage con URLs permanentes     |
| Hosting       | Deploy del frontend HTML               |

## Arquitectura propuesta

```
Usuario → Frontend (HTML/JS) → Firebase SDK
                                    ↓
                              Firestore + Storage + Auth
```

### Eliminaría

- `Code.gs` (Apps Script)
- Google Forms (formularios propios)
- Google Sheets (Firestore)
- Google Drive (Cloud Storage)

### Estructura Firestore

Firestore es NoSQL, así que los datos se guardan en colecciones:

```javascript
// Colección: parcelas
{
  numero: "Parcela 1",
  rol: "00521-001",
  metros: 450,
  estado: "Habitada"
}

// Colección: propietarios
{
  nombre_completo: "Juan Pérez",
  rut: "30123456",
  parcela_ref: "parcelas/parcela1",  // referencia
  telefono: "+54 9 11 1234-5678",
  email: "juan.perez@mail.com",
  tipo: "Propietario"
}

// Colección: gastos
{
  parcela_ref: "parcelas/parcela1",
  periodo: "2026-07",
  concepto: "Gasto común",
  monto: 50000,
  pagado: true,
  fecha: Timestamp
}

// Colección: flujo_caja
{
  tipo: "Ingreso",
  concepto: "Cuotas",
  monto: 650000,
  comprobante_url: "gs://bucket/archivo.pdf",
  fecha: Timestamp
}

// Colección: noticias
{
  titulo: "Asamblea mensual",
  descripcion: "...",
  fecha_hasta: Timestamp
}

// Colección: documentos
{
  nombre: "Reglamento 2026",
  categoria: "Estatuto",
  archivo_url: "gs://bucket/reglamento.pdf"
}

// Colección: reclamos
{
  tipo: "Reclamo",
  parcela_ref: "parcelas/parcela3",
  asunto: "Fuga de agua",
  descripcion: "..."
}

// Colección: proveedores
{
  rubro: "Plomería",
  nombre: "Agua & Sol",
  telefono: "+54 9 11 5555-1111"
}

// Colección: asambleas
{
  tipo: "Ordinaria",
  temario: "1. Presupuesto...",
  acuerdos: "Se aprobó...",
  asistentes: "12"
}
```

## Pros

- **Integración nativa con Google**: los usuarios de Google ya tienen cuenta
- **Free tier generoso**: 1GB Firestore, 5GB Storage, 10GB Hosting, 50K reads/día
- **Real-time**: Firestore soporta listeners en tiempo real
- **SDK oficial**: librerías para web, Android, iOS
- **Hosting免费**: deploy del HTML es gratis
- **Auth integrado**: login con Google de una línea
- **Dashboard**: consola de Firebase para manage datos
- **Google Sheets import**: Firebase tiene herramientas para importar desde CSV

## Contras

- **NoSQL**: no hay joins, hay que denormalizar datos
- **Costos impredecibles**: el free tier tiene 50K reads/día, pero después cobra por operación
- **Lock-in de Google**: migrar después es difícil
- **Firestore es complejo**: reglas de seguridad, índices compuestos, etc.
- **No hay REST automático**: hay que usar el SDK, no se puede curl directo
- **Los Google Forms se pierden**: hay que crear formularios propios
- **Migración manual** de datos existentes

## Comparación con Supabase

| Aspecto           | Firebase              | Supabase              |
|-------------------|-----------------------|-----------------------|
| Tipo DB           | NoSQL (Firestore)     | SQL (PostgreSQL)      |
| Query language    | Firestore queries     | SQL                   |
| Free tier reads   | 50K/día               | Ilimitado             |
| Storage free      | 5GB                   | 1GB                   |
| Hosting free      | 10GB                  | No                    |
| Auth              | Excelente             | Bueno                 |
| Curva aprendizaje | Media                 | Media-Alta            |
| Costos al crecer  | Más caro              | Más barato            |

## Nivel de esfuerzo

**Alto** (~3-5 días)

- Configurar proyecto Firebase: 1-2 horas
- Crear colecciones + reglas: 2-4 horas
- Migrar datos: 2-4 horas
- Reescribir frontend con SDK: 8-16 horas
- Auth + formularios: 4-6 horas
- Testing: 2-4 horas

## Dependencias

- Similar a Supabase: rebuild completo del frontend
- Se puede usar Firebase solo para auth y mantener el resto del stack
- Combina con la eliminación de Google Forms

## Pricing (si se crece)

| Plan    | Precio          | Firestore            | Storage   |
|---------|-----------------|----------------------|-----------|
| Free    | $0              | 1GB + 50K reads/día  | 5GB       |
| Blaze   | Pay-as-you-go   | $0.18/100K reads     | $0.026/GB |

**Nota**: en Blaze, si hay tráfico inesperado, la factura puede ser alta. Se pueden poner límites de presupuesto.

## Referencias

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Auth](https://firebase.google.com/docs/auth)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
