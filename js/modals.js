function openModal(title, html) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
  hideLoading();
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
    if (el.value && el.value.trim() !== '') hasData = true;
  });
  if (hasData) {
    if (!confirm('¿Cerrar? Se perderán los datos ingresados.')) return;
  }
  closeModal();
}

function handleForm(e) {
  e.preventDefault();
  var form = e.target;
  var submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Guardando...'; }
  showLoading();
  var data = {};
  new FormData(form).forEach(function(v, k) { data[k] = v; });
  form.querySelectorAll('select[multiple]').forEach(function(sel) {
    data[sel.name] = Array.from(sel.selectedOptions).map(function(o) { return o.value; }).join(', ');
  });

  var table = form.dataset.table;
  var autoDateTables = ['noticias', 'documentos'];
  if (autoDateTables.indexOf(table) !== -1 && !data.fecha) {
    data.fecha = new Date().toISOString().slice(0, 10);
  }
  if (table === 'flujo' && currentUser && !data.registrado_por) {
    data.registrado_por = currentUser.email;
  }

  var fileInput = form.querySelector('input[type="file"]');
  var filePromise = Promise.resolve(null);
  if (fileInput && fileInput.files.length > 0) {
    var bucket = form.dataset.bucket || 'gastos_comunes';
    var folder = '';
    if (table === 'gastos' && data.periodo) folder = data.periodo;
    else if (table === 'flujo' && data.fecha && data.tipo) folder = data.fecha.slice(0, 7) + '-' + data.tipo;
    else if (table === 'documentos' && data.categoria) folder = data.categoria;
    filePromise = supabaseUpload(fileInput.files[0], bucket, folder);
  }

  filePromise.then(function(fileUrl) {
    if (fileInput && fileInput.files.length > 0 && !fileUrl) {
      hideLoading();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar'; }
      return;
    }
    if (fileUrl) {
      data[fileInput.name] = fileUrl;
    }
    if (DEMO_MODE) {
      console.log('Form data:', data);
      alert('Guardado (demo). En modo real se enviaría a Supabase.');
      closeModal();
    } else {
      if (!table) {
        alert('Error: no se especificó la tabla.');
        hideLoading();
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar'; }
        return;
      }
      if (table === 'asambleas') {
        var asistentesStr = data.asistentes || '';
        var asistentesIds = asistentesStr ? asistentesStr.split(', ') : [];
        delete data.asistentes;
        supabaseInsert(table, data).then(function(result) {
          if (!result) { hideLoading(); if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar'; } return; }
          var asambleaId = result.id;
          if (asistentesIds.length) {
            var rows = asistentesIds.map(function(pid) { return { asamblea_id: asambleaId, parcela_id: pid }; });
            supabaseClient.from('asamblea_asistentes').insert(rows).then(function() {
              hideLoading();
              alert('Guardado correctamente.');
              closeModal();
              reloadTab(getCurrentTab());
            });
          } else {
            hideLoading();
            alert('Guardado correctamente.');
            closeModal();
            reloadTab(getCurrentTab());
          }
        });
      } else {
        supabaseInsert(table, data).then(function(result) {
          hideLoading();
          if (result) {
            alert('Guardado correctamente.');
            closeModal();
            reloadTab(getCurrentTab());
          } else {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Guardar'; }
          }
        });
      }
    }
  });
}

function getCurrentTab() {
  var active = document.querySelector('.tab-content.active');
  if (!active) return 'cuenta';
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

function formNoticias() {
  openModal('Agregar Noticia', '<form data-table="noticias" onsubmit="handleForm(event)">' +
    '<div class="form-group"><label>Título *</label><input type="text" name="titulo" placeholder="Ej: Corte de agua programado" required></div>' +
    '<div class="form-group"><label>Descripción *</label><textarea name="descripcion" placeholder="Detalle de la noticia para los residentes" required></textarea></div>' +
    '<div class="form-group"><label>Vigente hasta</label><input type="date" name="fecha_hasta"></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formFlujo() {
  openModal('Agregar Movimiento', '<form data-table="flujo" data-bucket="ingresos_egresos" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Tipo *</label><select name="tipo" required><option>Ingreso</option><option>Egreso</option></select></div>' +
      '<div class="form-group"><label>Fecha *</label><input type="date" name="fecha" required></div>' +
    '</div>' +
    '<div class="form-group"><label>Concepto *</label><input type="text" name="concepto" placeholder="Ej: Pago de gestión, Luz comunal" required></div>' +
    '<div class="form-group"><label>Monto *</label><input type="number" name="monto" min="0" placeholder="0" required></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" placeholder="Detalles del movimiento (opcional)"></textarea></div>' +
    '<div class="form-group"><label>Comprobante (foto)</label><input type="file" name="comprobante" accept="image/*"></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formDocumentos() {
  openModal('Agregar Documento', '<form data-table="documentos" data-bucket="documentos" onsubmit="handleForm(event)">' +
    '<div class="form-group"><label>Nombre *</label><input type="text" name="nombre" placeholder="Ej: Acta reunión marzo 2026" required></div>' +
    '<div class="form-group"><label>Categoría *</label><select name="categoria" required><option>Estatuto</option><option>Actas</option><option>Contratos</option><option>Seguros</option><option>Planos</option></select></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" placeholder="Resumen del documento (opcional)"></textarea></div>' +
    '<div class="form-group"><label>Archivo</label><input type="file" name="archivo"></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
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

function formProveedores() {
  openModal('Agregar Proveedor', '<form data-table="proveedores" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Rubro *</label><select name="rubro" required><option value="">Seleccionar...</option><option>Jardinería</option><option>Plomería</option><option>Electricidad</option><option>Albañilería</option><option>Pintura</option><option>Limpieza</option><option>Seguridad</option><option>Carpintería</option><option>Herrería</option><option>Tecnología</option><option>Otro</option></select></div>' +
      '<div class="form-group"><label>Nombre *</label><input type="text" name="nombre" placeholder="Nombre del proveedor o empresa" required></div>' +
    '</div>' +
    '<div class="form-group"><label>Contacto *</label><input type="text" name="contacto" placeholder="Nombre de la persona de contacto" required></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Teléfono</label><input type="tel" name="telefono" placeholder="+56 9 1234 5678"></div>' +
      '<div class="form-group"><label>Email</label><input type="email" name="email" placeholder="correo@ejemplo.com"></div>' +
    '</div>' +
    '<div class="form-group"><label>Web/Instagram</label><input type="text" name="web_instagram" placeholder="https://..."></div>' +
    '<div class="form-group"><label>Observaciones</label><textarea name="observaciones" placeholder="Notas adicionales sobre el proveedor (opcional)"></textarea></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formAsambleas() {
  if (PARCELAS.length === 0) {
    loadJson('PARCELAS').then(function() { formAsambleas(); });
    return;
  }
  var parcelas = PARCELAS.map(function(p) { return '<option value="' + p.id + '">' + p.numero + '</option>'; }).join('');
  openModal('Agregar Asamblea', '<form data-table="asambleas" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Fecha *</label><input type="date" name="fecha" required></div>' +
      '<div class="form-group"><label>Tipo *</label><select name="tipo" required><option>Ordinaria</option><option>Extraordinaria</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label>Temario *</label><textarea name="temario" placeholder="Puntos a tratar en la asamblea" required></textarea></div>' +
    '<div class="form-group"><label>Acuerdos</label><textarea name="acuerdos" placeholder="Decisiones tomadas (completar después de la asamblea)"></textarea></div>' +
    '<div class="form-group"><label>Asistentes</label><div style="margin-bottom:0.3rem"><a href="#" onclick="toggleAllAsistentes(); return false" style="color:#2563eb;font-size:0.8rem">Seleccionar todas</a></div><select name="asistentes" multiple style="min-height:6rem">' + parcelas + '</select></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') confirmCloseModal(); });

function toggleAllAsistentes() {
  var sel = document.querySelector('[name="asistentes"]');
  var allSelected = Array.from(sel.options).every(function(o) { return o.selected; });
  Array.from(sel.options).forEach(function(o) { o.selected = !allSelected; });
}
