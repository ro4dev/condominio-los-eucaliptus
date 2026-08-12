// AUDITORÍA DE CAMBIOS — registra INSERT/UPDATE/DELETE desde la UI

var PII_FIELDS = ['rut', 'telefono', 'email'];

function sanitizeAudit(registro) {
  var copy = Object.assign({}, registro || {});
  PII_FIELDS.forEach(function(f) { if (f in copy) copy[f] = '[oculto]'; });
  return copy;
}

function logAudit(tabla, accion, registro, usuario) {
  var entry = {
    tabla: tabla,
    accion: accion,
    registro_id: registro && registro.id != null ? String(registro.id) : null,
    datos: sanitizeAudit(registro || {}),
    usuario: usuario || (currentUser && currentUser.email) || 'anónimo'
  };
  if (DEMO_MODE) {
    entry.created_at = new Date().toISOString();
    AUDIT_LOG.unshift(entry);
    return Promise.resolve();
  }
  if (!supabaseClient) return Promise.resolve();
  return supabaseClient.from('audit_log').insert(entry)
    .then(function(res) {
      if (res.error) console.error('logAudit:', res.error);
    })
    .catch(function(err) { console.error('logAudit:', err); });
}
