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
    '<div class="form-group"><label>Nombre</label><md-filled-text-field id="cfgModalInput" placeholder="' + placeholder + '" style="width:100%"></md-filled-text-field></div>';
  document.getElementById('modalFooter').innerHTML =
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button>' +
    '<md-filled-button id="cfgModalAddBtn">Agregar</md-filled-button>';
  document.getElementById('mainDialog').show();
  document.getElementById('cfgModalInput').focus();
  document.getElementById('cfgModalAddBtn').onclick = async function() {
    var val = document.getElementById('cfgModalInput').value.trim();
    if (!val) {
      return;
    }
    showLoading();
    await onAdd(val);
    hideLoading();
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
  showConfirm('¿Eliminar categoría "' + cat + '"?', function() {
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
  showConfirm('¿Eliminar rubro "' + rubro + '"?', function() {
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
  showConfirm('¿Eliminar concepto "' + concepto + '"?', function() {
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
  btn.textContent = 'Procesando...';

  var cantidad = parseInt(document.getElementById('cfgParcelasCantidad').value);
  var prefijo = document.getElementById('cfgParcelasPrefijo').value.trim();
  if (!prefijo) {
    showSnackbar('Ingresá un prefijo.', 'warning');
    btn.disabled = false;
    btn.textContent = 'Aplicar';
    return;
  }
  if (!cantidad || cantidad < 1) {
    showSnackbar('Ingresá una cantidad válida.', 'warning');
    btn.disabled = false;
    btn.textContent = 'Aplicar';
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
    btn.textContent = 'Aplicar';
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
      var { error } = await supabaseClient.from('parcelas').insert(nuevasReales);
      if (error) {
        hideLoading();
        showSnackbar('Error al crear parcelas: ' + error.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Aplicar';
        return;
      }
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
  btn.textContent = 'Aplicar';
}

// --- INIT CONFIG TAB ---
async function renderConfig() {
  showSkeletons('config');
  await Promise.all([loadConfig(), loadJson('PARCELAS'), loadJson('DOCUMENTOS'), loadJson('PROVEEDORES'), loadJson('FLUJO')]);
  renderMontos();
  renderParcelasConfig();
  renderCategoriasDocs();
  renderRubrosProveedores();
  renderConceptosFlujo();
}
