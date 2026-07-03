function doGet() {
  const data = getSheetData();
  const dataJson = JSON.stringify(data);

  const html = HtmlService.createHtmlOutput(
    '<!DOCTYPE html>' +
    '<html lang="es">' +
    '<head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Condominio Eucaliptus</title>' +
    '<script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>' +
    '<style>' +
    '*{margin:0;padding:0;box-sizing:border-box}' +
    'body{font-family:system-ui,-apple-system,sans-serif;background:#f5f7fa;color:#1a1a2e}' +
    '.container{max-width:1200px;margin:0 auto;padding:1.5rem}' +
    'header{background:#1a1a2e;color:#fff;padding:1.5rem;text-align:center;border-radius:12px;margin-bottom:1.5rem}' +
    'header h1{font-size:1.8rem;font-weight:600;letter-spacing:1px}' +
    'header p{color:#a0a0b8;margin-top:0.3rem;font-size:0.9rem}' +
    '.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1.5rem}' +
    '.stat-card{background:#fff;border-radius:10px;padding:1.2rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center}' +
    '.stat-card .label{font-size:0.8rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px}' +
    '.stat-card .value{font-size:1.6rem;font-weight:700;margin-top:0.3rem}' +
    '.stat-card .value.blue{color:#2563eb}' +
    '.charts{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-bottom:1.5rem}' +
    '.chart-box{background:#fff;border-radius:10px;padding:1.2rem;box-shadow:0 1px 3px rgba(0,0,0,0.08)}' +
    '.chart-box h3{font-size:0.95rem;margin-bottom:0.8rem;color:#374151}' +
    '.chart-box canvas{max-height:280px}' +
    '.filters{display:flex;gap:1rem;margin-bottom:1rem;flex-wrap:wrap;align-items:center}' +
    '.filters label{font-size:0.85rem;font-weight:600;color:#374151}' +
    '.filters select{padding:0.4rem 0.7rem;border:1px solid #d1d5db;border-radius:6px;font-size:0.85rem;background:#fff}' +
    '.table-wrap{background:#fff;border-radius:10px;padding:1.2rem;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow-x:auto}' +
    '.table-wrap h3{font-size:0.95rem;margin-bottom:0.8rem;color:#374151}' +
    'table{width:100%;border-collapse:collapse;font-size:0.85rem}' +
    'th{background:#f9fafb;text-align:left;padding:0.6rem 0.8rem;font-weight:600;color:#374151;border-bottom:2px solid #e5e7eb}' +
    'td{padding:0.5rem 0.8rem;border-bottom:1px solid #f3f4f6}' +
    'tr:hover td{background:#f9fafb}' +
    '.loading{text-align:center;padding:3rem;color:#6b7280}' +
    '@media(max-width:700px){.charts{grid-template-columns:1fr}}' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="container">' +
    '<header><h1>CONDOMINIO EUCALIPTUS</h1><p>Control de gastos comunes</p></header>' +
    '<div id="loading" class="loading">Cargando datos...</div>' +
    '<div id="content" style="display:none">' +
    '<section class="stats" id="stats"></section>' +
    '<div class="filters">' +
    '<label>Periodo:</label><select id="periodFilter"></select>' +
    '<label>Parcela:</label><select id="parcelaFilter"></select>' +
    '</div>' +
    '<section class="charts">' +
    '<div class="chart-box"><h3>Monto por período</h3><canvas id="chartPeriodos"></canvas></div>' +
    '<div class="chart-box"><h3>Por parcela</h3><canvas id="chartParcelas"></canvas></div>' +
    '</section>' +
    '<div class="table-wrap"><h3>Registros</h3><table><thead><tr><th>Parcela</th><th>Nombre</th><th>Periodo</th><th>Concepto</th><th>Monto</th><th>Fecha</th></tr></thead><tbody id="tableBody"></tbody></table></div>' +
    '</div>' +
    '</div>' +
    '<script>' +
    'var DATA = ' + dataJson + ';' +
    'document.getElementById("loading").style.display="none";' +
    'document.getElementById("content").style.display="block";' +
    'var periodFilter=document.getElementById("periodFilter");' +
    'var parcelaFilter=document.getElementById("parcelaFilter");' +
    'var chartPeriodos,chartParcelas;' +
    'function fillFilters(){var p=[...new Set(DATA.map(function(r){return r.periodo})).filter(Boolean)].sort().reverse();var pa=[...new Set(DATA.map(function(r){return r.parcela})).filter(Boolean)].sort();periodFilter.innerHTML="<option value=>Todos</option>"+p.map(function(v){return"<option>"+v+"</option>"}).join("");parcelaFilter.innerHTML="<option value=>Todas</option>"+pa.map(function(v){return"<option>"+v+"</option>"}).join("");periodFilter.onchange=applyFilters;parcelaFilter.onchange=applyFilters}' +
    'function filteredData(){var p=periodFilter.value;var pa=parcelaFilter.value;return DATA.filter(function(r){return(!p||r.periodo==p)&&(!pa||r.parcela==pa)})}' +
    'function applyFilters(){var d=filteredData();renderStats(d);renderTable(d);renderCharts(d)}' +
    'function renderStats(d){var t=d.reduce(function(s,r){return s+parseFloat(r.monto||0)},0);document.getElementById("stats").innerHTML="<div class=stat-card><div class=label>Total recaudado</div><div class=\"value blue\">$"+t.toFixed(0)+"</div></div><div class=stat-card><div class=label>Registros</div><div class=value>"+d.length+"</div></div><div class=stat-card><div class=label>Periodos</div><div class=value>"+new Set(d.map(function(r){return r.periodo})).size+"</div></div><div class=stat-card><div class=label>Parcelas</div><div class=value>"+new Set(d.map(function(r){return r.parcela})).size+"</div></div>"}' +
    'function renderTable(d){var tb=document.getElementById("tableBody");if(d.length===0){tb.innerHTML="<tr><td colspan=6 style=text-align:center;color:#9ca3af;padding:1.5rem>Sin registros</td></tr>";return}tb.innerHTML=d.map(function(r){return"<tr><td>"+(r.parcela||"")+"</td><td>"+(r.nombre||"")+"</td><td>"+(r.periodo||"")+"</td><td>"+(r.concepto||"")+"</td><td>$"+parseFloat(r.monto||0).toFixed(0)+"</td><td>"+(r.fecha||"")+"</td></tr>"}).join("")}' +
    'function renderCharts(d){renderPeriodChart(d);renderParcelaChart(d)}' +
    'function renderPeriodChart(d){var g={};d.forEach(function(r){var p=r.periodo||"Sin periodo";g[p]=(g[p]||0)+parseFloat(r.monto||0)});var l=Object.keys(g);var v=Object.values(g);var ctx=document.getElementById("chartPeriodos").getContext("2d");if(chartPeriodos)chartPeriodos.destroy();chartPeriodos=new Chart(ctx,{type:"bar",data:{labels:l,datasets:[{label:"Monto",data:v,backgroundColor:"#3b82f6",borderRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:function(v){return"$"+v}}}}}})}' +
    'function renderParcelaChart(d){var g={};d.forEach(function(r){var p=r.parcela||"Sin parcela";g[p]=(g[p]||0)+parseFloat(r.monto||0)});var l=Object.keys(g);var v=Object.values(g);var c=["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16"];var ctx=document.getElementById("chartParcelas").getContext("2d");if(chartParcelas)chartParcelas.destroy();chartParcelas=new Chart(ctx,{type:"doughnut",data:{labels:l,datasets:[{data:v,backgroundColor:c.slice(0,l.length)}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{boxWidth:12,padding:12,font:{size:11}}}}}})}' +
    'fillFilters();applyFilters();' +
    '<\/script>' +
    '</body></html>'
  ).setTitle('Condominio Eucaliptus')
   .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');

  return html;
}

function getSheetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  if (data.length < 2) return [];

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
  return records;
}
