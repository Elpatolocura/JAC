async function loginUser(username, password) {
  try {
    // Buscar por username en usuarios
    let data = await apiFetch(
      'usuarios?username=eq.' + encodeURIComponent(username) + '&select=*'
    );
    if (data && data.length > 0) {
      const u = data[0];
      const storedPass = u.password || '';

      if (password === storedPass) {
        return {
          ok: true,
          user: { username: u.username, name: u.name, role: u.role, ciudad: u.ciudad || '', barrio: u.barrio, cedula: u.cedula || '' },
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

    if (password !== storedPassword && password !== r.cedula) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }

    return {
      ok: true,
      user: {
        username: r.cedula,
        name: r.nombres + ' ' + r.apellidos,
        role: r.role || 'Afiliado',
        ciudad: r.ciudad || '',
        barrio: r.barrio,
        registroId: r.id,
        cedula: r.cedula,
      },
      mustChangePassword: false,
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
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
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

    // Verificar que no exista otro usuario con el mismo rol en el mismo barrio
    const mismoRol = await apiFetch(
      'usuarios?barrio=eq.' + encodeURIComponent(campos.barrio) + '&role=eq.' + encodeURIComponent(campos.role) + '&select=id'
    );
    if (mismoRol && mismoRol.length > 0) {
      return { ok: false, error: 'Ya existe un ' + campos.role + ' en el barrio ' + campos.barrio + '. Cada barrio solo puede tener un usuario por rol.' };
    }

    // Crear usuario
    await apiFetch('usuarios', {
      method: 'POST',
      body: JSON.stringify({
        username: campos.username,
        password: campos.password,
        email: campos.email || '',
        cedula: campos.cedula || '',
        name: campos.name,
        role: campos.role,
        ciudad: campos.ciudad || '',
        barrio: campos.barrio,
        cambio_requerido: false,
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

async function deleteActa(id) {
  try {
    const url = SUPABASE_URL + '/rest/v1/actas?id=eq.' + encodeURIComponent(id);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal',
      },
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
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

async function getActas() {
  try {
    return await apiFetch('actas?order=created_at.desc&select=*');
  } catch {
    return [];
  }
}

async function saveActa(campos) {
  try {
    const result = await apiFetch('actas', {
      method: 'POST',
      headers: { 'Prefer': 'return=representation' },
      body: JSON.stringify(campos),
    });
    return { ok: true, data: result && result.length > 0 ? result[0] : null };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function updateRegistro(id, campos) {
  try {
    const url = SUPABASE_URL + '/rest/v1/registros?id=eq.' + encodeURIComponent(id);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(campos),
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
    return { ok: false, error: text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkCedulaDuplicada(cedula) {
  try {
    const data = await apiFetch(
      'registros?cedula=eq.' + encodeURIComponent(cedula) + '&select=ciudad,barrio'
    );
    return data && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

async function saveSoporte(data) {
  try {
    await apiFetch('soporte', {
      method: 'POST',
      body: JSON.stringify({
        asunto: data.asunto,
        mensaje: data.mensaje,
        usuario: data.usuario || '',
        barrio: data.barrio || '',
        created_at: new Date().toISOString(),
      }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function getUsuarios() {
  try { return await apiFetch('usuarios?select=*'); }
  catch (e) { console.error('getUsuarios error:', e); return []; }
}

// ===== REUNIONES (videollamadas) =====

async function getReuniones() {
  try { return await apiFetch('reuniones?order=created_at.desc&select=*'); }
  catch { return []; }
}

async function saveReunion(data) {
  try {
    await apiFetch('reuniones', { method: 'POST', body: JSON.stringify(data) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

async function updateReunion(id, data) {
  try {
    await apiFetch('reuniones?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(data),
    });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

// Invitaciones
async function getInvitaciones() {
  try { return await apiFetch('invitaciones_reunion?order=created_at.desc&select=*'); }
  catch { return []; }
}

async function saveInvitacion(data) {
  try {
    await apiFetch('invitaciones_reunion', { method: 'POST', body: JSON.stringify(data) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

async function updateInvitacion(id, data) {
  try {
    await apiFetch('invitaciones_reunion?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(data),
    });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

// Invitados externos
async function getInvitadosExternos() {
  try { return await apiFetch('invitados_externos?order=created_at.desc&select=*'); }
  catch { return []; }
}

async function saveInvitadoExterno(data) {
  try {
    await apiFetch('invitados_externos', { method: 'POST', body: JSON.stringify(data) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

async function updateInvitadoExterno(id, data) {
  try {
    await apiFetch('invitados_externos?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(data),
    });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

// Asistencia
async function getAsistencia() {
  try { return await apiFetch('asistencia_reuniones?order=hora_ingreso.asc&select=*'); }
  catch { return []; }
}

async function saveAsistencia(data) {
  try {
    await apiFetch('asistencia_reuniones', { method: 'POST', body: JSON.stringify(data) });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

async function updateAsistencia(id, data) {
  try {
    await apiFetch('asistencia_reuniones?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH', headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(data),
    });
    return { ok: true };
  } catch (err) { return { ok: false, error: err.message }; }
}

async function saveSolicitudEliminacion(data) {
  try {
    await apiFetch('solicitudes_eliminacion', {
      method: 'POST',
      body: JSON.stringify({
        registro_id: data.registroId,
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedula: data.cedula,
        barrio: data.barrio,
        motivos: data.motivos,
        observacion: data.observacion || '',
        solicitado_por: data.solicitadoPor || '',
        created_at: new Date().toISOString(),
      }),
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
