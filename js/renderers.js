// Helper: admin actions HTML
function adminActions(editFn, deleteFn) {
  if (!IS_ADMIN) return '';
  return '<div style="display:flex;gap:0rem;flex-shrink:0;align-items:center">' +
    '<md-icon-button onclick="' + editFn + '" title="Editar"><md-icon>edit</md-icon></md-icon-button>' +
    '<md-icon-button onclick="' + deleteFn + '" title="Eliminar"><md-icon>delete</md-icon></md-icon-button>' +
    '</div>';
}

// Helper: acciones para admin o autor del registro
function ownActions(editFn, deleteFn, autorEmail) {
  var puede = IS_ADMIN || (currentUser && autorEmail && currentUser.email === autorEmail);
  if (!puede) return '';
  return '<div style="display:flex;gap:0rem;flex-shrink:0;align-items:center">' +
    '<md-icon-button onclick="' + editFn + '" title="Editar"><md-icon>edit</md-icon></md-icon-button>' +
    '<md-icon-button onclick="' + deleteFn + '" title="Eliminar"><md-icon>delete</md-icon></md-icon-button>' +
    '</div>';
}
// Helper: empty state
function emptyState(texto) {
  return '<div class="empty-state">' +
    '<span class="material-symbols-outlined">inbox</span>' +
    '<p>' + texto + '</p>' +
    '</div>';
}

function deleteItem(table, id, arrayName, renderFn) {
  if (!IS_ADMIN) return;
  var nombres = { gastos: 'este gasto', noticias: 'esta noticia', flujo: 'este movimiento', documentos: 'este documento', proveedores: 'este proveedor', propietarios: 'este propietario' };
  var nombre = nombres[table] || 'este registro';
  showConfirm('¿Estás seguro de eliminar ' + nombre + '? Esta acción no se puede deshacer.', function() {
    if (DEMO_MODE) {
      window[arrayName] = window[arrayName].filter(function(item) { return item.id !== id; });
      showSnackbar('Eliminado (demo).', 'success');
      renderFn();
    } else {
      showLoading();
      if (table === 'propietarios') {
        supabaseClient.functions.invoke('delete-user', { body: { propietario_id: id } }).then(function(res) {
          hideLoading();
          if (res.error) {
            showSnackbar(res.error.message || 'Error al eliminar', 'error');
          } else {
            showSnackbar('Eliminado correctamente.', 'success');
            reloadTab(getCurrentTab());
          }
        });
      } else {
        supabaseDelete(table, id).then(function(result) {
          hideLoading();
          if (result) {
            showSnackbar('Eliminado correctamente.', 'success');
            reloadTab(getCurrentTab());
          }
        });
      }
    }
  });
}

// HOME
function periodoVigente() {
  var p = null;
  GASTOS.forEach(function(g) {
    if (g.periodo && (!p || g.periodo > p)) {
      p = g.periodo;
    }
  });
  return p;
}

function miParcelaId() {
  if (!currentUser || typeof PROPIETARIOS === 'undefined') return null;
  var prop = PROPIETARIOS.find(function(p) { return p.email === currentUser.email; });
  return prop ? prop.parcela_id : null;
}

function egresosDelMes(periodo) {
  return egresosMes(periodo, FLUJO);
}

function renderHome() {
  var periodo = periodoVigente();
  var miParcela = currentUser && !IS_ADMIN ? miParcelaId() : null;
  var esPropietario = !!miParcela;

  var statsEl = document.getElementById('homeStats');
  if (esPropietario) {
    var regsParcela = GASTOS.filter(function(g) { return g.parcela_id === miParcela; });
    var esp = esperadoPorPeriodo(periodo, regsParcela);
    var rec = recaudadoPorPeriodo(periodo, regsParcela);
    var estado = estadoParcelaPago(miParcela, GASTOS);
    var deuda = deudaParcela(miParcela, GASTOS);
    statsEl.innerHTML =
      '<div class="stat-card"><div class="label">Pagado (periodo)</div><div class="value blue">$' + formatMoney(rec) + '</div></div>' +
      '<div class="stat-card"><div class="label">Cuota (periodo)</div><div class="value">$' + formatMoney(esp) + '</div></div>' +
      '<div class="stat-card"><div class="label">Estado</div><div class="value ' + (estado === 'Al día' ? 'green' : 'red') + '">' + estado + '</div></div>' +
      '<div class="stat-card"><div class="label">Deuda acumulada</div><div class="value ' + (deuda > 0 ? 'red' : 'green') + '">$' + formatMoney(deuda) + '</div></div>';
  } else {
    var recaudado = recaudadoPorPeriodo(periodo, GASTOS);
    var esperado = esperadoPorPeriodo(periodo, GASTOS);
    var egresos = egresosDelMes(periodo);
    var cantidadMorosos = morosos(GASTOS, PARCELAS).length;
    statsEl.innerHTML =
      '<div class="stat-card"><div class="label">Recaudado (periodo)</div><div class="value blue">$' + formatMoney(recaudado) + '</div></div>' +
      '<div class="stat-card"><div class="label">Esperado (periodo)</div><div class="value">$' + formatMoney(esperado) + '</div></div>' +
      '<div class="stat-card"><div class="label">Egresos (periodo)</div><div class="value red">$' + formatMoney(egresos) + '</div></div>' +
      '<div class="stat-card"><div class="label">Morosos</div><div class="value ' + (cantidadMorosos > 0 ? 'red' : 'green') + '">' + cantidadMorosos + '</div></div>';
  }

  var pct = esPropietario
    ? pctRecaudado(periodo, GASTOS.filter(function(g) { return g.parcela_id === miParcela; }))
    : pctRecaudado(periodo, GASTOS);
  var fill = document.getElementById('homeRecaudacionFill');
  fill.style.width = pct + '%';
  fill.style.background = pct >= 90 ? 'var(--color-positive)' : (pct >= 60 ? '#f59e0b' : 'var(--md-sys-color-error)');
  document.getElementById('homeRecaudacionLabel').textContent =
    pct + '% de las cuotas del periodo pagadas' + (esPropietario ? ' (tu parcela)' : '') + '.';

  renderMorosos();
  renderAvisoAumento();
}

function renderAvisoAumento() {
  var el = document.getElementById('homeAviso');
  if (!el) return;
  var aviso = avisoAumento();
  if (!aviso) {
    el.style.display = 'none';
    return;
  }
  el.style.display = '';
  el.innerHTML =
    '<div class="aviso-card" style="display:flex;align-items:center;gap:0.8rem;flex-wrap:wrap">' +
      '<md-icon style="color:#f59e0b">trending_up</md-icon>' +
      '<div style="flex:1;min-width:200px">' +
        '<strong>Cuota ' + formatPeriodo(aviso.periodo) + ' subirá a $' + formatMoney(aviso.nuevo) + '</strong>' +
        '<div style="font-size:0.8rem;color:var(--text-2)">Actualmente $' + formatMoney(aviso.anterior) + ' (+' + aviso.pct + '%)</div>' +
      '</div>' +
      (IS_ADMIN ? '<md-filled-button class="admin-only" onclick="formGenerarCuotas(\'' + aviso.periodo + '\')"><md-icon slot="icon">add</md-icon>Generar cuotas</md-filled-button>' : '') +
    '</div>';
}

function renderMorosos() {
  var card = document.getElementById('homeMorosos');
  var list = document.getElementById('homeMorososList');
  if (!currentUser) {
    card.style.display = 'none';
    return;
  }
  card.style.display = '';
  var miParcela = miParcelaId();

  var mcard = function(m, isPropia) {
    var periodos = periodosPendientes(m.parcela_id, GASTOS).length;
    return '<div class="moroso-card" onclick="openDeudaParcela(\'' + m.parcela_id + '\')">' +
      '<div class="moroso-card-num">' + escHtml(m.numero) + (isPropia ? ' <span class="moroso-card-propia">(tu parcela)</span>' : '') + '</div>' +
      '<div class="moroso-card-deuda">$' + formatMoney(m.deuda) + '</div>' +
      '<div class="moroso-card-periodos">' + (periodos ? periodos + ' periodo' + (periodos > 1 ? 's' : '') : '') + '</div>' +
    '</div>';
  };

  if (IS_ADMIN) {
    var mor = morosos(GASTOS, PARCELAS);
    if (!mor.length) {
      list.innerHTML = emptyState('Todas las parcelas están al día.');
      return;
    }
    list.innerHTML = '<div class="morosos-grid">' + mor.map(function(m) { return mcard(m, false); }).join('') + '</div>';
  } else if (miParcela) {
    var deuda = deudaParcela(miParcela, GASTOS);
    if (deuda <= 0) {
      list.innerHTML = emptyState('Tu parcela está al día.');
      return;
    }
    list.innerHTML = '<div class="morosos-grid">' + mcard({ parcela_id: miParcela, numero: parcelName(miParcela), deuda: deuda }, true) + '</div>';
  } else {
    card.style.display = 'none';
  }
}

function openDeudaParcela(parcelaId) {
  var detalle = deudaPorPeriodo(parcelaId, GASTOS);
  var total = deudaParcela(parcelaId, GASTOS);
  var nombre = escHtml(parcelName(parcelaId));
  if (!detalle.length) {
    openModal('Deuda de ' + nombre,
      '<p style="color:var(--text-muted);margin:0">Esta parcela está al día.</p>' +
      (total === 0 ? '' : '<p style="color:var(--text-muted);margin:0.5rem 0 0">Tiene saldo a favor que se aplicará a futuros periodos.</p>'),
      footerDeuda(parcelaId));
    return;
  }
  var body =
    '<div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--text-muted);padding-bottom:0.4rem;border-bottom:1px solid var(--divider)">' +
      '<span>Periodo</span><span>Deuda</span>' +
    '</div>' +
    detalle.map(function(d) {
      return '<div style="display:flex;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--divider)">' +
        '<span style="color:var(--text)">' + (d.periodo ? formatPeriodo(d.periodo) : 'Sin periodo') + '</span>' +
        '<span style="color:var(--text-2)">$' + formatMoney(d.monto) + '</span>' +
      '</div>';
    }).join('') +
    '<div style="display:flex;justify-content:space-between;padding-top:0.7rem;font-weight:700;color:var(--text)">' +
      '<span>Total</span><span style="color:var(--md-sys-color-error)">$' + formatMoney(total) + '</span>' +
    '</div>';
  openModal('Deuda de ' + nombre, body, footerDeuda(parcelaId));
}

function footerDeuda(parcelaId) {
  var footer = '<md-text-button onclick="closeModal()">Cerrar</md-text-button>';
  if (IS_ADMIN) {
    footer += '<md-filled-button onclick="formPagoParcela(\'' + parcelaId + '\')"><md-icon slot="icon">payments</md-icon>Registrar pago</md-filled-button>';
  }
  return footer;
}

function openComoPagar(parcelaId) {
  var d = CONFIG.datos_pago || {};
  var tieneDatos = !!(d.banco || d.tipo_cuenta || d.numero_cuenta || d.rut || d.titular || d.email);

  var body = '';
  if (parcelaId) {
    var monto = deudaParcela(parcelaId, GASTOS);
    body += '<p style="margin:0 0 0.8rem;font-weight:600;color:var(--text)">Deuda de ' + escHtml(parcelName(parcelaId)) + ': $' + formatMoney(monto) + '</p>';
  } else if (currentUser) {
    var mp = miParcelaId();
    if (mp) {
      var montoPropia = deudaParcela(mp, GASTOS);
      body += '<p style="margin:0 0 0.8rem;font-weight:600;color:var(--text)">Tu deuda: $' + formatMoney(montoPropia) + '</p>';
    }
  }

  var campos = [];
  if (!tieneDatos) {
    body += '<p style="color:var(--text-muted);margin:0">Sin datos de pago configurados.</p>';
  } else {
    campos = [
      ['Banco', d.banco],
      ['Tipo de cuenta', d.tipo_cuenta],
      ['Número de cuenta', d.numero_cuenta],
      ['RUT', d.rut],
      ['Titular', d.titular],
      ['Email', d.email]
    ];
    body += campos.filter(function(c) { return c[1]; }).map(function(c) {
      return '<div class="pago-row">' +
        '<span class="pago-label">' + c[0] + '</span>' +
        '<span class="value" onclick="copiarValor(this)" title="Tocar para copiar">' + escHtml(c[1]) + '</span>' +
        '</div>';
    }).join('');
    if (d.qr) {
      body += '<img src="' + d.qr + '" alt="Código QR de pago" class="pago-qr">';
    }
  }

  var allText = campos.filter(function(c) { return c[1]; }).map(function(c) { return c[0] + ': ' + c[1]; }).join('\n');
  var footer = '<md-text-button onclick="closeModal()">Cerrar</md-text-button>';
  if (allText) {
    footer += '<md-filled-button onclick="copiarTodosDatos()"><md-icon slot="icon">content_copy</md-icon>Copiar datos</md-filled-button>';
  }
  openModal('Cómo pagar tu cuota', body, footer);
}

function copiarTodosDatos() {
  var d = CONFIG.datos_pago || {};
  var lineas = [
    ['Banco', d.banco],
    ['Tipo de cuenta', d.tipo_cuenta],
    ['Número de cuenta', d.numero_cuenta],
    ['RUT', d.rut],
    ['Titular', d.titular],
    ['Email', d.email]
  ].filter(function(c) { return c[1]; }).map(function(c) { return c[0] + ': ' + c[1]; });
  copiarTexto(lineas.join('\n'));
}

function copiarValor(el) {
  copiarTexto(el.textContent || '');
}

function copiarTexto(texto) {
  function done() {
    showSnackbar('Copiado al portapapeles.', 'success');
  }
  function fallback() {
    var ta = document.createElement('textarea');
    ta.value = texto;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      done();
    } catch (e) {
      showSnackbar('No se pudo copiar.', 'error');
    }
    document.body.removeChild(ta);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(done, fallback);
  } else {
    fallback();
  }
}

// FINANZAS / BALANCE
function renderFinanzas() {
  renderRecaudadoChart();
  renderFlujoChart();
  renderPeriodoEnCurso();
  renderResumenPeriodos();
}

function periodoVigente() {
  var periodos = periodosFinanzas(GASTOS, FLUJO);
  return periodos.length ? periodos[0] : null;
}

function renderPeriodoEnCurso() {
  var el = document.getElementById('finanzasPeriodoEnCurso');
  if (!el) return;
  var p = periodoVigente();
  if (!p) {
    el.innerHTML = '';
    return;
  }
  var esp = esperadoPorPeriodo(p, GASTOS);
  var rec = recaudadoPorPeriodo(p, GASTOS);
  var pct = esp ? Math.round((rec / esp) * 100) : 0;
  var eg = egresosMes(p, FLUJO);
  var sal = saldoPeriodo(p, GASTOS, FLUJO);
  var fillColor = pct >= 90 ? 'var(--color-positive)' : (pct >= 60 ? '#f59e0b' : 'var(--md-sys-color-error)');
  el.innerHTML =
    '<div class="card">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:0.4rem">' +
        '<h4 style="margin:0">Periodo en curso</h4>' +
        '<div style="display:flex;gap:0.25rem;flex-shrink:0">' +
          '<md-icon-button onclick="verCuotasPeriodo(\'' + p + '\')" title="Ver cuotas del periodo"><md-icon>receipt_long</md-icon></md-icon-button>' +
          '<md-icon-button onclick="verMovimientosPeriodo(\'' + p + '\')" title="Ver movimientos del periodo"><md-icon>swap_vert</md-icon></md-icon-button>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:0.85rem;color:var(--text-2);margin-bottom:0.8rem">Periodo <strong style="color:var(--text)">' + formatPeriodo(p) + '</strong></div>' +
      '<section class="stats" style="margin-bottom:0.8rem">' +
        '<div class="stat-card"><div class="label">Esperado</div><div class="value">$' + formatMoney(esp) + '</div></div>' +
        '<div class="stat-card"><div class="label">Recaudado</div><div class="value blue">$' + formatMoney(rec) + '</div></div>' +
        '<div class="stat-card"><div class="label">Egresos</div><div class="value red">$' + formatMoney(eg) + '</div></div>' +
        '<div class="stat-card"><div class="label">Saldo</div><div class="value ' + (sal >= 0 ? 'green' : 'red') + '">$' + formatMoney(sal) + '</div></div>' +
      '</section>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + Math.min(100, pct) + '%;background:' + fillColor + '"></div></div>' +
      '<p class="progress-label">' + pct + '% de las cuotas del periodo pagadas</p>' +
    '</div>';
}

function estadoChip(g) {
  var pagado = sumPagosGasto(g.id);
  var monto = parseFloat(g.monto || 0);
  var estado, bg, color;
  if (isPagado(g)) {
    estado = 'Pagado';
    bg = 'var(--color-positive-bg)';
    color = 'var(--color-positive-text)';
  } else if (pagado > 0 && pagado < monto) {
    estado = 'Parcial';
    bg = 'var(--color-extraordinaria-bg)';
    color = 'var(--color-extraordinaria-text)';
  } else {
    estado = 'Pendiente';
    bg = 'var(--md-sys-color-surface-container-highest)';
    color = 'var(--md-sys-color-on-surface-variant)';
  }
  return '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;white-space:nowrap;background:' + bg + ';color:' + color + '">' + estado + '</span>';
}

function renderResumenPeriodos() {
  var wrap = document.getElementById('resumenPeriodosWrap');
  var table = document.getElementById('tableResumenPeriodos');
  var tbody = document.getElementById('resumenPeriodosBody');
  if (!wrap || !table || !tbody) return;
  var sk = document.getElementById('resumenPeriodosSkeleton');
  if (sk) {
    sk.style.display = 'none';
  }
  var emptyEl = document.getElementById('resumenPeriodosEmpty');
  if (emptyEl) {
    emptyEl.style.display = 'none';
    emptyEl.innerHTML = '';
  }
  var periodos = periodosFinanzas(GASTOS, FLUJO);
  if (!periodos.length) {
    table.style.display = 'none';
    if (emptyEl) {
      emptyEl.style.display = '';
      emptyEl.innerHTML = emptyState('Sin datos para mostrar.');
    }
    return;
  }
  table.style.display = 'table';
  var totals = { esp: 0, rec: 0, eg: 0, sal: 0 };
  var rows = periodos.map(function(p) {
    var esp = esperadoPorPeriodo(p, GASTOS);
    var rec = recaudadoPorPeriodo(p, GASTOS);
    var eg = egresosMes(p, FLUJO);
    var sal = saldoPeriodo(p, GASTOS, FLUJO);
    totals.esp += esp;
    totals.rec += rec;
    totals.eg += eg;
    totals.sal += sal;
    var pct = esp ? Math.round((rec / esp) * 100) : 0;
    var pctColor = pct >= 90 ? 'var(--color-positive)' : (pct >= 60 ? '#f59e0b' : 'var(--md-sys-color-error)');
    return '<tr>' +
      '<td style="font-weight:600;color:var(--text);white-space:nowrap">' + formatPeriodo(p) + '</td>' +
      '<td>$' + formatMoney(esp) + '</td>' +
      '<td>$' + formatMoney(rec) + '</td>' +
      '<td style="font-weight:600;color:' + pctColor + '">' + pct + '%</td>' +
      '<td>$' + formatMoney(eg) + '</td>' +
      '<td style="font-weight:600;white-space:nowrap;color:' + (sal >= 0 ? 'var(--color-positive)' : 'var(--md-sys-color-error)') + '">$' + formatMoney(sal) + '</td>' +
      '<td style="width:1%;white-space:nowrap">' +
        '<md-icon-button onclick="verCuotasPeriodo(\'' + p + '\')" title="Ver cuotas del periodo"><md-icon>receipt_long</md-icon></md-icon-button>' +
      '</td>' +
      '<td style="width:1%;white-space:nowrap">' +
        '<md-icon-button onclick="verMovimientosPeriodo(\'' + p + '\')" title="Ver movimientos del periodo"><md-icon>swap_vert</md-icon></md-icon-button>' +
      '</td>' +
      '</tr>';
  }).join('');
  var pctTotal = totals.esp ? Math.round((totals.rec / totals.esp) * 100) : 0;
  var pctTotalColor = pctTotal >= 90 ? 'var(--color-positive)' : (pctTotal >= 60 ? '#f59e0b' : 'var(--md-sys-color-error)');
  var totalsRow =
    '<tr class="resumen-totales">' +
      '<td style="font-weight:700;color:var(--text)">Totales</td>' +
      '<td style="font-weight:600">$' + formatMoney(totals.esp) + '</td>' +
      '<td style="font-weight:600">$' + formatMoney(totals.rec) + '</td>' +
      '<td style="font-weight:600;color:' + pctTotalColor + '">' + pctTotal + '%</td>' +
      '<td style="font-weight:600">$' + formatMoney(totals.eg) + '</td>' +
      '<td style="font-weight:700;color:' + (totals.sal >= 0 ? 'var(--color-positive)' : 'var(--md-sys-color-error)') + '">$' + formatMoney(totals.sal) + '</td>' +
      '<td></td>' +
      '<td></td>' +
    '</tr>';
  tbody.innerHTML = rows + totalsRow;
}

function verCuotasPeriodo(periodo) {
  var esp = esperadoPorPeriodo(periodo, GASTOS);
  var rec = recaudadoPorPeriodo(periodo, GASTOS);
  var pct = esp ? Math.round((rec / esp) * 100) : 0;
  var pctColor = pct >= 90 ? 'var(--color-positive)' : (pct >= 60 ? '#f59e0b' : 'var(--md-sys-color-error)');
  var head = '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:0.8rem">' +
    '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:var(--surface-hover);color:var(--text-2)">Periodo ' + formatPeriodo(periodo) + '</span>' +
    '<span style="font-size:0.85rem;color:var(--text-2)">Esperado <strong style="color:var(--text)">$' + formatMoney(esp) + '</strong> · Recaudado <strong style="color:var(--md-sys-color-primary)">$' + formatMoney(rec) + '</strong> · <strong style="color:' + pctColor + '">' + pct + '%</strong></span>' +
    '</div>';
  var footer = '<md-text-button onclick="closeModal()">Cerrar</md-text-button>';
  openModal('Cuotas del periodo', head + resumenCuotasDetalle(periodo), footer);
}

function verMovimientosPeriodo(periodo) {
  var ing = FLUJO.filter(function(f) { return f.tipo === 'Ingreso' && mesDeFecha(f.fecha) === periodo; }).reduce(function(s, f) { return s + parseFloat(f.monto || 0); }, 0);
  var eg = egresosMes(periodo, FLUJO);
  var head = '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:0.8rem">' +
    '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:var(--surface-hover);color:var(--text-2)">Periodo ' + formatPeriodo(periodo) + '</span>' +
    '<span style="font-size:0.85rem;color:var(--text-2)">Ingresos <strong style="color:var(--color-positive)">$' + formatMoney(ing) + '</strong> · Egresos <strong style="color:var(--md-sys-color-error)">$' + formatMoney(eg) + '</strong></span>' +
    '</div>';
  var footer = '<md-text-button onclick="closeModal()">Cerrar</md-text-button>';
  openModal('Movimientos del periodo', head + resumenMovimientosDetalle(periodo), footer);
}

function resumenCuotasDetalle(periodo) {
  var cuotas = GASTOS.filter(function(g) { return g.periodo === periodo; });
  if (!cuotas.length) {
    return '<p style="margin:0;color:var(--text-muted);font-size:0.85rem">Sin cuotas para este periodo.</p>';
  }
  return '<div style="overflow-x:auto"><table style="min-width:420px">' +
    '<thead><tr><th>Parcela</th><th>Monto</th><th>Pagado</th><th>Estado</th><th></th></tr></thead>' +
    '<tbody>' + cuotas.map(function(g) {
      return '<tr>' +
        '<td>' + parcelName(g.parcela_id) + '</td>' +
        '<td>$' + formatMoney(parseFloat(g.monto || 0)) + '</td>' +
        '<td>$' + formatMoney(sumPagosGasto(g.id)) + '</td>' +
        '<td>' + estadoChip(g) + '</td>' +
        '<td style="width:1%;white-space:nowrap">' +
          '<md-icon-button onclick="verPagos(\'' + g.id + '\')" title="Ver pagos"><md-icon>payments</md-icon></md-icon-button>' +
          adminActions("editGasto('" + g.id + "')", "deleteGasto('" + g.id + "')") +
        '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function resumenMovimientosDetalle(periodo) {
  var movs = FLUJO.filter(function(f) { return mesDeFecha(f.fecha) === periodo; }).slice().sort(function(a, b) {
    return new Date(b.fecha) - new Date(a.fecha);
  });
  if (!movs.length) {
    return '<p style="margin:0;color:var(--text-muted);font-size:0.85rem">Sin movimientos para este periodo.</p>';
  }
  return '<div style="overflow-x:auto"><table style="min-width:420px">' +
    '<thead><tr><th>Fecha</th><th>Tipo</th><th>Concepto</th><th>Monto</th><th></th></tr></thead>' +
    '<tbody>' + movs.map(function(f) {
      var color = f.tipo === 'Ingreso' ? 'var(--color-positive)' : 'var(--md-sys-color-error)';
      var bgColor = f.tipo === 'Ingreso' ? 'var(--color-positive-bg)' : 'var(--md-sys-color-error-container)';
      var textColor = f.tipo === 'Ingreso' ? 'var(--color-positive-text)' : 'var(--md-sys-color-on-error-container)';
      return '<tr>' +
        '<td style="white-space:nowrap">' + formatDate(f.fecha) + '</td>' +
        '<td><span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:' + bgColor + ';color:' + textColor + '">' + escHtml(f.tipo) + '</span></td>' +
        '<td>' + escHtml(f.concepto) + (f.descripcion ? '<div style="font-size:0.8rem;color:var(--text-muted)">' + nl2br(f.descripcion) + '</div>' : '') + '</td>' +
        '<td style="text-align:right;font-weight:600;white-space:nowrap;color:' + color + '">$' + formatMoney(parseFloat(f.monto)) + '</td>' +
        '<td style="width:1%;white-space:nowrap">' + adminActions("editFlujo('" + f.id + "')", "deleteFlujo('" + f.id + "')") + '</td></tr>';
    }).join('') + '</tbody></table></div>';
}

// PARCELAS
function renderParcelas() {
  var wrap = document.getElementById('parcelasGrid');

  if (!PARCELAS.length) {
    wrap.innerHTML = emptyState('No hay parcelas registradas.');
    return;
  }

  var sorted = PARCELAS.slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  var estadoChip = function(estado) {
    var st = String(estado || '').toLowerCase();
    var bg, color;
    if (st.indexOf('habit') !== -1) {
      bg = 'var(--color-positive-bg)';
      color = 'var(--color-positive-text)';
    } else if (st.indexOf('construc') !== -1) {
      bg = 'var(--color-extraordinaria-bg)';
      color = 'var(--color-extraordinaria-text)';
    } else {
      bg = 'var(--md-sys-color-surface-container-highest)';
      color = 'var(--md-sys-color-on-surface-variant)';
    }
    return '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;white-space:nowrap;background:' + bg + ';color:' + color + '">' + escHtml(estado) + '</span>';
  };

  var rows = sorted.map(function(p) {
    var propietarios = PROPIETARIOS.filter(function(pr) { return pr.parcela_id === p.id; });
    return '<tr>' +
      '<td style="font-weight:600;color:var(--text)">' + escHtml(p.numero || '') + '</td>' +
      '<td>' + escHtml(p.rol || '—') + '</td>' +
      '<td>' + (p.metros ? escHtml(p.metros) + ' m²' : '—') + '</td>' +
      '<td>' + estadoChip(p.estado) + '</td>' +
      '<td><div style="display:flex;align-items:center;gap:0.2rem">' +
        '<md-icon-button onclick="showPropietarios(\'' + p.id + '\')" title="Ver propietarios (' + propietarios.length + ')" style="color:var(--md-sys-color-primary)"><md-icon>groups</md-icon></md-icon-button>' +
        '<span style="font-size:0.8rem;color:var(--text-2)">' + propietarios.length + '</span>' +
      '</div></td>' +
      '<td style="width:1%;white-space:nowrap">' + (IS_ADMIN ? '<md-icon-button onclick="editParcela(\'' + p.id + '\')" title="Editar"><md-icon>edit</md-icon></md-icon-button>' : '') + '</td>' +
      '</tr>';
  }).join('');

  wrap.innerHTML = '<table style="min-width:560px">' +
    '<thead><tr>' +
      '<th>Parcela</th><th>Rol</th><th>Metros²</th><th>Estado</th><th>Propietarios</th><th style="width:1%;white-space:nowrap"></th>' +
    '</tr></thead>' +
    '<tbody>' + rows + '</tbody>' +
    '</table>';
}

// POPUP PROPIETARIOS (desde card de parcela)
function showPropietarios(parcelaId) {
  var parcela = PARCELAS.find(function(p) { return p.id === parcelaId; });
  if (!parcela) return;
  var props = PROPIETARIOS.filter(function(pr) { return pr.parcela_id === parcelaId; });

  var body;
  if (!props.length) {
    body = '<div style="text-align:center;color:var(--text-muted);padding:2rem">No hay propietarios registrados para esta parcela.</div>';
  } else {
    body = props.map(function(prop, j) {
      var nombre = prop.nombre_completo || '';
      return '<div style="padding:0.8rem 0;' + (j > 0 ? 'border-top:1px solid var(--divider)' : '') + '">' +
        '<div style="display:flex;align-items:center;gap:0.6rem">' +
          '<div style="flex:1;min-width:0">' +
            '<div style="font-weight:600;font-size:0.9rem;color:var(--text)">' + escHtml(nombre) + '</div>' +
            '<div style="font-size:0.75rem;color:var(--text-2)">' + escHtml(prop.tipo) + '</div>' +
          '</div>' +
          (IS_ADMIN ? '<div style="display:flex;flex-shrink:0;align-items:center">' +
            '<md-icon-button onclick="editPropietario(\'' + prop.id + '\')" title="Editar"><md-icon>edit</md-icon></md-icon-button>' +
            '<md-icon-button onclick="deleteItem(\'propietarios\', \'' + prop.id + '\', \'PROPIETARIOS\', renderParcelas)" title="Eliminar"><md-icon>delete</md-icon></md-icon-button>' +
          '</div>' : '') +
        '</div>' +
        '<div style="margin-top:0.3rem;font-size:0.8rem;color:var(--text-2)">' +
          (prop.telefono ? '<div><md-icon style="vertical-align:middle;font-size:1rem" aria-label="Teléfono" title="Teléfono">phone</md-icon> <a href="tel:' + escHtml(prop.telefono) + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + escHtml(prop.telefono) + '</a></div>' : '') +
          (prop.email ? '<div><md-icon style="vertical-align:middle;font-size:1rem" aria-label="Correo" title="Correo">mail</md-icon> <a href="mailto:' + escHtml(prop.email) + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + escHtml(prop.email) + '</a></div>' : '') +
          (prop.rut ? '<div><md-icon style="vertical-align:middle;font-size:1rem" aria-label="RUT" title="RUT">badge</md-icon> RUT: ' + escHtml(prop.rut) + '</div>' : '') +
        '</div>' +
      '</div>';
    }).join('');
  }

  var footer = '<md-text-button onclick="closeModal()">Cerrar</md-text-button>';
  if (IS_ADMIN) {
    footer += '<md-filled-button onclick="formPropietarios(\'' + parcelaId + '\')"><md-icon slot="icon">person_add</md-icon>Agregar</md-filled-button>';
  }
  openModal('Propietarios de ' + escHtml(parcela.numero || parcelaId), body, footer);
}

// NOTICIAS
var noticiasFilter = 'vigentes';

function filterNoticias(filtro) {
  noticiasFilter = filtro;
  document.querySelectorAll('#noticiasFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderNoticias();
}

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

  var mostrar = [];
  if (noticiasFilter === 'vigentes') {
    mostrar = activas;
  } else if (noticiasFilter === 'no_vigentes') {
    mostrar = vencidas;
  } else {
    mostrar = activas.concat(vencidas);
  }

  if (mostrar.length === 0) {
    list.innerHTML = emptyState('No hay noticias.');
    return;
  }

  list.innerHTML = mostrar.map(function(n) {
    var esVencida = vencidas.indexOf(n) !== -1;
    return renderNoticiaCard(n, esVencida);
  }).join('');
}

function renderNoticiaCard(n, old) {
  var fecha = formatDate(n.fecha || n.created_at);
  return '<div class="news-card">' +
    '<div style="display:flex;justify-content:space-between;align-items:center">' +
      '<h4 style="margin:0;flex:1">' + escHtml(n.titulo) + '</h4>' +
      '<span class="dates" style="margin:0">' + fecha + '</span>' +
      adminActions("editNoticia('" + n.id + "')", "deleteNoticia('" + n.id + "')") +
    '</div>' +
    '<div class="desc">' + nl2br(n.descripcion) + '</div>' +
    (n.archivo ? '<a href="' + n.archivo + '" target="_blank" style="color:var(--md-sys-color-primary);font-size:0.85rem">Ver archivo adjunto</a>' : '') +
    '</div>';
}

// DOCUMENTOS
var documentosFilter = 'Todos';

function filterDocumentos(cat) {
  documentosFilter = cat;
  document.querySelectorAll('#documentosChips md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderDocumentos();
}

function renderDocumentos() {
  var list = document.getElementById('documentosList');
  var icons = { 'Estatuto': 'book', 'Actas': 'description', 'Contratos': 'contract', 'Seguros': 'shield', 'Planos': 'map' };
  var filtered = DOCUMENTOS.filter(function(d) {
    return documentosFilter === 'Todos' || d.categoria === documentosFilter;
  });

  list.innerHTML = filtered.map(function(d) {
    var icon = icons[d.categoria] || 'description';
    var fecha = formatDate(d.fecha || d.created_at);
    var btns = '<div style="display:flex;gap:0rem;flex-shrink:0;align-items:center">';
    btns += adminActions("editDocumento('" + d.id + "')", "deleteDocumento('" + d.id + "')");
    if (d.descripcion) {
      btns += '<md-icon-button onclick="showDescripcion(\'' + d.id + '\')" title="Ver descripción"><md-icon>info</md-icon></md-icon-button>';
    }
    if (d.archivo) {
      btns += '<a href="' + d.archivo + '" title="Ver documento" target="_blank" style="text-decoration:none"><md-icon-button style="color:var(--text-2)"><md-icon>description</md-icon></md-icon-button></a>';
    }
    btns += '</div>';
    return '<div class="doc-item">' +
      '<div class="doc-icon"><md-icon aria-label="' + (d.categoria || 'Documento') + '" title="' + (d.categoria || 'Documento') + '">' + icon + '</md-icon></div>' +
      '<div class="doc-info" style="flex:1">' +
        '<div class="doc-name">' + escHtml(d.nombre) + '</div>' +
        '<div class="doc-meta">' + d.categoria + ' · ' + fecha + '</div>' +
      '</div>' +
      btns +
      '</div>';
  }).join('');

  if (!filtered.length) {
    list.innerHTML = emptyState('No hay documentos en esta categoría.');
  }
}

function showDescripcion(docId) {
  var doc = DOCUMENTOS.find(function(d) { return d.id === docId; });
  if (!doc) return;
  openModal('Descripción', '<div style="line-height:1.6;white-space:pre-wrap">' + escHtml(doc.descripcion) + '</div>');
}

// RECLAMOS
var reclamosFilter = 'todos';

function filterReclamos(tipo) {
  reclamosFilter = tipo;
  document.querySelectorAll('#reclamosFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderReclamos();
}

function renderReclamos() {
  var list = document.getElementById('reclamosList');
  var filtered = reclamosFilter === 'todos' ? RECLAMOS : RECLAMOS.filter(function(r) { return r.tipo === reclamosFilter; });
  list.innerHTML = filtered.map(function(r) {
    var tipoClass = String(r.tipo || '').toLowerCase().replace(/[^a-z0-9-]/g, '') || 'reclamo';
    return '<div class="reclamo-item ' + tipoClass + '">' +
      '<div class="reclamo-header">' +
        '<span class="reclamo-tipo ' + tipoClass + '">' + escHtml(r.tipo) + '</span>' +
        '<span class="reclamo-fecha">' + formatDate(r.fecha || r.created_at) + '</span>' +
      '</div>' +
      '<div class="reclamo-title">' + escHtml(r.asunto) + '</div>' +
      '<div class="reclamo-desc">' + nl2br(r.descripcion) + '</div>' +
      (r.parcela_id ? '<div class="reclamo-parcela">' + parcelName(r.parcela_id) + '</div>' : '<div class="reclamo-parcela">Anónimo</div>') +
      '</div>';
  }).join('');
  if (filtered.length === 0) {
    list.innerHTML = emptyState('No hay comentarios.');
  }
}

// PROVEEDORES
function renderProveedores() {
  var grid = document.getElementById('proveedoresGrid');
  grid.innerHTML = PROVEEDORES.map(function(p) {
    return '<div class="proveedor-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">' +
        '<div class="proveedor-rubro" style="margin:0">' + escHtml(p.rubro) + '</div>' +
        adminActions("editProveedor('" + p.id + "')", "deleteProveedor('" + p.id + "')") +
      '</div>' +
      '<div class="proveedor-nombre">' + escHtml(p.nombre) + '</div>' +
      '<div class="proveedor-contacto">' +
        '<div><md-icon style="vertical-align:middle;font-size:1.1rem" aria-label="Contacto" title="Contacto">person</md-icon> ' + escHtml(p.contacto) + '</div>' +
        (p.telefono ? '<div><md-icon style="vertical-align:middle;font-size:1.1rem" aria-label="Teléfono" title="Teléfono">phone</md-icon> <a href="tel:' + escHtml(p.telefono) + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + escHtml(p.telefono) + '</a></div>' : '') +
        (p.email ? '<div><md-icon style="vertical-align:middle;font-size:1.1rem" aria-label="Correo" title="Correo">mail</md-icon> <a href="mailto:' + escHtml(p.email) + '" style="color:var(--md-sys-color-primary);text-decoration:none">' + escHtml(p.email) + '</a></div>' : '') +
        (p.web_instagram ? '<div><md-icon style="vertical-align:middle;font-size:1.1rem" aria-label="Sitio web" title="Sitio web">language</md-icon> <a href="' + escHtml(p.web_instagram) + '" target="_blank" style="color:var(--md-sys-color-primary);text-decoration:none">' + escHtml(p.web_instagram) + '</a></div>' : '') +
        '<div style="color:var(--text-muted);font-size:0.8rem;margin-top:0.3rem">' + escHtml(p.observaciones) + '</div>' +
      '</div>' +
      '</div>';
  }).join('');

  if (!PROVEEDORES.length) {
    grid.innerHTML = emptyState('No hay proveedores registrados.');
  }
}

// ASAMBLEAS
var asambleasFilter = 'Todos';

function filterAsambleas(tipo) {
  asambleasFilter = tipo;
  document.querySelectorAll('#asambleasChips md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
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
    var fecha = formatDate(a.fecha);
    var asistentesIds = (ASAMBLEA_ASISTENTES || []).filter(function(aa) { return aa.asamblea_id === a.id; }).map(function(aa) { return aa.parcela_id; });
    var asistentes = asistentesIds.length ? asistentesIds.map(function(pid) {
      return '<span style="display:inline-block;background:var(--skeleton-1);color:var(--text-2);padding:0.2rem 0.5rem;border-radius:var(--md-sys-shape-corner-extra-small);font-size:0.8rem;margin:0.1rem">' + parcelName(pid) + '</span>';
    }).join('') : '';
    return '<div class="item-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">' +
        '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:' + (a.tipo === 'Extraordinaria' ? 'var(--color-extraordinaria-bg)' : 'var(--md-sys-color-primary-container)') + ';color:' + (a.tipo === 'Extraordinaria' ? 'var(--color-extraordinaria-text)' : 'var(--md-sys-color-on-primary-container)') + '">' + escHtml(a.tipo) + '</span>' +
        '<div style="display:flex;gap:0.3rem;align-items:center">' +
          '<span style="font-size:0.8rem;color:var(--text-muted)">' + fecha + '</span>' +
          adminActions("editAsamblea('" + a.id + "')", "deleteAsamblea('" + a.id + "')") +
        '</div>' +
      '</div>' +
      '<div style="font-size:0.85rem;font-weight:600;margin-bottom:0.2rem">Temario</div>' +
      '<div style="font-size:0.85rem;margin-bottom:0.6rem">' + nl2br(a.temario) + '</div>' +
      (a.acuerdos ? '<div style="font-size:0.85rem;font-weight:600;margin-bottom:0.2rem">Acuerdos</div><div style="font-size:0.85rem;margin-bottom:0.4rem">' + nl2br(a.acuerdos) + '</div>' : '') +
      (asistentes ? '<div style="margin-top:0.4rem"><strong style="font-size:0.85rem">Asistentes:</strong><div style="margin-top:0.3rem">' + asistentes + '</div></div>' : '') +
      '</div>';
  }).join('');

  if (!sorted.length) {
    timeline.innerHTML = emptyState('No hay asambleas.');
  }
}

// ENCUESTAS
var encuestasFilter = 'Abiertas';

function filterEncuestas(filtro) {
  encuestasFilter = filtro;
  document.querySelectorAll('#encuestasChips md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
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
  var ahora = new Date();

  var data = ENCUESTAS.map(function(e) {
    var votos = ENCUESTAS_VOTOS.filter(function(v) { return v.encuesta_id === e.id; });
    var opciones = getOpciones(e);
    var conteo = {};
    opciones.forEach(function(op) { conteo[op] = 0; });
    votos.forEach(function(v) { if (conteo[v.seleccion] !== undefined) conteo[v.seleccion]++; });
    var total = votos.length;
    var cerrada = false;
    if (e.fecha_termino) {
      var f = e.fecha_termino.split('T')[0].split('-');
      var fin = new Date(+f[0], +f[1] - 1, +f[2], 23, 59, 59);
      cerrada = ahora > fin;
    }

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
    container.innerHTML = emptyState('No hay encuestas para mostrar.');
    return;
  }

  var colores = ['#22c55e', '#3b82f6', '#f59e0b', '#b91c1c', '#8b5cf6', '#ec4899'];

  container.innerHTML = data.map(function(d) {
    var e = d.encuesta;
    var quorumAlcanzado = e.quorum ? d.total >= e.quorum : true;
    var estadoBg = d.cerrada ? 'var(--md-sys-color-surface-container)' : 'var(--md-sys-color-tertiary-container)';
    var estadoText = d.cerrada ? 'var(--md-sys-color-on-surface-variant)' : 'var(--md-sys-color-on-tertiary-container)';

    var infoExtra = '';
    if (e.fecha_termino && !d.cerrada) {
      var remaining = getTimeRemaining(e.fecha_termino);
      if (remaining) {
        infoExtra = 'Termina en: ' + remaining;
      }
    }

    var inicio = e.fecha || e.created_at;
    var fechaPub = (e.fecha_termino && inicio)
      ? formatDateCorta(inicio) + ' - ' + formatDateCorta(e.fecha_termino)
      : formatDateCorta(inicio);

    var quorumHtml = '';
    if (e.quorum) {
      quorumHtml = '<span style="padding:0.15rem 0.5rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:var(--md-sys-color-surface-container);color:' + (quorumAlcanzado ? 'var(--md-sys-color-tertiary)' : 'var(--md-sys-color-error)') + '">Quorum: ' + d.total + '/' + e.quorum + (quorumAlcanzado ? ' ✓' : '') + '</span>';
    }

    var opcionesHtml = '<div style="position:relative">' +
      (d.cerrada ? '<div class="watermark">TERMINADA</div>' : '') +
      d.opciones.map(function(op, i) {
      var count = d.conteo[op];
      var pct = d.total > 0 ? Math.round((count / d.total) * 100) : 0;
      var color = colores[i % colores.length];
      var esMiVoto = d.miVoto && d.miVoto.seleccion === op;

      var barra = '<div style="display:flex;height:6px;border-radius:var(--md-sys-shape-corner-extra-small);overflow:hidden;margin:0.3rem 0;background:var(--skeleton-1)">' +
        '<div style="width:' + pct + '%;background:' + color + ';transition:width 0.3s"></div>' +
      '</div>';

      var boton = '';
      if (!d.cerrada && currentUser && !d.miVoto) {
        boton = ' <md-filled-button onclick="votarEncuesta(\'' + e.id + '\', ' + i + ')" style="font-size:0.75rem;padding:0.2rem 0.6rem;--md-filled-button-container-color:' + color + '">Votar</md-filled-button>';
      }

      return '<div style="margin-bottom:0.4rem;' + (esMiVoto ? 'background:var(--skeleton-1);padding:0.3rem 0.5rem;border-radius:var(--md-sys-shape-corner-extra-small);' : '') + '">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;font-size:0.85rem">' +
          '<span' + (esMiVoto ? ' style="font-weight:600"' : '') + '>' + escHtml(op) + (esMiVoto ? ' ✓' : '') + '</span>' +
          '<span style="display:inline-flex;align-items:center;gap:0.4rem;color:var(--text-muted)">' + count + ' (' + pct + '%)' + boton + '</span>' +
        '</div>' +
        barra +
      '</div>';
    }).join('') +
    '</div>';

    var accion = '';
    if (!d.cerrada && currentUser && !d.miVoto) {
      accion = '';
    } else if (d.miVoto) {
      accion = '<div style="margin-top:0.4rem;font-size:0.8rem;color:var(--text-muted)">Ya votaste</div>';
    }

    return '<div class="item-card' + (d.cerrada ? ' cerrada' : '') + '">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">' +
        '<span style="padding:0.2rem 0.6rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:' + estadoBg + ';color:' + estadoText + '">' + (d.cerrada ? 'Cerrada' : 'Abierta') + '</span>' +
        '<div style="display:flex;gap:0.3rem;align-items:center">' +
          '<span style="font-size:0.8rem;color:var(--text-muted)">' + fechaPub + '</span>' +
          adminActions("editEncuesta('" + e.id + "')", "deleteEncuesta('" + e.id + "')") +
        '</div>' +
      '</div>' +
      '<div style="font-size:1rem;font-weight:600;margin-bottom:0.3rem;color:var(--text)">' + escHtml(e.titulo) + '</div>' +
      (e.descripcion ? '<div style="font-size:0.85rem;color:var(--text-2);margin-bottom:0.4rem">' + nl2br(e.descripcion) + '</div>' : '') +
      (infoExtra ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.3rem">' + infoExtra + '</div>' : '') +
      opcionesHtml + accion +
      '<div style="display:flex;justify-content:flex-end;align-items:center;gap:0.4rem;margin-top:0.3rem">' +
        quorumHtml +
        '<span style="padding:0.15rem 0.5rem;border-radius:var(--md-sys-shape-corner-full);font-size:0.75rem;font-weight:600;background:var(--md-sys-color-surface-container);color:var(--text-2)">Total: ' + d.total + ' votos</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function votarEncuesta(encuestaId, indice) {
  if (!currentUser) {
    showSnackbar('Debes iniciar sesión para votar.', 'info');
    return;
  }

  var encuesta = ENCUESTAS.find(function(e) { return e.id === encuestaId; });
  var seleccion = encuesta ? getOpciones(encuesta)[indice] : null;
  if (seleccion === null || seleccion === undefined) {
    showSnackbar('Opción inválida.', 'error');
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
// Edit helpers

function editPropietario(id) {
  var data = PROPIETARIOS.find(function(p) { return p.id === id; });
  if (data) formPropietarios(data);
}

function editGasto(id) {
  var data = GASTOS.find(function(g) { return g.id === id; });
  if (data) formGastos(data);
}

function deleteGasto(id) {
  deleteItem('gastos', id, 'GASTOS', renderFinanzas);
}

function editParcela(id) {
  var data = PARCELAS.find(function(p) { return p.id === id; });
  if (data) formParcelas(data);
}

function editNoticia(id) {
  var item = NOTICIAS.find(function(n) { return n.id === id; });
  if (item) formNoticias(item);
}

function deleteNoticia(id) {
  deleteItem('noticias', id, 'NOTICIAS', renderNoticias);
}

function editFlujo(id) {
  var item = FLUJO.find(function(f) { return f.id === id; });
  if (item) formFlujo(item);
}

function deleteFlujo(id) {
  deleteItem('flujo', id, 'FLUJO', renderFinanzas);
}

function editDocumento(id) {
  var item = DOCUMENTOS.find(function(d) { return d.id === id; });
  if (item) formDocumentos(item);
}

function deleteDocumento(id) {
  deleteItem('documentos', id, 'DOCUMENTOS', renderDocumentos);
}

function editProveedor(id) {
  var item = PROVEEDORES.find(function(p) { return p.id === id; });
  if (item) formProveedores(item);
}

function deleteProveedor(id) {
  deleteItem('proveedores', id, 'PROVEEDORES', renderProveedores);
}

function editAsamblea(id) {
  var item = ASAMBLEAS.find(function(a) { return a.id === id; });
  if (!item) return;
  var asistenteIds = (ASAMBLEA_ASISTENTES || []).filter(function(aa) { return aa.asamblea_id === id; }).map(function(aa) { return aa.parcela_id; });
  var copy = Object.assign({}, item, { asistentesIds: asistenteIds });
  formAsambleas(copy);
}

function deleteAsamblea(id) {
  if (!IS_ADMIN) return;
  showConfirm('¿Eliminar esta asamblea? Se perderán todos los datos y asistentes asociados. Esta acción no se puede deshacer.', function() {
    if (DEMO_MODE) {
      ASAMBLEAS = ASAMBLEAS.filter(function(a) { return a.id !== id; });
      ASAMBLEA_ASISTENTES = ASAMBLEA_ASISTENTES.filter(function(aa) { return aa.asamblea_id !== id; });
      showSnackbar('Eliminado (demo).', 'success');
      renderAsambleas();
    } else {
      showLoading();
      supabaseClient.from('asamblea_asistentes').delete().eq('asamblea_id', id).then(function() {
        supabaseDelete('asambleas', id).then(function(result) {
          hideLoading();
          if (result) {
            showSnackbar('Eliminada correctamente.', 'success');
            reloadTab(getCurrentTab());
          }
        });
      });
    }
  });
}

function editEncuesta(id) {
  var item = ENCUESTAS.find(function(e) { return e.id === id; });
  if (item) formEncuestas(item);
}

function deleteEncuesta(id) {
  if (!IS_ADMIN) return;
  showConfirm('¿Eliminar esta encuesta? También se eliminarán todos los votos.', function() {
    if (DEMO_MODE) {
      ENCUESTAS = ENCUESTAS.filter(function(e) { return e.id !== id; });
      ENCUESTAS_VOTOS = ENCUESTAS_VOTOS.filter(function(v) { return v.encuesta_id !== id; });
      showSnackbar('Eliminado (demo).', 'success');
      renderEncuestas();
    } else {
      showLoading();
      supabaseClient.from('encuestas_votos').delete().eq('encuesta_id', id).then(function() {
        supabaseDelete('encuestas', id).then(function(result) {
          hideLoading();
          if (result) {
            showSnackbar('Eliminada correctamente.', 'success');
            reloadTab(getCurrentTab());
          }
        });
      });
    }
  });
}

// PUBLICACIONES DE VENTA
var publicacionesCategoriaFilter = 'todas';
var publicacionesEstadoFilter = 'Disponible';

function filterPublicacionesCategoria(filtro) {
  publicacionesCategoriaFilter = filtro;
  document.querySelectorAll('#publicacionesCategoriaFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderPublicaciones();
}

function filterPublicacionesEstado(filtro) {
  publicacionesEstadoFilter = filtro;
  document.querySelectorAll('#publicacionesEstadoFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderPublicaciones();
}

function renderPublicaciones() {
  var grid = document.getElementById('publicacionesGrid');
  var filtered = filtrarPublicaciones(PUBLICACIONES, publicacionesCategoriaFilter, publicacionesEstadoFilter);
  var sorted = filtered.slice().sort(function(a, b) {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  grid.innerHTML = sorted.map(function(p) {
    var estadoClass = p.estado === 'Vendido' ? 'chip-neutral' : 'chip-positive';
    var categoriaClass = p.categoria === 'Servicio' ? 'chip-secondary' : 'chip-primary';
    return '<div class="publicacion-card' + (p.estado === 'Vendido' ? ' vendido' : '') + '">' +
      '<div class="publicacion-foto">' +
        (p.foto
          ? '<img src="' + escHtml(p.foto) + '" alt="' + escHtml(p.titulo) + '" loading="lazy" onclick="verFotoPublicacion(\'' + p.id + '\')" title="Ver imagen completa" style="cursor:pointer">'
          : '<div class="publicacion-foto-placeholder"><md-icon>image_not_supported</md-icon><span>Sin imagen</span></div>') +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem">' +
        '<div style="display:flex;gap:0.3rem;align-items:center;flex-wrap:wrap">' +
          '<span class="chip ' + categoriaClass + '">' + escHtml(p.categoria) + '</span>' +
          '<span class="chip ' + estadoClass + '">' + escHtml(p.estado) + '</span>' +
        '</div>' +
        ownActions("editPublicacion('" + p.id + "')", "deletePublicacion('" + p.id + "')", p.usuario) +
      '</div>' +
      '<div class="publicacion-titulo">' + escHtml(p.titulo) + '</div>' +
      (p.descripcion ? '<div class="publicacion-desc">' + nl2br(p.descripcion) + '</div>' : '') +
      '<div class="publicacion-meta">' +
        (p.precio !== null && p.precio !== undefined && p.precio !== '' ? '<span class="publicacion-precio">$' + formatMoney(p.precio) + '</span>' : '') +
        (p.parcela_id ? '<span class="publicacion-meta-row"><md-icon>location_on</md-icon>' + escHtml(parcelName(p.parcela_id)) + '</span>' : '') +
        (p.contacto ? '<span class="publicacion-meta-row"><md-icon>phone</md-icon>' + escHtml(p.contacto) + '</span>' : '') +
      '</div>' +
      '</div>';
  }).join('');

  if (!sorted.length) {
    grid.innerHTML = emptyState('No hay publicaciones con estos filtros.');
  }
}

function verFotoPublicacion(id) {
  var p = PUBLICACIONES.find(function(x) { return x.id === id; });
  if (!p || !p.foto) return;
  openModal(p.titulo,
    '<div style="display:flex;justify-content:center">' +
      '<img src="' + escHtml(p.foto) + '" alt="' + escHtml(p.titulo) + '" style="max-width:100%;max-height:70vh;border-radius:var(--md-sys-shape-corner-medium);object-fit:contain">' +
    '</div>');
}

function editPublicacion(id) {
  var item = PUBLICACIONES.find(function(p) { return p.id === id; });
  if (item) formPublicaciones(item);
}

function deletePublicacion(id) {
  var item = PUBLICACIONES.find(function(p) { return p.id === id; });
  var puede = IS_ADMIN || (item && currentUser && item.usuario && currentUser.email === item.usuario);
  if (!puede) return;
  showConfirm('¿Estás seguro de eliminar esta publicación? Esta acción no se puede deshacer.', function() {
    if (DEMO_MODE) {
      PUBLICACIONES = PUBLICACIONES.filter(function(p) { return p.id !== id; });
      logAudit('publicaciones', 'DELETE', item || { id: id });
      showSnackbar('Eliminado (demo).', 'success');
      renderPublicaciones();
    } else {
      showLoading();
      supabaseDelete('publicaciones', id).then(function(result) {
        hideLoading();
        if (result) {
          logAudit('publicaciones', 'DELETE', { id: id });
          showSnackbar('Eliminado correctamente.', 'success');
          reloadTab(getCurrentTab());
        }
      });
    }
  });
}

loadInitialData();
