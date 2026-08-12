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
  ENCUESTAS_VOTOS: 'encuestas_votos',
  PUBLICACIONES: 'publicaciones'
};

async function loadJson(target) {
  try {
    if (DEMO_MODE) {
      if (loaded[target]) return;
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
  await Promise.all([loadJson('GASTOS'), loadJson('FLUJO'), loadJson('PARCELAS'), loadJson('PROPIETARIOS'), loadConfig()]);
  renderHome();
  var tabEl = document.getElementById('tab-home');
  if (tabEl) tabEl.setAttribute('aria-busy', 'false');
}

async function loadTabData(tab) {
  var configs = {
    home: function() { return Promise.all([loadJson('GASTOS'), loadJson('FLUJO'), loadJson('PARCELAS'), loadJson('PROPIETARIOS'), loadConfig()]).then(function() { renderHome(); }); },
    finanzas: function() { return Promise.all([loadJson('GASTOS'), loadJson('FLUJO'), loadJson('PARCELAS')]).then(function() { fillFinanzasFilters(); renderFinanzas(); }); },
    parcelas: function() { return Promise.all([loadJson('PARCELAS'), loadJson('PROPIETARIOS')]).then(function() { renderParcelas(); }); },
    noticias: function() { return loadJson('NOTICIAS').then(function() { renderNoticias(); }); },
    documentos: function() { return loadJson('DOCUMENTOS').then(function() { renderDocumentos(); }); },
    reclamos: function() { return loadJson('RECLAMOS').then(function() { renderReclamos(); }); },
    proveedores: function() { return loadJson('PROVEEDORES').then(function() { renderProveedores(); }); },
    asambleas: function() { return Promise.all([loadJson('ASAMBLEAS'), loadJson('ASAMBLEA_ASISTENTES')]).then(function() { renderAsambleas(); }); },
    encuestas: function() { return Promise.all([loadJson('ENCUESTAS'), loadJson('ENCUESTAS_VOTOS'), loadJson('PARCELAS')]).then(function() { renderEncuestas(); }); },
    publicaciones: function() { return Promise.all([loadJson('PUBLICACIONES'), loadJson('PARCELAS')]).then(function() { renderPublicaciones(); }); },
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
  var tabEl = document.getElementById('tab-' + tab);
  tabEl.classList.add('active');
  tabEl.setAttribute('aria-busy', 'true');
  await loadTabData(tab);
  tabEl.setAttribute('aria-busy', 'false');
}

function showSkeletons(tab) {
  var skeletons = {
    home: '<div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div>',
    finanzas: '<div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div><div class="skeleton skeleton-stat"></div>',
    parcelas: '<div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div>',
    noticias: '<div class="skeleton skeleton-news"></div><div class="skeleton skeleton-news"></div><div class="skeleton skeleton-news"></div>',
    documentos: '<div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div>',
    reclamos: '<div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div><div class="skeleton skeleton-doc"></div>',
    proveedores: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    asambleas: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    encuestas: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    publicaciones: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>',
    config: '<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>'
  };
  var tabEl = document.getElementById('tab-' + tab);
  if (!tabEl) {
    return;
  }
  tabEl.setAttribute('aria-busy', 'true');
  var content = tabEl.querySelector('.cards-grid, .timeline, .table-wrap, .stats, #reclamosList, #noticiasList, #flujoList');
  if (content) {
    content.innerHTML = skeletons[tab] || '<div class="skeleton skeleton-card"></div>';
  }
  if (tab === 'finanzas') {
    var fl = document.getElementById('flujoList');
    if (fl) {
      fl.innerHTML = '<div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div><div class="skeleton skeleton-row"></div>';
    }
    var cu = document.getElementById('cuotasLoading');
    var tg = document.getElementById('tableGastos');
    if (cu) {
      cu.style.display = '';
    }
    if (tg) {
      tg.style.display = 'none';
    }
  }
}

async function reloadTab(tab) {
  showSkeletons(tab);
  if (!DEMO_MODE) {
    loaded = {};
  }
  await loadTabData(tab);
  var tabEl = document.getElementById('tab-' + tab);
  if (tabEl) tabEl.setAttribute('aria-busy', 'false');
}
