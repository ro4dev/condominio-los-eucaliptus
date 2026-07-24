function openModal(title, html, footerHtml) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalFooter').innerHTML = footerHtml !== undefined ? footerHtml : '<md-text-button onclick="closeModal()">Cerrar</md-text-button>';
  document.getElementById('mainDialog').show();
}

function closeModal() {
  document.getElementById('mainDialog').close();
  hideLoading();
}

function showConfirm(message, onConfirm, confirmText) {
  confirmText = confirmText || 'Eliminar';
  document.getElementById('modalTitle').textContent = 'Confirmar';
  document.getElementById('modalBody').innerHTML = '<div style="line-height:1.5">' + message + '</div>';
  document.getElementById('modalFooter').innerHTML =
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button>' +
    '<md-filled-button onclick="confirmAction()" style="--md-filled-button-container-color:#b91c1c">' + confirmText + '</md-filled-button>';
  document.getElementById('mainDialog').show();
  window._confirmCallback = onConfirm;
}

function confirmAction() {
  closeModal();
  if (typeof window._confirmCallback === 'function') {
    window._confirmCallback();
  }
  window._confirmCallback = null;
}

function showLoading() {
  var el = document.getElementById('modalLoading');
  el.style.display = 'flex';
}

function hideLoading() {
  var el = document.getElementById('modalLoading');
  el.style.display = 'none';
}

function confirmCloseModal() {
  var body = document.getElementById('modalBody');
  var inputs = body.querySelectorAll('input:not([type="file"]):not([type="hidden"]), textarea, select, md-filled-text-field, md-outlined-text-field, md-filled-select');
  var hasData = false;
  inputs.forEach(function(el) {
    var val = el.value || '';
    if (val.trim && val.trim() !== '') {
      hasData = true;
    }
  });
  if (hasData) {
    showConfirm('¿Cerrar? Se perderán los datos ingresados.', function() { closeModal(); }, 'Cerrar');
    return;
  }
  closeModal();
}

function handleForm(e) {
  e.preventDefault();
  var form = e.target;
  var submitBtn = form.querySelector('button[type="submit"], md-filled-button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }
  showLoading();
  var data = {};
  form.querySelectorAll('input[type="hidden"]').forEach(function(inp) { if (inp.name) data[inp.name] = inp.value; });
  form.querySelectorAll('input:not([type="file"]):not([type="hidden"]), textarea, select').forEach(function(el) { if (el.name) data[el.name] = el.value; });
  form.querySelectorAll('md-filled-text-field, md-outlined-text-field').forEach(function(el) { if (el.name) data[el.name] = el.value; });
  form.querySelectorAll('md-filled-select, md-outlined-select').forEach(function(el) { if (el.name) data[el.name] = el.value; });
  form.querySelectorAll('input[type="file"]').forEach(function(inp) {
    if (inp.files.length === 0) delete data[inp.name];
  });
  form.querySelectorAll('select[multiple]').forEach(function(sel) {
    data[sel.name] = Array.from(sel.selectedOptions).map(function(o) { return o.value; }).join(', ');
  });

  var table = form.dataset.table;
  var isEdit = !!data.id;
  var autoDateTables = ['noticias', 'documentos'];
  if (autoDateTables.indexOf(table) !== -1 && !data.fecha) {
    data.fecha = new Date().toISOString().slice(0, 10);
  }
  if (table === 'flujo' && currentUser && !data.registrado_por) {
    data.registrado_por = currentUser.email;
  }
  if (table === 'proveedores' && data.web_instagram && data.web_instagram.indexOf('http') !== 0) {
    data.web_instagram = 'https://' + data.web_instagram;
  }
  if (table === 'proveedores' && data.web_instagram && /[\s,]/.test(data.web_instagram)) {
    showSnackbar('El campo Web/Instagram contiene caracteres inválidos (espacios, comas).', 'warning');
    submitError();
    return;
  }
  if (!data.parcela_id) {
    delete data.parcela_id;
  }

  var fileInput = form.querySelector('input[type="file"]');
  var filePromise = Promise.resolve(null);
  if (fileInput && fileInput.files.length > 0) {
    var bucket = form.dataset.bucket || 'gastos_comunes';
    var folder = '';
    if (table === 'gastos' && data.periodo) {
      folder = data.periodo;
    }
    else if (table === 'flujo' && data.fecha && data.tipo) folder = data.fecha.slice(0, 7) + '-' + data.tipo;
    else if (table === 'documentos' && data.categoria) folder = data.categoria;
    filePromise = supabaseUpload(fileInput.files[0], bucket, folder);
  }

  function afterSave() {
    hideLoading();
    showSnackbar(isEdit ? 'Actualizado correctamente.' : 'Guardado correctamente.', 'success');
    closeModal();
    reloadTab(getCurrentTab());
  }

  function submitError(msg) {
    hideLoading();
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = isEdit ? 'Actualizar' : 'Guardar';
    }
    if (msg) showSnackbar(msg, 'error');
  }

  filePromise.then(function(fileUrl) {
    if (fileInput && fileInput.files.length > 0 && !fileUrl) {
      submitError();
      return;
    }
    if (fileUrl) {
      data[fileInput.name] = fileUrl;
    }

    if (DEMO_MODE) {
      if (table === 'encuestas') {
        if (!isEdit) {
          var altInputs = document.querySelectorAll('.encuesta-alt-input');
          var alternativas = [];
          altInputs.forEach(function(inp) {
            var val = inp.value.trim();
            if (val) {
              alternativas.push(val);
            }
          });
          data.alternativas = alternativas;
        }
        if (!data.fecha_termino) {
          delete data.fecha_termino;
        }
        if (data.quorum) {
          data.quorum = parseInt(data.quorum) || null;
        }
        if (isEdit) {
          var idx = ENCUESTAS.findIndex(function(e) { return e.id === data.id; });
          if (idx !== -1) ENCUESTAS[idx] = Object.assign({}, ENCUESTAS[idx], data);
        } else {
          data.id = generateUUID();
          data.created_at = new Date().toISOString();
          ENCUESTAS.push(data);
        }
        afterSave();
        renderEncuestas();
      } else if (isEdit) {
        var arrName = tableToArray(table);
        if (arrName) {
          var idx = window[arrName].findIndex(function(item) { return item.id === data.id; });
          if (idx !== -1) window[arrName][idx] = Object.assign({}, window[arrName][idx], data);
        }
        afterSave();
        reloadTab(getCurrentTab());
      } else {
        var arrName = tableToArray(table);
        if (arrName) {
          data.id = generateUUID();
          if (table === 'noticias' || table === 'documentos') {
            data.fecha = data.fecha || new Date().toISOString().slice(0, 10);
          }
          window[arrName].push(data);
        }
        afterSave();
        reloadTab(getCurrentTab());
      }
    } else {
      if (!table) {
        showSnackbar('Error: no se especificó la tabla.', 'error');
        submitError();
        return;
      }

      var doUpdate = isEdit ? function(tbl, payload) {
        return supabaseUpdate(tbl, data.id, payload);
      } : function(tbl, payload) {
        return supabaseInsert(tbl, payload);
      };

      if (table === 'propietarios' && !isEdit) {
        supabaseClient.functions.invoke('create-user', { body: data }).then(function(res) {
          if (res.error) {
            submitError(res.error.message || 'Error al crear usuario');
          } else {
            afterSave();
          }
        });
      } else if (table === 'asambleas') {
        var asistentesStr = data.asistentes || '';
        var asistentesIds = asistentesStr ? asistentesStr.split(', ') : [];
        delete data.asistentes;
        doUpdate(table, data).then(function(result) {
          if (!result) { submitError(); return; }
          var asambleaId = isEdit ? data.id : result[0] && result[0].id;
          if (isEdit) {
            supabaseClient.from('asamblea_asistentes').delete().eq('asamblea_id', asambleaId).then(function() {
              if (asistentesIds.length) {
                var rows = asistentesIds.map(function(pid) { return { asamblea_id: asambleaId, parcela_id: pid }; });
                supabaseClient.from('asamblea_asistentes').insert(rows).then(function() { afterSave(); });
              } else {
                afterSave();
              }
            });
          } else {
            if (asistentesIds.length) {
              var rows = asistentesIds.map(function(pid) { return { asamblea_id: asambleaId, parcela_id: pid }; });
              supabaseClient.from('asamblea_asistentes').insert(rows).then(function() { afterSave(); });
            } else {
              afterSave();
            }
          }
        });
      } else if (table === 'encuestas') {
        if (data.quorum) {
          data.quorum = parseInt(data.quorum) || null;
        }
        if (!data.fecha_termino) {
          delete data.fecha_termino;
        }
        if (!isEdit) {
          var altInputs = document.querySelectorAll('.encuesta-alt-input');
          var alternativas = [];
          altInputs.forEach(function(inp) {
            var val = inp.value.trim();
            if (val) {
              alternativas.push(val);
            }
          });
          data.alternativas = alternativas;
        }
        doUpdate(table, data).then(function(result) {
          hideLoading();
          if (result) {
            showSnackbar(isEdit ? 'Encuesta actualizada.' : 'Encuesta creada.', 'success');
            closeModal();
            reloadTab(getCurrentTab());
          } else {
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = isEdit ? 'Actualizar' : 'Crear';
            }
          }
        });
      } else {
        doUpdate(table, data).then(function(result) {
          if (result) {
            afterSave();
          } else {
            submitError();
          }
        });
      }
    }
  });
}

function tableToArray(table) {
  var map = {
    noticias: 'NOTICIAS',
    flujo: 'FLUJO',
    documentos: 'DOCUMENTOS',
    proveedores: 'PROVEEDORES',
    asambleas: 'ASAMBLEAS',
    encuestas: 'ENCUESTAS',
    parcelas: 'PARCELAS',
    propietarios: 'PROPIETARIOS'
  };
  return map[table] || null;
}

function getCurrentTab() {
  var active = document.querySelector('.tab-content.active');
  if (!active) {
    return 'cuenta';
  }
  return active.id.replace('tab-', '');
}

function formGastos(opt) {
  var isEdit = opt && typeof opt === 'object';
  var data = isEdit ? opt : null;
  if (PARCELAS.length === 0) {
    loadJson('PARCELAS').then(function() { formGastos(opt); });
    return;
  }
  var sorted = PARCELAS.slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  var parcelas = sorted.map(function(p) {
    var sel = isEdit && data.parcela_id === p.id ? ' selected' : '';
    return '<md-select-option value="' + p.id + '"' + sel + '>' + p.numero + '</md-select-option>';
  }).join('');
  openModal(isEdit ? 'Editar Gasto' : 'Agregar Gasto', '<form id="modalForm" data-table="gastos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<input type="hidden" name="concepto" id="gastoConcepto">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Periodo *</label><md-filled-text-field type="month" name="periodo" required id="gastoPeriodo" style="width:100%"' + (isEdit ? ' value="' + data.periodo + '"' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><label>Parcela *</label><md-filled-select name="parcela_id" required id="gastoParcela" style="width:100%">' + parcelas + '</md-filled-select></div>' +
    '</div>' +
    '<div class="form-group"><label>Monto *</label><md-filled-text-field type="number" name="monto" min="0" placeholder="0" required style="width:100%"' + (isEdit ? ' value="' + data.monto + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Descripción</label><md-filled-text-field textarea name="descripcion" placeholder="Detalles del gasto (opcional)" style="width:100%">' + (isEdit ? escHtml(data.descripcion || '') : '') + '</md-filled-text-field></div>' +
    '<div class="form-group"><label>Comprobante (foto)</label><input type="file" name="archivo" accept="image/*"></div>' +
    (isEdit && data.archivo ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.archivo + '" target="_blank">ver</a></div>' : '') +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
  document.getElementById('gastoPeriodo').addEventListener('change', updateGastoParcelas);
  document.getElementById('gastoParcela').addEventListener('change', updateGastoConcepto);
  updateGastoConcepto();
}

function updateGastoParcelas() {
  var periodo = document.getElementById('gastoPeriodo').value;
  var select = document.getElementById('gastoParcela');
  var usadas = GASTOS.filter(function(g) { return g.periodo === periodo; }).map(function(g) { return g.parcela_id; });
  var sorted = PARCELAS.filter(function(p) { return usadas.indexOf(p.id) === -1; }).slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  select.innerHTML = sorted.map(function(p) { return '<md-select-option value="' + p.id + '">' + p.numero + '</md-select-option>'; }).join('');
  if (sorted.length === 0) {
    select.innerHTML = '<md-select-option value="" disabled selected>Todas las parcelas ya tienen gasto</md-select-option>';
    select.disabled = true;
  } else {
    select.disabled = false;
  }
  updateGastoConcepto();
}

function updateGastoConcepto() {
  var periodo = document.getElementById('gastoPeriodo').value || '';
  var select = document.getElementById('gastoParcela');
  var selectedValue = select.value;
  var parcela = PARCELAS.find(function(p) { return p.id === selectedValue; });
  var numero = parcela ? parcela.numero : '';
  var conceptoEl = document.getElementById('gastoConcepto');
  if (periodo && numero) {
    var parts = periodo.split('-');
    conceptoEl.value = 'GC_' + parts[1] + '_' + parts[0] + '_' + numero;
  } else {
    conceptoEl.value = '';
  }
}

function formParcelas(data) {
  var isEdit = !!data;
  openModal(isEdit ? 'Editar Parcela' : 'Agregar Parcela',
    '<form id="modalForm" data-table="parcelas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Número *</label><md-filled-text-field name="numero" placeholder="Ej: 1, 2A, 15" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.numero) + '"' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><label>Rol</label><md-outlined-text-field name="rol" placeholder="Rol de la propiedad" style="width:100%"' + (isEdit && data.rol ? ' value="' + escHtml(data.rol) + '"' : '') + '></md-outlined-text-field></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Metros² *</label><md-filled-text-field type="number" name="metros" min="0" placeholder="0" required style="width:100%"' + (isEdit ? ' value="' + data.metros + '"' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><label>Estado</label><md-filled-select name="estado" style="width:100%">' +
        '<md-select-option value="Habitada"' + (isEdit && data.estado === 'Habitada' ? ' selected' : '') + '>Habitada</md-select-option>' +
        '<md-select-option value="Desocupada"' + (isEdit && data.estado === 'Desocupada' ? ' selected' : '') + '>Desocupada</md-select-option>' +
        '<md-select-option value="En construcción"' + (isEdit && data.estado === 'En construcción' ? ' selected' : '') + '>En construcción</md-select-option>' +
      '</md-filled-select></div>' +
    '</div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formPropietarios(opt) {
  var isEdit = opt && typeof opt === 'object';
  var data = isEdit ? opt : null;
  var parcelaId = isEdit ? (data.parcela_id || null) : (opt || null);
  var isFromParcela = !!parcelaId;
  var parcelas = PARCELAS.map(function(p) {
    var sel = parcelaId === p.id ? ' selected' : '';
    return '<md-select-option value="' + p.id + '"' + sel + '>' + p.numero + '</md-select-option>';
  }).join('');
  openModal(isEdit ? 'Editar Propietario' : 'Agregar Propietario',
    '<form id="modalForm" data-table="propietarios" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><label>Nombre completo *</label><md-filled-text-field name="nombre_completo" placeholder="Juan Pérez" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre_completo) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>RUT</label><md-outlined-text-field name="rut" placeholder="12.345.678-9" style="width:100%"' + (isEdit && data.rut ? ' value="' + escHtml(data.rut) + '"' : '') + '></md-outlined-text-field></div>' +
      (isFromParcela
        ? '<input type="hidden" name="parcela_id" value="' + parcelaId + '"><div class="form-group"><label>Parcela</label><div style="padding:0.6rem 0.8rem;font-size:0.85rem;color:var(--text-2);background:var(--skeleton-1);border-radius:8px">' + (PARCELAS.find(function(p) { return p.id === parcelaId; }) || {}).numero + '</div></div>'
        : '<div class="form-group"><label>Parcela *</label><md-filled-select name="parcela_id" required style="width:100%">' + parcelas + '</md-filled-select></div>') +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Teléfono</label><md-outlined-text-field type="tel" name="telefono" placeholder="+56 9 1234 5678" style="width:100%"' + (isEdit && data.telefono ? ' value="' + escHtml(data.telefono) + '"' : '') + '></md-outlined-text-field></div>' +
      '<div class="form-group"><label>Email</label><md-outlined-text-field type="email" name="email" placeholder="correo@ejemplo.com" style="width:100%"' + (isEdit && data.email ? ' value="' + escHtml(data.email) + '"' : '') + '></md-outlined-text-field></div>' +
    '</div>' +
    '<div class="form-group"><label>Tipo</label><md-filled-select name="tipo" style="width:100%">' +
      '<md-select-option value="Propietario"' + (isEdit && data.tipo === 'Propietario' ? ' selected' : '') + '>Propietario</md-select-option>' +
      '<md-select-option value="Inquilino"' + (isEdit && data.tipo === 'Inquilino' ? ' selected' : '') + '>Inquilino</md-select-option>' +
      '<md-select-option value="Administrador"' + (isEdit && data.tipo === 'Administrador' ? ' selected' : '') + '>Administrador</md-select-option>' +
    '</md-filled-select></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formNoticias(data) {
  var isEdit = !!data;
  openModal(isEdit ? 'Editar Noticia' : 'Agregar Noticia',
    '<form id="modalForm" data-table="noticias" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><label>Título *</label><md-filled-text-field name="titulo" placeholder="Ej: Corte de agua programado" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Descripción *</label><md-filled-text-field textarea name="descripcion" placeholder="Detalle de la noticia para los residentes" required style="width:100%">' + (isEdit ? escHtml(data.descripcion) : '') + '</md-filled-text-field></div>' +
    '<div class="form-group"><label>Vigente hasta</label><md-outlined-text-field type="date" name="fecha_hasta" style="width:100%"' + (isEdit && data.fecha_hasta ? ' value="' + data.fecha_hasta + '"' : '') + '></md-outlined-text-field></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formFlujo(data) {
  var conceptos = CONFIG.conceptos_flujo || [];
  if (!conceptos.length) {
    showSnackbar('Primero debes configurar los conceptos en la pestaña Configuración.', 'warning');
    return;
  }
  var isEdit = !!data;
  var opts = conceptos.map(function(c) { return '<md-select-option value="' + c + '"' + (isEdit && data.concepto === c ? ' selected' : '') + '>' + c + '</md-select-option>'; }).join('');
  openModal(isEdit ? 'Editar Movimiento' : 'Agregar Movimiento',
    '<form id="modalForm" data-table="flujo" data-bucket="ingresos_egresos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Tipo *</label><md-filled-select name="tipo" required style="width:100%"><md-select-option value="Ingreso"' + (isEdit && data.tipo === 'Ingreso' ? ' selected' : '') + '>Ingreso</md-select-option><md-select-option value="Egreso"' + (isEdit && data.tipo === 'Egreso' ? ' selected' : '') + '>Egreso</md-select-option></md-filled-select></div>' +
      '<div class="form-group"><label>Fecha *</label><md-filled-text-field type="date" name="fecha" required style="width:100%"' + (isEdit ? ' value="' + data.fecha + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group"><label>Concepto *</label><md-filled-select name="concepto" required style="width:100%">' + opts + '</md-filled-select></div>' +
    '<div class="form-group"><label>Monto *</label><md-filled-text-field type="number" name="monto" min="0" placeholder="0" required style="width:100%"' + (isEdit ? ' value="' + data.monto + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Descripción</label><md-filled-text-field textarea name="descripcion" placeholder="Detalles del movimiento (opcional)" style="width:100%">' + (isEdit ? escHtml(data.descripcion || '') : '') + '</md-filled-text-field></div>' +
    '<div class="form-group"><label>Comprobante (foto)</label><input type="file" name="comprobante" accept="image/*"></div>' +
    (isEdit && data.comprobante ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.comprobante + '" target="_blank">ver</a></div>' : '') +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formDocumentos(data) {
  var isEdit = !!data;
  var cats = (CONFIG.categorias_documentos && CONFIG.categorias_documentos.length) ? CONFIG.categorias_documentos : ['Estatuto', 'Actas', 'Contratos', 'Seguros', 'Planos'];
  var catOpts = cats.map(function(c) { return '<md-select-option value="' + c + '"' + (isEdit && data.categoria === c ? ' selected' : '') + '>' + c + '</md-select-option>'; }).join('');
  openModal(isEdit ? 'Editar Documento' : 'Agregar Documento',
    '<form id="modalForm" data-table="documentos" data-bucket="documentos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><label>Nombre *</label><md-filled-text-field name="nombre" placeholder="Ej: Acta reunión marzo 2026" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Categoría *</label><md-filled-select name="categoria" required style="width:100%">' + catOpts + '</md-filled-select></div>' +
    '<div class="form-group"><label>Descripción</label><md-filled-text-field textarea name="descripcion" placeholder="Resumen del documento (opcional)" style="width:100%">' + (isEdit ? escHtml(data.descripcion || '') : '') + '</md-filled-text-field></div>' +
    '<div class="form-group"><label>Archivo</label><input type="file" name="archivo"></div>' +
    (isEdit && data.archivo ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.archivo + '" target="_blank">ver</a></div>' : '') +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formReclamos() {
  var parcelas = PARCELAS.map(function(p) { return '<md-select-option value="' + p.id + '">' + p.numero + '</md-select-option>'; }).join('');
  openModal('Agregar Reclamo/Sugerencia', '<form id="modalForm" data-table="reclamos" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Tipo *</label><md-filled-select name="tipo" required style="width:100%"><md-select-option value="Reclamo">Reclamo</md-select-option><md-select-option value="Sugerencia">Sugerencia</md-select-option></md-filled-select></div>' +
      '<div class="form-group"><label>Parcela</label><md-filled-select name="parcela_id" style="width:100%"><md-select-option value="">Anónimo</md-select-option>' + parcelas + '</md-filled-select></div>' +
    '</div>' +
    '<div class="form-group"><label>Asunto *</label><md-filled-text-field name="asunto" placeholder="Ej: Ruido excesivo, Fuga de agua" required style="width:100%"></md-filled-text-field></div>' +
    '<div class="form-group"><label>Descripción *</label><md-filled-text-field textarea name="descripcion" placeholder="Describa el problema o sugerencia con el mayor detalle posible" required style="width:100%"></md-filled-text-field></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">Guardar</md-filled-button>');
}

function formProveedores(data) {
  var isEdit = !!data;
  var rubros = CONFIG.rubros_proveedores && CONFIG.rubros_proveedores.length ? CONFIG.rubros_proveedores : ['Jardinería', 'Plomería', 'Electricidad', 'Albañilería', 'Pintura', 'Limpieza', 'Seguridad', 'Carpintería', 'Herrería', 'Tecnología', 'Otro'];
  var rubroOpts = rubros.map(function(r) { return '<md-select-option value="' + r + '"' + (isEdit && data.rubro === r ? ' selected' : '') + '>' + r + '</md-select-option>'; }).join('');
  openModal(isEdit ? 'Editar Proveedor' : 'Agregar Proveedor',
    '<form id="modalForm" data-table="proveedores" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Rubro *</label><md-filled-select name="rubro" required style="width:100%"><md-select-option value="">Seleccionar...</md-select-option>' + rubroOpts + '</md-filled-select></div>' +
      '<div class="form-group"><label>Nombre *</label><md-filled-text-field name="nombre" placeholder="Nombre del proveedor o empresa" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group"><label>Contacto *</label><md-filled-text-field name="contacto" placeholder="Nombre de la persona de contacto" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.contacto) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Teléfono</label><md-outlined-text-field type="tel" name="telefono" placeholder="+56 9 1234 5678" style="width:100%"' + (isEdit && data.telefono ? ' value="' + escHtml(data.telefono) + '"' : '') + '></md-outlined-text-field></div>' +
      '<div class="form-group"><label>Email</label><md-outlined-text-field type="email" name="email" placeholder="correo@ejemplo.com" style="width:100%"' + (isEdit && data.email ? ' value="' + escHtml(data.email) + '"' : '') + '></md-outlined-text-field></div>' +
    '</div>' +
    '<div class="form-group"><label>Web/Instagram</label><md-outlined-text-field name="web_instagram" placeholder="https://..." style="width:100%"' + (isEdit && data.web_instagram ? ' value="' + escHtml(data.web_instagram) + '"' : '') + '></md-outlined-text-field></div>' +
    '<div class="form-group"><label>Observaciones</label><md-filled-text-field textarea name="observaciones" placeholder="Notas adicionales sobre el proveedor (opcional)" style="width:100%">' + (isEdit ? escHtml(data.observaciones || '') : '') + '</md-filled-text-field></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formAsambleas(data) {
  if (PARCELAS.length === 0) {
    loadJson('PARCELAS').then(function() {
      if (PARCELAS.length === 0) {
        showSnackbar('Primero debes configurar las parcelas', 'warning');
        return;
      }
      formAsambleas(data);
    });
    return;
  }
  var isEdit = !!data;
  var parcelas = PARCELAS.map(function(p) {
    var selected = isEdit && data.asistentesIds && data.asistentesIds.indexOf(p.id) !== -1;
    return '<option value="' + p.id + '"' + (selected ? ' selected' : '') + '>' + p.numero + '</option>';
  }).join('');
  openModal(isEdit ? 'Editar Asamblea' : 'Agregar Asamblea',
    '<form id="modalForm" data-table="asambleas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Fecha *</label><md-filled-text-field type="date" name="fecha" required style="width:100%"' + (isEdit ? ' value="' + data.fecha + '"' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><label>Tipo *</label><md-filled-select name="tipo" required style="width:100%"><md-select-option value="Ordinaria"' + (isEdit && data.tipo === 'Ordinaria' ? ' selected' : '') + '>Ordinaria</md-select-option><md-select-option value="Extraordinaria"' + (isEdit && data.tipo === 'Extraordinaria' ? ' selected' : '') + '>Extraordinaria</md-select-option></md-filled-select></div>' +
    '</div>' +
    '<div class="form-group"><label>Temario *</label><md-filled-text-field textarea name="temario" placeholder="Puntos a tratar en la asamblea" required style="width:100%">' + (isEdit ? escHtml(data.temario) : '') + '</md-filled-text-field></div>' +
    '<div class="form-group"><label>Acuerdos</label><md-filled-text-field textarea name="acuerdos" placeholder="Decisiones tomadas (completar después de la asamblea)" style="width:100%">' + (isEdit ? escHtml(data.acuerdos || '') : '') + '</md-filled-text-field></div>' +
    '<div class="form-group"><label>Asistentes</label><div style="margin-bottom:0.3rem"><a href="#" onclick="toggleAllAsistentes(); return false" style="color:#2563eb;font-size:0.8rem">Seleccionar todas</a></div><select name="asistentes" multiple style="min-height:6rem;width:100%">' + parcelas + '</select></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formEncuestas(data) {
  var isEdit = !!data;
  var alternativasHtml = '';
  if (isEdit) {
    var ops = (data.alternativas && data.alternativas.length && !(data.alternativas.length === 1 && data.alternativas[0] === ''))
      ? data.alternativas : ['A favor', 'En contra'];
    alternativasHtml = '<div style="font-size:0.85rem;color:var(--text-muted);padding:0.5rem;background:var(--skeleton-1);border-radius:6px">Opciones: ' + ops.join(' / ') + ' (no editable al tener votos)</div>';
  } else {
    alternativasHtml =
      '<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.5rem">' +
        '<span style="margin:0;font-size:0.9rem">Con alternativas</span>' +
        '<md-switch id="encuestaModoAlt" onchange="toggleEncuestaAlternativas()"></md-switch>' +
      '</div>' +
      '<div id="encuestaAlternativas" style="display:none">' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><md-outlined-text-field class="encuesta-alt-input" placeholder="Opción 1" style="flex:1"></md-outlined-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:#b91c1c"><md-icon>close</md-icon></md-icon-button></div>' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><md-outlined-text-field class="encuesta-alt-input" placeholder="Opción 2" style="flex:1"></md-outlined-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:#b91c1c"><md-icon>close</md-icon></md-icon-button></div>' +
      '</div>' +
      '<md-filled-tonal-button id="btnAddAlt" onclick="addEncuestaAlt()" style="display:none"><md-icon slot="icon">add</md-icon>Alternativa</md-filled-tonal-button>' +
      '<div id="encuestaModoInfo" style="font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem">Modo simple: "A favor" / "En contra"</div>';
  }
  openModal(isEdit ? 'Editar Encuesta' : 'Nueva Encuesta',
    '<form id="modalForm" data-table="encuestas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><label>Título *</label><md-filled-text-field name="titulo" placeholder="Título de la propuesta" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Descripción</label><md-filled-text-field textarea name="descripcion" placeholder="Detalle de la propuesta (opcional)" style="width:100%">' + (isEdit ? escHtml(data.descripcion || '') : '') + '</md-filled-text-field></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Fecha de término</label><md-outlined-text-field type="date" name="fecha_termino" style="width:100%"' + (isEdit && data.fecha_termino ? ' value="' + data.fecha_termino + '"' : '') + '></md-outlined-text-field></div>' +
      '<div class="form-group"><label>Quorum (mín. votos)</label><md-outlined-text-field type="number" name="quorum" min="0" placeholder="Sin límite" style="width:100%"' + (isEdit && data.quorum ? ' value="' + data.quorum + '"' : '') + '></md-outlined-text-field></div>' +
    '</div>' +
    '<div class="form-group">' + alternativasHtml + '</div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Crear') + '</md-filled-button>');
}

function toggleEncuestaAlternativas() {
  var on = document.getElementById('encuestaModoAlt').selected;
  document.getElementById('encuestaAlternativas').style.display = on ? '' : 'none';
  document.getElementById('btnAddAlt').style.display = on ? '' : 'none';
  document.getElementById('encuestaModoInfo').textContent = on ? 'Alternativas personalizadas' : 'Modo simple: "A favor" / "En contra"';
}

function addEncuestaAlt() {
  var container = document.getElementById('encuestaAlternativas');
  var count = container.querySelectorAll('.encuesta-alt-input').length + 1;
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:0.4rem;align-items:center';
  div.innerHTML = '<md-outlined-text-field class="encuesta-alt-input" placeholder="Opción ' + count + '" style="flex:1"></md-outlined-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:#b91c1c"><md-icon>close</md-icon></md-icon-button>';
  container.appendChild(div);
  div.querySelector('md-outlined-text-field').focus();
}

function removeEncuestaAlt(btn) {
  btn.parentElement.remove();
}

document.getElementById('mainDialog').addEventListener('cancel', function(e) {
  e.preventDefault();
  confirmCloseModal();
});

function toggleAllAsistentes() {
  var sel = document.querySelector('[name="asistentes"]');
  var allSelected = Array.from(sel.options).every(function(o) { return o.selected; });
  Array.from(sel.options).forEach(function(o) { o.selected = !allSelected; });
}
