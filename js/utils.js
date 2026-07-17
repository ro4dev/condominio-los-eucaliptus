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
