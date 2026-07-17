# Evolución de la App

## Registro de cambios

### 03/07/2026 - Inicio del proyecto
- HTML monolítico con CSS y JS inline
- Backend: Google Apps Script (Code.gs)
- 8 módulos: Gastos, Parcelas, Noticias, Flujo, Documentos, Reclamos, Proveedores, Asambleas
- Google Forms para carga de datos

### 17/07/2026 - Documentación y planificación
- Carpeta docs/ con opciones de mejora (auth, S3, Supabase, Firebase, PocketBase, VMs gratis)
- Migración de JSONs a carpeta data/ (quitar prefijo datos_)
- README completo
- Decisión: migrar a Supabase + Backblaze B2
- Plan de reorganización: CSS 4 archivos, JS 5 archivos

### Próximos pasos
- [ ] Reorganizar CSS y JS en carpetas
- [ ] Configurar Supabase (tablas, auth)
- [ ] Migrar datos demo a Supabase
- [ ] Implementar login con Google
- [ ] Evaluar Backblaze B2 para archivos
