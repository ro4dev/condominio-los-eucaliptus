var _scrimClosePatched = false;
function patchScrimClose() {
  if (_scrimClosePatched) return;
  var ctor = customElements.get('md-dialog');
  if (!ctor) return;
  var proto = ctor.prototype;
  if (typeof proto.handleDialogClick !== 'function') return;
  var origCancel = proto.handleCancel;
  proto.handleDialogClick = function () { this.nextClickIsFromContent = false; };
  proto.handleCancel = function (e) {
    if (e.target !== this.dialog) return;
    if (typeof origCancel === 'function' && this.escapePressedWithoutCancel) {
      return origCancel.call(this, e);
    }
    e.preventDefault();
  };
  _scrimClosePatched = true;
}

function openModal(title, html, footerHtml) {
  patchScrimClose();
  var dialog = document.getElementById('mainDialog');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalFooter').innerHTML = footerHtml !== undefined ? footerHtml : '<md-text-button onclick="closeModal()">Cerrar</md-text-button>';
  if (!dialog.open) {
    dialog.show();
  }
}

function closeModal() {
  closeDatePicker();
  document.getElementById('mainDialog').close();
  hideLoading();
}

function showConfirm(message, onConfirm, confirmText) {
  patchScrimClose();
  confirmText = confirmText || 'Eliminar';
  document.getElementById('modalTitle').textContent = 'Confirmar';
  document.getElementById('modalBody').innerHTML = '<div style="line-height:1.5">' + message + '</div>';
  document.getElementById('modalFooter').innerHTML =
    '<md-text-button onclick="closeModal()">Cancelar</md-text-button>' +
    '<md-filled-button onclick="confirmAction()" style="--md-filled-button-container-color:var(--md-sys-color-error)">' + confirmText + '</md-filled-button>';
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
  closeModal();
}

var MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
var DIAS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
var _datePickerInput = null;
var _dpYear = null;
var _dpMonth = null;

function dateFieldHtml(name, label, isoValue) {
  var val = isoValue ? formatDate(isoValue) : '';
  return '<div class="form-group"><div class="m3-date-group">' +
    '<input type="text" class="m3-date" placeholder=" " required inputmode="none" value="' + val + '"' +
    (isoValue ? ' data-iso="' + isoValue + '"' : '') +
    ' onkeydown="if(event.key.length===1)return false" onpaste="return false" oninput="dateFieldTyped(this)" oninvalid="dateFieldInvalid(event)" onclick="openDatePicker(this)">' +
    '<label class="m3-date-label">' + label + '</label>' +
    '<input type="hidden" name="' + name + '"' + (isoValue ? ' value="' + isoValue + '"' : '') + '>' +
    '<div class="m3-date-error"></div>' +
    '<md-icon class="m3-date-icon" aria-hidden="true">calendar_month</md-icon>' +
  '</div></div>';
}

function dateFieldInvalid(e) {
  e.preventDefault();
  var group = e.target.closest('.m3-date-group');
  if (!group) return;
  group.classList.add('m3-error');
  var msg = group.querySelector('.m3-date-error');
  if (msg) msg.textContent = 'Campo requerido';
}

function dateFieldOk(e) {
  var el = e.target || e;
  var group = el.closest ? el.closest('.m3-date-group') : null;
  if (group) group.classList.remove('m3-error');
}

function dateFieldTyped(el) {
  var iso = el.getAttribute('data-iso');
  var expected = iso ? formatDate(iso) : '';
  if (el.value !== expected) el.value = expected;
  dateFieldOk(el);
}

function dateISO(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function openDatePicker(inputEl) {
  _datePickerInput = inputEl;
  var iso = inputEl.getAttribute('data-iso') || '';
  var base = iso ? new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) : new Date();
  _dpYear = base.getFullYear();
  _dpMonth = base.getMonth();
  renderDatePicker();
  var dlg = document.getElementById('datePickerDialog');
  var rect = inputEl.getBoundingClientRect();
  var estH = 340;
  if (rect.bottom + estH > window.innerHeight - 8) {
    dlg.style.top = Math.max(8, rect.top - estH) + 'px';
  } else {
    dlg.style.top = (rect.bottom + 4) + 'px';
  }
  var left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - 308));
  dlg.style.left = left + 'px';
  dlg.addEventListener('close', datePickerCleanup);
  document.addEventListener('scroll', closeDatePicker, true);
  document.addEventListener('click', datePickerBackdrop, true);
  document.addEventListener('keydown', datePickerKey);
  dlg.showModal();
}

function closeDatePicker() {
  var dlg = document.getElementById('datePickerDialog');
  if (dlg.open) dlg.close();
}

function datePickerBackdrop(e) {
  var dlg = document.getElementById('datePickerDialog');
  if (e.target === dlg) closeDatePicker();
}

function datePickerKey(e) {
  if (e.key === 'Escape') closeDatePicker();
}

function datePickerCleanup() {
  var dlg = document.getElementById('datePickerDialog');
  dlg.removeEventListener('close', datePickerCleanup);
  document.removeEventListener('scroll', closeDatePicker, true);
  document.removeEventListener('click', datePickerBackdrop, true);
  document.removeEventListener('keydown', datePickerKey);
}

function renderDatePicker() {
  var todayISO = dateISO(new Date());
  var selectedISO = _datePickerInput ? _datePickerInput.getAttribute('data-iso') || '' : '';
  var startWeekday = (new Date(_dpYear, _dpMonth, 1).getDay() + 6) % 7;
  var daysInMonth = new Date(_dpYear, _dpMonth + 1, 0).getDate();
  var cells = [];
  for (var i = 0; i < 42; i++) {
    var day = i - startWeekday + 1;
    var inMonth = day >= 1 && day <= daysInMonth;
    var isoStr = dateISO(new Date(_dpYear, _dpMonth, day));
    var cls = 'date-picker-day';
    if (!inMonth) cls += ' other';
    if (isoStr === selectedISO) cls += ' selected';
    if (isoStr === todayISO) cls += ' today';
    cells.push('<button type="button" class="' + cls + '" data-date="' + isoStr + '">' + new Date(_dpYear, _dpMonth, day).getDate() + '</button>');
  }
  document.getElementById('datePickerBody').innerHTML =
    '<div class="date-picker-header">' +
      '<md-icon-button onclick="datePickerPrevMonth()"><md-icon>chevron_left</md-icon></md-icon-button>' +
      '<span class="date-picker-title">' + MESES_ES[_dpMonth] + ' ' + _dpYear + '</span>' +
      '<md-icon-button onclick="datePickerNextMonth()"><md-icon>chevron_right</md-icon></md-icon-button>' +
    '</div>' +
    '<div class="date-picker-weekdays">' + DIAS_ES.map(function(d) { return '<span>' + d + '</span>'; }).join('') + '</div>' +
    '<div class="date-picker-grid" onclick="datePickerClick(event)">' + cells.join('') + '</div>';
}

function datePickerPrevMonth() {
  _dpMonth--;
  if (_dpMonth < 0) { _dpMonth = 11; _dpYear--; }
  renderDatePicker();
}

function datePickerNextMonth() {
  _dpMonth++;
  if (_dpMonth > 11) { _dpMonth = 0; _dpYear++; }
  renderDatePicker();
}

function datePickerClick(e) {
  var btn = e.target.closest('.date-picker-day');
  if (!btn) return;
  pickDate(btn.getAttribute('data-date'));
}

function pickDate(isoStr) {
  var input = _datePickerInput;
  if (input) {
    input.value = formatDate(isoStr);
    input.setAttribute('data-iso', isoStr);
    var hidden = input.closest('.m3-date-group').querySelector('input[type="hidden"]');
    if (hidden) hidden.value = isoStr;
    dateFieldOk(input);
  }
  closeDatePicker();
}

function handleForm(e) {
  e.preventDefault();
  var form = e.target;
  var submitBtn = document.querySelector('#modalFooter [type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }
  showLoading();
  var data = {};
  form.querySelectorAll('input[type="hidden"]').forEach(function(inp) { if (inp.name) data[inp.name] = inp.value; });
  form.querySelectorAll('input:not([type="file"]):not([type="hidden"]), textarea, select').forEach(function(el) { if (el.name) data[el.name] = el.value; });
  form.querySelectorAll('md-filled-text-field').forEach(function(el) { if (el.name) data[el.name] = el.value; });
  form.querySelectorAll('md-filled-select').forEach(function(el) { if (el.name) data[el.name] = el.value; });
  form.querySelectorAll('input[type="file"]').forEach(function(inp) {
    if (inp.files.length === 0) delete data[inp.name];
  });
  var asistentesChips = document.getElementById('asistentesChips');
  if (asistentesChips) {
    data.asistentes = Array.from(asistentesChips.querySelectorAll('md-filter-chip[selected]')).map(function(c) { return c.getAttribute('value'); }).join(', ');
  }

  var table = form.dataset.table;
  var isEdit = !!data.id;
  var autoDateTables = ['noticias', 'documentos'];
  if (autoDateTables.indexOf(table) !== -1 && !data.fecha) {
    data.fecha = new Date().toISOString().slice(0, 10);
  }
  if (table === 'flujo' && currentUser && !data.registrado_por) {
    data.registrado_por = currentUser.email;
  }
  if (table === 'publicaciones' && !isEdit) {
    data.usuario = currentUser ? currentUser.email : 'anónimo';
  }
  if (table === 'publicaciones' && (data.precio === '' || data.precio === undefined || data.precio === null)) {
    delete data.precio;
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
    if (DEMO_MODE) {
      filePromise = fileToBlobURL(fileInput.files[0]);
    } else {
      var bucket = form.dataset.bucket || 'gastos_comunes';
      var folder = '';
      if (table === 'gastos' && data.periodo) {
        folder = data.periodo;
      }
      else if (table === 'flujo' && data.fecha && data.tipo) folder = data.fecha.slice(0, 7) + '-' + data.tipo;
      else if (table === 'documentos' && data.categoria) folder = data.categoria;
      filePromise = supabaseUpload(fileInput.files[0], bucket, folder);
    }
  }

  function auditSave() {
    logAudit(table, isEdit ? 'UPDATE' : 'INSERT', data);
  }

  function afterSave() {
    hideLoading();
    auditSave();
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
    if (!DEMO_MODE && fileInput && fileInput.files.length > 0 && !fileUrl) {
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
          if (!isEdit && result[0]) data.id = result[0].id;
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
            if (!isEdit && result[0]) data.id = result[0].id;
            auditSave();
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
            if (!isEdit && result[0]) data.id = result[0].id;
            afterSave();
          } else {
            submitError();
          }
        });
      }
    }
  });
}

function fileToBlobURL(file) {
  return new Promise(function(resolve) {
    function toURL(blob) {
      resolve(URL.createObjectURL(blob));
    }
    if (typeof imageCompression !== 'undefined' && file.type && file.type.indexOf('image/') === 0 && file.size > 500 * 1024) {
      imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1920, useWebWorker: true })
        .then(toURL)
        .catch(function() { toURL(file); });
    } else {
      toURL(file);
    }
  });
}

function tableToArray(table) {
  var map = {
    gastos: 'GASTOS',
    reclamos: 'RECLAMOS',
    noticias: 'NOTICIAS',
    flujo: 'FLUJO',
    documentos: 'DOCUMENTOS',
    proveedores: 'PROVEEDORES',
    asambleas: 'ASAMBLEAS',
    encuestas: 'ENCUESTAS',
    parcelas: 'PARCELAS',
    propietarios: 'PROPIETARIOS',
    publicaciones: 'PUBLICACIONES'
  };
  return map[table] || null;
}

function getCurrentTab() {
  var active = document.querySelector('.tab-content.active');
  if (!active) {
    return 'finanzas';
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
    return '<md-select-option value="' + p.id + '"' + sel + '><span slot="headline">' + p.numero + '</span></md-select-option>';
  }).join('');
  var meses = [];
  var now = new Date();
  for (var i = -6; i <= 6; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    var val = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    var label = d.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
    var sel = isEdit && data.periodo === val ? ' selected' : '';
    meses.push('<md-select-option value="' + val + '"' + sel + '><span slot="headline">' + label + '</span></md-select-option>');
  }
  openModal(isEdit ? 'Editar Gasto' : 'Agregar Gasto', '<form id="modalForm" data-table="gastos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<input type="hidden" name="concepto" id="gastoConcepto">' +
    '<div class="form-group"><md-filled-select label="Periodo" name="periodo" required id="gastoPeriodo" style="width:100%">' + meses.join('') + '</md-filled-select></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-select label="Parcela" name="parcela_id" required id="gastoParcela" style="width:100%">' + parcelas + '</md-filled-select></div>' +
      '<div class="form-group"><md-filled-text-field label="Monto" type="number" name="monto" min="0" placeholder="Ej: 0" required style="width:100%"' + (isEdit ? ' value="' + data.monto + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalles del gasto..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><div style="display:flex;align-items:center;justify-content:space-between;gap:1rem">' +
      '<label for="gastoPagado" style="margin:0">Cuota pagada</label>' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
        '<md-switch id="gastoPagado"' + (isEdit && data.pagado === 'Sí' ? ' selected' : '') + ' onchange="syncGastoPagado()"></md-switch>' +
        '<input type="hidden" name="pagado" id="gastoPagadoHidden" value="' + (isEdit && data.pagado === 'Sí' ? 'Sí' : 'No') + '">' +
      '</div>' +
    '</div></div>' +
    '<div class="form-group"><label>Comprobante (foto)</label>' +
      '<div class="comprobante-row">' +
        '<input type="file" name="archivo" accept="image/*">' +
        (isEdit && data.archivo ? '<a href="' + data.archivo + '" target="_blank" title="Ver comprobante" style="text-decoration:none;flex-shrink:0"><md-icon-button style="color:var(--md-sys-color-primary)"><md-icon>receipt</md-icon></md-icon-button></a>' : '') +
      '</div>' +
    '</div>' +
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
  select.innerHTML = sorted.map(function(p) { return '<md-select-option value="' + p.id + '"><span slot="headline">' + p.numero + '</span></md-select-option>'; }).join('');
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

function syncGastoPagado() {
  var sw = document.getElementById('gastoPagado');
  document.getElementById('gastoPagadoHidden').value = sw.selected ? 'Sí' : 'No';
}

function formParcelas(data) {
  var isEdit = !!data;
  openModal(isEdit ? 'Editar Parcela' : 'Agregar Parcela',
    '<form id="modalForm" data-table="parcelas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-text-field label="Número" name="numero" placeholder="Ej: 1, 2A, 15" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.numero) + '" disabled' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><md-filled-text-field label="Rol" name="rol" placeholder="Ej: Rol de la propiedad" style="width:100%"' + (isEdit && data.rol ? ' value="' + escHtml(data.rol) + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-text-field label="Metros²" type="number" name="metros" min="0" placeholder="Ej: 0" style="width:100%"' + (isEdit ? ' value="' + data.metros + '"' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><md-filled-select label="Estado" name="estado" style="width:100%">' +
        '<md-select-option value="Habitada"' + (isEdit && data.estado === 'Habitada' ? ' selected' : '') + '><span slot="headline">Habitada</span></md-select-option>' +
        '<md-select-option value="Desocupada"' + (isEdit && data.estado === 'Desocupada' ? ' selected' : '') + '><span slot="headline">Desocupada</span></md-select-option>' +
        '<md-select-option value="En construcción"' + (isEdit && data.estado === 'En construcción' ? ' selected' : '') + '><span slot="headline">En construcción</span></md-select-option>' +
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
    return '<md-select-option value="' + p.id + '"' + sel + '><span slot="headline">' + p.numero + '</span></md-select-option>';
  }).join('');
  openModal(isEdit ? 'Editar Propietario' : 'Agregar Propietario',
    '<form id="modalForm" data-table="propietarios" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><md-filled-text-field label="Nombre completo" name="nombre_completo" placeholder="Ej: Juan Pérez" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre_completo) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-text-field label="RUT" name="rut" placeholder="Ej: 12.345.678-9" required style="width:100%"' + (isEdit && data.rut ? ' value="' + escHtml(data.rut) + '"' : '') + '></md-filled-text-field></div>' +
      (isFromParcela
        ? '<input type="hidden" name="parcela_id" value="' + parcelaId + '"><div class="form-group"><md-filled-select label="Parcela" disabled style="width:100%"><md-select-option value="' + parcelaId + '" selected><span slot="headline">' + (PARCELAS.find(function(p) { return p.id === parcelaId; }) || {}).numero + '</span></md-select-option></md-filled-select></div>'
        : '<div class="form-group"><md-filled-select label="Parcela" name="parcela_id" required style="width:100%">' + parcelas + '</md-filled-select></div>') +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-text-field label="Teléfono" type="tel" name="telefono" placeholder="Ej: +56 9 1234 5678" style="width:100%"' + (isEdit && data.telefono ? ' value="' + escHtml(data.telefono) + '"' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><md-filled-text-field label="Email" type="email" name="email" placeholder="Ej: correo@ejemplo.com" required style="width:100%"' + (isEdit && data.email ? ' value="' + escHtml(data.email) + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-select label="Tipo" name="tipo" style="width:100%">' +
      '<md-select-option value="Propietario"' + (isEdit && data.tipo === 'Propietario' ? ' selected' : '') + '><span slot="headline">Propietario</span></md-select-option>' +
      '<md-select-option value="Inquilino"' + (isEdit && data.tipo === 'Inquilino' ? ' selected' : '') + '><span slot="headline">Inquilino</span></md-select-option>' +
      '<md-select-option value="Administrador"' + (isEdit && data.tipo === 'Administrador' ? ' selected' : '') + '><span slot="headline">Administrador</span></md-select-option>' +
    '</md-filled-select></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formNoticias(data) {
  var isEdit = !!data;
  openModal(isEdit ? 'Editar Noticia' : 'Agregar Noticia',
    '<form id="modalForm" data-table="noticias" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row" style="grid-template-columns:1fr 1fr">' +
    '<div class="form-group"><md-filled-text-field label="Título" name="titulo" placeholder="Ej: Corte de agua programado" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></md-filled-text-field></div>' +
    dateFieldHtml('fecha_hasta', 'Vigente hasta*', isEdit ? data.fecha_hasta : '') +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalle de la noticia..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion) + '"' : '') + '></md-filled-text-field></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formFlujo(data) {
  var isEdit = !!data;
  var conceptos = (CONFIG.conceptos_flujo || []).filter(function(c) { return c !== 'Cuotas' && c !== 'Fondo reserva'; });
  if (!conceptos.length) {
    showSnackbar('Primero debes configurar los conceptos en la pestaña Configuración.', 'warning');
    return;
  }
  if (isEdit && data.concepto && conceptos.indexOf(data.concepto) === -1) {
    conceptos.push(data.concepto);
  }
  var opts = conceptos.map(function(c) { return '<md-select-option value="' + c + '"' + (isEdit && data.concepto === c ? ' selected' : '') + '><span slot="headline">' + c + '</span></md-select-option>'; }).join('');
  openModal(isEdit ? 'Editar Movimiento' : 'Agregar Movimiento',
    '<form id="modalForm" data-table="flujo" data-bucket="ingresos_egresos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-select label="Tipo" name="tipo" required style="width:100%"><md-select-option value="Ingreso"' + (isEdit && data.tipo === 'Ingreso' ? ' selected' : '') + '><span slot="headline">Ingreso</span></md-select-option><md-select-option value="Egreso"' + (isEdit && data.tipo === 'Egreso' ? ' selected' : '') + '><span slot="headline">Egreso</span></md-select-option></md-filled-select></div>' +
      dateFieldHtml('fecha', 'Fecha*', isEdit ? data.fecha : '') +
    '</div>' +
    '<div class="form-group"><md-filled-select label="Concepto" name="concepto" required style="width:100%">' + opts + '</md-filled-select></div>' +
    '<div class="form-group"><md-filled-text-field label="Monto" type="number" name="monto" min="0" placeholder="Ej: 0" required style="width:100%"' + (isEdit ? ' value="' + data.monto + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalles del movimiento..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Comprobante (foto)</label>' +
      '<div class="comprobante-row">' +
        '<input type="file" name="comprobante" accept="image/*">' +
        (isEdit && data.comprobante ? '<a href="' + data.comprobante + '" target="_blank" title="Ver comprobante" style="text-decoration:none;flex-shrink:0"><md-icon-button style="color:var(--md-sys-color-primary)"><md-icon>receipt</md-icon></md-icon-button></a>' : '') +
      '</div>' +
    '</div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formDocumentos(data) {
  var isEdit = !!data;
  var cats = (CONFIG.categorias_documentos && CONFIG.categorias_documentos.length) ? CONFIG.categorias_documentos : ['Estatuto', 'Actas', 'Contratos', 'Seguros', 'Planos'];
  var catOpts = cats.map(function(c) { return '<md-select-option value="' + c + '"' + (isEdit && data.categoria === c ? ' selected' : '') + '><span slot="headline">' + c + '</span></md-select-option>'; }).join('');
  openModal(isEdit ? 'Editar Documento' : 'Agregar Documento',
    '<form id="modalForm" data-table="documentos" data-bucket="documentos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row" style="grid-template-columns:2fr 1fr">' +
    '<div class="form-group"><md-filled-text-field label="Nombre" name="nombre" placeholder="Ej: Acta reunión marzo 2026" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><md-filled-select label="Categoría" name="categoria" required style="width:100%">' + catOpts + '</md-filled-select></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Resumen del documento..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Archivo</label><input type="file" name="archivo"></div>' +
    (isEdit && data.archivo ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.archivo + '" target="_blank">ver</a></div>' : '') +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formReclamos() {
  var parcelas = PARCELAS.map(function(p) { return '<md-select-option value="' + p.id + '"><span slot="headline">' + p.numero + '</span></md-select-option>'; }).join('');
  openModal('Agregar Comentario', '<form id="modalForm" data-table="reclamos" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-select label="Tipo" name="tipo" required style="width:100%"><md-select-option value="Reclamo"><span slot="headline">Reclamo</span></md-select-option><md-select-option value="Sugerencia"><span slot="headline">Sugerencia</span></md-select-option></md-filled-select></div>' +
      '<div class="form-group"><md-filled-select label="Parcela" name="parcela_id" required style="width:100%">' + parcelas + '</md-filled-select></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Asunto" name="asunto" placeholder="Ej: Ruido excesivo, Fuga de agua" required style="width:100%"></md-filled-text-field></div>' +
    '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Describa el problema o sugerencia..." type="textarea" rows="3" required style="width:100%"></md-filled-text-field></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">Guardar</md-filled-button>');
}

function formPublicaciones(data) {
  var isEdit = !!data;
  if (PARCELAS.length === 0) {
    loadJson('PARCELAS').then(function() { formPublicaciones(data); });
    return;
  }
  var sorted = PARCELAS.slice().sort(function(a, b) {
    var numA = parseInt((a['numero'] || '').replace(/\D/g, '')) || 0;
    var numB = parseInt((b['numero'] || '').replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  var parcelas = '<md-select-option value=""><span slot="headline">Sin especificar</span></md-select-option>' + sorted.map(function(p) {
    var sel = isEdit && data.parcela_id === p.id ? ' selected' : '';
    return '<md-select-option value="' + p.id + '"' + sel + '><span slot="headline">' + p.numero + '</span></md-select-option>';
  }).join('');
  var estados = [
    { v: 'Disponible', sel: !isEdit || data.estado === 'Disponible' },
    { v: 'Vendido', sel: isEdit && data.estado === 'Vendido' }
  ];
  openModal(isEdit ? 'Editar Publicación' : 'Publicar Venta',
    '<form id="modalForm" data-table="publicaciones" data-bucket="publicaciones" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-text-field label="Título" name="titulo" placeholder="Ej: Mesa de comedor en venta" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-select label="Categoría" name="categoria" required style="width:100%"><md-select-option value="Producto"' + (isEdit && data.categoria === 'Producto' ? ' selected' : '') + '><span slot="headline">Producto</span></md-select-option><md-select-option value="Servicio"' + (isEdit && data.categoria === 'Servicio' ? ' selected' : '') + '><span slot="headline">Servicio</span></md-select-option></md-filled-select></div>' +
      '<div class="form-group"><md-filled-text-field label="Precio ($)" type="number" name="precio" min="0" placeholder="Ej: 45000" style="width:100%"' + (isEdit && data.precio !== null && data.precio !== undefined ? ' value="' + data.precio + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalles del producto o servicio..." type="textarea" rows="3" style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-select label="Parcela" name="parcela_id" style="width:100%">' + parcelas + '</md-filled-select></div>' +
      '<div class="form-group"><md-filled-select label="Estado" name="estado" style="width:100%">' + estados.map(function(e) { return '<md-select-option value="' + e.v + '"' + (e.sel ? ' selected' : '') + '><span slot="headline">' + e.v + '</span></md-select-option>'; }).join('') + '</md-filled-select></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Contacto" name="contacto" placeholder="Ej: Parcela 12 - llamar por la tarde" style="width:100%"' + (isEdit ? ' value="' + escHtml(data.contacto || '') + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Foto (opcional)</label>' +
      '<div class="comprobante-row">' +
        '<input type="file" name="foto" accept="image/*">' +
        (isEdit && data.foto ? '<a href="' + data.foto + '" target="_blank" title="Ver foto" style="text-decoration:none;flex-shrink:0"><md-icon-button style="color:var(--md-sys-color-primary)"><md-icon>image</md-icon></md-icon-button></a>' : '') +
      '</div>' +
    '</div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Publicar') + '</md-filled-button>');
}

function formProveedores(data) {
  var isEdit = !!data;
  var rubros = CONFIG.rubros_proveedores && CONFIG.rubros_proveedores.length ? CONFIG.rubros_proveedores : ['Jardinería', 'Plomería', 'Electricidad', 'Albañilería', 'Pintura', 'Limpieza', 'Seguridad', 'Carpintería', 'Herrería', 'Tecnología', 'Otro'];
  var rubroOpts = rubros.map(function(r) { return '<md-select-option value="' + r + '"' + (isEdit && data.rubro === r ? ' selected' : '') + '><span slot="headline">' + r + '</span></md-select-option>'; }).join('');
  openModal(isEdit ? 'Editar Proveedor' : 'Agregar Proveedor',
    '<form id="modalForm" data-table="proveedores" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-select label="Rubro" name="rubro" required style="width:100%"><md-select-option value=""><span slot="headline">Seleccionar...</span></md-select-option>' + rubroOpts + '</md-filled-select></div>' +
      '<div class="form-group"><md-filled-text-field label="Nombre" name="nombre" placeholder="Ej: Nombre del proveedor o empresa" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Contacto" name="contacto" placeholder="Ej: Nombre de la persona de contacto" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.contacto) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><md-filled-text-field label="Teléfono" type="tel" name="telefono" placeholder="Ej: +56 9 1234 5678" style="width:100%"' + (isEdit && data.telefono ? ' value="' + escHtml(data.telefono) + '"' : '') + '></md-filled-text-field></div>' +
      '<div class="form-group"><md-filled-text-field label="Email" type="email" name="email" placeholder="Ej: correo@ejemplo.com" style="width:100%"' + (isEdit && data.email ? ' value="' + escHtml(data.email) + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Web/Instagram" name="web_instagram" placeholder="Ej: https://..." style="width:100%"' + (isEdit && data.web_instagram ? ' value="' + escHtml(data.web_instagram) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><md-filled-text-field label="Observaciones" name="observaciones" placeholder="Ej: Notas adicionales sobre el proveedor..." type="textarea" rows="3" style="width:100%"' + (isEdit ? ' value="' + escHtml(data.observaciones || '') + '"' : '') + '></md-filled-text-field></div>' +
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
    return '<md-filter-chip label="' + p.numero + '" value="' + p.id + '"' + (selected ? ' selected' : '') + ' onclick="toggleChip(this)"></md-filter-chip>';
  }).join('');
  openModal(isEdit ? 'Editar Asamblea' : 'Agregar Asamblea',
    '<form id="modalForm" data-table="asambleas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      dateFieldHtml('fecha', 'Fecha*', isEdit ? data.fecha : '') +
      '<div class="form-group"><md-filled-select label="Tipo" name="tipo" required style="width:100%"><md-select-option value="Ordinaria"' + (isEdit && data.tipo === 'Ordinaria' ? ' selected' : '') + '><span slot="headline">Ordinaria</span></md-select-option><md-select-option value="Extraordinaria"' + (isEdit && data.tipo === 'Extraordinaria' ? ' selected' : '') + '><span slot="headline">Extraordinaria</span></md-select-option></md-filled-select></div>' +
    '</div>' +
    '<div class="form-group"><md-filled-text-field label="Temario" name="temario" placeholder="Ej: Puntos a tratar en la asamblea" type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.temario) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><md-filled-text-field label="Acuerdos" name="acuerdos" placeholder="Ej: Decisiones tomadas..." type="textarea" rows="3" style="width:100%"' + (isEdit ? ' value="' + escHtml(data.acuerdos || '') + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><label>Asistentes</label><div style="margin-bottom:0.3rem"><a href="#" onclick="toggleAllAsistentes(); return false" style="color:var(--md-sys-color-primary);font-size:0.8rem">Seleccionar todas</a></div><div id="asistentesChips" class="filter-chips">' + parcelas + '</div></div>' +
  '</form>',
  '<md-text-button onclick="closeModal()">Cancelar</md-text-button><md-filled-button type="submit" form="modalForm">' + (isEdit ? 'Actualizar' : 'Guardar') + '</md-filled-button>');
}

function formEncuestas(data) {
  var isEdit = !!data;
  var alternativasHtml = '';
  if (isEdit) {
    var ops = (data.alternativas && data.alternativas.length && !(data.alternativas.length === 1 && data.alternativas[0] === ''))
      ? data.alternativas : ['A favor', 'En contra'];
    alternativasHtml = '<div style="font-size:0.85rem;color:var(--text-muted);padding:0.5rem;background:var(--skeleton-1);border-radius:var(--md-sys-shape-corner-small)">Opciones:<br>' + ops.map(function(op) { return '- ' + op; }).join('<br>') + '<br><span style="font-size:0.75rem">(no editable al tener votos)</span></div>';
  } else {
    alternativasHtml =
      '<div style="display:flex;align-items:center;gap:0.8rem;margin-bottom:0.5rem">' +
        '<span style="margin:0;font-size:0.9rem">Con alternativas</span>' +
        '<md-switch id="encuestaModoAlt" onchange="toggleEncuestaAlternativas()"></md-switch>' +
      '</div>' +
      '<div id="encuestaAlternativas" style="display:none">' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><md-filled-text-field class="encuesta-alt-input" placeholder="Ej: Opción 1" style="flex:1"></md-filled-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:var(--md-sys-color-error)"><md-icon>close</md-icon></md-icon-button></div>' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><md-filled-text-field class="encuesta-alt-input" placeholder="Ej: Opción 2" style="flex:1"></md-filled-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:var(--md-sys-color-error)"><md-icon>close</md-icon></md-icon-button></div>' +
      '</div>' +
      '<md-filled-tonal-button id="btnAddAlt" onclick="addEncuestaAlt()" style="display:none"><md-icon slot="icon">add</md-icon>Alternativa</md-filled-tonal-button>' +
      '<div id="encuestaModoInfo" style="font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem">Modo simple: "A favor" / "En contra"</div>';
  }
  openModal(isEdit ? 'Editar Encuesta' : 'Agregar Encuesta',
    '<form id="modalForm" data-table="encuestas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><md-filled-text-field label="Título" name="titulo" placeholder="Ej: Título de la propuesta" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-group"><md-filled-text-field label="Descripción" name="descripcion" placeholder="Ej: Detalle de la propuesta..." type="textarea" rows="3" required style="width:100%"' + (isEdit ? ' value="' + escHtml(data.descripcion || '') + '"' : '') + '></md-filled-text-field></div>' +
    '<div class="form-row">' +
      dateFieldHtml('fecha_termino', 'Fecha de término*', isEdit ? data.fecha_termino : '') +
      '<div class="form-group"><md-filled-text-field label="Quorum (mín. votos)" type="number" name="quorum" min="0" placeholder="Ej: Sin límite" style="width:100%"' + (isEdit && data.quorum ? ' value="' + data.quorum + '"' : '') + '></md-filled-text-field></div>' +
    '</div>' +
    '<div class="form-group" style="margin-top:1rem">' + alternativasHtml + '</div>' +
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
  div.innerHTML = '<md-filled-text-field class="encuesta-alt-input" placeholder="Ej: Opción ' + count + '" style="flex:1"></md-filled-text-field><md-icon-button onclick="removeEncuestaAlt(this)" style="color:var(--md-sys-color-error)"><md-icon>close</md-icon></md-icon-button>';
  container.appendChild(div);
  div.querySelector('md-filled-text-field').focus();
}

function removeEncuestaAlt(btn) {
  btn.parentElement.remove();
}

document.getElementById('mainDialog').addEventListener('cancel', function(e) {
  e.preventDefault();
  confirmCloseModal();
});

function toggleAllAsistentes() {
  var chips = document.querySelectorAll('#asistentesChips md-filter-chip');
  var allSelected = Array.from(chips).every(function(c) { return c.hasAttribute('selected'); });
  chips.forEach(function(c) {
    if (allSelected) c.removeAttribute('selected');
    else c.setAttribute('selected', '');
  });
}

function toggleChip(chip) {
  if (chip.hasAttribute('selected')) chip.removeAttribute('selected');
  else chip.setAttribute('selected', '');
}
