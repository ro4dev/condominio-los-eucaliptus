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
  ASAMBLEAS: 'data/asambleas.json'
};

function toggleDemoMode() {
  DEMO_MODE = !DEMO_MODE;
  localStorage.setItem('demoMode', DEMO_MODE);
  document.getElementById('demoToggle').textContent = DEMO_MODE ? 'Salir de modo demo' : 'Ir a modo demo';
  document.getElementById('demoToggle').classList.toggle('active', DEMO_MODE);
  location.reload();
}

initSupabase();
