async function loginUser(username, password) {
  try {
    // Buscar primero en usuarios (presidentes/secretarios)
    let data = await apiFetch(
      'usuarios?username=eq.' + encodeURIComponent(username) + '&password=eq.' + encodeURIComponent(password) + '&select=*'
    );
    if (data && data.length > 0) {
      const u = data[0];
      return {
        ok: true,
        user: { username: u.username, name: u.name, role: u.role, barrio: u.barrio },
        mustChangePassword: false,
      };
    }

    // Si no, buscar por cédula en registros
    data = await apiFetch(
      'registros?cedula=eq.' + encodeURIComponent(username) + '&select=*'
    );
    if (!data || data.length === 0) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }

    const r = data[0];

    // Si no tiene contraseña guardada, se asigna la cédula como default
    const storedPassword = r.password || r.cedula;

    if (password !== storedPassword && password !== r.cedula) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }

    const mustChange = password === r.cedula || !r.password;

    return {
      ok: true,
      user: {
        username: r.cedula,
        name: r.nombres + ' ' + r.apellidos,
        role: r.role || 'Afiliado',
        barrio: r.barrio,
        registroId: r.id,
      },
      mustChangePassword: mustChange,
    };
  } catch (err) {
    return { ok: false, error: 'Error de conexión: ' + err.message };
  }
}

async function changePassword(cedula, newPassword) {
  try {
    // Intentar con columna password primero
    const res = await fetch(SUPABASE_URL + '/rest/v1/registros?cedula=eq.' + encodeURIComponent(cedula), {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) return { ok: true };

    // Si falló porque no existe la columna, dar error claro
    const text = await res.text();
    if (text.includes('column') && text.includes('password')) {
      return { ok: false, error: 'Ejecutá en Supabase SQL: ALTER TABLE registros ADD COLUMN password TEXT DEFAULT \'\';' };
    }
    return { ok: false, error: text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function getRegistros() {
  try {
    return await apiFetch('registros?order=id.asc&select=*');
  } catch {
    return [];
  }
}

async function saveRegistro(campos) {
  try {
    await apiFetch('registros', {
      method: 'POST',
      body: JSON.stringify(campos),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkCedulaDuplicada(cedula) {
  try {
    const data = await apiFetch(
      'registros?cedula=eq.' + encodeURIComponent(cedula) + '&select=barrio'
    );
    return data && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}
