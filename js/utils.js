function formatMoney(v) {
  var s = Math.round(v).toString();
  var result = '';
  var count = 0;
  for (var i = s.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) result = '.' + result;
    result = s.charAt(i) + result;
    count++;
  }
  return result;
}

function formatPeriodo(p) {
  if (!p) return '';
  var s = String(p);
  if (s.indexOf('T') !== -1) s = s.slice(0, 7);
  var parts = s.split('-');
  if (parts.length >= 2) return parts[1] + '/' + parts[0];
  return s;
}

function formatDate(d) {
  if (!d) return '';
  var s = String(d);
  if (s.indexOf('T') !== -1) s = s.split('T')[0];
  var parts = s.split('-');
  if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
  parts = s.split('/');
  if (parts.length === 3) return parts[0] + '/' + parts[1] + '/' + parts[2];
  return s;
}

function getInitials(name) {
  return name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
}

function showSnackbar(message, type) {
  type = type || 'info';
  var el = document.getElementById('snackbar');
  if (!el) {
    el = document.createElement('div');
    el.id = 'snackbar';
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg-card);color:var(--text);padding:10px 18px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);font-size:0.9rem;z-index:99999;transition:opacity 0.3s;opacity:0;border:1px solid var(--border);max-width:90%;display:flex;align-items:center;gap:0.5rem';
    document.body.appendChild(el);
  }
  var icons = { success: '\u2713', warning: '\u26a0', error: '\u2717', info: '\u2139' };
  var colors = { success: '#16a34a', warning: '#d97706', error: '#dc2626', info: '#2563eb' };
  var icon = icons[type] || icons.info;
  var color = colors[type] || colors.info;
  el.style.borderLeft = '4px solid ' + color;
  el.innerHTML = '<span style="color:' + color + ';font-weight:bold;font-size:1.1rem">' + icon + '</span> ' + message;
  el.style.opacity = '1';
  clearTimeout(el._timeout);
  el._timeout = setTimeout(function() { el.style.opacity = '0'; }, 3000);
}
