async function loginUser(username, password) {
  try {
    const data = await apiFetch(
      'usuarios?username=eq.' + encodeURIComponent(username) + '&password=eq.' + encodeURIComponent(password) + '&select=*'
    );
    if (!data || data.length === 0) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }
    const u = data[0];
    return {
      ok: true,
      user: { username: u.username, name: u.name, role: u.role, barrio: u.barrio },
    };
  } catch (err) {
    return { ok: false, error: 'Error de conexión: ' + err.message };
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
