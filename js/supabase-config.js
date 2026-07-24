var SUPABASE_URL = 'https://kxacuszfhyhxngeazuze.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4YWN1c3pmaHloeG5nZWF6dXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0OTY1MzQsImV4cCI6MjEwMDA3MjUzNH0.kwG5AEZ60dn6H1Y_pQq4rePn4inRs7a7NyDzvGa-P8E';

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
    if (configTab) {
      configTab.style.display = IS_ADMIN ? '' : 'none';
    }
    return;
  }
  if (!currentUser) {
    IS_ADMIN = false;
    if (configTab) {
      configTab.style.display = 'none';
    }
    return;
  }
  IS_ADMIN = currentUser.app_metadata && currentUser.app_metadata.role === 'admin';
  if (configTab) {
    configTab.style.display = IS_ADMIN ? '' : 'none';
  }
  updateAuthUI();
}

function updateAuthUI() {
  var loginBtn = document.getElementById('loginBtn');
  var logoutBtn = document.getElementById('logoutBtn');
  var userInfo = document.getElementById('userInfo');
  var adminBtns = document.querySelectorAll('.admin-only');
  if (currentUser) {
    if (loginBtn) {
      loginBtn.style.display = 'none';
    }
    if (logoutBtn) {
      logoutBtn.style.display = '';
    }
    if (userInfo) {
      userInfo.textContent = currentUser.email;
    }
    adminBtns.forEach(function(btn) { btn.style.display = IS_ADMIN ? '' : 'none'; });
  } else {
    if (loginBtn) {
      loginBtn.style.display = '';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
    if (userInfo) {
      userInfo.textContent = '';
    }
    adminBtns.forEach(function(btn) { btn.style.display = 'none'; });
  }
}

function showLoginModal() {
  var dialog = document.getElementById('loginDialog');
  if (dialog) {
    dialog.show();
  }
}

function closeLoginModal() {
  var dialog = document.getElementById('loginDialog');
  if (dialog) {
    dialog.close();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  var form = e.target;
  var email = form.email.value;
  var password = form.password.value;
  var errorEl = document.getElementById('loginError');
  if (errorEl) {
    errorEl.textContent = '';
  }

  var result = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
  if (result.error) {
    if (errorEl) {
      if (result.error.message.indexOf('Invalid login credentials') !== -1) {
        errorEl.textContent = 'Email o contraseña incorrectos';
      } else {
        errorEl.textContent = result.error.message;
      }
    }
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
  if (errorEl) {
    errorEl.textContent = '';
  }

  var result = await supabaseClient.auth.signUp({ email: email, password: password });
  if (result.error) {
    if (errorEl) {
      errorEl.textContent = result.error.message;
    }
  } else {
    if (errorEl) {
      errorEl.textContent = 'Revisa tu email para confirmar tu cuenta.';
    }
  }
}

async function supabaseInsert(table, data) {
  if (!currentUser) {
    showSnackbar('Debes iniciar sesión para guardar.', 'info');
    return null;
  }
  var result = await supabaseClient.from(table).insert(data).select();
  if (result.error) {
    console.error('Error inserting:', result.error);
    showSnackbar('Error al guardar: ' + result.error.message, 'error');
    return null;
  }
  return result.data;
}

async function supabaseUpdate(table, id, data) {
  if (!currentUser) {
    showSnackbar('Debes iniciar sesión.', 'info');
    return null;
  }
  var result = await supabaseClient.from(table).update(data).eq('id', id).select();
  if (result.error) {
    console.error('Error updating:', result.error);
    showSnackbar('Error al actualizar: ' + result.error.message, 'error');
    return null;
  }
  return result.data;
}

async function supabaseDelete(table, id) {
  if (!currentUser) {
    showSnackbar('Debes iniciar sesión.', 'info');
    return null;
  }
  var result = await supabaseClient.from(table).delete().eq('id', id);
  if (result.error) {
    console.error('Error deleting:', result.error);
    showSnackbar('Error al eliminar: ' + result.error.message, 'error');
    return null;
  }
  return true;
}

async function supabaseUpload(file, bucket, folder) {
  if (!currentUser) {
    showSnackbar('Debes iniciar sesión.', 'info');
    return null;
  }

  if (file.type.startsWith('image/') && file.size > 500 * 1024) {
    var opts = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    try {
      file = await imageCompression(file, opts);
    } catch (e) {
      console.warn('Compresión fallida, subiendo original:', e);
    }
  }

  var ext = file.name.split('.').pop();
  var dir = folder || currentUser.id;
  var path = dir + '/' + Date.now() + '.' + ext;
  var result = await supabaseClient.storage.from(bucket).upload(path, file);
  if (result.error) {
    console.error('Error uploading:', result.error);
    showSnackbar('Error al subir archivo: ' + result.error.message, 'error');
    return null;
  }
  var urlResult = await supabaseClient.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (urlResult.error) {
    console.error('Error creating signed URL:', urlResult.error);
    showSnackbar('Error al generar enlace: ' + urlResult.error.message, 'error');
    return null;
  }
  return urlResult.data.signedUrl;
}

function showSignupForm() {
  var dialog = document.getElementById('loginDialog');
  var headline = dialog ? dialog.querySelector('[slot="headline"]') : null;
  var form = document.getElementById('loginForm');
  if (headline) {
    headline.textContent = 'Crear cuenta';
  }
  if (form) {
    form.onsubmit = handleSignup;
    var errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.textContent = '';
    }
  }
}

function showLoginForm() {
  var dialog = document.getElementById('loginDialog');
  var headline = dialog ? dialog.querySelector('[slot="headline"]') : null;
  var form = document.getElementById('loginForm');
  if (headline) {
    headline.textContent = 'Iniciar sesión';
  }
  if (form) {
    form.onsubmit = handleLogin;
    var errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.textContent = '';
    }
  }
}
