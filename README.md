# Condominio Los Eucaliptus

Visualizador de gastos comunes para el condominio. Los datos se cargan desde un Google Sheet privado y se exponen via Google Apps Script como API JSON.

## Stack

- **Frontend**: HTML + Chart.js (GitHub Pages)
- **Datos**: Google Sheets
- **API**: Google Apps Script

## Setup

1. Crear un Google Sheet con las columnas: `Parcela`, `Nombre`, `Periodo`, `Concepto`, `Monto`, `Fecha`
2. En el sheet: **Extensiones → Apps Script**, pegar el contenido de `Code.gs` y desplegar como Web app
3. Copiar la URL del despliegue y pegarla en `index.html` donde dice `URL_DEL_APPS_SCRIPT`
4. Pushear el cambio a `main`

## URL

https://ro4dev.github.io/condominio-los-eucaliptus
