export const DIGI_ORIGIN = 'https://digi.emoldova.org';
const SESSION_KEY = 'digitizare.digiSession';

export function readDigiSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch (_) { return null; }
}

export function saveDigiSession(store) {
  if (!store.digiContext) return;
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(store)); } catch (_) { /* Storage may be full. */ }
}

export function clearDigiSession() { sessionStorage.removeItem(SESSION_KEY); }

export function handoffFromLocation() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const id = params.get('digi');
  const token = params.get('token');
  if (!id && !token) return null;
  // Remove capabilities from browser history immediately; never send them as a query/referrer.
  history.replaceState(null, '', location.pathname + location.search);
  if (!/^[a-f0-9-]{36}$/.test(id || '') || !/^[a-f0-9]{64}$/.test(token || '')) {
    throw new Error('Legătura primită de la Digi este invalidă. Deschide din nou documentul din Digi.');
  }
  return { id, token };
}

export async function digiRequest(api, path, context, body = {}) {
  const response = await fetch(api + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + context.token },
    body: JSON.stringify(body),
  });
  let data;
  try { data = await response.json(); } catch (_) { throw new Error('Serverul nu a confirmat cererea. Reîncearcă.'); }
  if (!response.ok || data.code !== 200) throw new Error(data.msg || 'Cererea către Digi nu a reușit.');
  return data;
}
