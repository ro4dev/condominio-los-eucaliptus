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

function getInitials(name) {
  return name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
}

function nl2br(text) {
  return (text || '').replace(/\n/g, '<br>');
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

function showSnackbar(message, type) {
  type = type || 'info';
  var el = document.getElementById('appSnackbar');
  if (!el) {
    el = document.createElement('md-snackbar');
    el.id = 'appSnackbar';
    el.setAttribute('auto-close', '');
    el.setAttribute('timeout', '3000');
    document.body.appendChild(el);
  }
  var icons = { success: 'check_circle', warning: 'warning', error: 'error', info: 'info' };
  var icon = icons[type] || icons.info;
  el.innerHTML = '<md-icon slot="leading-icon">' + icon + '</md-icon> ' + message;
  el.open = true;
}
