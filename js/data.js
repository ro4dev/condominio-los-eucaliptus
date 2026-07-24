var TABLE_MAP = {
  GASTOS: 'gastos',
  PARCELAS: 'parcelas',
  PROPIETARIOS: 'propietarios',
  NOTICIAS: 'noticias',
  FLUJO: 'flujo',
  DOCUMENTOS: 'documentos',
  RECLAMOS: 'reclamos',
  PROVEEDORES: 'proveedores',
  ASAMBLEAS: 'asambleas',
  ASAMBLEA_ASISTENTES: 'asamblea_asistentes',
  ENCUESTAS: 'encuestas',
  ENCUESTAS_VOTOS: 'encuestas_votos'
};

async function loadJson(target) {
  try {
    if (DEMO_MODE) {
      var res = await fetch(DEMO_FILES[target], { cache: 'no-store' });
      window[target] = await res.json();
    } else if (supabaseClient) {
      var table = TABLE_MAP[target];
      var { data, error } = await supabaseClient.from(table).select('*');
      if (error) {
        throw error;
      }
      window[target] = data;
    }
    loaded[target] = true;
  } catch (e) {
    console.error('Error cargando ' + target, e);
  }
}

async function loadInitialData() {
  await Promise.all([loadJson('GASTOS'), loadJson('PARCELAS'), loadConfig()]);
  fillFilters();
  applyFilters();
}

async function loadTabData(tab) {
  var configs = {
    cuenta: function() { return loadJson('GASTOS').then(function() { fillFilters(); applyFilters(); }); },
    parcelas: function() { return Promise.all([loadJson('PARCELAS'), loadJson('PROPIETARIOS')]).then(function() { renderParcelas(); }); },
    noticias: function() { return loadJson('NOTICIAS').then(function() { renderNoticias(); }); },
    flujo: function() { return loadJson('FLUJO').then(function() { renderFlujo(); }); },
    documentos: function() { return loadJson('DOCUMENTOS').then(function() { renderDocumentos(); }); },
    reclamos: function() { return loadJson('RECLAMOS').then(function() { renderReclamos(); }); },
    proveedores: function() { return loadJson('PROVEEDORES').then(function() { renderProveedores(); }); },
    asambleas: function() { return Promise.all([loadJson('ASAMBLEAS'), loadJson('ASAMBLEA_ASISTENTES')]).then(function() { renderAsambleas(); }); },
    encuestas: function() { return Promise.all([loadJson('ENCUESTAS'), loadJson('ENCUESTAS_VOTOS'), loadJson('PARCELAS')]).then(function() { renderEncuestas(); }); },
    config: function() { return renderConfig(); }
  };

  if (configs[tab]) {
    await configs[tab]();
  }
}

async function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.removeAttribute('active'); });
  document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.remove('active'); });
  document.querySelector('[data-tab="' + tab + '"]').setAttribute('active', '');
  document.getElementById('tab-' + tab).classList.add('active');
  await loadTabData(tab);
}

function showSkeletons(tab) {
  var skeletons = {
    cuenta: '<div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div>',
    parcelas: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    noticias: '<div class="skeleton skeleton-news"></div><div class="skeleton skeleton-news"></div><div class="skeleton skeleton-news"></div>',
    flujo: '<div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div>',
    documentos: '<div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div>',
    reclamos: '<div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div>',
    proveedores: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    asambleas: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    encuestas: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    config: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>'
  };
  var tabEl = document.getElementById('tab-' + tab);
  if (!tabEl) {
    return;
  }
  var content = tabEl.querySelector('.cards-grid, .timeline, .table-wrap, .stats, #reclamosList, #noticiasList, #flujoList');
  if (content) {
    content.innerHTML = skeletons[tab] || '<div class="skeleton skeleton-card"></div>';
  }
  if (tab === 'flujo') {
    var fl = document.getElementById('flujoList');
    if (fl) {
      fl.innerHTML = '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>';
    }
  }
  if (tab === 'cuenta') {
    var tl = document.getElementById('tableLoading');
    var tg = document.getElementById('tableGastos');
    if (tl) {
      tl.style.display = '';
    }
    if (tg) {
      tg.style.display = 'none';
    }
  }
}

async function reloadTab(tab) {
  showSkeletons(tab);
  loaded = {};
  await loadTabData(tab);
}
