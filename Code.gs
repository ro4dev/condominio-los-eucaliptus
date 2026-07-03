function doGet() {
  const data = getSheetData();
  const dataJson = JSON.stringify(data);

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Condominio Eucaliptus</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f5f7fa; color: #1a1a2e; }
    .container { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
    header { background: #1a1a2e; color: #fff; padding: 1.5rem; text-align: center; border-radius: 12px; margin-bottom: 1.5rem; }
    header h1 { font-size: 1.8rem; font-weight: 600; letter-spacing: 1px; }
    header p { color: #a0a0b8; margin-top: 0.3rem; font-size: 0.9rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #fff; border-radius: 10px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); text-align: center; }
    .stat-card .label { font-size: 0.8rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-card .value { font-size: 1.6rem; font-weight: 700; margin-top: 0.3rem; }
    .stat-card .value.blue { color: #2563eb; }
    .charts { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .chart-box { background: #fff; border-radius: 10px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .chart-box h3 { font-size: 0.95rem; margin-bottom: 0.8rem; color: #374151; }
    .chart-box canvas { max-height: 280px; }
    .filters { display: flex; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .filters label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .filters select { padding: 0.4rem 0.7rem; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; background: #fff; }
    .table-wrap { background: #fff; border-radius: 10px; padding: 1.2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow-x: auto; }
    .table-wrap h3 { font-size: 0.95rem; margin-bottom: 0.8rem; color: #374151; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { background: #f9fafb; text-align: left; padding: 0.6rem 0.8rem; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
    td { padding: 0.5rem 0.8rem; border-bottom: 1px solid #f3f4f6; }
    tr:hover td { background: #f9fafb; }
    @media (max-width: 700px) { .charts { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>CONDOMINIO EUCALIPTUS</h1>
      <p>Control de gastos comunes</p>
    </header>
    <div id="content">
      <section class="stats" id="stats"></section>
      <div class="filters">
        <label>Periodo:</label>
        <select id="periodFilter"></select>
        <label>Parcela:</label>
        <select id="parcelaFilter"></select>
      </div>
      <section class="charts">
        <div class="chart-box">
          <h3>Monto por período</h3>
          <canvas id="chartPeriodos"></canvas>
        </div>
        <div class="chart-box">
          <h3>Por parcela</h3>
          <canvas id="chartParcelas"></canvas>
        </div>
      </section>
      <div class="table-wrap">
        <h3>Registros</h3>
        <table>
          <thead>
            <tr>
              <th>Parcela</th>
              <th>Nombre</th>
              <th>Periodo</th>
              <th>Concepto</th>
              <th>Monto</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody id="tableBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    const DATA = ${dataJson};

    function formatMoney(v) {
      return v.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function formatPeriodo(p) {
      if (!p) return '';
      const parts = String(p).split('-');
      if (parts.length === 2) return parts[1] + '/' + parts[0];
      return p;
    }

    function fillFilters() {
      const periodos = [...new Set(DATA.map(r => r.periodo).filter(Boolean))].sort().reverse();
      const parcelas = [...new Set(DATA.map(r => r.parcela).filter(Boolean))].sort();

      const pf = document.getElementById('periodFilter');
      pf.innerHTML = '<option value="">Todos</option>' + periodos.map(p => '<option>' + p + '</option>').join('');

      const paf = document.getElementById('parcelaFilter');
      paf.innerHTML = '<option value="">Todas</option>' + parcelas.map(p => '<option>' + p + '</option>').join('');

      pf.onchange = applyFilters;
      paf.onchange = applyFilters;
    }

    function filteredData() {
      const p = document.getElementById('periodFilter').value;
      const pa = document.getElementById('parcelaFilter').value;
      return DATA.filter(r => (!p || r.periodo == p) && (!pa || r.parcela == pa));
    }

    function applyFilters() {
      const data = filteredData();
      renderStats(data);
      renderTable(data);
      renderCharts(data);
    }

    function renderStats(data) {
      const total = data.reduce((s, r) => s + parseFloat(r.monto || 0), 0);
      const periodos = new Set(data.map(r => r.periodo)).size;
      const parcelas = new Set(data.map(r => r.parcela)).size;

      document.getElementById('stats').innerHTML =
        '<div class="stat-card"><div class="label">Total recaudado</div><div class="value blue">$' +
        formatMoney(total) + '</div></div>' +
        '<div class="stat-card"><div class="label">Registros</div><div class="value">' +
        data.length + '</div></div>' +
        '<div class="stat-card"><div class="label">Periodos</div><div class="value">' +
        periodos + '</div></div>' +
        '<div class="stat-card"><div class="label">Parcelas</div><div class="value">' +
        parcelas + '</div></div>';
    }

    function renderTable(data) {
      const tbody = document.getElementById('tableBody');
      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:1.5rem">Sin registros</td></tr>';
        return;
      }
      tbody.innerHTML = data.map(r =>
        '<tr>' +
        '<td>' + (r.parcela || '') + '</td>' +
        '<td>' + (r.nombre || '') + '</td>' +
        '<td>' + formatPeriodo(r.periodo) + '</td>' +
        '<td>' + (r.concepto || '') + '</td>' +
        '<td>$' + formatMoney(parseFloat(r.monto || 0)) + '</td>' +
        '<td>' + (r.fecha || '') + '</td>' +
        '</tr>'
      ).join('');
    }

    let chartPeriodos, chartParcelas;

    function renderCharts(data) {
      renderPeriodChart(data);
      renderParcelaChart(data);
    }

    function renderPeriodChart(data) {
      const groups = {};
      data.forEach(r => {
        const p = r.periodo || 'Sin periodo';
        groups[p] = (groups[p] || 0) + parseFloat(r.monto || 0);
      });
      const labels = Object.keys(groups).map(formatPeriodo);
      const values = Object.values(groups);

      const ctx = document.getElementById('chartPeriodos').getContext('2d');
      if (chartPeriodos) chartPeriodos.destroy();
      chartPeriodos = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Monto',
            data: values,
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { callback: function(v) { return '$' + formatMoney(v); } }
            }
          }
        }
      });
    }

    function renderParcelaChart(data) {
      const groups = {};
      data.forEach(r => {
        const p = r.parcela || 'Sin parcela';
        groups[p] = (groups[p] || 0) + parseFloat(r.monto || 0);
      });
      const labels = Object.keys(groups);
      const values = Object.values(groups);
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

      const ctx = document.getElementById('chartParcelas').getContext('2d');
      if (chartParcelas) chartParcelas.destroy();
      chartParcelas = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length)
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { boxWidth: 12, padding: 12, font: { size: 11 } }
            }
          }
        }
      });
    }

    fillFilters();
    applyFilters();
  <\/script>
</body>
</html>`;

  return HtmlService.createHtmlOutput(html)
    .setTitle('Condominio Eucaliptus')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
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
    if (row.every(function(cell) { return cell === ''; })) continue;
    const record = {};
    headers.forEach(function(header, idx) {
      record[header] = row[idx];
    });
    records.push(record);
  }
  return records;
}
