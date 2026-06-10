const SUPABASE_URL = 'https://mgzqmtcxnwhrcvfxujnw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BdYoJTpc0IkjCtHoarj6YQ_PVeSJlBt';

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function apiFetch(path, options) {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: { ...headers, ...(options?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Error ' + res.status);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json') ? res.json() : res.text();
}
