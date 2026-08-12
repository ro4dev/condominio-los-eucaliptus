function formatMoney(v) {
  var s = Math.round(v).toString();
  var result = '';
  var count = 0;
  for (var i = s.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result = '.' + result;
    }
    result = s.charAt(i) + result;
    count++;
  }
  return result;
}

function formatPeriodo(p) {
  if (!p) {
    return '';
  }
  var s = String(p);
  if (s.indexOf('T') !== -1) {
    s = s.slice(0, 7);
  }
  var parts = s.split('-');
  if (parts.length >= 2) {
    return parts[1] + '/' + parts[0];
  }
  return s;
}

function formatDate(d) {
  if (!d) {
    return '';
  }
  var s = String(d);
  if (s.indexOf('T') !== -1) {
    s = s.split('T')[0];
  }
  var parts = s.split('-');
  if (parts.length === 3) {
    return parts[2] + '/' + parts[1] + '/' + parts[0];
  }
  parts = s.split('/');
  if (parts.length === 3) {
    return parts[0] + '/' + parts[1] + '/' + parts[2];
  }
  return s;
}

function formatDateCorta(d) {
  var s = formatDate(d);
  if (s.length === 10) {
    return s.slice(0, 6) + s.slice(8);
  }
  return s;
}

function nl2br(text) {
  return escHtml(text || '').replace(/\n/g, '<br>');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function getTimeRemaining(fechaStr) {
  if (!fechaStr) return null;
  var parts = fechaStr.split('T')[0].split('-');
  var now = new Date();
  if (+parts[0] !== now.getFullYear() || +parts[1] !== now.getMonth() + 1 || +parts[2] !== now.getDate()) return null;
  var fin = new Date(+parts[0], +parts[1] - 1, +parts[2], 23, 59, 59);
  var diff = fin - now;
  if (diff <= 0) return null;
  var horas = Math.floor(diff / 3600000);
  var minutos = Math.floor((diff % 3600000) / 60000);
  return horas + 'h ' + minutos + 'm';
}

// ── Deudores / estado de pago (funciones puras) ──
function isPagado(gasto) {
  return !!(gasto && gasto.pagado === 'Sí');
}

function esperadoPorPeriodo(periodo, GASTOS) {
  return (GASTOS || []).filter(function(g) { return g.periodo === periodo; })
    .reduce(function(s, g) { return s + parseFloat(g.monto || 0); }, 0);
}

function recaudadoPorPeriodo(periodo, GASTOS) {
  return (GASTOS || []).filter(function(g) { return g.periodo === periodo && isPagado(g); })
    .reduce(function(s, g) { return s + parseFloat(g.monto || 0); }, 0);
}

function pctRecaudado(periodo, GASTOS) {
  var esp = esperadoPorPeriodo(periodo, GASTOS);
  if (!esp) return 0;
  return Math.round((recaudadoPorPeriodo(periodo, GASTOS) / esp) * 100);
}

// ── Finanzas / Balance (funciones puras) ──
function mesDeFecha(fecha) {
  if (!fecha) return '';
  var s = String(fecha);
  if (s.indexOf('T') !== -1) {
    s = s.split('T')[0];
  }
  var m = s.split('-');
  if (m.length === 3 && m[0].length === 4) {
    return m[0] + '-' + m[1];
  }
  var p = s.split('/');
  if (p.length === 3) {
    return p[2] + '-' + (p[1].length === 1 ? '0' + p[1] : p[1]);
  }
  return '';
}

function ingresosDerivados(periodo, GASTOS) {
  return recaudadoPorPeriodo(periodo, GASTOS);
}

function egresosMes(periodo, FLUJO) {
  return (FLUJO || []).filter(function(f) {
    return f.tipo === 'Egreso' && mesDeFecha(f.fecha) === periodo;
  }).reduce(function(s, f) { return s + parseFloat(f.monto || 0); }, 0);
}

function ingresosMes(periodo, GASTOS, FLUJO) {
  var cuotas = recaudadoPorPeriodo(periodo, GASTOS);
  var manual = (FLUJO || []).filter(function(f) {
    return f.tipo === 'Ingreso' && mesDeFecha(f.fecha) === periodo;
  }).reduce(function(s, f) { return s + parseFloat(f.monto || 0); }, 0);
  return cuotas + manual;
}

function pendientesDeParcela(parcela_id, GASTOS) {
  return (GASTOS || []).filter(function(g) { return g.parcela_id === parcela_id && !isPagado(g); });
}

function periodosPendientes(parcela_id, GASTOS) {
  var set = {};
  (GASTOS || []).forEach(function(g) {
    if (g.parcela_id === parcela_id && !isPagado(g) && g.periodo) {
      set[g.periodo] = true;
    }
  });
  return Object.keys(set);
}

function deudaPorPeriodo(parcela_id, GASTOS) {
  var sums = {};
  var sinPeriodo = 0;
  (GASTOS || []).forEach(function(g) {
    if (g.parcela_id === parcela_id && !isPagado(g)) {
      if (g.periodo) {
        sums[g.periodo] = (sums[g.periodo] || 0) + parseFloat(g.monto || 0);
      } else {
        sinPeriodo += parseFloat(g.monto || 0);
      }
    }
  });
  var res = Object.keys(sums).sort().map(function(p) {
    return { periodo: p, monto: sums[p] };
  });
  if (sinPeriodo > 0) {
    res.push({ periodo: '', monto: sinPeriodo });
  }
  return res;
}

function deudaParcela(parcela_id, GASTOS) {
  return pendientesDeParcela(parcela_id, GASTOS)
    .reduce(function(s, g) { return s + parseFloat(g.monto || 0); }, 0);
}

function estadoParcelaPago(parcela_id, GASTOS) {
  return pendientesDeParcela(parcela_id, GASTOS).length === 0 ? 'Al día' : 'Deudor';
}

function morosos(GASTOS, PARCELAS) {
  var deudas = {};
  (GASTOS || []).forEach(function(g) {
    if (!isPagado(g) && g.parcela_id) {
      deudas[g.parcela_id] = (deudas[g.parcela_id] || 0) + parseFloat(g.monto || 0);
    }
  });
  return Object.keys(deudas).map(function(pid) {
    var p = (PARCELAS || []).find(function(x) { return x.id === pid; });
    return { parcela_id: pid, numero: p ? p.numero : pid, deuda: deudas[pid] };
  }).filter(function(m) { return m.deuda > 0; })
    .sort(function(a, b) {
      var numA = parseInt((a.numero || '').replace(/\D/g, '')) || 0;
      var numB = parseInt((b.numero || '').replace(/\D/g, '')) || 0;
      return numA - numB;
    });
}

// ── Publicaciones de venta (funciones puras) ──
function filtrarPublicaciones(PUBLICACIONES, categoria, estado) {
  return (PUBLICACIONES || []).filter(function(p) {
    var okCategoria = categoria === 'todas' || p.categoria === categoria;
    var okEstado = estado === 'todos' || p.estado === estado;
    return okCategoria && okEstado;
  });
}

var _snackbarTimer = null;
function showSnackbar(message, type) {
  type = type || 'info';
  var el = document.getElementById('appSnackbar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appSnackbar';
    document.body.appendChild(el);
  }
  clearTimeout(_snackbarTimer);
  el.classList.remove('show');
  var icons = { success: 'check_circle', warning: 'warning', error: 'error', info: 'info' };
  var icon = icons[type] || icons.info;
  el.innerHTML = '<span class="snackbar-icon material-symbols-outlined ' + type + '">' + icon + '</span>' + escHtml(message);
  void el.offsetWidth;
  el.classList.add('show');
  _snackbarTimer = setTimeout(function() { el.classList.remove('show'); }, 3000);
}
