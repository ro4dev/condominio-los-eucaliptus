function openModal(title, html) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  hideLoading();
}

function showConfirm(message, onConfirm, confirmText) {
  confirmText = confirmText || 'Eliminar';
  document.getElementById('modalTitle').textContent = 'Confirmar';
  document.getElementById('modalBody').innerHTML =
    '<div style="margin-bottom:1rem;line-height:1.5">' + message + '</div>' +
    '<div class="form-actions" style="display:flex;gap:0.5rem">' +
      '<button type="button" class="btn btn-secondary" onclick="closeModal()" style="flex:1">Cancelar</button>' +
      '<button type="button" class="btn btn-primary" onclick="confirmAction()" style="flex:1;background:#b91c1c;border-color:#b91c1c">' + confirmText + '</button>' +
    '</div>';
  document.getElementById('modalOverlay').classList.add('active');
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
  document.getElementById('modalLoading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('modalLoading').style.display = 'none';
}

function confirmCloseModal() {
  var body = document.getElementById('modalBody');
  var inputs = body.querySelectorAll('input:not([type="file"]):not([type="hidden"]), textarea, select');
  var hasData = false;
  inputs.forEach(function(el) {
    if (el.value && el.value.trim() !== '') {
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
  var submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
  }
  showLoading();
  var data = {};
  new FormData(form).forEach(function(v, k) { data[k] = v; });
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
        console.log('Form data:', data);
        showSnackbar('Guardado (demo). En modo real se enviaría a Supabase.', 'success');
        closeModal();
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

      if (table === 'asambleas') {
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
    encuestas: 'ENCUESTAS'
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

function formGastos() {
  if (PARCELAS.length === 0) {
    loadJson('PARCELAS').then(function() { formGastos(); });
    return;
  }
  var parcelas = PARCELAS.map(function(p) { return '<option value="' + p.id + '">' + p.numero + '</option>'; }).join('');
  openModal('Agregar Gasto', '<form data-table="gastos" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Periodo *</label><input type="month" name="periodo" required id="gastoPeriodo"></div>' +
      '<div class="form-group"><label>Parcela *</label><select name="parcela_id" required id="gastoParcela">' + parcelas + '</select></div>' +
    '</div>' +
    '<div class="form-group"><label>Monto *</label><input type="number" name="monto" min="0" placeholder="0" required></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" placeholder="Detalles del gasto (opcional)"></textarea></div>' +
    '<div class="form-group"><label>Comprobante (foto)</label><input type="file" name="archivo" accept="image/*"></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
  document.getElementById('gastoPeriodo').addEventListener('change', updateGastoParcelas);
}

function updateGastoParcelas() {
  var periodo = document.getElementById('gastoPeriodo').value;
  var select = document.getElementById('gastoParcela');
  var usadas = GASTOS.filter(function(g) { return g.periodo === periodo; }).map(function(g) { return g.parcela_id; });
  select.innerHTML = PARCELAS.filter(function(p) { return usadas.indexOf(p.id) === -1; })
    .map(function(p) { return '<option value="' + p.id + '">' + p.numero + '</option>'; }).join('');
  if (select.options.length === 0) {
    select.innerHTML = '<option value="">Todas las parcelas ya tienen gasto</option>';
    select.disabled = true;
  } else {
    select.disabled = false;
  }
}

function formParcelas() {
  openModal('Agregar Parcela', '<form data-table="parcelas" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Número *</label><input type="text" name="numero" placeholder="Ej: 1, 2A, 15" required></div>' +
      '<div class="form-group"><label>Rol</label><input type="text" name="rol" placeholder="Rol de la propiedad"></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Metros² *</label><input type="number" name="metros" min="0" placeholder="0" required></div>' +
      '<div class="form-group"><label>Estado</label><select name="estado"><option>Habitada</option><option>Desocupada</option><option>En construcción</option></select></div>' +
    '</div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formPropietarios() {
  var parcelas = PARCELAS.map(function(p) { return '<option value="' + p.id + '">' + p.numero + '</option>'; }).join('');
  openModal('Agregar Propietario', '<form data-table="propietarios" onsubmit="handleForm(event)">' +
    '<div class="form-group"><label>Nombre completo *</label><input type="text" name="nombre_completo" placeholder="Juan Pérez" required></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>RUT</label><input type="text" name="rut" placeholder="12.345.678-9"></div>' +
      '<div class="form-group"><label>Parcela *</label><select name="parcela_id" required>' + parcelas + '</select></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Teléfono</label><input type="tel" name="telefono" placeholder="+56 9 1234 5678"></div>' +
      '<div class="form-group"><label>Email</label><input type="email" name="email" placeholder="correo@ejemplo.com"></div>' +
    '</div>' +
    '<div class="form-group"><label>Tipo</label><select name="tipo"><option>Propietario</option><option>Inquilino</option><option>Administrador</option></select></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formNoticias(data) {
  var isEdit = !!data;
  openModal(isEdit ? 'Editar Noticia' : 'Agregar Noticia',
    '<form data-table="noticias" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><label>Título *</label><input type="text" name="titulo" placeholder="Ej: Corte de agua programado" required' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></div>' +
    '<div class="form-group"><label>Descripción *</label><textarea name="descripcion" placeholder="Detalle de la noticia para los residentes" required>' + (isEdit ? escHtml(data.descripcion) : '') + '</textarea></div>' +
    '<div class="form-group"><label>Vigente hasta</label><input type="date" name="fecha_hasta"' + (isEdit && data.fecha_hasta ? ' value="' + data.fecha_hasta + '"' : '') + '></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">' + (isEdit ? 'Actualizar' : 'Guardar') + '</button></div>' +
  '</form>');
}

function formFlujo(data) {
  var conceptos = CONFIG.conceptos_flujo || [];
  if (!conceptos.length) {
    showSnackbar('Primero debes configurar los conceptos en la pestaña Configuración.', 'warning');
    return;
  }
  var isEdit = !!data;
  var opts = conceptos.map(function(c) { return '<option value="' + c + '"' + (isEdit && data.concepto === c ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  openModal(isEdit ? 'Editar Movimiento' : 'Agregar Movimiento',
    '<form data-table="flujo" data-bucket="ingresos_egresos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Tipo *</label><select name="tipo" required><option value="Ingreso"' + (isEdit && data.tipo === 'Ingreso' ? ' selected' : '') + '>Ingreso</option><option value="Egreso"' + (isEdit && data.tipo === 'Egreso' ? ' selected' : '') + '>Egreso</option></select></div>' +
      '<div class="form-group"><label>Fecha *</label><input type="date" name="fecha" required' + (isEdit ? ' value="' + data.fecha + '"' : '') + '></div>' +
    '</div>' +
    '<div class="form-group"><label>Concepto *</label><select name="concepto" required>' + opts + '</select></div>' +
    '<div class="form-group"><label>Monto *</label><input type="number" name="monto" min="0" placeholder="0" required' + (isEdit ? ' value="' + data.monto + '"' : '') + '></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" placeholder="Detalles del movimiento (opcional)">' + (isEdit ? escHtml(data.descripcion || '') : '') + '</textarea></div>' +
    '<div class="form-group"><label>Comprobante (foto)</label><input type="file" name="comprobante" accept="image/*"></div>' +
    (isEdit && data.comprobante ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.comprobante + '" target="_blank">ver</a></div>' : '') +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">' + (isEdit ? 'Actualizar' : 'Guardar') + '</button></div>' +
  '</form>');
}

function formDocumentos(data) {
  var isEdit = !!data;
  var cats = (CONFIG.categorias_documentos && CONFIG.categorias_documentos.length) ? CONFIG.categorias_documentos : ['Estatuto', 'Actas', 'Contratos', 'Seguros', 'Planos'];
  var catOpts = cats.map(function(c) { return '<option value="' + c + '"' + (isEdit && data.categoria === c ? ' selected' : '') + '>' + c + '</option>'; }).join('');
  openModal(isEdit ? 'Editar Documento' : 'Agregar Documento',
    '<form data-table="documentos" data-bucket="documentos" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><label>Nombre *</label><input type="text" name="nombre" placeholder="Ej: Acta reunión marzo 2026" required' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></div>' +
    '<div class="form-group"><label>Categoría *</label><select name="categoria" required>' + catOpts + '</select></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" placeholder="Resumen del documento (opcional)">' + (isEdit ? escHtml(data.descripcion || '') : '') + '</textarea></div>' +
    '<div class="form-group"><label>Archivo</label><input type="file" name="archivo"></div>' +
    (isEdit && data.archivo ? '<div style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.5rem">Archivo actual: <a href="' + data.archivo + '" target="_blank">ver</a></div>' : '') +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">' + (isEdit ? 'Actualizar' : 'Guardar') + '</button></div>' +
  '</form>');
}

function formReclamos() {
  var parcelas = PARCELAS.map(function(p) { return '<option value="' + p.id + '">' + p.numero + '</option>'; }).join('');
  openModal('Agregar Reclamo/Sugerencia', '<form data-table="reclamos" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Tipo *</label><select name="tipo" required><option>Reclamo</option><option>Sugerencia</option></select></div>' +
      '<div class="form-group"><label>Parcela</label><select name="parcela_id"><option value="">Anónimo</option>' + parcelas + '</select></div>' +
    '</div>' +
    '<div class="form-group"><label>Asunto *</label><input type="text" name="asunto" placeholder="Ej: Ruido excesivo, Fuga de agua" required></div>' +
    '<div class="form-group"><label>Descripción *</label><textarea name="descripcion" placeholder="Describa el problema o sugerencia con el mayor detalle posible" required></textarea></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formProveedores(data) {
  var isEdit = !!data;
  var rubros = CONFIG.rubros_proveedores && CONFIG.rubros_proveedores.length ? CONFIG.rubros_proveedores : ['Jardinería', 'Plomería', 'Electricidad', 'Albañilería', 'Pintura', 'Limpieza', 'Seguridad', 'Carpintería', 'Herrería', 'Tecnología', 'Otro'];
  var rubroOpts = rubros.map(function(r) { return '<option value="' + r + '"' + (isEdit && data.rubro === r ? ' selected' : '') + '>' + r + '</option>'; }).join('');
  openModal(isEdit ? 'Editar Proveedor' : 'Agregar Proveedor',
    '<form data-table="proveedores" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Rubro *</label><select name="rubro" required><option value="">Seleccionar...</option>' + rubroOpts + '</select></div>' +
      '<div class="form-group"><label>Nombre *</label><input type="text" name="nombre" placeholder="Nombre del proveedor o empresa" required' + (isEdit ? ' value="' + escHtml(data.nombre) + '"' : '') + '></div>' +
    '</div>' +
    '<div class="form-group"><label>Contacto *</label><input type="text" name="contacto" placeholder="Nombre de la persona de contacto" required' + (isEdit ? ' value="' + escHtml(data.contacto) + '"' : '') + '></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Teléfono</label><input type="tel" name="telefono" placeholder="+56 9 1234 5678"' + (isEdit && data.telefono ? ' value="' + escHtml(data.telefono) + '"' : '') + '></div>' +
      '<div class="form-group"><label>Email</label><input type="email" name="email" placeholder="correo@ejemplo.com"' + (isEdit && data.email ? ' value="' + escHtml(data.email) + '"' : '') + '></div>' +
    '</div>' +
    '<div class="form-group"><label>Web/Instagram</label><input type="text" name="web_instagram" placeholder="https://..."' + (isEdit && data.web_instagram ? ' value="' + escHtml(data.web_instagram) + '"' : '') + '></div>' +
    '<div class="form-group"><label>Observaciones</label><textarea name="observaciones" placeholder="Notas adicionales sobre el proveedor (opcional)">' + (isEdit ? escHtml(data.observaciones || '') : '') + '</textarea></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">' + (isEdit ? 'Actualizar' : 'Guardar') + '</button></div>' +
  '</form>');
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
    '<form data-table="asambleas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-row">' +
      '<div class="form-group"><label>Fecha *</label><input type="date" name="fecha" required' + (isEdit ? ' value="' + data.fecha + '"' : '') + '></div>' +
      '<div class="form-group"><label>Tipo *</label><select name="tipo" required><option value="Ordinaria"' + (isEdit && data.tipo === 'Ordinaria' ? ' selected' : '') + '>Ordinaria</option><option value="Extraordinaria"' + (isEdit && data.tipo === 'Extraordinaria' ? ' selected' : '') + '>Extraordinaria</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label>Temario *</label><textarea name="temario" placeholder="Puntos a tratar en la asamblea" required>' + (isEdit ? escHtml(data.temario) : '') + '</textarea></div>' +
    '<div class="form-group"><label>Acuerdos</label><textarea name="acuerdos" placeholder="Decisiones tomadas (completar después de la asamblea)">' + (isEdit ? escHtml(data.acuerdos || '') : '') + '</textarea></div>' +
    '<div class="form-group"><label>Asistentes</label><div style="margin-bottom:0.3rem"><a href="#" onclick="toggleAllAsistentes(); return false" style="color:#2563eb;font-size:0.8rem">Seleccionar todas</a></div><select name="asistentes" multiple style="min-height:6rem">' + parcelas + '</select></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">' + (isEdit ? 'Actualizar' : 'Guardar') + '</button></div>' +
  '</form>');
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
        '<label style="margin:0;font-size:0.9rem">Con alternativas</label>' +
        '<label class="toggle"><input type="checkbox" id="encuestaModoAlt" onchange="toggleEncuestaAlternativas()"><span class="toggle-slider"></span></label>' +
      '</div>' +
      '<div id="encuestaAlternativas" style="display:none">' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><input type="text" class="encuesta-alt-input" placeholder="Opción 1" style="flex:1;padding:0.5rem;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;background:var(--bg-card);color:var(--text-2)"><button type="button" class="btn-toggle" onclick="removeEncuestaAlt(this)" style="color:#b91c1c;border-color:#b91c1c">&times;</button></div>' +
        '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem"><input type="text" class="encuesta-alt-input" placeholder="Opción 2" style="flex:1;padding:0.5rem;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;background:var(--bg-card);color:var(--text-2)"><button type="button" class="btn-toggle" onclick="removeEncuestaAlt(this)" style="color:#b91c1c;border-color:#b91c1c">&times;</button></div>' +
      '</div>' +
      '<button type="button" id="btnAddAlt" class="btn-toggle" onclick="addEncuestaAlt()" style="font-size:0.8rem;display:none">+ Agregar alternativa</button>' +
      '<div id="encuestaModoInfo" style="font-size:0.75rem;color:var(--text-muted);margin-top:0.3rem">Modo simple: "A favor" / "En contra"</div>';
  }
  openModal(isEdit ? 'Editar Encuesta' : 'Nueva Encuesta',
    '<form data-table="encuestas" onsubmit="handleForm(event)">' +
    (isEdit ? '<input type="hidden" name="id" value="' + data.id + '">' : '') +
    '<div class="form-group"><label>Título *</label><input type="text" name="titulo" placeholder="Título de la propuesta" required' + (isEdit ? ' value="' + escHtml(data.titulo) + '"' : '') + '></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" placeholder="Detalle de la propuesta (opcional)">' + (isEdit ? escHtml(data.descripcion || '') : '') + '</textarea></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Fecha de término</label><input type="date" name="fecha_termino"' + (isEdit && data.fecha_termino ? ' value="' + data.fecha_termino + '"' : '') + '></div>' +
      '<div class="form-group"><label>Quorum (mín. votos)</label><input type="number" name="quorum" min="0" placeholder="Sin límite"' + (isEdit && data.quorum ? ' value="' + data.quorum + '"' : '') + '></div>' +
    '</div>' +
    '<div class="form-group">' + alternativasHtml + '</div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">' + (isEdit ? 'Actualizar' : 'Crear') + '</button></div>' +
  '</form>');
}

function toggleEncuestaAlternativas() {
  var on = document.getElementById('encuestaModoAlt').checked;
  document.getElementById('encuestaAlternativas').style.display = on ? '' : 'none';
  document.getElementById('btnAddAlt').style.display = on ? '' : 'none';
  document.getElementById('encuestaModoInfo').textContent = on ? 'Alternativas personalizadas' : 'Modo simple: "A favor" / "En contra"';
}

function addEncuestaAlt() {
  var container = document.getElementById('encuestaAlternativas');
  var count = container.querySelectorAll('.encuesta-alt-input').length + 1;
  var div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:0.5rem;margin-bottom:0.4rem';
  div.innerHTML = '<input type="text" class="encuesta-alt-input" placeholder="Opción ' + count + '" style="flex:1;padding:0.5rem;border:1px solid var(--border);border-radius:6px;font-size:0.85rem;background:var(--bg-card);color:var(--text-2)"><button type="button" class="btn-toggle" onclick="removeEncuestaAlt(this)" style="color:#b91c1c;border-color:#b91c1c">&times;</button>';
  container.appendChild(div);
  div.querySelector('input').focus();
}

function removeEncuestaAlt(btn) {
  btn.parentElement.remove();
}

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') confirmCloseModal(); });

function toggleAllAsistentes() {
  var sel = document.querySelector('[name="asistentes"]');
  var allSelected = Array.from(sel.options).every(function(o) { return o.selected; });
  Array.from(sel.options).forEach(function(o) { o.selected = !allSelected; });
}
