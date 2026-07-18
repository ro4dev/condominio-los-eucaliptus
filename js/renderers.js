// ESTADO DE CUENTA
function fillFilters() {
  var periodos = [];
  var parcelas = [];
  GASTOS.forEach(function(r) {
    if (r.periodo && periodos.indexOf(r.periodo) === -1) periodos.push(r.periodo);
    if (r.parcela && parcelas.indexOf(r.parcela) === -1) parcelas.push(r.parcela);
  });
  periodos.sort().reverse();
  parcelas.sort();

  var pf = document.getElementById('periodFilter');
  pf.innerHTML = '<option value="">Todos</option>' + periodos.map(function(p) { return '<option value="' + p + '">' + formatPeriodo(p) + '</option>'; }).join('');

  var paf = document.getElementById('parcelaFilter');
  paf.innerHTML = '<option value="">Todas</option>' + parcelas.map(function(p) { return '<option>' + p + '</option>'; }).join('');

  pf.onchange = applyFilters;
  paf.onchange = applyFilters;
}

function filteredData() {
  var p = document.getElementById('periodFilter').value;
  var pa = document.getElementById('parcelaFilter').value;
  return GASTOS.filter(function(r) { return (!p || r.periodo == p) && (!pa || r.parcela == pa); });
}

function applyFilters() {
  var data = filteredData();
  renderStats(data);
  renderTable(data);
  renderCharts(data);
}

function renderStats(data) {
  var total = data.reduce(function(s, r) { return s + parseFloat(r.monto || 0); }, 0);
  var periodos = [];
  var parcelas = [];
  data.forEach(function(r) {
    if (periodos.indexOf(r.periodo) === -1) periodos.push(r.periodo);
    if (parcelas.indexOf(r.parcela) === -1) parcelas.push(r.parcela);
  });

  document.getElementById('stats').innerHTML =
    '<div class="stat-card"><div class="label">Total recaudado</div><div class="value blue">$' + formatMoney(total) + '</div></div>' +
    '<div class="stat-card"><div class="label">Registros</div><div class="value">' + data.length + '</div></div>' +
    '<div class="stat-card"><div class="label">Periodos</div><div class="value">' + periodos.length + '</div></div>' +
    '<div class="stat-card"><div class="label">Parcelas</div><div class="value">' + parcelas.length + '</div></div>';
}

function renderTable(data) {
  document.getElementById('tableLoading').style.display = 'none';
  document.getElementById('tableGastos').style.display = 'table';
  var tbody = document.getElementById('tableBody');
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:1.5rem">Sin registros</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(function(r) {
    return '<tr>' +
      '<td>' + (r.parcela || '') + '</td>' +
      '<td>' + formatPeriodo(r.periodo) + '</td>' +
      '<td>$' + formatMoney(parseFloat(r.monto || 0)) + '</td>' +
      '<td>' + (r.archivo ? '<a href="' + r.archivo + '" target="_blank">Ver</a>' : '') + '</td>' +
      '</tr>';
  }).join('');
}

// PARCELAS
function renderParcelas() {
  var grid = document.getElementById('parcelasGrid');
  var colorClasses = ['green', 'purple', 'orange', 'pink'];

  var sorted = PARCELAS.slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  grid.innerHTML = sorted.map(function(p, i) {
    var propietarios = PROPIETARIOS.filter(function(pr) { return pr.parcela === p.numero; });
    var colorClass = colorClasses[i % 4];

    var propietariosHtml = propietarios.map(function(prop, j) {
      var propColor = colorClasses[(i + j) % 4];
      var nombre = prop.nombre_completo || '';
      return '<div style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid #f3f4f6">' +
        '<div style="display:flex;align-items:center;gap:0.6rem">' +
          '<div class="avatar ' + propColor + '">' + getInitials(nombre) + '</div>' +
          '<div><div style="font-weight:600;font-size:0.9rem">' + nombre + '</div><div style="font-size:0.75rem;color:#6b7280">' + prop.tipo + '</div></div>' +
        '</div>' +
        '<div style="margin-left:2.4rem;margin-top:0.3rem;font-size:0.8rem;color:#374151">' +
          (prop.telefono ? '<div>📱 <a href="tel:' + prop.telefono + '" style="color:#2563eb;text-decoration:none">' + prop.telefono + '</a></div>' : '') +
          (prop.email ? '<div>✉️ <a href="mailto:' + prop.email + '" style="color:#2563eb;text-decoration:none">' + prop.email + '</a></div>' : '') +
          (prop.rut ? '<div>📄 RUT: ' + prop.rut + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');

    return '<div class="card">' +
      '<h4>' + (p.numero || '') + '</h4>' +
      (p.rol ? '<div class="field"><span class="field-label">Rol</span><span class="field-value">' + p.rol + '</span></div>' : '') +
      '<div class="field"><span class="field-label">Metros²</span><span class="field-value">' + (p.metros || '') + ' m²</span></div>' +
      '<div class="field"><span class="field-label">Estado</span><span class="field-value">' + p.estado + '</span></div>' +
      propietariosHtml +
      '</div>';
  }).join('');
}

// NOTICIAS
var showOldNoticias = false;

function renderNoticias() {
  var list = document.getElementById('noticiasList');
  var hoy = new Date();
  var activas = NOTICIAS.filter(function(n) {
    if (!n.fecha_hasta) return true;
    return new Date(n.fecha_hasta) >= hoy;
  });
  var vencidas = NOTICIAS.filter(function(n) {
    if (!n.fecha_hasta) return false;
    return new Date(n.fecha_hasta) < hoy;
  });

  activas.sort(function(a, b) {
    return new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at);
  });
  vencidas.sort(function(a, b) {
    return new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at);
  });

  var html = '';
  if (activas.length === 0 && !showOldNoticias) {
    html = '<div style="text-align:center;color:#9ca3af;padding:2rem">No hay noticias activas</div>';
  } else {
    html += activas.map(function(n) { return renderNoticiaCard(n); }).join('');
    if (vencidas.length > 0) {
      html += '<div style="text-align:center;margin:1rem 0"><button onclick="toggleOldNoticias()" class="btn-toggle">' + (showOldNoticias ? 'Ocultar anteriores' : 'Ver ' + vencidas.length + ' noticias anteriores') + '</button></div>';
      if (showOldNoticias) {
        html += vencidas.map(function(n) { return renderNoticiaCard(n, true); }).join('');
      }
    }
  }
  list.innerHTML = html;
}

function renderNoticiaCard(n, old) {
  var fecha = formatDate(n.fecha || n.created_at);
  var hasta = formatDate(n.fecha_hasta);
  var style = old ? 'opacity:0.6;' : '';
  return '<div class="news-card" style="margin-bottom:1rem;' + style + '">' +
    '<h4>' + (n.titulo || '') + '</h4>' +
    '<div class="dates">Publicado: ' + fecha + (hasta ? ' · Vigente hasta: ' + hasta : '') + '</div>' +
    '<div class="desc">' + (n.descripcion || '') + '</div>' +
    (n.archivo ? '<a href="' + n.archivo + '" target="_blank" style="color:#2563eb;font-size:0.85rem">Ver archivo adjunto</a>' : '') +
    '</div>';
}

function toggleOldNoticias() {
  showOldNoticias = !showOldNoticias;
  renderNoticias();
}

// INGRESOS/EGRESOS
var flujoFilter = 'todos';

function filterFlujo(tipo) {
  flujoFilter = tipo;
  document.querySelectorAll('#flujoFilter .chip').forEach(function(c) { c.classList.remove('active'); });
  event.target.classList.add('active');
  renderFlujo();
}

function renderFlujo() {
  var ingresos = FLUJO.filter(function(f) { return f.tipo === 'Ingreso'; });
  var egresos = FLUJO.filter(function(f) { return f.tipo === 'Egreso'; });
  var totalIngresos = ingresos.reduce(function(s, f) { return s + parseFloat(f.monto); }, 0);
  var totalEgresos = egresos.reduce(function(s, f) { return s + parseFloat(f.monto); }, 0);
  var balance = totalIngresos - totalEgresos;

  document.getElementById('flujoStats').innerHTML =
    '<div class="stat-card"><div class="label">Ingresos</div><div class="value green">$' + formatMoney(totalIngresos) + '</div></div>' +
    '<div class="stat-card"><div class="label">Egresos</div><div class="value red">$' + formatMoney(totalEgresos) + '</div></div>' +
    '<div class="stat-card"><div class="label">Balance</div><div class="value ' + (balance >= 0 ? 'green' : 'red') + '">$' + formatMoney(balance) + '</div></div>' +
    '<div class="stat-card"><div class="label">Movimientos</div><div class="value">' + FLUJO.length + '</div></div>';

  var filtered = flujoFilter === 'todos' ? FLUJO : FLUJO.filter(function(f) { return f.tipo === flujoFilter; });
  var list = document.getElementById('flujoList');
  var sorted = filtered.slice().sort(function(a, b) {
    return new Date(b.fecha) - new Date(a.fecha);
  });
  list.innerHTML = sorted.map(function(f) {
    var fecha = formatDate(f.fecha);
    var color = f.tipo === 'Ingreso' ? '#059669' : '#dc2626';
    var bgColor = f.tipo === 'Ingreso' ? '#d1fae5' : '#fee2e2';
    var textColor = f.tipo === 'Ingreso' ? '#065f46' : '#991b1b';
    return '<div class="card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem">' +
        '<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:' + bgColor + ';color:' + textColor + '">' + f.tipo + '</span>' +
        '<span style="font-size:0.8rem;color:#6b7280">' + fecha + '</span>' +
      '</div>' +
      '<div style="font-size:1.1rem;font-weight:700;color:' + color + ';margin-bottom:0.4rem">$' + formatMoney(parseFloat(f.monto)) + '</div>' +
      '<div style="font-weight:500;margin-bottom:0.3rem">' + f.concepto + '</div>' +
      (f.descripcion ? '<div style="font-size:0.85rem;color:#6b7280;margin-bottom:0.4rem">' + f.descripcion + '</div>' : '') +
      (f.comprobante ? '<a href="' + f.comprobante + '" target="_blank" style="color:#2563eb;font-size:0.85rem">Ver comprobante</a>' : '') +
      '</div>';
  }).join('');
}

// DOCUMENTOS
function renderDocumentos() {
  var list = document.getElementById('documentosList');
  var icons = { 'Estatuto': '&#128220;', 'Actas': '&#128196;', 'Contratos': '&#128221;', 'Seguros': '&#128737;', 'Planos': '&#128208;' };

  list.innerHTML = DOCUMENTOS.map(function(d) {
    var icon = icons[d.categoria] || '&#128196;';
    var fecha = formatDate(d.fecha || d.created_at);
    return '<div class="doc-item">' +
      '<div class="doc-icon">' + icon + '</div>' +
      '<div class="doc-info">' +
        '<div class="doc-name">' + d.nombre + '</div>' +
        '<div class="doc-meta">' + d.categoria + ' · ' + fecha + '</div>' +
      '</div>' +
      (d.archivo ? '<a href="' + d.archivo + '" class="doc-link" target="_blank">Ver</a>' : '') +
      '</div>';
  }).join('');
}

// RECLAMOS
var reclamosFilter = 'todos';

function filterReclamos(tipo) {
  reclamosFilter = tipo;
  document.querySelectorAll('#reclamosFilter .chip').forEach(function(c) { c.classList.remove('active'); });
  event.target.classList.add('active');
  renderReclamos();
}

function renderReclamos() {
  var list = document.getElementById('reclamosList');
  var filtered = reclamosFilter === 'todos' ? RECLAMOS : RECLAMOS.filter(function(r) { return r.tipo === reclamosFilter; });
  list.innerHTML = filtered.map(function(r) {
    var tipoClass = r.tipo.toLowerCase();
    return '<div class="reclamo-item ' + tipoClass + '">' +
      '<div class="reclamo-header">' +
        '<span class="reclamo-tipo ' + tipoClass + '">' + r.tipo + '</span>' +
        '<span class="reclamo-fecha">' + formatDate(r.fecha || r.created_at) + '</span>' +
      '</div>' +
      '<div class="reclamo-title">' + r.asunto + '</div>' +
      '<div class="reclamo-desc">' + r.descripcion + '</div>' +
      (r.parcela ? '<div class="reclamo-parcela">' + r.parcela + '</div>' : '<div class="reclamo-parcela">Anónimo</div>') +
      '</div>';
  }).join('');
  if (filtered.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:#9ca3af;padding:2rem">Sin registros</div>';
  }
}

// PROVEEDORES
function renderProveedores() {
  var grid = document.getElementById('proveedoresGrid');
  grid.innerHTML = PROVEEDORES.map(function(p) {
    return '<div class="proveedor-card">' +
      '<div class="proveedor-rubro">' + p.rubro + '</div>' +
      '<div class="proveedor-nombre">' + p.nombre + '</div>' +
      '<div class="proveedor-contacto">' +
        '<div>&#128205; ' + p.contacto + '</div>' +
        (p.telefono ? '<div>&#128222; <a href="tel:' + p.telefono + '" style="color:#2563eb;text-decoration:none">' + p.telefono + '</a></div>' : '') +
        (p.email ? '<div>&#9993; <a href="mailto:' + p.email + '" style="color:#2563eb;text-decoration:none">' + p.email + '</a></div>' : '') +
        (p.web_instagram ? '<div>&#127760; <a href="' + p.web_instagram + '" target="_blank" style="color:#2563eb;text-decoration:none">' + p.web_instagram + '</a></div>' : '') +
        '<div style="color:#6b7280;font-size:0.8rem;margin-top:0.3rem">' + p.observaciones + '</div>' +
      '</div>' +
      '</div>';
  }).join('');
}

// ASAMBLEAS
function renderAsambleas() {
  var timeline = document.getElementById('asambleasTimeline');
  var sorted = ASAMBLEAS.slice().sort(function(a, b) {
    return new Date(b.fecha) - new Date(a.fecha);
  });
  timeline.innerHTML = sorted.map(function(a) {
    var extraClass = a.tipo === 'Extraordinaria' ? ' extra' : '';
    var fecha = formatDate(a.fecha);
    var asistentes = a.asistentes ? String(a.asistentes).split(',').map(function(item) {
      return '<span style="display:inline-block;background:#e5e7eb;padding:0.2rem 0.5rem;border-radius:4px;font-size:0.8rem;margin:0.1rem">' + item.trim() + '</span>';
    }).join('') : '';
    return '<div class="timeline-item' + extraClass + '">' +
      '<div class="timeline-date">' + fecha + '</div>' +
      '<span class="timeline-tipo' + extraClass + '">' + a.tipo + '</span>' +
      '<div class="timeline-section"><strong>Temario:</strong><p>' + (a.temario || '') + '</p></div>' +
      '<div class="timeline-section"><strong>Acuerdos:</strong><p>' + (a.acuerdos || '') + '</p></div>' +
      '<div class="timeline-section"><strong>Asistentes:</strong><p>' + asistentes + '</p></div>' +
      '</div>';
  }).join('');
}

loadInitialData();
