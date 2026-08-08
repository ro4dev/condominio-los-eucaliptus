var chartPeriodos, chartParcelas, chartFlujo;

function getCSS(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function renderCharts(data) {
  renderPeriodChart(data);
  renderParcelaChart(data);
}

function renderPeriodChart(data) {
  var groups = {};
  data.forEach(function(r) {
    var p = r.periodo || 'Sin periodo';
    groups[p] = (groups[p] || 0) + parseFloat(r.monto || 0);
  });
  var labels = Object.keys(groups).map(formatPeriodo);
  var values = Object.values(groups);
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  var primary = getCSS('--md-sys-color-primary');

  var ctx = document.getElementById('chartPeriodos').getContext('2d');
  if (chartPeriodos) {
    chartPeriodos.destroy();
  }
  chartPeriodos = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: [{ label: 'Monto', data: values, borderColor: primary, borderWidth: 2, pointBackgroundColor: primary, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: false }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { beginAtZero: true, ticks: { color: textColor, callback: function(v) { return '$' + formatMoney(v); } }, grid: { color: gridColor } }
      }
    }
  });
}

function renderParcelaChart(data) {
  var groups = {};
  data.forEach(function(r) {
    var p = parcelName(r.parcela_id) || 'Sin parcela';
    groups[p] = (groups[p] || 0) + parseFloat(r.monto || 0);
  });
  var labels = Object.keys(groups);
  var values = Object.values(groups);
  var textColor = getCSS('--text');
  var primary = getCSS('--md-sys-color-primary');
  var colors = [primary, '#10b981', '#f59e0b', '#b91c1c', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  var ctx = document.getElementById('chartParcelas').getContext('2d');
  if (chartParcelas) {
    chartParcelas.destroy();
  }
  chartParcelas = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length) }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12, font: { size: 11 } } }, tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': $' + formatMoney(ctx.parsed); } } } }
    }
  });
}

function renderFlujoChart() {
  var grupos = {};
  FLUJO.forEach(function(f) {
    var s = String(f.fecha || '');
    var y, m;
    if (s.indexOf('/') !== -1) {
      var parts = s.split('/');
      y = parseInt(parts[2], 10);
      m = parseInt(parts[1], 10);
    } else {
      var iso = s.indexOf('T') !== -1 ? s.split('T')[0] : s;
      var p = iso.split('-');
      y = parseInt(p[0], 10);
      m = parseInt(p[1], 10);
    }
    if (!y || !m) {
      return;
    }
    var key = y + '-' + String(m).padStart(2, '0');
    grupos[key] = grupos[key] || { ing: 0, egr: 0 };
    if (f.tipo === 'Ingreso') {
      grupos[key].ing += parseFloat(f.monto || 0);
    } else {
      grupos[key].egr += parseFloat(f.monto || 0);
    }
  });
  var keys = Object.keys(grupos).sort();
  var labels = keys.map(formatPeriodo);
  var datosIng = keys.map(function(k) { return grupos[k].ing; });
  var datosEgr = keys.map(function(k) { return grupos[k].egr; });
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  var colorIng = getCSS('--color-positive');
  var colorEgr = getCSS('--md-sys-color-error');

  var datasets = [];
  if (flujoFilter === 'todos' || flujoFilter === 'Ingreso') {
    datasets.push({ label: 'Ingresos', data: datosIng, borderColor: colorIng, borderWidth: 2, pointBackgroundColor: colorIng, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: false });
  }
  if (flujoFilter === 'todos' || flujoFilter === 'Egreso') {
    datasets.push({ label: 'Egresos', data: datosEgr, borderColor: colorEgr, borderWidth: 2, pointBackgroundColor: colorEgr, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: false });
  }

  var ctx = document.getElementById('chartFlujo').getContext('2d');
  if (chartFlujo) {
    chartFlujo.destroy();
  }
  chartFlujo = new Chart(ctx, {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: textColor, boxWidth: 12, padding: 12, font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
        y: { beginAtZero: true, ticks: { color: textColor, callback: function(v) { return '$' + formatMoney(v); } }, grid: { color: gridColor } }
      }
    }
  });
}

function updateChartTheme() {
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  var primary = getCSS('--md-sys-color-primary');
  if (chartPeriodos) {
    chartPeriodos.data.datasets[0].borderColor = primary;
    chartPeriodos.data.datasets[0].pointBackgroundColor = primary;
    chartPeriodos.options.scales.x.ticks.color = textColor;
    chartPeriodos.options.scales.y.ticks.color = textColor;
    chartPeriodos.options.scales.x.grid.color = gridColor;
    chartPeriodos.options.scales.y.grid.color = gridColor;
    chartPeriodos.update();
  }
  if (chartParcelas) {
    chartParcelas.options.plugins.legend.labels.color = textColor;
    chartParcelas.update();
  }
  if (chartFlujo) {
    var colorIng = getCSS('--color-positive');
    var colorEgr = getCSS('--md-sys-color-error');
    chartFlujo.data.datasets.forEach(function(ds) {
      ds.borderColor = ds.label === 'Ingresos' ? colorIng : colorEgr;
      ds.pointBackgroundColor = ds.label === 'Ingresos' ? colorIng : colorEgr;
    });
    chartFlujo.options.plugins.legend.labels.color = textColor;
    chartFlujo.options.scales.x.ticks.color = textColor;
    chartFlujo.options.scales.y.ticks.color = textColor;
    chartFlujo.options.scales.x.grid.color = gridColor;
    chartFlujo.options.scales.y.grid.color = gridColor;
    chartFlujo.update();
  }
}
