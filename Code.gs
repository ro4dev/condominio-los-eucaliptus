var FOLDER_ID = 'TU_FOLDER_ID';

function doGet(e) {
  var sheet = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'Gastos Comunes (respuestas)';
  var data = getSheetData(sheet);

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeHeader(header) {
  return header
    .toLowerCase()
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function getSheetData(sheetName) {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  if (!folder) return [];

  var files = folder.getFilesByName(sheetName);
  if (!files.hasNext()) return [];

  var file = files.next();
  var ss = SpreadsheetApp.openById(file.getId());
  var sheet = ss.getSheets()[0];
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  var headers = data[0].map(function(h) {
    return normalizeHeader(h.toString());
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
