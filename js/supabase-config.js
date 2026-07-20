var SUPABASE_URL = 'https://kxacuszfhyhxngeazuze.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZm51c3lrZnZjYXJkdW5taWxxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQzMTk5NzQsImV4cCI6MjA5OTg5NTk3NH0.r6vvxtNutgkEc9thD4IUucpVzxGLHkE7_ovgoqKMUd8';

var supabaseClient = null;
var currentUser = null;
var IS_ADMIN = false;

function initSupabase() {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseClient.auth.onAuthStateChange(function(event, session) {
      currentUser = session ? session.user : null;
      updateAuthUI();
      checkAdmin();
    });
    supabaseClient.auth.getSession().then(function(result) {
      currentUser = result.data.session ? result.data.session.user : null;
      updateAuthUI();
      checkAdmin();
    });
    return true;
  }
  return false;
}

async function checkAdmin() {
  var configTab = document.getElementById('configTabBtn');
  if (DEMO_MODE) {
    IS_ADMIN = !!currentUser;
    if (configTab) configTab.style.display = IS_ADMIN ? '' : 'none';
    return;
  }
  if (!currentUser) {
    IS_ADMIN = false;
    if (configTab) configTab.style.display = 'none';
    return;
  }
  IS_ADMIN = currentUser.user_metadata && currentUser.user_metadata.role === 'admin';
  if (configTab) configTab.style.display = IS_ADMIN ? '' : 'none';
  updateAuthUI();
}

function updateAuthUI() {
  var loginBtn = document.getElementById('loginBtn');
  var logoutBtn = document.getElementById('logoutBtn');
  var userInfo = document.getElementById('userInfo');
  var addBtns = document.querySelectorAll('.form-link');
  var adminBtns = document.querySelectorAll('.form-link.admin-only');
  if (currentUser) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = '';
    if (userInfo) userInfo.textContent = currentUser.email;
    addBtns.forEach(function(btn) { btn.style.display = 'none'; });
    adminBtns.forEach(function(btn) { btn.style.display = IS_ADMIN ? '' : 'none'; });
    var userBtns = document.querySelectorAll('.form-link:not(.admin-only)');
    userBtns.forEach(function(btn) { btn.style.display = ''; });
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfo) userInfo.textContent = '';
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

async function supabaseUpload(file, bucket, folder) {
  if (!currentUser) {
    alert('Debes iniciar sesión para subir archivos.');
    return null;
  }
  var ext = file.name.split('.').pop();
  var dir = folder || currentUser.id;
  var path = dir + '/' + Date.now() + '.' + ext;
  var result = await supabaseClient.storage.from(bucket).upload(path, file);
  if (result.error) {
    console.error('Error uploading:', result.error);
    alert('Error al subir archivo: ' + result.error.message);
    return null;
  }
  var urlResult = supabaseClient.storage.from(bucket).getPublicUrl(path);
  return urlResult.data.publicUrl;
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
