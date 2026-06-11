async function loginUser(username, password) {
  try {
    // Buscar por username en usuarios
    let data = await apiFetch(
      'usuarios?username=eq.' + encodeURIComponent(username) + '&select=*'
    );
    if (data && data.length > 0) {
      const u = data[0];
      const cedula = u.cedula || '';
      const storedPass = u.password || '';
      const cambioReq = u.cambio_requerido !== false;

      if (password === cedula && cedula !== '' && cambioReq) {
        return {
          ok: true,
          user: { username: u.username, name: u.name, role: u.role, barrio: u.barrio, cedula: cedula },
          mustChangePassword: true,
        };
      }

      if (password === storedPass) {
        return {
          ok: true,
          user: { username: u.username, name: u.name, role: u.role, barrio: u.barrio, cedula: cedula },
          mustChangePassword: false,
        };
      }

      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }

    // Si no, buscar por cédula en registros (afiliados)
    data = await apiFetch(
      'registros?cedula=eq.' + encodeURIComponent(username) + '&select=*'
    );
    if (!data || data.length === 0) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }

    const r = data[0];
    const storedPassword = r.password || r.cedula;
    const cambioReq = r.cambio_requerido !== false;

    if (password !== storedPassword && password !== r.cedula) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }

    const mustChange = (password === r.cedula || !r.password) && cambioReq;

    return {
      ok: true,
      user: {
        username: r.cedula,
        name: r.nombres + ' ' + r.apellidos,
        role: r.role || 'Afiliado',
        barrio: r.barrio,
        registroId: r.id,
        cedula: r.cedula,
      },
      mustChangePassword: mustChange,
    };
  } catch (err) {
    return { ok: false, error: 'Error de conexión: ' + err.message };
  }
}

async function changePassword(cedulaOrUsername, newPassword, isUsuario) {
  try {
    const table = isUsuario ? 'usuarios' : 'registros';
    const field = isUsuario ? 'username' : 'cedula';
    const url = SUPABASE_URL + '/rest/v1/' + table + '?' + field + '=eq.' + encodeURIComponent(cedulaOrUsername);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ password: newPassword, cambio_requerido: false }),
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
    if (text.includes('column') && (text.includes('password') || text.includes('cambio_requerido'))) {
      return { ok: false, error: 'Ejecutá en Supabase SQL: ALTER TABLE ' + table + ' ADD COLUMN cambio_requerido BOOLEAN DEFAULT TRUE;' };
    }
    return { ok: false, error: text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function registerUser(campos) {
  try {
    // Validar código de registro
    const codigos = await apiFetch(
      'codigos_registro?codigo=eq.' + encodeURIComponent(campos.codigo) + '&select=*'
    );
    if (!codigos || codigos.length === 0) {
      return { ok: false, error: 'Código de registro inválido' };
    }
    const codigoData = codigos[0];
    if (codigoData.usado) {
      return { ok: false, error: 'Este código de registro ya fue utilizado' };
    }

    // Verificar si el usuario ya existe
    const existentes = await apiFetch(
      'usuarios?username=eq.' + encodeURIComponent(campos.username) + '&select=id'
    );
    if (existentes && existentes.length > 0) {
      return { ok: false, error: 'El nombre de usuario ya está en uso' };
    }

    // Crear usuario
    await apiFetch('usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username: campos.username,
        password: campos.password,
        cedula: campos.cedula || '',
        name: campos.name,
        role: campos.role,
        barrio: campos.barrio,
        cambio_requerido: campos.cedula ? true : false,
      }),
    });

    // Marcar código como usado
    await apiFetch('codigos_registro?codigo=eq.' + encodeURIComponent(campos.codigo), {
      method: 'PATCH',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({ usado: true, usado_por: campos.username }),
    });

    return { ok: true };
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
