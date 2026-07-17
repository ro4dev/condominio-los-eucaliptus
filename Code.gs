function doGet(e) {
  var sheet = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'Gastos Comunes (respuestas)';
  var data = getSheetData(sheet);

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  var folder = getFolder();
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

function getFolder() {
  var folders = DriveApp.getFoldersByName('Condominio Eucaliptus');
  if (!folders.hasNext()) return null;
  return folders.next();
}
