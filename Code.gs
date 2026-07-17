var SPREADSHEET_IDS = {
  'Asambleas (respuestas)': 'ID_AQUI',
  'Documentos (respuestas)': 'ID_AQUI',
  'Gastos Comunes (respuestas)': 'ID_AQUI',
  'Ingresos/Egresos (respuestas)': 'ID_AQUI',
  'Noticias (respuestas)': 'ID_AQUI',
  'Parcelas (respuestas)': 'ID_AQUI',
  'Propietarios (respuestas)': 'ID_AQUI',
  'Proveedores (respuestas)': 'ID_AQUI',
  'Reclamos/Sugerencias (respuestas)': 'ID_AQUI'
};

function doGet(e) {
  var sheet = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'Gastos Comunes (respuestas)';
  var data = getSheetData(sheet);

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  var ssId = SPREADSHEET_IDS[sheetName];
  if (!ssId || ssId === 'ID_AQUI') return [];

  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheets()[0];
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) {
    return h.toString().toLowerCase().trim();
  });

  var records = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (row.every(function(cell) { return cell === ''; })) continue;
    var record = {};
    headers.forEach(function(header, idx) {
      record[header] = row[idx];
    });
    records.push(record);
  }
  return records;
}
