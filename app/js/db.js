// ============================================
// Operaciones de base de datos (Supabase)
// ============================================

async function loginUser(username, password) {
  try {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Supabase no configurado' };

    const { data, error } = await sb
      .from('usuarios')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      return { ok: false, error: 'Usuario o contraseña incorrectos' };
    }

    return {
      ok: true,
      user: {
        username: data.username,
        name: data.name,
        role: data.role,
        barrio: data.barrio,
      },
    };
  } catch (err) {
    return { ok: false, error: 'Error de conexión: ' + err.message };
  }
}

async function getRegistros() {
  try {
    const sb = getSupabase();
    if (!sb) return [];
    const { data, error } = await sb.from('registros').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
}

async function saveRegistro(campos) {
  try {
    const sb = getSupabase();
    if (!sb) return { ok: false, error: 'Supabase no configurado' };

    const { error } = await sb.from('registros').insert([campos]);
    if (error) throw error;
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function checkCedulaDuplicada(cedula) {
  try {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('registros')
      .select('barrio')
      .eq('cedula', cedula)
      .maybeSingle();
    if (error) throw error;
    return data;
  } catch {
    return null;
  }
}
