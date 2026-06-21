const SUPABASE_URL = 'https://mgzqmtcxnwhrcvfxujnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BdYoJTpc0IkjCtHoarj6YQ_PVeSJlBt';

async function getAuthHeaders() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + session.access_token,
        'Content-Type': 'application/json',
      };
    }
  } catch (e) { /* fall through */ }
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
}

async function apiFetch(path, options) {
  const headers = await getAuthHeaders();
  if (options?.headers) {
    Object.assign(headers, options.headers);
  }
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error ' + res.status);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : res.text();
}
