// ============================================
// Configuración de Supabase
// ============================================
// Reemplaza estos valores con los de tu proyecto:
// Ve a https://supabase.com -> Settings -> API
// ============================================

const SUPABASE_URL = 'https://mgzqmtcxnwhrcvfxujnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BdYoJTpc0IkjCtHoarj6YQ_PVeSJlBt';

// Inicializar cliente Supabase
const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function getSupabase() {
  if (!supabase) {
    alert('Error: Supabase no está configurado. Revisa app/js/supabase.js');
    return null;
  }
  return supabase;
}
