var SUPABASE_URL = 'https://ebfnusykfvcardunmilq.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZm51c3lrZnZjYXJkdW5taWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTk5NzQsImV4cCI6MjA5OTg5NTk3NH0.r6vvxtNutgkEc9thD4IUucpVzxGLHkE7_ovgoqKMUd8';

var supabaseClient = null;
var currentUser = null;

function initSupabase() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseClient.auth.onAuthStateChange(function(event, session) {
      currentUser = session ? session.user : null;
      updateAuthUI();
    });
    supabaseClient.auth.getSession().then(function(result) {
      currentUser = result.data.session ? result.data.session.user : null;
      updateAuthUI();
    });
    return true;
  }
  return false;
}

function updateAuthUI() {
  var loginBtn = document.getElementById('loginBtn');
  var logoutBtn = document.getElementById('logoutBtn');
  var addBtns = document.querySelectorAll('.form-link');
  if (currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = '';
    addBtns.forEach(function(btn) { btn.style.display = ''; });
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
    addBtns.forEach(function(btn) { btn.style.display = 'none'; });
  }
}

function showLoginModal() {
  var modal = document.getElementById('loginModal');
  if (modal) modal.classList.add('active');
}

function closeLoginModal() {
  var modal = document.getElementById('loginModal');
  if (modal) modal.classList.remove('active');
}

async function handleLogin(e) {
  e.preventDefault();
  var form = e.target;
  var email = form.email.value;
  var password = form.password.value;
  var errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.textContent = '';

  var result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
  if (result.error) {
    if (errorEl) errorEl.textContent = result.error.message;
  } else {
    closeLoginModal();
    form.reset();
  }
}

async function handleLogout() {
  await supabaseClient.auth.signOut();
}

async function handleSignup(e) {
  e.preventDefault();
  var form = e.target;
  var email = form.email.value;
  var password = form.password.value;
  var errorEl = document.getElementById('loginError');
  if (errorEl) errorEl.textContent = '';

  var result = await supabaseClient.auth.signUp({ email: email, password: password });
  if (result.error) {
    if (errorEl) errorEl.textContent = result.error.message;
  } else {
    if (errorEl) errorEl.textContent = 'Revisa tu email para confirmar tu cuenta.';
  }
}

async function supabaseInsert(table, data) {
  if (!currentUser) {
    alert('Debes iniciar sesión para guardar datos.');
    return null;
  }
  var result = await supabaseClient.from(table).insert(data).select();
  if (result.error) {
    console.error('Error inserting:', result.error);
    alert('Error al guardar: ' + result.error.message);
    return null;
  }
  return result.data;
}

function showSignupForm() {
  var title = document.getElementById('loginModalTitle');
  var form = document.getElementById('loginForm');
  if (title) title.textContent = 'Crear cuenta';
  if (form) {
    form.onsubmit = handleSignup;
    var errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.textContent = '';
    var link = form.parentElement.querySelector('a');
    if (link) {
      link.textContent = 'Ya tengo cuenta';
      link.onclick = function() { showLoginForm(); return false; };
    }
  }
}

function showLoginForm() {
  var title = document.getElementById('loginModalTitle');
  var form = document.getElementById('loginForm');
  if (title) title.textContent = 'Iniciar sesión';
  if (form) {
    form.onsubmit = handleLogin;
    var errorEl = document.getElementById('loginError');
    if (errorEl) errorEl.textContent = '';
    var link = form.parentElement.querySelector('a');
    if (link) {
      link.textContent = 'Crear cuenta';
      link.onclick = function() { showSignupForm(); return false; };
    }
  }
}
