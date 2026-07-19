// CONFIG PAGE — solo admin

var CONFIG = {};

async function loadConfig() {
  if (DEMO_MODE) {
    var res = await fetch('data/config.json', { cache: 'no-store' });
    CONFIG = await res.json();
  } else if (supabaseClient) {
    var { data, error } = await supabaseClient.from('config').select('key, value');
    if (error) throw error;
    CONFIG = {};
    data.forEach(function(row) { CONFIG[row.key] = row.value; });
  }
}

async function saveConfig(key, value) {
  CONFIG[key] = value;
  if (!DEMO_MODE && supabaseClient) {
    var { error } = await supabaseClient.from('config').upsert({ key: key, value: value, updated_at: new Date().toISOString() });
    if (error) { alert('Error al guardar: ' + error.message); return false; }
  }
  return true;
}

// --- CONDOMINIO ---
function renderCondominio() {
  var c = CONFIG.condominio || {};
  document.getElementById('cfgNombre').value = c.nombre || '';
  document.getElementById('cfgDireccion').value = c.direccion || '';
  document.getElementById('cfgContacto').value = c.contacto || '';
}

async function saveCondominio() {
  var value = {
    nombre: document.getElementById('cfgNombre').value.trim(),
    direccion: document.getElementById('cfgDireccion').value.trim(),
    contacto: document.getElementById('cfgContacto').value.trim()
  };
  if (await saveConfig('condominio', value)) {
    alert('Configuración del condominio guardada.');
  }
}

// --- MONTOS ---
function renderMontos() {
  var m = CONFIG.montos || {};
  document.getElementById('cfgMontoMensual').value = m.monto_mensual || '';
  document.getElementById('cfgFondoReserva').value = m.fondo_reserva || '';
  document.getElementById('cfgMoneda').value = m.moneda || 'CLP';
}

async function saveMontos() {
  var value = {
    monto_mensual: parseFloat(document.getElementById('cfgMontoMensual').value) || 0,
    fondo_reserva: parseFloat(document.getElementById('cfgFondoReserva').value) || 0,
    moneda: document.getElementById('cfgMoneda').value
  };
  if (await saveConfig('montos', value)) {
    alert('Montos guardados.');
  }
}

// --- CATEGORÍAS DOCUMENTOS ---
function renderCategoriasDocs() {
  var cats = CONFIG.categorias_documentos || [];
  var container = document.getElementById('cfgCategoriasDocs');
  container.innerHTML = cats.map(function(c, i) {
    return '<span class="chip" style="display:inline-flex;align-items:center;gap:0.3rem">' + c +
      ' <button onclick="removeCategoriaDoc(' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.9rem;line-height:1" title="Eliminar">&times;</button></span>';
  }).join('');
}

function addCategoriaDoc() {
  var input = document.getElementById('cfgNuevaCategoria');
  var val = input.value.trim();
  if (!val) return;
  var cats = CONFIG.categorias_documentos || [];
  if (cats.indexOf(val) !== -1) { alert('Ya existe esa categoría.'); return; }
  cats.push(val);
  CONFIG.categorias_documentos = cats;
  input.value = '';
  renderCategoriasDocs();
}

function removeCategoriaDoc(i) {
  var cats = CONFIG.categorias_documentos || [];
  cats.splice(i, 1);
  CONFIG.categorias_documentos = cats;
  renderCategoriasDocs();
}

async function saveCategoriasDocs() {
  if (await saveConfig('categorias_documentos', CONFIG.categorias_documentos || [])) {
    alert('Categorías de documentos guardadas.');
  }
}

// --- RUBROS PROVEEDORES ---
function renderRubrosProveedores() {
  var rubros = CONFIG.rubros_proveedores || [];
  var container = document.getElementById('cfgRubrosProveedores');
  container.innerHTML = rubros.map(function(r, i) {
    return '<span class="chip" style="display:inline-flex;align-items:center;gap:0.3rem">' + r +
      ' <button onclick="removeRubroProveedor(' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.9rem;line-height:1" title="Eliminar">&times;</button></span>';
  }).join('');
}

function addRubroProveedor() {
  var input = document.getElementById('cfgNuevoRubro');
  var val = input.value.trim();
  if (!val) return;
  var rubros = CONFIG.rubros_proveedores || [];
  if (rubros.indexOf(val) !== -1) { alert('Ya existe ese rubro.'); return; }
  rubros.push(val);
  CONFIG.rubros_proveedores = rubros;
  input.value = '';
  renderRubrosProveedores();
}

function removeRubroProveedor(i) {
  var rubros = CONFIG.rubros_proveedores || [];
  rubros.splice(i, 1);
  CONFIG.rubros_proveedores = rubros;
  renderRubrosProveedores();
}

async function saveRubrosProveedores() {
  if (await saveConfig('rubros_proveedores', CONFIG.rubros_proveedores || [])) {
    alert('Rubros de proveedores guardados.');
  }
}

// --- PARCELAS BULK ---
function renderParcelasList() {
  var list = document.getElementById('cfgParcelasList');
  if (!PARCELAS.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay parcelas cargadas.</p>'; return; }
  list.innerHTML = PARCELAS.map(function(p) {
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.4rem 0;border-bottom:1px solid var(--border-light)">' +
      '<span style="font-size:0.9rem">' + p.numero + '</span>' +
      '<span style="font-size:0.8rem;color:var(--text-muted)">' + (p.metros || '') + ' m² · ' + (p.estado || '') + '</span>' +
      '</div>';
  }).join('');
}

async function bulkCreateParcelas() {
  var cantidad = parseInt(document.getElementById('cfgParcelasCantidad').value);
  var prefijo = document.getElementById('cfgParcelasPrefijo').value.trim() || 'Parcela';
  if (!cantidad || cantidad < 1) { alert('Ingresá una cantidad válida.'); return; }

  var existentes = PARCELAS.map(function(p) { return p.numero; });
  var nuevas = [];
  for (var i = 1; i <= cantidad; i++) {
    var nombre = prefijo + ' ' + i;
    if (existentes.indexOf(nombre) === -1) {
      nuevas.push({ numero: nombre, metros: 0, estado: 'Sin asignar' });
    }
  }

  if (!nuevas.length) { alert('Todas las parcelas ya existen.'); return; }

  if (DEMO_MODE) {
    nuevas.forEach(function(p) { PARCELAS.push(p); });
  } else if (supabaseClient) {
    var { error } = await supabaseClient.from('parcelas').insert(nuevas);
    if (error) { alert('Error al crear parcelas: ' + error.message); return; }
    await loadJson('PARCELAS');
  }

  alert(nuevas.length + ' parcela(s) creada(s).');
  document.getElementById('cfgParcelasCantidad').value = '';
  renderParcelasList();
}

// --- ADMIN USERS ---
var ADMINS = [];

async function loadAdmins() {
  if (DEMO_MODE) {
    ADMINS = currentUser ? [{ user_id: currentUser.id, email: currentUser.email }] : [];
  } else if (supabaseClient) {
    var { data, error } = await supabaseClient.from('admin_users').select('*');
    if (!error) ADMINS = data || [];
  }
}

function renderAdmins() {
  var list = document.getElementById('cfgAdminsList');
  if (!ADMINS.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No hay administradores configurados.</p>'; return; }
  list.innerHTML = ADMINS.map(function(a) {
    var isMe = currentUser && a.user_id === currentUser.id;
    return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid var(--border-light)">' +
      '<span style="font-size:0.9rem">' + a.email + (isMe ? ' (tú)' : '') + '</span>' +
      (isMe ? '' : '<button class="btn-toggle" onclick="removeAdmin(\'' + a.user_id + '\')" style="color:#ef4444;border-color:#ef4444">Quitar</button>') +
      '</div>';
  }).join('');
}

async function addAdmin() {
  var input = document.getElementById('cfgNuevoAdmin');
  var email = input.value.trim();
  if (!email) return;

  if (DEMO_MODE) {
    if (ADMINS.some(function(a) { return a.email === email; })) { alert('Ya es admin.'); return; }
    ADMINS.push({ user_id: 'demo-' + Date.now(), email: email });
    input.value = '';
    renderAdmins();
    alert('Admin agregado (modo demo).');
    return;
  }

  if (!supabaseClient) return;

  var { data: users, error: searchError } = await supabaseClient.auth.admin.listUsers();
  if (searchError) { alert('Error buscando usuarios: ' + searchError.message); return; }

  var user = (users.users || []).find(function(u) { return u.email === email; });
  if (!user) { alert('No se encontró usuario con ese email.'); return; }

  var { error } = await supabaseClient.from('admin_users').insert({ user_id: user.id, email: email });
  if (error) { alert('Error al agregar admin: ' + error.message); return; }

  ADMINS.push({ user_id: user.id, email: email });
  input.value = '';
  renderAdmins();
}

async function removeAdmin(userId) {
  if (!confirm('¿Quitar este administrador?')) return;

  if (DEMO_MODE) {
    ADMINS = ADMINS.filter(function(a) { return a.user_id !== userId; });
    renderAdmins();
    return;
  }

  if (!supabaseClient) return;
  var { error } = await supabaseClient.from('admin_users').delete().eq('user_id', userId);
  if (error) { alert('Error: ' + error.message); return; }
  ADMINS = ADMINS.filter(function(a) { return a.user_id !== userId; });
  renderAdmins();
}

// --- INIT CONFIG TAB ---
async function renderConfig() {
  showSkeletons('config');
  await Promise.all([loadConfig(), loadJson('PARCELAS'), loadAdmins()]);
  renderCondominio();
  renderMontos();
  renderCategoriasDocs();
  renderRubrosProveedores();
  renderParcelasList();
  renderAdmins();
}
