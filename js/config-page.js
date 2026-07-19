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
    showLoading();
    var { error } = await supabaseClient.from('config').upsert({ key: key, value: value, updated_at: new Date().toISOString() });
    hideLoading();
    if (error) { alert('Error al guardar: ' + error.message); return false; }
  }
  return true;
}

// --- MONTOS ---
function renderMontos() {
  var m = CONFIG.montos || {};
  document.getElementById('cfgGastoComunBase').value = m.gasto_comun_base || '';
  document.getElementById('cfgFondoReserva').value = m.fondo_reserva || '';
}

async function saveMontos() {
  var value = {
    gasto_comun_base: parseFloat(document.getElementById('cfgGastoComunBase').value) || 0,
    fondo_reserva: parseFloat(document.getElementById('cfgFondoReserva').value) || 0
  };
  if (await saveConfig('montos', value)) {
    alert('Montos guardados.');
  }
}

// --- LIST CHIP HELPER ---
function renderChipList(items, removeFn, usedItems) {
  if (!items.length) return '<span style="color:var(--text-muted);font-size:0.85rem">Sin elementos</span>';
  var used = usedItems || [];
  return '<div style="display:flex;flex-wrap:wrap;gap:0.5rem">' + items.map(function(item, i) {
    var isInUse = used.indexOf(item) !== -1;
    var btn = isInUse
      ? '<span style="color:var(--text-muted);font-size:0.7rem" title="En uso — no se puede eliminar">&#128274;</span>'
      : '<button onclick="' + removeFn + '(' + i + ')" style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.9rem;line-height:1" title="Eliminar">&times;</button>';
    var style = isInUse ? 'opacity:0.6;cursor:default' : '';
    return '<span class="chip" style="display:inline-flex;align-items:center;gap:0.3rem;' + style + '">' + item + ' ' + btn + '</span>';
  }).join('') + '</div>';
}

// --- MODAL HELPER ---
function openConfigModal(title, placeholder, onAdd) {
  var overlay = document.getElementById('modalOverlay');
  var titleEl = document.getElementById('modalTitle');
  var body = document.querySelector('.modal-body');
  titleEl.textContent = title;
  body.innerHTML =
    '<div class="form-group"><label>Nombre</label><input id="cfgModalInput" type="text" placeholder="' + placeholder + '" autofocus></div>' +
    '<div class="form-actions">' +
      '<button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>' +
      '<button class="btn btn-primary" id="cfgModalAddBtn">Agregar</button>' +
    '</div>';
  overlay.classList.add('active');
  document.getElementById('cfgModalInput').focus();
  document.getElementById('cfgModalAddBtn').onclick = async function() {
    var val = document.getElementById('cfgModalInput').value.trim();
    if (!val) return;
    showLoading();
    await onAdd(val);
    hideLoading();
    closeModal();
  };
  document.getElementById('cfgModalInput').onkeydown = function(e) {
    if (e.key === 'Enter') document.getElementById('cfgModalAddBtn').click();
  };
}

// --- CATEGORÍAS DOCUMENTOS ---
function renderCategoriasDocs() {
  var usadas = (DOCUMENTOS || []).map(function(d) { return d.categoria; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgCategoriasDocs').innerHTML = renderChipList(CONFIG.categorias_documentos || [], 'removeCategoriaDoc', usadas);
}

function openModalCategoriaDoc() {
  openConfigModal('Agregar categoría de documento', 'Ej: Actas', function(val) {
    var cats = CONFIG.categorias_documentos || [];
    if (cats.indexOf(val) !== -1) { alert('Ya existe esa categoría.'); return; }
    cats.push(val);
    CONFIG.categorias_documentos = cats;
    renderCategoriasDocs();
    saveConfig('categorias_documentos', cats);
  });
}

function removeCategoriaDoc(i) {
  var cats = CONFIG.categorias_documentos || [];
  cats.splice(i, 1);
  CONFIG.categorias_documentos = cats;
  renderCategoriasDocs();
  saveConfig('categorias_documentos', cats);
}

async function saveCategoriasDocs() {
  if (await saveConfig('categorias_documentos', CONFIG.categorias_documentos || [])) {
    alert('Categorías guardadas.');
  }
}

// --- RUBROS PROVEEDORES ---
function renderRubrosProveedores() {
  var usados = (PROVEEDORES || []).map(function(p) { return p.rubro; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgRubrosProveedores').innerHTML = renderChipList(CONFIG.rubros_proveedores || [], 'removeRubroProveedor', usados);
}

function openModalRubroProveedor() {
  openConfigModal('Agregar rubro de proveedor', 'Ej: Electricidad', function(val) {
    var rubros = CONFIG.rubros_proveedores || [];
    if (rubros.indexOf(val) !== -1) { alert('Ya existe ese rubro.'); return; }
    rubros.push(val);
    CONFIG.rubros_proveedores = rubros;
    renderRubrosProveedores();
    saveConfig('rubros_proveedores', rubros);
  });
}

function removeRubroProveedor(i) {
  var rubros = CONFIG.rubros_proveedores || [];
  rubros.splice(i, 1);
  CONFIG.rubros_proveedores = rubros;
  renderRubrosProveedores();
  saveConfig('rubros_proveedores', rubros);
}

async function saveRubrosProveedores() {
  if (await saveConfig('rubros_proveedores', CONFIG.rubros_proveedores || [])) {
    alert('Rubros guardados.');
  }
}

// --- CONCEPTOS FLUJO ---
function renderConceptosFlujo() {
  var usados = (FLUJO || []).map(function(f) { return f.concepto; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgConceptosFlujo').innerHTML = renderChipList(CONFIG.conceptos_flujo || [], 'removeConceptoFlujo', usados);
}

function openModalConceptoFlujo() {
  openConfigModal('Agregar concepto de ingreso/egreso', 'Ej: Mantenimiento', function(val) {
    var conceptos = CONFIG.conceptos_flujo || [];
    if (conceptos.indexOf(val) !== -1) { alert('Ya existe ese concepto.'); return; }
    conceptos.push(val);
    CONFIG.conceptos_flujo = conceptos;
    renderConceptosFlujo();
    saveConfig('conceptos_flujo', conceptos);
  });
}

function removeConceptoFlujo(i) {
  var conceptos = CONFIG.conceptos_flujo || [];
  conceptos.splice(i, 1);
  CONFIG.conceptos_flujo = conceptos;
  renderConceptosFlujo();
  saveConfig('conceptos_flujo', conceptos);
}

async function saveConceptosFlujo() {
  if (await saveConfig('conceptos_flujo', CONFIG.conceptos_flujo || [])) {
    alert('Conceptos guardados.');
  }
}

// --- PARCELAS BULK ---
function renderParcelasConfig() {
  var p = CONFIG.parcelas_prefijo || '';
  var c = CONFIG.parcelas_cantidad || '';
  document.getElementById('cfgParcelasPrefijo').value = p;
  document.getElementById('cfgParcelasCantidad').value = c;
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
    showLoading();
    var { error } = await supabaseClient.from('parcelas').insert(nuevas);
    hideLoading();
    if (error) { alert('Error al crear parcelas: ' + error.message); return; }
    await loadJson('PARCELAS');
  }

  await saveConfig('parcelas_cantidad', cantidad);
  await saveConfig('parcelas_prefijo', prefijo);

  alert(nuevas.length + ' parcela(s) creada(s).');
  document.getElementById('cfgParcelasCantidad').value = '';
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

  showLoading();
  var { data: users, error: searchError } = await supabaseClient.auth.admin.listUsers();
  if (searchError) { hideLoading(); alert('Error buscando usuarios: ' + searchError.message); return; }

  var user = (users.users || []).find(function(u) { return u.email === email; });
  if (!user) { hideLoading(); alert('No se encontró usuario con ese email.'); return; }

  var { error } = await supabaseClient.from('admin_users').insert({ user_id: user.id, email: email });
  hideLoading();
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
  showLoading();
  var { error } = await supabaseClient.from('admin_users').delete().eq('user_id', userId);
  hideLoading();
  if (error) { alert('Error: ' + error.message); return; }
  ADMINS = ADMINS.filter(function(a) { return a.user_id !== userId; });
  renderAdmins();
}

// --- INIT CONFIG TAB ---
async function renderConfig() {
  showSkeletons('config');
  await Promise.all([loadConfig(), loadJson('PARCELAS'), loadJson('DOCUMENTOS'), loadJson('PROVEEDORES'), loadJson('FLUJO'), loadAdmins()]);
  renderMontos();
  renderParcelasConfig();
  renderCategoriasDocs();
  renderRubrosProveedores();
  renderConceptosFlujo();
  renderAdmins();
}
