function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0].map(h => h.toString().toLowerCase().trim());
  const records = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.every(cell => cell === '')) continue;

    const record = {};
    headers.forEach((header, idx) => {
      record[header] = row[idx];
    });
    records.push(record);
  }

  const result = JSON.stringify(records);
  return ContentService.createTextOutput(result)
    .setMimeType(ContentService.MimeType.JSON);
}
