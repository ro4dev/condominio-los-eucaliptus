// CONFIG PAGE — solo admin

var CONFIG = {};

async function loadConfig() {
  if (DEMO_MODE) {
    var res = await fetch('data/config.json', { cache: 'no-store' });
    CONFIG = await res.json();
  } else if (supabaseClient) {
    var { data, error } = await supabaseClient.from('config').select('key, value');
      if (error) {
        throw error;
      }
    CONFIG = {};
    data.forEach(function(row) { CONFIG[row.key] = row.value; });
  }
}

async function saveConfig(key, value) {
  var existed = Object.prototype.hasOwnProperty.call(CONFIG, key);
  CONFIG[key] = value;
  if (!DEMO_MODE && supabaseClient) {
    showLoading();
    var { error } = await supabaseClient.from('config').upsert({ key: key, value: value, updated_at: new Date().toISOString() });
    hideLoading();
    if (error) {
      showSnackbar('Error al guardar: ' + error.message, 'error');
      return false;
    }
  }
  logAudit('config', existed ? 'UPDATE' : 'INSERT', { key: key, value: value });
  return true;
}

// --- MONTOS ---
function renderMontos() {
  var m = CONFIG.montos || {};
  document.getElementById('cfgGastoComunBase').value = m.gasto_comun_base || '';
  document.getElementById('cfgFondoReserva').value = m.fondo_reserva || '';
}

async function saveMontos() {
  var btn = document.getElementById('btnGuardarMontos');
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  var value = {
    gasto_comun_base: parseFloat(document.getElementById('cfgGastoComunBase').value) || 0,
    fondo_reserva: parseFloat(document.getElementById('cfgFondoReserva').value) || 0
  };
  if (await saveConfig('montos', value)) {
    showSnackbar('Montos guardados.', 'success');
  }
  btn.disabled = false;
  btn.textContent = 'Guardar';
}

// --- DATOS DE PAGO (Home → Cómo pagar) ---
function renderDatosPago() {
  var d = CONFIG.datos_pago || {};
  document.getElementById('cfgPagoBanco').value = d.banco || '';
  document.getElementById('cfgPagoTipoCuenta').value = d.tipo_cuenta || '';
  document.getElementById('cfgPagoNumeroCuenta').value = d.numero_cuenta || '';
  document.getElementById('cfgPagoRut').value = d.rut || '';
  document.getElementById('cfgPagoTitular').value = d.titular || '';
  document.getElementById('cfgPagoEmail').value = d.email || '';
  document.getElementById('cfgPagoQr').value = d.qr || '';
}

async function saveDatosPago() {
  var btn = document.getElementById('btnGuardarDatosPago');
  btn.disabled = true;
  btn.textContent = 'Guardando...';
  var value = {
    banco: document.getElementById('cfgPagoBanco').value.trim(),
    tipo_cuenta: document.getElementById('cfgPagoTipoCuenta').value.trim(),
    numero_cuenta: document.getElementById('cfgPagoNumeroCuenta').value.trim(),
    rut: document.getElementById('cfgPagoRut').value.trim(),
    titular: document.getElementById('cfgPagoTitular').value.trim(),
    email: document.getElementById('cfgPagoEmail').value.trim(),
    qr: document.getElementById('cfgPagoQr').value.trim()
  };
  if (await saveConfig('datos_pago', value)) {
    showSnackbar('Datos de pago guardados.', 'success');
  }
  btn.disabled = false;
  btn.textContent = 'Guardar';
}

// --- LIST CHIP HELPER ---
function renderChipList(items, removeFn, usedItems) {
  if (!items.length) {
    return '<span style="color:var(--text-muted);font-size:0.85rem">Sin elementos</span>';
  }
  var used = usedItems || [];
  return '<div class="chip-list" data-removefn="' + removeFn + '" style="display:flex;flex-wrap:wrap;gap:0.5rem">' + items.map(function(item, i) {
    var isInUse = used.indexOf(item) !== -1;
    if (isInUse) {
      return '<md-assist-chip>' + item + '</md-assist-chip>';
    }
    return '<div class="chip-remove-wrapper" data-fn="' + removeFn + '" data-idx="' + i + '" style="cursor:pointer"><md-input-chip removable>' + item + '</md-input-chip></div>';
  }).join('') + '</div>';
}

document.addEventListener('click', function(e) {
  var path = e.composedPath();
  var wrapper = null;
  for (var i = 0; i < path.length; i++) {
    if (path[i].classList && path[i].classList.contains('chip-remove-wrapper')) {
      wrapper = path[i];
      break;
    }
  }
  if (!wrapper) return;
  e.preventDefault();
  e.stopPropagation();
  var fn = wrapper.dataset.fn;
  var idx = parseInt(wrapper.dataset.idx);
  if (fn && !isNaN(idx)) {
    window[fn](idx);
  }
}, true);

// --- MODAL HELPER ---
function openConfigModal(title, placeholder, onAdd) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML =
    '<div class="form-group"><md-filled-text-field label="Nombre" id="cfgModalInput" placeholder="' + placeholder + '" required error-text="Este campo es requerido" style="width:100%"></md-filled-text-field></div>';
  document.getElementById('modalFooter').innerHTML =
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button>' +
    '<md-filled-button id="cfgModalAddBtn">Agregar</md-filled-button>';
  document.getElementById('mainDialog').show();
  document.getElementById('cfgModalInput').focus();
  document.getElementById('cfgModalAddBtn').onclick = async function() {
    var input = document.getElementById('cfgModalInput');
    var val = input.value.trim();
    if (!val) {
      input.reportValidity();
      return;
    }
    var addBtn = document.getElementById('cfgModalAddBtn');
    addBtn.disabled = true;
    showLoading();
    await onAdd(val);
    hideLoading();
    addBtn.disabled = false;
    closeModal();
  };
  document.getElementById('cfgModalInput').onkeydown = function(e) {
    if (e.key === 'Enter') {
      document.getElementById('cfgModalAddBtn').click();
    }
  };
}

// --- CATEGORÍAS DOCUMENTOS ---
function renderCategoriasDocs() {
  var usadas = (DOCUMENTOS || []).map(function(d) { return d.categoria; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgCategoriasDocs').innerHTML = renderChipList(CONFIG.categorias_documentos || [], 'removeCategoriaDoc', usadas);
}

function openModalCategoriaDoc() {
  openConfigModal('Agregar categoría de documento', 'Ej: Actas', async function(val) {
    var cats = CONFIG.categorias_documentos || [];
    if (cats.indexOf(val) !== -1) {
      showSnackbar('Ya existe esa categoría.', 'warning');
      return;
    }
    cats.push(val);
    CONFIG.categorias_documentos = cats;
    renderCategoriasDocs();
    if (await saveConfig('categorias_documentos', cats)) {
      showSnackbar('Categoría agregada.', 'success');
    }
  });
}

function removeCategoriaDoc(i) {
  var cat = (CONFIG.categorias_documentos || [])[i];
  if (!cat) return;
  showConfirm('¿Eliminar la categoría "' + cat + '"?', function() {
    var cats = CONFIG.categorias_documentos || [];
    cats.splice(i, 1);
    CONFIG.categorias_documentos = cats;
    renderCategoriasDocs();
    saveConfig('categorias_documentos', cats).then(function(ok) { if (ok) { showSnackbar('Categoría eliminada.', 'success'); } });
  });
}

async function saveCategoriasDocs() {
  if (await saveConfig('categorias_documentos', CONFIG.categorias_documentos || [])) {
    showSnackbar('Categorías guardadas.', 'success');
  }
}

// --- RUBROS PROVEEDORES ---
function renderRubrosProveedores() {
  var usados = (PROVEEDORES || []).map(function(p) { return p.rubro; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgRubrosProveedores').innerHTML = renderChipList(CONFIG.rubros_proveedores || [], 'removeRubroProveedor', usados);
}

function openModalRubroProveedor() {
  openConfigModal('Agregar rubro de proveedor', 'Ej: Electricidad', async function(val) {
    var rubros = CONFIG.rubros_proveedores || [];
    if (rubros.indexOf(val) !== -1) {
      showSnackbar('Ya existe ese rubro.', 'warning');
      return;
    }
    rubros.push(val);
    CONFIG.rubros_proveedores = rubros;
    renderRubrosProveedores();
    if (await saveConfig('rubros_proveedores', rubros)) {
      showSnackbar('Rubro agregado.', 'success');
    }
  });
}

function removeRubroProveedor(i) {
  var rubro = (CONFIG.rubros_proveedores || [])[i];
  if (!rubro) return;
  showConfirm('¿Eliminar el rubro "' + rubro + '"?', function() {
    var rubros = CONFIG.rubros_proveedores || [];
    rubros.splice(i, 1);
    CONFIG.rubros_proveedores = rubros;
    renderRubrosProveedores();
    saveConfig('rubros_proveedores', rubros).then(function(ok) { if (ok) { showSnackbar('Rubro eliminado.', 'success'); } });
  });
}

async function saveRubrosProveedores() {
  if (await saveConfig('rubros_proveedores', CONFIG.rubros_proveedores || [])) {
    showSnackbar('Rubros guardados.', 'success');
  }
}

// --- CONCEPTOS FLUJO ---
function renderConceptosFlujo() {
  var usados = (FLUJO || []).map(function(f) { return f.concepto; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgConceptosFlujo').innerHTML = renderChipList(CONFIG.conceptos_flujo || [], 'removeConceptoFlujo', usados);
}

function openModalConceptoFlujo() {
  openConfigModal('Agregar concepto de ingreso/egreso', 'Ej: Mantenimiento', async function(val) {
    var conceptos = CONFIG.conceptos_flujo || [];
    if (conceptos.indexOf(val) !== -1) {
      showSnackbar('Ya existe ese concepto.', 'warning');
      return;
    }
    conceptos.push(val);
    CONFIG.conceptos_flujo = conceptos;
    renderConceptosFlujo();
    if (await saveConfig('conceptos_flujo', conceptos)) {
      showSnackbar('Concepto agregado.', 'success');
    }
  });
}

function removeConceptoFlujo(i) {
  var concepto = (CONFIG.conceptos_flujo || [])[i];
  if (!concepto) return;
  showConfirm('¿Eliminar el concepto "' + concepto + '"?', function() {
    var conceptos = CONFIG.conceptos_flujo || [];
    conceptos.splice(i, 1);
    CONFIG.conceptos_flujo = conceptos;
    renderConceptosFlujo();
    saveConfig('conceptos_flujo', conceptos).then(function(ok) { if (ok) { showSnackbar('Concepto eliminado.', 'success'); } });
  });
}

async function saveConceptosFlujo() {
  if (await saveConfig('conceptos_flujo', CONFIG.conceptos_flujo || [])) {
    showSnackbar('Conceptos guardados.', 'success');
  }
}

// --- PARCELAS BULK ---
function renderParcelasConfig() {
  var p = CONFIG.parcelas_prefijo || '';
  var c = CONFIG.parcelas_cantidad || '';
  document.getElementById('cfgParcelasPrefijo').value = p;
  document.getElementById('cfgParcelasCantidad').value = c;
}

async function renameParcelas(oldPrefijo, newPrefijo) {
  if (DEMO_MODE || !supabaseClient) {
    PARCELAS.forEach(function(p) {
      var match = p.numero.match(/^(\D+)\s+(\d+)$/);
      if (match && match[1] === oldPrefijo) {
        p.numero = newPrefijo + ' ' + match[2];
      }
    });
    return;
  }

  for (var i = 0; i < PARCELAS.length; i++) {
    var match = PARCELAS[i].numero.match(/^(\D+)\s+(\d+)$/);
    if (!match || match[1] !== oldPrefijo) {
      continue;
    }
    var newName = newPrefijo + ' ' + match[2];
    var { error } = await supabaseClient.from('parcelas').update({ numero: newName }).eq('id', PARCELAS[i].id);
    if (error) {
      console.error('Error renaming parcela:', PARCELAS[i].numero, error);
    }
  }

  await loadJson('PARCELAS');
  console.log('Parcelas after rename:', PARCELAS.map(function(p) { return p.numero; }));
}

async function bulkCreateParcelas() {
  var btn = document.getElementById('btnAplicarParcelas');
  btn.disabled = true;
  btn.textContent = 'Creando...';

  var cantidad = parseInt(document.getElementById('cfgParcelasCantidad').value);
  var prefijo = document.getElementById('cfgParcelasPrefijo').value.trim();
  if (!prefijo) {
    showSnackbar('Ingresá un prefijo.', 'warning');
    btn.disabled = false;
    btn.textContent = 'Crear parcelas';
    return;
  }
  if (!cantidad || cantidad < 1) {
    showSnackbar('Ingresá una cantidad válida.', 'warning');
    btn.disabled = false;
    btn.textContent = 'Crear parcelas';
    return;
  }

  var prefijoAnterior = CONFIG.parcelas_prefijo || '';

  var nuevas = [];
  for (var i = 1; i <= cantidad; i++) {
    nuevas.push({ id: generateUUID(), numero: prefijo + ' ' + i, metros: 0, estado: 'Sin asignar' });
  }

  var nombresNuevos = nuevas.map(function(p) { return p.numero; });
  var nombresExistentes = PARCELAS.map(function(p) { return p.numero; });
  var iguales = nombresNuevos.length === nombresExistentes.length && nombresNuevos.every(function(n, i) { return n === nombresExistentes[i]; });

  if (iguales) {
    await saveConfig('parcelas_cantidad', cantidad);
    await saveConfig('parcelas_prefijo', prefijo);
    showSnackbar('Sin cambios.', 'info');
    btn.disabled = false;
    btn.textContent = 'Crear parcelas';
    return;
  }

  if (DEMO_MODE) {
    if (prefijo !== prefijoAnterior) {
      PARCELAS.forEach(function(p) {
        var match = p.numero.match(/^(\D+)\s+(\d+)$/);
        if (match && match[1] === prefijoAnterior) {
          p.numero = prefijo + ' ' + match[2];
        }
      });
    }
    nuevas.forEach(function(p) {
      if (!PARCELAS.some(function(x) { return x.numero === p.numero; })) {
        PARCELAS.push(p);
        logAudit('parcelas', 'INSERT', p);
      }
    });
  } else if (supabaseClient) {
    showLoading();
    if (prefijo !== prefijoAnterior) {
      await renameParcelas(prefijoAnterior, prefijo);
    }
    nombresExistentes = PARCELAS.map(function(p) { return p.numero; });
    console.log('Existentes:', nombresExistentes);
    console.log('Nuevas:', nuevas.map(function(p) { return p.numero; }));
    var nuevasReales = nuevas.filter(function(p) { return nombresExistentes.indexOf(p.numero) === -1; });
    console.log('Nuevas reales:', nuevasReales.map(function(p) { return p.numero; }));
    if (nuevasReales.length) {
      var { data: insertedRows, error } = await supabaseClient.from('parcelas').insert(nuevasReales).select();
      if (error) {
        hideLoading();
        showSnackbar('Error al crear parcelas: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Crear parcelas';
        return;
      }
      (insertedRows || []).forEach(function(p) { logAudit('parcelas', 'INSERT', p); });
      await loadJson('PARCELAS');
    }
    hideLoading();
  }

  await saveConfig('parcelas_cantidad', cantidad);
  await saveConfig('parcelas_prefijo', prefijo);

  var msg = prefijo !== prefijoAnterior
    ? 'Parcelas renombradas a "' + prefijo + '".'
    : 'Parcelas actualizadas.';
  showSnackbar(msg, 'success');
  renderParcelasConfig();
  btn.disabled = false;
  btn.textContent = 'Crear parcelas';
}

// --- AUDITORÍA DE ACTIVIDAD ---
var auditFilter = 'todas';

var AUDIT_TABLES = [
  { value: 'gastos', label: 'Gastos' },
  { value: 'flujo', label: 'Flujo' },
  { value: 'noticias', label: 'Noticias' },
  { value: 'documentos', label: 'Documentos' },
  { value: 'reclamos', label: 'Reclamos' },
  { value: 'proveedores', label: 'Proveedores' },
  { value: 'asambleas', label: 'Asambleas' },
  { value: 'encuestas', label: 'Encuestas' },
  { value: 'parcelas', label: 'Parcelas' },
  { value: 'propietarios', label: 'Propietarios' },
  { value: 'publicaciones', label: 'Ventas' },
  { value: 'config', label: 'Configuración' }
];

function filterAudit(filtro) {
  auditFilter = filtro;
  document.querySelectorAll('#auditFilter md-filter-chip').forEach(function(c) { c.selected = false; });
  event.target.closest('md-filter-chip').selected = true;
  renderAuditLog();
}

function formatAuditDate(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  var dd = String(d.getDate()).padStart(2, '0');
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var hh = String(d.getHours()).padStart(2, '0');
  var mi = String(d.getMinutes()).padStart(2, '0');
  return dd + '/' + mm + '/' + d.getFullYear() + ' ' + hh + ':' + mi;
}

var AUDIT_ACCIONES = { INSERT: 'Creó', UPDATE: 'Actualizó', DELETE: 'Eliminó' };

function showAuditDatos(idx) {
  var e = window._auditRows[idx];
  if (!e || !e.datos) return;
  openModal('Detalle de actividad',
    '<pre style="font-size:0.8rem;white-space:pre-wrap;word-break:break-word;background:var(--md-sys-color-surface-container-low);padding:0.8rem;border-radius:var(--md-sys-shape-corner-small);max-height:60vh;overflow:auto;margin:0">' + escHtml(JSON.stringify(e.datos, null, 2)) + '</pre>');
}

async function renderAuditLog() {
  var wrap = document.getElementById('cfgAuditLog');
  if (!wrap) return;
  var chips = '<div class="filter-chips" id="auditFilter">' +
    '<md-filter-chip label="Todas" selected onclick="filterAudit(\'todas\')"></md-filter-chip>' +
    AUDIT_TABLES.map(function(t) {
      return '<md-filter-chip label="' + t.label + '" onclick="filterAudit(\'' + t.value + '\')"></md-filter-chip>';
    }).join('') +
    '</div>';
  wrap.innerHTML = chips + '<div id="auditList" style="margin-top:0.8rem"></div>';
  var listEl = document.getElementById('auditList');

  var rows;
  if (DEMO_MODE) {
    rows = AUDIT_LOG.slice();
  } else if (supabaseClient) {
    listEl.innerHTML = '<div style="padding:0.8rem 0;color:var(--text-muted);font-size:0.85rem">Cargando actividad...</div>';
    var { data, error } = await supabaseClient.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) {
      listEl.innerHTML = emptyState('No se pudo cargar la actividad.');
      return;
    }
    rows = data || [];
  } else {
    rows = [];
  }

  rows = rows.filter(function(e) { return auditFilter === 'todas' || e.tabla === auditFilter; });
  window._auditRows = rows;

  if (!rows.length) {
    listEl.innerHTML = emptyState('Sin actividad registrada.');
    return;
  }

  listEl.innerHTML = rows.map(function(e, i) {
    var accion = AUDIT_ACCIONES[e.accion] || e.accion;
    var idTxt = e.registro_id ? String(e.registro_id).slice(0, 8) : '—';
    var infoBtn = (e.accion === 'UPDATE' || e.accion === 'DELETE') && e.datos && Object.keys(e.datos).length
      ? '<md-icon-button title="Ver datos" onclick="showAuditDatos(' + i + ')" style="--md-icon-button-icon-size:20px"><md-icon>info</md-icon></md-icon-button>'
      : '';
    return '<div style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem 0;border-bottom:1px solid var(--border-light);font-size:0.85rem">' +
      '<span style="color:var(--text-muted);white-space:nowrap">' + escHtml(formatAuditDate(e.created_at)) + '</span>' +
      '<span style="color:var(--text-2)">' + escHtml(e.usuario || 'anónimo') + '</span>' +
      '<span style="color:var(--text);font-weight:500">' + escHtml(accion) + '</span>' +
      '<span style="color:var(--text-muted)">en</span>' +
      '<span style="color:var(--text);font-weight:600">' + escHtml(e.tabla) + '</span>' +
      '<span style="color:var(--text-muted)">· registro</span>' +
      '<code style="font-size:0.75rem;color:var(--text-2)">' + escHtml(idTxt) + '</code>' +
      infoBtn +
      '</div>';
  }).join('');
}

// --- INIT CONFIG TAB ---
async function renderConfig() {
  showSkeletons('config');
  await Promise.all([loadConfig(), loadJson('PARCELAS'), loadJson('DOCUMENTOS'), loadJson('PROVEEDORES'), loadJson('FLUJO')]);
  if (DEMO_MODE) await loadJson('AUDIT_LOG');
  renderMontos();
  renderParcelasConfig();
  renderCategoriasDocs();
  renderRubrosProveedores();
  renderConceptosFlujo();
  await renderAuditLog();
  var tabEl = document.getElementById('tab-config');
  if (tabEl) tabEl.setAttribute('aria-busy', 'false');
}
