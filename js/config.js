var DEMO_MODE = localStorage.getItem('demoMode') !== 'false';
document.getElementById('demoToggle').textContent = DEMO_MODE ? 'Salir de modo demo' : 'Ir a modo demo';
document.getElementById('demoToggle').classList.toggle('active', DEMO_MODE);

var GASTOS = [];
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
  document.getElementById('demoToggle').textContent = DEMO_MODE ? 'Salir de modo demo' : 'Ir a modo demo';
  document.getElementById('demoToggle').classList.toggle('active', DEMO_MODE);
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
document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';

function toggleTheme() {
  isDark = !isDark;
  document.body.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
}

initSupabase();
