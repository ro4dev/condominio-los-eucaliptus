function formatMoney(v) {
  var negative = v < 0;
  var s = Math.round(Math.abs(v)).toString();
  var result = '';
  var count = 0;
  for (var i = s.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      result = '.' + result;
    }
    result = s.charAt(i) + result;
    count++;
  }
  return (negative ? '-$' : '$') + result;
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

// Solo URLs sin esquema peligroso (para hrefs). Devuelve '' si no es segura.
// Permite http(s), rutas relativas (assets/...), #, data:image/ y blob: (demo upload).
// Bloquea javascript:, vbscript:, file: y data: no-imagen.
function safeUrl(u) {
  if (!u) return '';
  var s = String(u).replace(/[\u0000-\u0020]/g, '').trim();
  if (/^(javascript|vbscript|file):/i.test(s)) return '';
  if (/^data:/i.test(s) && !/^data:image\//i.test(s)) return '';
  return s;
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

// ── Pagos / estado de pago (funciones puras) ──
function getPagos() {
  return (typeof PAGOS !== 'undefined') ? PAGOS : [];
}

function pagosDeGasto(gastoId) {
  return getPagos().filter(function(p) { return p.gasto_id === gastoId; });
}

function sumPagosGasto(gastoId) {
  return pagosDeGasto(gastoId).reduce(function(s, p) { return s + parseFloat(p.monto || 0); }, 0);
}

function pagosDeParcela(parcelaId) {
  return getPagos().filter(function(p) { return p.parcela_id === parcelaId; });
}

// Cuota marcada como pagada sin pagos registrados (legado pre-pagos)
function pagoLegado(g) {
  return !!(g && g.pagado === 'Sí' && !pagosDeGasto(g.id).length);
}

function isPagado(gasto) {
  if (!gasto) return false;
  if (pagoLegado(gasto)) return true;
  var monto = parseFloat(gasto.monto || 0);
  if (!monto) return false;
  return sumPagosGasto(gasto.id) >= monto;
}

// Monto efectivamente cobrado de una cuota (nunca supera el monto de la cuota)
function recaudadoGasto(gasto) {
  if (!gasto) return 0;
  var monto = parseFloat(gasto.monto || 0);
  if (pagoLegado(gasto)) return monto;
  return Math.min(monto, sumPagosGasto(gasto.id));
}

function esperadoPorPeriodo(periodo, GASTOS) {
  return (GASTOS || []).filter(function(g) { return g.periodo === periodo; })
    .reduce(function(s, g) { return s + parseFloat(g.monto || 0); }, 0);
}

function recaudadoPorPeriodo(periodo, GASTOS) {
  return (GASTOS || []).filter(function(g) { return g.periodo === periodo; })
    .reduce(function(s, g) { return s + recaudadoGasto(g); }, 0);
}

function pctRecaudado(periodo, GASTOS) {
  var esp = esperadoPorPeriodo(periodo, GASTOS);
  if (!esp) return 0;
  return Math.round((recaudadoPorPeriodo(periodo, GASTOS) / esp) * 100);
}

// ── Config de cuota por periodo ──
function configPeriodos() {
  return (typeof CONFIG !== 'undefined' && CONFIG.periodos) ? CONFIG.periodos : [];
}

function periodoConfig(periodo) {
  return configPeriodos().find(function(p) { return p.periodo === periodo; }) || null;
}

function montosBase() {
  var m = (typeof CONFIG !== 'undefined' && CONFIG.montos) ? CONFIG.montos : {};
  return {
    monto: parseFloat(m.gasto_comun_base) || 0,
    fondo_reserva: parseFloat(m.fondo_reserva) || 0
  };
}

// Cuota del periodo (gasto común + fondo reserva). Si no hay config para el periodo, usa Monto Base.
function cuotaDelPeriodo(periodo) {
  var base = montosBase();
  var conf = periodoConfig(periodo);
  if (conf) {
    if (conf.monto != null && conf.monto !== '') base.monto = parseFloat(conf.monto) || 0;
    if (conf.fondo_reserva != null && conf.fondo_reserva !== '') base.fondo_reserva = parseFloat(conf.fondo_reserva) || 0;
  }
  return { monto: base.monto, fondo_reserva: base.fondo_reserva, total: base.monto + base.fondo_reserva };
}

// Siguiente periodo posterior al último con cuotas registradas
function siguientePeriodo() {
  var last = null;
  (typeof GASTOS !== 'undefined' ? GASTOS : []).forEach(function(g) {
    if (g.periodo && (!last || g.periodo > last)) last = g.periodo;
  });
  var parts = last ? last.split('-') : null;
  var y, m;
  if (!parts || parts.length !== 2) {
    var now = new Date();
    y = now.getFullYear();
    m = now.getMonth() + 1;
  } else {
    y = parseInt(parts[0]);
    m = parseInt(parts[1]);
  }
  m++;
  if (m > 12) { m = 1; y++; }
  return y + '-' + String(m).padStart(2, '0');
}

// Aviso de aumento de cuota para el próximo periodo (si está configurado más alto)
function avisoAumento() {
  var vigente = null;
  (typeof GASTOS !== 'undefined' ? GASTOS : []).forEach(function(g) {
    if (g.periodo && (!vigente || g.periodo > vigente)) vigente = g.periodo;
  });
  if (!vigente) return null;
  var actual = cuotaDelPeriodo(vigente);
  var futuro = cuotaDelPeriodo(siguientePeriodo());
  if (!futuro.total || futuro.total <= actual.total) return null;
  var pct = actual.total ? Math.round(((futuro.total - actual.total) / actual.total) * 100) : 100;
  return { periodo: siguientePeriodo(), anterior: actual.total, nuevo: futuro.total, pct: pct };
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

// Periodos con datos (cuotas o movimientos), ordenados del más reciente al más antiguo
function periodosFinanzas(GASTOS, FLUJO) {
  var set = {};
  (GASTOS || []).forEach(function(g) { if (g.periodo) set[g.periodo] = true; });
  (FLUJO || []).forEach(function(f) { var m = mesDeFecha(f.fecha); if (m) set[m] = true; });
  return Object.keys(set).sort().reverse();
}

// Saldo del periodo: ingresos totales (cuotas + manuales) menos egresos
function saldoPeriodo(periodo, GASTOS, FLUJO) {
  return ingresosMes(periodo, GASTOS, FLUJO) - egresosMes(periodo, FLUJO);
}

// Deuda total de una parcela: nunca negativa (el saldo a favor no se cobra)
function deudaParcela(parcela_id, GASTOS) {
  var cuotas = 0, pagado = 0;
  (GASTOS || []).forEach(function(g) {
    if (g.parcela_id !== parcela_id) return;
    cuotas += parseFloat(g.monto || 0);
    if (pagoLegado(g)) pagado += parseFloat(g.monto || 0);
  });
  pagado += pagosDeParcela(parcela_id).reduce(function(s, p) { return s + parseFloat(p.monto || 0); }, 0);
  return Math.max(0, cuotas - pagado);
}

// Desglose por periodo de la deuda de una parcela (monto = déficit del periodo).
// El excedente (saldo a favor) se absorbe primero en los periodos más recientes.
function deudaPorPeriodo(parcela_id, GASTOS) {
  var cuotas = {}, pagado = {};
  (GASTOS || []).forEach(function(g) {
    if (g.parcela_id !== parcela_id) return;
    var p = g.periodo || '';
    cuotas[p] = (cuotas[p] || 0) + parseFloat(g.monto || 0);
    if (pagoLegado(g)) pagado[p] = (pagado[p] || 0) + parseFloat(g.monto || 0);
  });
  pagosDeParcela(parcela_id).forEach(function(pg) {
    var p = pg.periodo || '';
    pagado[p] = (pagado[p] || 0) + parseFloat(pg.monto || 0);
  });

  var excedente = 0;
  var res = [];
  Object.keys(cuotas).sort().forEach(function(p) {
    var saldo = cuotas[p] - (pagado[p] || 0);
    if (saldo < 0) {
      excedente += -saldo;
    } else if (saldo > 0) {
      res.push({ periodo: p, monto: saldo });
    }
  });
  for (var i = res.length - 1; i >= 0 && excedente > 0; i--) {
    var ab = Math.min(res[i].monto, excedente);
    res[i].monto -= ab;
    excedente -= ab;
  }
  return res.filter(function(d) { return d.monto > 0; });
}

function periodosPendientes(parcela_id, GASTOS) {
  return deudaPorPeriodo(parcela_id, GASTOS).map(function(d) { return d.periodo; });
}

function estadoParcelaPago(parcela_id, GASTOS) {
  return deudaParcela(parcela_id, GASTOS) <= 0 ? 'Al día' : 'Deudor';
}

function morosos(GASTOS, PARCELAS) {
  var seen = {};
  (GASTOS || []).forEach(function(g) {
    if (g.parcela_id) seen[g.parcela_id] = true;
  });
  return Object.keys(seen).map(function(pid) {
    var p = (PARCELAS || []).find(function(x) { return x.id === pid; });
    return { parcela_id: pid, numero: p ? p.numero : pid, deuda: deudaParcela(pid, GASTOS) };
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
