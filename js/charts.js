var chartPeriodos, chartParcelas;

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

  var ctx = document.getElementById('chartPeriodos').getContext('2d');
  if (chartPeriodos) chartPeriodos.destroy();
  chartPeriodos = new Chart(ctx, {
    type: 'bar',
    data: { labels: labels, datasets: [{ label: 'Monto', data: values, backgroundColor: '#3b82f6', borderRadius: 4 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '$' + formatMoney(v); } } } } }
  });
}

function renderParcelaChart(data) {
  var groups = {};
  data.forEach(function(r) {
    var p = r.parcela || 'Sin parcela';
    groups[p] = (groups[p] || 0) + parseFloat(r.monto || 0);
  });
  var labels = Object.keys(groups);
  var values = Object.values(groups);
  var colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'];

  var ctx = document.getElementById('chartParcelas').getContext('2d');
  if (chartParcelas) chartParcelas.destroy();
  chartParcelas = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length) }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } } } }
  });
}
