const SUPABASE_URL = 'https://mgzqmtcxnwhrcvfxujnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BdYoJTpc0IkjCtHoarj6YQ_PVeSJlBt';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    storage: window.localStorage,
  }
});
