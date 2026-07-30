var chartPeriodos, chartParcelas;

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
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'Monto', data: values, backgroundColor: primary, borderRadius: 4 }] },
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
      plugins: { legend: { position: 'bottom', labels: { color: textColor, boxWidth: 12, padding: 12, font: { size: 11 } } } }
    }
  });
}

function updateChartTheme() {
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  var primary = getCSS('--md-sys-color-primary');
  if (chartPeriodos) {
    chartPeriodos.data.datasets[0].backgroundColor = primary;
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
}
