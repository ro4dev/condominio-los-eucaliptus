var chartRecaudado, chartParcelas, chartFlujo;

function getCSS(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim();
}

function renderRecaudadoChart() {
  var grupos = {};
  GASTOS.forEach(function(r) {
    var p = r.periodo || 'Sin periodo';
    grupos[p] = grupos[p] || { esp: 0, rec: 0 };
    grupos[p].esp += parseFloat(r.monto || 0);
    if (isPagado(r)) {
      grupos[p].rec += parseFloat(r.monto || 0);
    }
  });
  var periodos = Object.keys(grupos).sort();
  var labels = periodos.map(formatPeriodo);
  var datosEsp = periodos.map(function(p) { return grupos[p].esp; });
  var datosRec = periodos.map(function(p) { return grupos[p].rec; });
  var textColor = getCSS('--text');
  var gridColor = getCSS('--border');
  var primary = getCSS('--md-sys-color-primary');
  var muted = getCSS('--text-muted');

  var ctx = document.getElementById('chartRecaudado').getContext('2d');
  if (chartRecaudado) {
    chartRecaudado.destroy();
  }
  chartRecaudado = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Esperado', data: datosEsp, borderColor: muted, borderWidth: 2, borderDash: [5, 5], pointBackgroundColor: muted, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: false },
        { label: 'Recaudado', data: datosRec, borderColor: primary, borderWidth: 2, pointBackgroundColor: primary, pointRadius: 3, pointHoverRadius: 5, tension: 0.3, fill: '-1' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: textColor, boxWidth: 12, padding: 12, font: { size: 11 } } },
        tooltip: { callbacks: { label: function(ctx) { return ctx.dataset.label + ': $' + formatMoney(ctx.parsed.y); } } }
      },
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
  var meses = {};
  FLUJO.forEach(function(f) {
    var m = mesDeFecha(f.fecha);
    if (m) {
      meses[m] = true;
    }
  });
  GASTOS.forEach(function(g) {
    if (g.periodo) {
      meses[g.periodo] = true;
    }
  });
  var keys = Object.keys(meses).sort();
  var labels = keys.map(formatPeriodo);
  var datosIng = keys.map(function(k) { return ingresosMes(k, GASTOS, FLUJO); });
  var datosEgr = keys.map(function(k) { return egresosMes(k, FLUJO); });
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
  var muted = getCSS('--text-muted');
  if (chartRecaudado) {
    chartRecaudado.data.datasets[0].borderColor = muted;
    chartRecaudado.data.datasets[0].pointBackgroundColor = muted;
    chartRecaudado.data.datasets[1].borderColor = primary;
    chartRecaudado.data.datasets[1].pointBackgroundColor = primary;
    chartRecaudado.options.plugins.legend.labels.color = textColor;
    chartRecaudado.options.scales.x.ticks.color = textColor;
    chartRecaudado.options.scales.y.ticks.color = textColor;
    chartRecaudado.options.scales.x.grid.color = gridColor;
    chartRecaudado.options.scales.y.grid.color = gridColor;
    chartRecaudado.update();
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
