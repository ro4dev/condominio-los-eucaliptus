var DEMO_MODE = localStorage.getItem('demoMode') !== 'false';

function setMenuHeadline(id, text) {
  var el = document.getElementById(id);
  var headline = el && el.querySelector('[slot="headline"]');
  if (headline) {
    headline.textContent = text;
  }
}

function updateDemoMenu() {
  setMenuHeadline('menuDemo', DEMO_MODE ? 'Salir de modo demo' : 'Ir a modo demo');
}
updateDemoMenu();

var GASTOS = [];
var PAGOS = [];
var PARCELAS = [];
var PROPIETARIOS = [];
var NOTICIAS = [];
var FLUJO = [];
var DOCUMENTOS = [];
var RECLAMOS = [];
var PROVEEDORES = [];
var ASAMBLEAS = [];
var ASAMBLEA_ASISTENTES = [];
var ENCUESTAS = [];
var ENCUESTAS_VOTOS = [];

var loaded = { GASTOS: false };

var DEMO_FILES = {
  GASTOS: 'data/gastos.json',
  PAGOS: 'data/pagos.json',
  PARCELAS: 'data/parcelas.json',
  PROPIETARIOS: 'data/propietarios.json',
  NOTICIAS: 'data/noticias.json',
  FLUJO: 'data/ingresos_egresos.json',
  DOCUMENTOS: 'data/documentos.json',
  RECLAMOS: 'data/reclamos.json',
  PROVEEDORES: 'data/proveedores.json',
  ASAMBLEAS: 'data/asambleas.json',
  ASAMBLEA_ASISTENTES: 'data/asamblea_asistentes.json',
  ENCUESTAS: 'data/encuestas.json',
  ENCUESTAS_VOTOS: 'data/encuestas_votos.json',
  CONFIG: 'data/config.json'
};

function toggleDemoMode() {
  DEMO_MODE = !DEMO_MODE;
  localStorage.setItem('demoMode', DEMO_MODE);
  updateDemoMenu();
  location.reload();
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function parcelName(parcelaId) {
  if (!parcelaId) {
    return '';
  }
  var p = PARCELAS.find(function(x) { return x.id === parcelaId; });
  return p ? p.numero : parcelaId;
}

var isDark = localStorage.getItem('theme') === 'dark';
if (isDark) document.body.classList.add('dark');

function updateThemeMenu() {
  var icon = document.getElementById('menuTheme').querySelector('md-icon');
  icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  setMenuHeadline('menuTheme', isDark ? 'Modo claro' : 'Modo oscuro');
}
updateThemeMenu();

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeMenu();
  if (typeof updateChartTheme === 'function') updateChartTheme();
}

function toggleUserMenu() {
  var menu = document.getElementById('userMenu');
  if (menu) {
    menu.open = !menu.open;
  }
}

initSupabase();
