// Supabase Auth via REST API (no JS client library needed)
const SUPABASE_AUTH_URL = 'https://mgzqmtcxnwhrcvfxujnw.supabase.co/auth/v1';

async function supabaseSignIn(email, password) {
  const res = await fetch(SUPABASE_AUTH_URL + '/token?grant_type=password', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: { message: data.error_description || data.msg || 'Error de autenticación' } };
  return { data: { user: data.user, session: { access_token: data.access_token, refresh_token: data.refresh_token, user: data.user } }, error: null };
}

async function supabaseSignUp(email, password) {
  const res = await fetch(SUPABASE_AUTH_URL + '/signup', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) return { data: null, error: { message: data.msg || data.error_description || 'Error al crear cuenta' } };
  return { data: { user: data }, error: null };
}

async function supabaseSignOut(accessToken) {
  await fetch(SUPABASE_AUTH_URL + '/logout', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
  });
}

async function supabaseGetSession() {
  const accessToken = localStorage.getItem('sb-access-token');
  const refreshToken = localStorage.getItem('sb-refresh-token');
  if (!accessToken) return { data: { session: null }, error: null };

  // Verify token is still valid by getting user
  const res = await fetch(SUPABASE_AUTH_URL + '/user', {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + accessToken,
    },
  });
  if (!res.ok) {
    // Try refreshing
    if (refreshToken) {
      const refreshRes = await fetch(SUPABASE_AUTH_URL + '/token?grant_type=refresh_token', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        localStorage.setItem('sb-access-token', refreshData.access_token);
        localStorage.setItem('sb-refresh-token', refreshData.refresh_token);
        return { data: { session: { access_token: refreshData.access_token, refresh_token: refreshData.refresh_token, user: refreshData.user } }, error: null };
      }
    }
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
    return { data: { session: null }, error: null };
  }
  const user = await res.json();
  return { data: { session: { access_token: accessToken, refresh_token: refreshToken, user } }, error: null };
}

async function supabaseUpdatePassword(newPassword, accessToken) {
  const res = await fetch(SUPABASE_AUTH_URL + '/user', {
    method: 'PUT',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) {
    const data = await res.json();
    return { error: { message: data.msg || 'Error al cambiar contraseña' } };
  }
  return { error: null };
}

async function supabaseResetPassword(email) {
  const res = await fetch(SUPABASE_AUTH_URL + '/recover', {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const data = await res.json();
    return { error: { message: data.msg || data.error_description || 'Error al enviar correo' } };
  }
  return { error: null };
}
