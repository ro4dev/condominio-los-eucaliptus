# Configuración Admin

## 1. Descripción general

Pestaña de administración visible solo para usuarios con role admin. Centraliza la configuración de parámetros del sistema: montos base, datos de pago, creación masiva de parcelas, categorías de documentos, rubros de proveedores y conceptos de flujo. Los chips se guardan automáticamente al agregar/eliminar.

ID del tab: `config`
Contenedor: `<div id="tab-config">`
Botón tab: `<md-primary-tab id="configTabBtn" style="display:none">`

## 2. Schema SQL

```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. Global state

```js
var CONFIG = {};  // en config-page.js
// Keys posibles:
//   CONFIG.montos → { gasto_comun_base: N, fondo_reserva: N }
//   CONFIG.periodos → [{ periodo: "YYYY-MM", monto: N, fondo_reserva: N }, ...]
//     (cuota del periodo; los periodos sin config usan Monto Base — ver finanzas.md §9)
//   CONFIG.categorias_documentos → ["Estatuto", "Actas", ...]
//   CONFIG.rubros_proveedores → ["Jardinería", "Limpieza", ...]
//   CONFIG.conceptos_flujo → ["Mantención", "Cuotas", ...]
//   CONFIG.parcelas_prefijo → "Terreno"
//   CONFIG.parcelas_cantidad → 40
//   CONFIG.datos_pago → { banco, tipo_cuenta, numero_cuenta, rut, titular, email, qr }
//     (consume la pestaña Home → card "Cómo pagar")
```

## 4. HTML structure (index.html)

```html
<div id="tab-config" class="tab-content" role="region" aria-label="Configuración">
  <!-- Parcelas + Montos (grid 2 columnas) -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem" class="config-duo">

    <!-- Parcelas bulk -->
    <div class="card">
      <h4>Parcelas</h4>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.8rem">Cantidad total y nombre de las parcelas</p>
      <div class="form-row">
        <div class="form-group"><md-filled-text-field label="Cantidad" id="cfgParcelasCantidad" type="number" min="1" placeholder="Ej: 40" style="width:100%"></md-filled-text-field></div>
        <div class="form-group"><md-filled-text-field label="Prefijo" id="cfgParcelasPrefijo" type="text" placeholder="Ej: Terreno" style="width:100%"></md-filled-text-field></div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:0.5rem"><md-filled-button id="btnAplicarParcelas" onclick="bulkCreateParcelas()">Crear parcelas</md-filled-button></div>
    </div>

    <!-- Montos -->
    <div class="card">
      <h4>Montos Base</h4>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.8rem">Montos fijos que se usan para calcular expensas</p>
      <div class="form-row">
        <div class="form-group"><md-filled-text-field label="Gasto común base" id="cfgGastoComunBase" type="number" min="0" placeholder="Ej: 50000" style="width:100%"></md-filled-text-field></div>
        <div class="form-group"><md-filled-text-field label="Fondo reserva" id="cfgFondoReserva" type="number" min="0" placeholder="Ej: 15000" style="width:100%"></md-filled-text-field></div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:0.5rem"><md-filled-button id="btnGuardarMontos" onclick="saveMontos()">Guardar</md-filled-button></div>
    </div>
  </div>

  <!-- Datos de pago (Home → Cómo pagar) -->
  <div class="card" style="margin-bottom:1rem">
    <h4>Datos de Pago</h4>
    <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.8rem">Cuenta y QR que se muestran en Home → "Cómo pagar" para que los deudores transfieran su cuota</p>
    <div class="form-row">
      <div class="form-group"><md-filled-text-field label="Banco" id="cfgPagoBanco" type="text" placeholder="Ej: Banco Estado" style="width:100%"></md-filled-text-field></div>
      <div class="form-group"><md-filled-text-field label="Tipo de cuenta" id="cfgPagoTipoCuenta" type="text" placeholder="Ej: CuentaRut" style="width:100%"></md-filled-text-field></div>
    </div>
    <div class="form-row">
      <div class="form-group"><md-filled-text-field label="Número de cuenta" id="cfgPagoNumeroCuenta" type="text" placeholder="Ej: 12-345678-9" style="width:100%"></md-filled-text-field></div>
      <div class="form-group"><md-filled-text-field label="RUT" id="cfgPagoRut" type="text" placeholder="Ej: 77.123.456-7" style="width:100%"></md-filled-text-field></div>
    </div>
    <div class="form-group"><md-filled-text-field label="Titular" id="cfgPagoTitular" type="text" placeholder="Ej: Comunidad Condominio Eucaliptus" style="width:100%"></md-filled-text-field></div>
    <div class="form-row">
      <div class="form-group"><md-filled-text-field label="Email tesorería" id="cfgPagoEmail" type="email" placeholder="Ej: tesoreria@eucaliptus.cl" style="width:100%"></md-filled-text-field></div>
      <div class="form-group"><md-filled-text-field label="URL imagen QR" id="cfgPagoQr" type="url" placeholder="https://...qr.png" style="width:100%"></md-filled-text-field></div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:0.5rem"><md-filled-button id="btnGuardarDatosPago" onclick="saveDatosPago()">Guardar</md-filled-button></div>
  </div>

  <!-- Categorías documentos -->
  <div class="card" style="margin-bottom:1rem">
    <h4>Categorías de Documentos</h4>
    <div id="cfgCategoriasDocs"></div>
    <div style="display:flex;justify-content:flex-end;margin-top:0.8rem"><md-filled-button onclick="openModalCategoriaDoc()"><md-icon slot="icon">add</md-icon>Agregar</md-filled-button></div>
  </div>

  <!-- Rubros proveedores -->
  <div class="card" style="margin-bottom:1rem">
    <h4>Rubros de Proveedores</h4>
    <div id="cfgRubrosProveedores"></div>
    <div style="display:flex;justify-content:flex-end;margin-top:0.8rem"><md-filled-button onclick="openModalRubroProveedor()"><md-icon slot="icon">add</md-icon>Agregar</md-filled-button></div>
  </div>

  <!-- Conceptos flujo -->
  <div class="card" style="margin-bottom:1rem">
    <h4>Conceptos de Ingresos/Egresos</h4>
    <div id="cfgConceptosFlujo"></div>
    <div style="display:flex;justify-content:flex-end;margin-top:0.8rem"><md-filled-button onclick="openModalConceptoFlujo()"><md-icon slot="icon">add</md-icon>Agregar</md-filled-button></div>
  </div>
</div>
```

## 5. JS Functions

### 5.1 loadConfig()

```js
async function loadConfig() {
  if (DEMO_MODE) {
    var res = await fetch('data/config.json', { cache: 'no-store' });
    CONFIG = await res.json();
  } else if (supabaseClient) {
    var { data, error } = await supabaseClient.from('config').select('key, value');
    CONFIG = {};
    data.forEach(function(row) { CONFIG[row.key] = row.value; });
  }
}
```

### 5.2 saveConfig(key, value)

```js
async function saveConfig(key, value) {
  CONFIG[key] = value;
  if (!DEMO_MODE && supabaseClient) {
    showLoading();
    var { error } = await supabaseClient.from('config').upsert({ key: key, value: value, updated_at: new Date().toISOString() });
    hideLoading();
    if (error) { showSnackbar('Error al guardar: ' + error.message, 'error'); return false; }
  }
  return true;
}
```

### 5.3 renderConfig()

```js
async function renderConfig() {
  showSkeletons('config');
  await Promise.all([
    loadConfig(),
    loadJson('PARCELAS'),
    loadJson('DOCUMENTOS'),
    loadJson('PROVEEDORES'),
    loadJson('FLUJO')
  ]);
  renderMontos();
  renderDatosPago();
  renderParcelasConfig();
  renderCategoriasDocs();
  renderRubrosProveedores();
  renderConceptosFlujo();
  var tabEl = document.getElementById('tab-config');
  if (tabEl) tabEl.setAttribute('aria-busy', 'false');
}
```

### 5.4 Montos

```js
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
  if (await saveConfig('montos', value)) { showSnackbar('Montos guardados.', 'success'); }
  btn.disabled = false;
  btn.textContent = 'Guardar';
}
```

### 5.4b Datos de Pago

```js
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
  if (await saveConfig('datos_pago', value)) { showSnackbar('Datos de pago guardados.', 'success'); }
  btn.disabled = false;
  btn.textContent = 'Guardar';
}
```

El `qr` es una URL de imagen QR estática (subida por el admin, p.ej. al bucket `documentos`). La consume `openComoPagar()` de la pestaña Home. El QR dinámico con monto requiere pasarela de pago (fuera de GitHub Pages).

### 5.5 Chip list system

**renderChipList(items, removeFn, usedItems)**:
```js
function renderChipList(items, removeFn, usedItems) {
  if (!items.length) {
    return '<span style="color:var(--text-muted);font-size:0.85rem">Sin elementos</span>';
  }
  var used = usedItems || [];
  return '<div class="chip-list" data-removefn="' + removeFn + '" style="display:flex;flex-wrap:wrap;gap:0.5rem">'
    + items.map(function(item, i) {
        var isInUse = used.indexOf(item) !== -1;
        if (isInUse) {
          return '<md-assist-chip>' + item + '</md-assist-chip>';
        }
        return '<div class="chip-remove-wrapper" data-fn="' + removeFn + '" data-idx="' + i + '" style="cursor:pointer"><md-input-chip removable>' + item + '</md-input-chip></div>';
      }).join('')
    + '</div>';
}
```

**Event delegation para eliminar chips**:
```js
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
  if (fn && !isNaN(idx)) { window[fn](idx); }
}, true);
```

### 5.6 Categorías Documentos

```js
function renderCategoriasDocs() {
  var usadas = (DOCUMENTOS || []).map(function(d) { return d.categoria; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgCategoriasDocs').innerHTML = renderChipList(CONFIG.categorias_documentos || [], 'removeCategoriaDoc', usadas);
}

function openModalCategoriaDoc() {
  openConfigModal('Agregar categoría de documento', 'Ej: Actas', async function(val) {
    var cats = CONFIG.categorias_documentos || [];
    if (cats.indexOf(val) !== -1) { showSnackbar('Ya existe esa categoría.', 'warning'); return; }
    cats.push(val);
    CONFIG.categorias_documentos = cats;
    renderCategoriasDocs();
    if (await saveConfig('categorias_documentos', cats)) { showSnackbar('Categoría agregada.', 'success'); }
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
    saveConfig('categorias_documentos', cats).then(function(ok) { if (ok) showSnackbar('Categoría eliminada.', 'success'); });
  });
}
```

### 5.7 Rubros Proveedores

```js
function renderRubrosProveedores() {
  var usados = (PROVEEDORES || []).map(function(p) { return p.rubro; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgRubrosProveedores').innerHTML = renderChipList(CONFIG.rubros_proveedores || [], 'removeRubroProveedor', usados);
}

function openModalRubroProveedor() {
  openConfigModal('Agregar rubro de proveedor', 'Ej: Electricidad', async function(val) {
    var rubros = CONFIG.rubros_proveedores || [];
    if (rubros.indexOf(val) !== -1) { showSnackbar('Ya existe ese rubro.', 'warning'); return; }
    rubros.push(val);
    CONFIG.rubros_proveedores = rubros;
    renderRubrosProveedores();
    if (await saveConfig('rubros_proveedores', rubros)) { showSnackbar('Rubro agregado.', 'success'); }
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
    saveConfig('rubros_proveedores', rubros).then(function(ok) { if (ok) showSnackbar('Rubro eliminado.', 'success'); });
  });
}
```

### 5.8 Conceptos Flujo

```js
function renderConceptosFlujo() {
  var usados = (FLUJO || []).map(function(f) { return f.concepto; }).filter(function(v, i, a) { return a.indexOf(v) === i; });
  document.getElementById('cfgConceptosFlujo').innerHTML = renderChipList(CONFIG.conceptos_flujo || [], 'removeConceptoFlujo', usados);
}

function openModalConceptoFlujo() {
  openConfigModal('Agregar concepto de ingreso/egreso', 'Ej: Mantenimiento', async function(val) {
    var conceptos = CONFIG.conceptos_flujo || [];
    if (conceptos.indexOf(val) !== -1) { showSnackbar('Ya existe ese concepto.', 'warning'); return; }
    conceptos.push(val);
    CONFIG.conceptos_flujo = conceptos;
    renderConceptosFlujo();
    if (await saveConfig('conceptos_flujo', conceptos)) { showSnackbar('Concepto agregado.', 'success'); }
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
    saveConfig('conceptos_flujo', conceptos).then(function(ok) { if (ok) showSnackbar('Concepto eliminado.', 'success'); });
  });
}
```

### 5.9 Parcelas Bulk

```js
function renderParcelasConfig() {
  document.getElementById('cfgParcelasPrefijo').value = CONFIG.parcelas_prefijo || '';
  document.getElementById('cfgParcelasCantidad').value = CONFIG.parcelas_cantidad || '';
}

async function bulkCreateParcelas() {
  var btn = document.getElementById('btnAplicarParcelas');
  btn.disabled = true;
  btn.textContent = 'Procesando...';

  var cantidad = parseInt(document.getElementById('cfgParcelasCantidad').value);
  var prefijo = document.getElementById('cfgParcelasPrefijo').value.trim();

  if (!prefijo) { showSnackbar('Ingresá un prefijo.', 'warning'); btn.disabled = false; btn.textContent = 'Crear parcelas';
  if (!cantidad || cantidad < 1) { showSnackbar('Ingresá una cantidad válida.', 'warning'); btn.disabled = false; btn.textContent = 'Crear parcelas';

  var prefijoAnterior = CONFIG.parcelas_prefijo || '';

  var nuevas = [];
  for (var i = 1; i <= cantidad; i++) {
    nuevas.push({ id: generateUUID(), numero: prefijo + ' ' + i, metros: 0, estado: 'Sin asignar' });
  }

  var nombresNuevos = nuevas.map(function(p) { return p.numero; });
  var nombresExistentes = PARCELAS.map(function(p) { return p.numero; });
  var iguales = nombresNuevos.length === nombresExistentes.length
    && nombresNuevos.every(function(n, i) { return n === nombresExistentes[i]; });

  if (iguales) {
    await saveConfig('parcelas_cantidad', cantidad);
    await saveConfig('parcelas_prefijo', prefijo);
    showSnackbar('Sin cambios.', 'info');
    btn.disabled = false; btn.textContent = 'Crear parcelas';
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
      if (!PARCELAS.some(function(x) { return x.numero === p.numero; })) { PARCELAS.push(p); }
    });
  } else if (supabaseClient) {
    showLoading();
    if (prefijo !== prefijoAnterior) { await renameParcelas(prefijoAnterior, prefijo); }
    nombresExistentes = PARCELAS.map(function(p) { return p.numero; });
    var nuevasReales = nuevas.filter(function(p) { return nombresExistentes.indexOf(p.numero) === -1; });
    if (nuevasReales.length) {
      var { error } = await supabaseClient.from('parcelas').insert(nuevasReales);
      if (error) { hideLoading(); showSnackbar('Error al crear parcelas: ' + error.message, 'error'); btn.disabled = false; btn.textContent = 'Crear parcelas';
      await loadJson('PARCELAS');
    }
    hideLoading();
  }

  await saveConfig('parcelas_cantidad', cantidad);
  await saveConfig('parcelas_prefijo', prefijo);
  showSnackbar(prefijo !== prefijoAnterior ? 'Parcelas renombradas a "' + prefijo + '".' : 'Parcelas actualizadas.', 'success');
  renderParcelasConfig();
  btn.disabled = false; btn.textContent = 'Crear parcelas';
}

async function renameParcelas(oldPrefijo, newPrefijo) {
  if (DEMO_MODE || !supabaseClient) {
    PARCELAS.forEach(function(p) {
      var match = p.numero.match(/^(\D+)\s+(\d+)$/);
      if (match && match[1] === oldPrefijo) { p.numero = newPrefijo + ' ' + match[2]; }
    });
    return;
  }
  for (var i = 0; i < PARCELAS.length; i++) {
    var match = PARCELAS[i].numero.match(/^(\D+)\s+(\d+)$/);
    if (!match || match[1] !== oldPrefijo) continue;
    var newName = newPrefijo + ' ' + match[2];
    await supabaseClient.from('parcelas').update({ numero: newName }).eq('id', PARCELAS[i].id);
  }
  await loadJson('PARCELAS');
}
```

### 5.10 openConfigModal()

```js
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
    if (!val) { input.reportValidity(); return; }
    showLoading();
    await onAdd(val);
    hideLoading();
    closeModal();
  };
  document.getElementById('cfgModalInput').onkeydown = function(e) {
    if (e.key === 'Enter') { document.getElementById('cfgModalAddBtn').click(); }
  };
}
```

## 6. Chip states

| Estado | Chip | Interacción |
|--------|------|-------------|
| En uso (tiene registros asociados) | `<md-assist-chip>` | No se puede eliminar (candado implícito) |
| Sin uso | `<md-input-chip removable>` | Click en X → confirmación → elimina |

## 7. Seed data

```sql
INSERT INTO config (key, value) VALUES
  ('montos', '{"gasto_comun_base": 50000, "fondo_reserva": 15000}'),
  ('categorias_documentos', '["Estatuto", "Actas", "Contratos", "Seguros", "Planos"]'),
  ('rubros_proveedores', '["Jardinería", "Limpieza", "Electricidad", "Plomería", "Seguridad", "Mantenimiento", "Otro"]')
ON CONFLICT (key) DO NOTHING;
```

> `datos_pago` no se siembra: queda vacío hasta que el admin lo configure en la pestaña de Configuración. Sin él, la card "Cómo pagar" de Home muestra un aviso "Sin datos de pago configurados".

## 8. Dependencias

- Solo visible si `IS_ADMIN = true`
- Requiere `DOCUMENTOS`, `PROVEEDORES` y `FLUJO` cargados (para detectar chips en uso)
- Los conceptos de flujo son REQUERIDOS antes de crear movimientos (formFlujo valida)

## 9. RLS

```sql
CREATE POLICY "config_select" ON config FOR SELECT TO authenticated USING (true);
CREATE POLICY "config_insert" ON config FOR INSERT TO authenticated WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "config_update" ON config FOR UPDATE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
CREATE POLICY "config_delete" ON config FOR DELETE TO authenticated USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');
```
