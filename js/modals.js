function openModal(title, html) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = html;
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

function handleForm(e) {
  e.preventDefault();
  var form = e.target;
  var data = {};
  new FormData(form).forEach(function(v, k) { data[k] = v; });
  if (DEMO_MODE) {
    console.log('Form data:', data);
    alert('Guardado (demo). En modo real se enviaría a Supabase.');
    closeModal();
  } else {
    var table = form.dataset.table;
    if (!table) {
      alert('Error: no se especificó la tabla.');
      return;
    }
    supabaseInsert(table, data).then(function(result) {
      if (result) {
        alert('Guardado correctamente.');
        closeModal();
        reloadTab(getCurrentTab());
      }
    });
  }
}

function getCurrentTab() {
  var active = document.querySelector('.tab-content.active');
  if (!active) return 'cuenta';
  return active.id.replace('tab-', '');
}

function formGastos() {
  var parcelas = PARCELAS.map(function(p) { return '<option>' + p.numero + '</option>'; }).join('');
  openModal('Agregar Gasto', '<form data-table="gastos" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Parcela</label><select name="parcela" required>' + parcelas + '</select></div>' +
      '<div class="form-group"><label>Periodo</label><input type="month" name="periodo" required></div>' +
    '</div>' +
    '<div class="form-group"><label>Concepto</label><input type="text" name="concepto" required></div>' +
    '<div class="form-group"><label>Monto</label><input type="number" name="monto" required></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion"></textarea></div>' +
    '<div class="form-group"><label>Pagado</label><select name="pagado"><option>Sí</option><option>No</option></select></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formParcelas() {
  openModal('Agregar Parcela', '<form data-table="parcelas" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Número</label><input type="text" name="numero" required></div>' +
      '<div class="form-group"><label>Rol</label><input type="text" name="rol"></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Metros²</label><input type="number" name="metros" required></div>' +
      '<div class="form-group"><label>Estado</label><select name="estado"><option>Habitada</option><option>Desocupada</option><option>En construcción</option></select></div>' +
    '</div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formPropietarios() {
  var parcelas = PARCELAS.map(function(p) { return '<option>' + p.numero + '</option>'; }).join('');
  openModal('Agregar Propietario', '<form data-table="propietarios" onsubmit="handleForm(event)">' +
    '<div class="form-group"><label>Nombre completo</label><input type="text" name="nombre_completo" required></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>RUT</label><input type="text" name="rut"></div>' +
      '<div class="form-group"><label>Parcela</label><select name="parcela" required>' + parcelas + '</select></div>' +
    '</div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Teléfono</label><input type="tel" name="telefono"></div>' +
      '<div class="form-group"><label>Email</label><input type="email" name="email"></div>' +
    '</div>' +
    '<div class="form-group"><label>Tipo</label><select name="tipo"><option>Propietario</option><option>Inquilino</option><option>Administrador</option></select></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formNoticias() {
  openModal('Agregar Noticia', '<form data-table="noticias" onsubmit="handleForm(event)">' +
    '<div class="form-group"><label>Título</label><input type="text" name="titulo" required></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" required></textarea></div>' +
    '<div class="form-group"><label>Vigente hasta</label><input type="date" name="fecha_hasta"></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formFlujo() {
  openModal('Agregar Movimiento', '<form data-table="flujo" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Tipo</label><select name="tipo" required><option>Ingreso</option><option>Egreso</option></select></div>' +
      '<div class="form-group"><label>Fecha</label><input type="date" name="fecha" required></div>' +
    '</div>' +
    '<div class="form-group"><label>Concepto</label><input type="text" name="concepto" required></div>' +
    '<div class="form-group"><label>Monto</label><input type="number" name="monto" required></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion"></textarea></div>' +
    '<div class="form-group"><label>Comprobante (URL)</label><input type="url" name="comprobante"></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formDocumentos() {
  openModal('Agregar Documento', '<form data-table="documentos" onsubmit="handleForm(event)">' +
    '<div class="form-group"><label>Nombre</label><input type="text" name="nombre" required></div>' +
    '<div class="form-group"><label>Categoría</label><select name="categoria" required><option>Estatuto</option><option>Actas</option><option>Contratos</option><option>Seguros</option><option>Planos</option></select></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion"></textarea></div>' +
    '<div class="form-group"><label>Archivo (URL)</label><input type="url" name="archivo"></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formReclamos() {
  var parcelas = PARCELAS.map(function(p) { return '<option>' + p.numero + '</option>'; }).join('');
  openModal('Agregar Reclamo/Sugerencia', '<form data-table="reclamos" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Tipo</label><select name="tipo" required><option>Reclamo</option><option>Sugerencia</option></select></div>' +
      '<div class="form-group"><label>Parcela</label><select name="parcela"><option value="">Anónimo</option>' + parcelas + '</select></div>' +
    '</div>' +
    '<div class="form-group"><label>Asunto</label><input type="text" name="asunto" required></div>' +
    '<div class="form-group"><label>Descripción</label><textarea name="descripcion" required></textarea></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formProveedores() {
  openModal('Agregar Proveedor', '<form data-table="proveedores" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Rubro</label><input type="text" name="rubro" required></div>' +
      '<div class="form-group"><label>Nombre</label><input type="text" name="nombre" required></div>' +
    '</div>' +
    '<div class="form-group"><label>Contacto</label><input type="text" name="contacto" required></div>' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Teléfono</label><input type="tel" name="telefono"></div>' +
      '<div class="form-group"><label>Email</label><input type="email" name="email"></div>' +
    '</div>' +
    '<div class="form-group"><label>Web/Instagram</label><input type="url" name="web_instagram"></div>' +
    '<div class="form-group"><label>Observaciones</label><textarea name="observaciones"></textarea></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

function formAsambleas() {
  openModal('Agregar Asamblea', '<form data-table="asambleas" onsubmit="handleForm(event)">' +
    '<div class="form-row">' +
      '<div class="form-group"><label>Fecha</label><input type="date" name="fecha" required></div>' +
      '<div class="form-group"><label>Tipo</label><select name="tipo" required><option>Ordinaria</option><option>Extraordinaria</option></select></div>' +
    '</div>' +
    '<div class="form-group"><label>Temario</label><textarea name="temario" required></textarea></div>' +
    '<div class="form-group"><label>Acuerdos</label><textarea name="acuerdos"></textarea></div>' +
    '<div class="form-group"><label>Asistentes (parcelas)</label><input type="text" name="asistentes" placeholder="Parcela 1, Parcela 2, ..."></div>' +
    '<div class="form-actions"><button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button><button type="submit" class="btn btn-primary">Guardar</button></div>' +
  '</form>');
}

document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });
