// ===== CONFIGURACIÓN DE EMAIL (EmailJS) =====
var EMAILJS_PUBLIC_KEY = 'dHvymfFP3YNmhEzge';
var EMAILJS_SERVICE_ID = 'service_xqnuxrp';
var EMAILJS_TEMPLATE_ID = 'template_gbvg0ah';

async function enviarNotificacionCorreo(destinatario, asunto, mensaje) {
  if (!destinatario || !destinatario.email) {
    return { ok: false, error: 'Destinatario sin correo' };
  }
  try {
    var res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: destinatario.email,
          to_name: destinatario.nombre || destinatario.email,
          subject: asunto,
          message: mensaje,
        },
      }),
    });
    if (res.ok) {
      return { ok: true };
    }
    var text = await res.text();
    console.error('EmailJS error response:', res.status, text);
    return { ok: false, error: 'HTTP ' + res.status + ': ' + text };
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
