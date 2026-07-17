function doGet(e) {
  var sheet = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : 'Gastos Comunes (respuestas)';
  var data = getSheetData(sheet);

  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
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
