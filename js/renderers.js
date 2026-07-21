// ESTADO DE CUENTA
function fillFilters() {
  var periodos = [];
  GASTOS.forEach(function(r) {
    if (r.periodo && periodos.indexOf(r.periodo) === -1) {
      periodos.push(r.periodo);
    }
  });
  periodos.sort().reverse();

  var pf = document.getElementById('periodFilter');
  pf.innerHTML = '<option value="">Todos</option>' + periodos.map(function(p) { return '<option value="' + p + '">' + formatPeriodo(p) + '</option>'; }).join('');

  var paf = document.getElementById('parcelaFilter');
  var sorted = PARCELAS.slice().sort(function(a, b) {
    return (a.numero || '').localeCompare(b.numero || '', undefined, { numeric: true });
  });
  paf.innerHTML = '<option value="">Todas</option>' + sorted.map(function(p) { return '<option value="' + p.id + '">' + p.numero + '</option>'; }).join('');

  pf.onchange = applyFilters;
  paf.onchange = applyFilters;
}

function filteredData() {
  var p = document.getElementById('periodFilter').value;
  var pa = document.getElementById('parcelaFilter').value;
  return GASTOS.filter(function(r) { return (!p || r.periodo == p) && (!pa || r.parcela_id == pa); });
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
    if (periodos.indexOf(r.periodo) === -1) {
      periodos.push(r.periodo);
    }
    if (r.parcela_id && parcelas.indexOf(r.parcela_id) === -1) {
      parcelas.push(r.parcela_id);
    }
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
      '<td>' + parcelName(r.parcela_id) + '</td>' +
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
    var propietarios = PROPIETARIOS.filter(function(pr) { return pr.parcela_id === p.id; });
    var colorClass = colorClasses[i % 4];

    var propietariosHtml = propietarios.map(function(prop, j) {
      var propColor = colorClasses[(i + j) % 4];
      var nombre = prop.nombre_completo || '';
      return '<div style="margin-top:0.8rem;padding-top:0.8rem;border-top:1px solid #f3f4f6">' +
        '<div style="display:flex;align-items:center;gap:0.6rem">' +
          '<div class="avatar ' + propColor + '">' + getInitials(nombre) + '</div>' +
          '<div><div style="font-weight:600;font-size:0.9rem">' + nombre + '</div><div style="font-size:0.75rem;color:var(--text-muted)">' + prop.tipo + '</div></div>' +
        '</div>' +
        '<div style="margin-left:2.4rem;margin-top:0.3rem;font-size:0.8rem;color:var(--text-2)">' +
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
  var hoyStr = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  var activas = NOTICIAS.filter(function(n) {
    if (!n.fecha_hasta) {
      return true;
    }
    return n.fecha_hasta >= hoyStr;
  });
  var vencidas = NOTICIAS.filter(function(n) {
    if (!n.fecha_hasta) {
      return false;
    }
    return n.fecha_hasta < hoyStr;
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
    '<div class="desc">' + nl2br(n.descripcion) + '</div>' +
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
    var color = f.tipo === 'Ingreso' ? '#059669' : '#b91c1c';
    var bgColor = f.tipo === 'Ingreso' ? '#d1fae5' : '#fee2e2';
    var textColor = f.tipo === 'Ingreso' ? '#065f46' : '#991b1b';
    var borderColor = f.tipo === 'Ingreso' ? '#059669' : '#b91c1c';
    return '<div class="flujo-card" style="border-left-color:' + borderColor + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">' +
        '<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:' + bgColor + ';color:' + textColor + '">' + f.tipo + '</span>' +
        '<span style="font-size:1.1rem;font-weight:700;color:' + color + '">$' + formatMoney(parseFloat(f.monto)) + '</span>' +
        '<span style="font-size:0.8rem;color:var(--text-muted)">' + fecha + '</span>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center">' +
        '<div style="font-weight:500">' + f.concepto + '</div>' +
        (f.comprobante ? '<a href="' + f.comprobante + '" target="_blank" style="color:#2563eb;font-size:1rem;text-decoration:none" title="Ver comprobante">&#128206;</a>' : '') +
      '</div>' +
      (f.descripcion ? '<div style="font-size:0.85rem;color:var(--text-muted);margin-bottom:0.4rem">' + nl2br(f.descripcion) + '</div>' : '') +
      '</div>';
  }).join('');
}

// DOCUMENTOS
var documentosFilter = 'Todos';

function filterDocumentos(cat) {
  documentosFilter = cat;
  document.querySelectorAll('#documentosChips .chip').forEach(function(c) {
    c.classList.toggle('active', c.textContent === cat);
  });
  renderDocumentos();
}

function renderDocumentos() {
  var list = document.getElementById('documentosList');
  var icons = { 'Estatuto': '&#128220;', 'Actas': '&#128196;', 'Contratos': '&#128221;', 'Seguros': '&#128737;', 'Planos': '&#128208;' };
  var filtered = DOCUMENTOS.filter(function(d) {
    return documentosFilter === 'Todos' || d.categoria === documentosFilter;
  });

  list.innerHTML = filtered.map(function(d) {
    var icon = icons[d.categoria] || '&#128196;';
    var fecha = formatDate(d.fecha || d.created_at);
    var btns = '<div style="display:flex;gap:0.25rem;flex-shrink:0;align-items:center">';
    if (d.descripcion) {
      btns += '<button onclick="showDescripcion(\'' + d.id + '\')" title="Ver descripción" style="background:none;border:none;cursor:pointer;font-size:1.2rem;padding:0.2rem;color:var(--text-2)">&#9432;</button>';
    }
    if (d.archivo) {
      btns += '<a href="' + d.archivo + '" title="Ver documento" target="_blank" style="text-decoration:none;font-size:1.2rem;padding:0.2rem;color:var(--text-2)">&#128206;</a>';
    }
    btns += '</div>';
    return '<div class="doc-item">' +
      '<div class="doc-icon">' + icon + '</div>' +
      '<div class="doc-info" style="flex:1">' +
        '<div class="doc-name">' + d.nombre + '</div>' +
        '<div class="doc-meta">' + d.categoria + ' · ' + fecha + '</div>' +
      '</div>' +
      btns +
      '</div>';
  }).join('');
}

function showDescripcion(docId) {
  var doc = DOCUMENTOS.find(function(d) { return d.id === docId; });
  if (!doc) return;
  openModal('Descripción', '<div style="line-height:1.6;white-space:pre-wrap">' + (doc.descripcion || '') + '</div>');
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
      '<div class="reclamo-desc">' + nl2br(r.descripcion) + '</div>' +
      (r.parcela_id ? '<div class="reclamo-parcela">' + parcelName(r.parcela_id) + '</div>' : '<div class="reclamo-parcela">Anónimo</div>') +
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
        '<div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.3rem">' + p.observaciones + '</div>' +
      '</div>' +
      '</div>';
  }).join('');
}

// ASAMBLEAS
var asambleasFilter = 'Todos';

function filterAsambleas(tipo) {
  asambleasFilter = tipo;
  document.querySelectorAll('#asambleasChips .chip').forEach(function(c) {
    c.classList.toggle('active', c.textContent === (tipo === 'Todos' ? 'Todos' : (tipo === 'Ordinaria' ? 'Ordinarias' : 'Extraordinarias')));
  });
  renderAsambleas();
}

function renderAsambleas() {
  var timeline = document.getElementById('asambleasTimeline');
  var filtered = ASAMBLEAS.filter(function(a) {
    return asambleasFilter === 'Todos' || a.tipo === asambleasFilter;
  });
  var sorted = filtered.slice().sort(function(a, b) {
    return new Date(b.fecha) - new Date(a.fecha);
  });
  timeline.innerHTML = sorted.map(function(a) {
    var borderColor = a.tipo === 'Extraordinaria' ? '#f59e0b' : '#3b82f6';
    var fecha = formatDate(a.fecha);
    var asistentesIds = (ASAMBLEA_ASISTENTES || []).filter(function(aa) { return aa.asamblea_id === a.id; }).map(function(aa) { return aa.parcela_id; });
    var asistentes = asistentesIds.length ? asistentesIds.map(function(pid) {
      return '<span style="display:inline-block;background:var(--skeleton-1);color:var(--text-2);padding:0.2rem 0.5rem;border-radius:4px;font-size:0.8rem;margin:0.1rem">' + parcelName(pid) + '</span>';
    }).join('') : '';
    return '<div class="flujo-card" style="border-left-color:' + borderColor + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">' +
        '<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:' + (a.tipo === 'Extraordinaria' ? '#fef3c7' : '#dbeafe') + ';color:' + (a.tipo === 'Extraordinaria' ? '#92400e' : '#1e40af') + '">' + a.tipo + '</span>' +
        '<span style="font-size:0.8rem;color:var(--text-muted)">' + fecha + '</span>' +
      '</div>' +
      '<div style="font-size:0.85rem;margin-bottom:0.4rem"><strong>Temario:</strong> ' + nl2br(a.temario) + '</div>' +
      (a.acuerdos ? '<div style="font-size:0.85rem;margin-bottom:0.4rem"><strong>Acuerdos:</strong> ' + nl2br(a.acuerdos) + '</div>' : '') +
      (asistentes ? '<div style="margin-top:0.4rem"><strong style="font-size:0.85rem">Asistentes:</strong><div style="margin-top:0.3rem">' + asistentes + '</div></div>' : '') +
      '</div>';
  }).join('');
}

// ENCUESTAS
var encuestasFilter = 'Todos';

function filterEncuestas(filtro) {
  encuestasFilter = filtro;
  document.querySelectorAll('#encuestasChips .chip').forEach(function(c) {
    c.classList.toggle('active', c.textContent === filtro || (filtro === 'Todos' && c.textContent === 'Todos'));
  });
  renderEncuestas();
}

function getOpciones(encuesta) {
  var alt = encuesta.alternativas;
  if (!alt || !alt.length || (alt.length === 1 && alt[0] === '')) {
    return ['A favor', 'En contra'];
  }
  return alt;
}

function renderEncuestas() {
  var container = document.getElementById('encuestasList');
  var today = new Date().toISOString().slice(0, 10);

  var data = ENCUESTAS.map(function(e) {
    var votos = ENCUESTAS_VOTOS.filter(function(v) { return v.encuesta_id === e.id; });
    var opciones = getOpciones(e);
    var conteo = {};
    opciones.forEach(function(op) { conteo[op] = 0; });
    votos.forEach(function(v) { if (conteo[v.seleccion] !== undefined) conteo[v.seleccion]++; });
    var total = votos.length;
    var cerrada = e.fecha_termino && e.fecha_termino < today;

    var miVoto = null;
    if (currentUser) {
      var miPropietario = (typeof PROPIETARIOS !== 'undefined') ? PROPIETARIOS.find(function(p) { return p.email === currentUser.email; }) : null;
      if (miPropietario) {
        miVoto = votos.find(function(v) { return v.parcela_id === miPropietario.parcela_id; });
      }
    }

    return {
      encuesta: e,
      opciones: opciones,
      conteo: conteo,
      total: total,
      cerrada: cerrada,
      miVoto: miVoto
    };
  });

  if (encuestasFilter === 'Abiertas') { data = data.filter(function(d) {
    return !d.cerrada;
    });
  }
  if (encuestasFilter === 'Cerradas') { data = data.filter(function(d) {
    return d.cerrada;
    });
  }

  data.sort(function(a, b) { return new Date(b.encuesta.created_at) - new Date(a.encuesta.created_at); });

  if (!data.length) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">No hay encuestas para mostrar.</p>';
    return;
  }

  var colores = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  container.innerHTML = data.map(function(d) {
    var e = d.encuesta;
    var quorumAlcanzado = e.quorum ? d.total >= e.quorum : true;
    var borderColor = d.cerrada ? '#9ca3af' : '#22c55e';
    var estadoBg = d.cerrada ? '#f3f4f6' : '#dcfce7';
    var estadoText = d.cerrada ? '#374151' : '#166534';

    var infoExtra = '';
    if (e.fecha_termino) {
      infoExtra += '<span style="font-size:0.8rem;color:var(--text-muted)">Termina: ' + formatDate(e.fecha_termino) + '</span>';
    }
    if (e.quorum) {
      infoExtra += (infoExtra ? ' · ' : '') + '<span style="font-size:0.8rem;color:' + (quorumAlcanzado ? '#16a34a' : '#dc2626') + '">Quorum: ' + d.total + '/' + e.quorum + (quorumAlcanzado ? ' ✓' : '') + '</span>';
    }

    var opcionesHtml = d.opciones.map(function(op, i) {
      var count = d.conteo[op];
      var pct = d.total > 0 ? Math.round((count / d.total) * 100) : 0;
      var color = colores[i % colores.length];
      var esMiVoto = d.miVoto && d.miVoto.seleccion === op;

      var barra = '<div style="display:flex;height:6px;border-radius:3px;overflow:hidden;margin:0.3rem 0;background:var(--skeleton-1)">' +
        '<div style="width:' + pct + '%;background:' + color + ';transition:width 0.3s"></div>' +
      '</div>';

      var boton = '';
      if (!d.cerrada && currentUser && !d.miVoto) {
        boton = ' <button class="btn btn-primary" onclick="votarEncuesta(\'' + e.id + '\', \'' + op.replace(/'/g, "\\'") + '\')" style="font-size:0.75rem;padding:0.2rem 0.6rem;background:' + color + ';border-color:' + color + '">Votar</button>';
      }

      return '<div style="margin-bottom:0.4rem;' + (esMiVoto ? 'background:var(--skeleton-1);padding:0.3rem 0.5rem;border-radius:4px;' : '') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem">' +
          '<span' + (esMiVoto ? ' style="font-weight:600"' : '') + '>' + op + (esMiVoto ? ' ✓' : '') + '</span>' +
          '<span style="color:var(--text-muted)">' + count + ' (' + pct + '%)' + boton + '</span>' +
        '</div>' +
        barra +
      '</div>';
    }).join('');

    var accion = '';
    if (!d.cerrada && currentUser && !d.miVoto) {
      accion = '';
    } else if (d.miVoto) {
      accion = '<div style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-muted)">Ya votaste</div>';
    }

    return '<div class="flujo-card" style="border-left-color:' + borderColor + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">' +
        '<span style="padding:0.2rem 0.6rem;border-radius:999px;font-size:0.75rem;font-weight:600;background:' + estadoBg + ';color:' + estadoText + '">' + (d.cerrada ? 'Cerrada' : 'Abierta') + '</span>' +
        (infoExtra ? '<span>' + infoExtra + '</span>' : '') +
      '</div>' +
      '<div style="font-size:1rem;font-weight:600;margin-bottom:0.3rem;color:var(--text)">' + e.titulo + '</div>' +
      (e.descripcion ? '<div style="font-size:0.85rem;color:var(--text-2);margin-bottom:0.4rem">' + nl2br(e.descripcion) + '</div>' : '') +
      '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.3rem">Total: ' + d.total + ' votos</div>' +
      opcionesHtml + accion +
    '</div>';
  }).join('');
}

async function votarEncuesta(encuestaId, seleccion) {
  if (!currentUser) {
    showSnackbar('Debes iniciar sesión para votar.', 'info');
    return;
  }

  var miPropietario = (typeof PROPIETARIOS !== 'undefined') ? PROPIETARIOS.find(function(p) { return p.email === currentUser.email; }) : null;
  if (!miPropietario || !miPropietario.parcela_id) {
    showSnackbar('No se encontró una parcela asociada a tu cuenta.', 'error');
    return;
  }

  if (DEMO_MODE) {
    ENCUESTAS_VOTOS.push({
      id: generateUUID(),
      encuesta_id: encuestaId,
      parcela_id: miPropietario.parcela_id,
      seleccion: seleccion,
      created_at: new Date().toISOString()
    });
    renderEncuestas();
    return;
  }

  showLoading();
  var { error } = await supabaseClient.from('encuestas_votos').insert({
    encuesta_id: encuestaId,
    parcela_id: miPropietario.parcela_id,
    seleccion: seleccion
  });
  hideLoading();
  if (error) {
    if (error.code === '23505') {
      showSnackbar('Ya votaste en esta encuesta.', 'warning');
    } else {
      showSnackbar('Error al votar: ' + error.message, 'error');
    }
    return;
  }
  await loadJson('ENCUESTAS_VOTOS');
  renderEncuestas();
}

loadInitialData();
