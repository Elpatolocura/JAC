// ===== CONFIGURACIÓN DE EMAIL (EmailJS) =====
var EMAILJS_CONFIG_KEY = 'jac_emailjs_config';

function getEmailJSConfig() {
  try { return JSON.parse(localStorage.getItem(EMAILJS_CONFIG_KEY)) || {}; } catch { return {}; }
}

function saveEmailJSConfig(config) {
  localStorage.setItem(EMAILJS_CONFIG_KEY, JSON.stringify(config));
}

async function enviarNotificacionCorreo(destinatario, asunto, mensaje) {
  var config = getEmailJSConfig();
  if (!config.publicKey || !config.serviceId || !config.templateId) {
    console.warn('EmailJS no configurado. Guardá las credenciales en Ajustes → Configurar correo');
    return { ok: false, error: 'EmailJS no configurado' };
  }

  try {
    var res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: config.serviceId,
        template_id: config.templateId,
        user_id: config.publicKey,
        template_params: {
          to_email: destinatario.email,
          to_name: destinatario.nombre || destinatario.email,
          subject: asunto,
          message: mensaje,
          reply_to: config.replyTo || '',
        },
      }),
    });
    if (res.ok) {
      return { ok: true };
    }
    var text = await res.text();
    return { ok: false, error: text };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function enviarInvitacionesReunion(reunionId, titulo, fecha, hora, lugar, invitados) {
  var asunto = 'Invitación a reunión - ' + titulo;
  var mensaje = 'Has sido invitado a la reunión:\n\n' +
    'Título: ' + titulo + '\n' +
    'Fecha: ' + fecha + '\n' +
    'Hora: ' + hora + '\n' +
    'Lugar: ' + lugar + '\n\n' +
    'Ingresá a la plataforma JAC para confirmar tu asistencia.';

  var resultados = [];
  for (var i = 0; i < invitados.length; i++) {
    var inv = invitados[i];
    if (!inv.email) continue;
    var r = await enviarNotificacionCorreo(
      { email: inv.email, nombre: inv.nombre },
      asunto,
      mensaje
    );
    resultados.push(r);
  }
  return resultados;
}

// Guardar notificación en Supabase
async function guardarNotificacion(data) {
  try {
    await apiFetch('notificaciones', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (e) {
    console.warn('Error guardando notificación:', e);
  }
}
