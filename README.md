# Condominio Los Eucaliptus

Visualizador de gastos comunes para el condominio. Los datos se cargan desde un Google Sheet privado y se exponen via Google Apps Script como web app.

## Stack

- **Frontend**: HTML + Chart.js (servido por Apps Script)
- **Datos**: Google Sheets
- **Backend**: Google Apps Script

## Setup

1. Crear un Google Sheet con las columnas: `Parcela`, `Nombre`, `Periodo`, `Concepto`, `Monto`, `Fecha`
2. En el sheet: **Extensiones → Apps Script**, pegar el contenido de `Code.gs`
3. **Desplegar → Nuevo despliegue → Web app**
   - Ejecutar como: `Yo`
   - Acceso: `Cualquier usuario`
4. Copiar la URL generada y compartirla con los residentes
