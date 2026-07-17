# Autenticación con Google

## Descripción

Proteger el frontend y backend del sistema para que solo usuarios autorizados puedan acceder. Actualmente la página es pública y任何人都 puede ver los datos de gastos, parcelas, propietarios, etc.

## Problema actual

- La web app es accesible para cualquiera con la URL
- Los Google Forms de carga ya piden login de Google, pero el dashboard no
- No hay forma de saber quién está accediendo

## Solución propuesta

### Frontend: Google Identity Services (GIS)

Usar la librería oficial de Google para login OAuth:

1. Agregar `https://accounts.google.com/gsi/client` al HTML
2. Mostrar botón "Iniciar sesión con Google" antes de cargar el dashboard
3. Obtener el email del usuario del token
4. Validar contra una lista de emails permitidos
5. Solo si es válido, mostrar el contenido y cargar datos

```javascript
// Ejemplo simplificado
function handleCredentialResponse(response) {
  const payload = JSON.parse(atob(response.credential.split('.')[1]));
  const email = payload.email;
  const allowed = ['admin@correo.com', 'vecino@correo.com'];
  
  if (allowed.includes(email)) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadInitialData();
  } else {
    mostrarError('No autorizado');
  }
}
```

### Backend: Filtro en Apps Script

En `Code.gs`, verificar el email antes de devolver datos:

```javascript
function doGet(e) {
  var email = Session.getActiveUser().getEmail();
  var allowed = ['admin@correo.com'];
  
  if (allowed.indexOf(email) === -1) {
    return ContentService
      .createTextOutput(JSON.stringify({error: 'No autorizado'}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  // ... resto del código
}
```

**Nota**: `Session.getActiveUser().getEmail()` solo funciona si el despliegue es "Solo los que tienen acceso" y el usuario está logueado con Google.

### Modo demo

El modo demo debería:
- Requerir login igual que el modo producción
- O deshabilitarse completamente en producción

## Pros

- Login nativo de Google (los usuarios ya tienen cuenta)
- No necesitan crear contraseña nueva
- Se puede controlar acceso por email
- Implementación relativamente simple en el frontend
- Apps Script ya tiene soporte nativo para Google Auth

## Contras

- Solo funciona para usuarios con cuenta de Google
- La lista de emails está hardcodeada (si cambia, hay que editar el código)
- `Session.getActiveUser().getEmail()` puede venir vacío si el despliegue no está configurado correctamente
- No hay roles (admin vs usuario regular) sin lógica adicional

## Nivel de esfuerzo

**Bajo-Medio** (~2-4 horas)

- Frontend: 1-2 horas (integrar GIS, pantalla de login)
- Backend: 30 min (filtro de email)
- Testing: 30 min

## Dependencias

- Ninguna dependencia con otras mejoras
- Se puede implementar de forma aislada
- Complementa cualquier migración de storage o DB

## Referencias

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [Apps Script Session.getActiveUser()](https://developers.google.com/apps-script/reference/script/session)
