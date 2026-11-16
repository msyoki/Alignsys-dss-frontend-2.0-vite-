// DSS session handed over by M-Files in the link (simplejwt tokens). Kept for this browser tab only,
// under its own key: it never touches the main app's login ('authTokens').
const trimSlash = (s) => (s || '').replace(/\/+$/, '');
export const AUTH_URL = trimSlash(import.meta.env.VITE_AUTH_URL);
const KEY = 'dss_integration_tokens';

export class AuthError extends Error {}
export const EXPIRED_MESSAGE = 'Your DSS session from M-Files has expired. Open the document again from M-Files to send it.';

export const readTokens = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch { return null; }
};
const saveTokens = (t) => {
  try { sessionStorage.setItem(KEY, JSON.stringify(t)); } catch { /* storage unavailable */ }
};

// Reads the JWT payload (name, email, exp). Not a security check: the server verifies the token.
export const decodeToken = (token) => {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent([...atob(part)].map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

// The M-Files integration hands over the DSS session in the link:
//   /integration/sendforothers/{guid}?token=<access jwt>[&refresh=<refresh jwt>]&signers=…&name=…
// (#access=…&refresh=… in the fragment works too.) The tokens are saved for this tab and removed
// from the address bar, so they don't stay in history or get copied along with the link.
// Called once when the page mounts (not at import time, so other routes are never touched).
const TOKEN_PARAMS = ['token', 'access', 'refresh'];
let adoptedForUrl = null; // the page can mount twice while the app shell settles; read the link once
export const adoptTokensFromUrl = () => {
  if (adoptedForUrl === window.location.pathname) return;
  adoptedForUrl = window.location.pathname;
  // TEMPORARY DEBUG: the redirect URL exactly as received from M-Files, logged before anything is
  // read or removed, then what was extracted. Remove once the integration is confirmed: it prints
  // live DSS tokens.
  /* eslint-disable no-console */
  console.log(`[DSS integration] redirect URL as received (before token extraction):\n${window.location.href}`);
  console.log('[DSS integration] query parameters as received (raw, not decoded):');
  window.location.search.replace(/^\?/, '').split('&').filter(Boolean).forEach((p, i) => {
    const eq = p.indexOf('=');
    console.log(`  ${i + 1}. ${eq < 0 ? p : p.slice(0, eq)} = ${eq < 0 ? '(no value)' : p.slice(eq + 1)}`);
  });
  if (window.location.hash) console.log(`[DSS integration] fragment as received: ${window.location.hash}`);
  /* eslint-enable no-console */

  const query = new URLSearchParams(window.location.search);
  const hashRaw = window.location.hash.replace(/^#/, '');
  const hash = new URLSearchParams(hashRaw.includes('=') ? hashRaw : '');
  const access = query.get('token') || query.get('access') || hash.get('access') || hash.get('token');
  const refresh = query.get('refresh') || hash.get('refresh');

  /* eslint-disable no-console */
  const describe = (tok) => {
    const p = tok ? decodeToken(tok) : null;
    if (!p) return tok ? 'present but not a readable JWT' : 'not in the link';
    return {
      token_type: p.token_type,
      user: p.email || p.user_id,
      issued: p.iat ? new Date(p.iat * 1000).toISOString() : undefined,
      expires: p.exp ? new Date(p.exp * 1000).toISOString() : undefined,
      expired: p.exp ? p.exp * 1000 < Date.now() : undefined,
    };
  };
  console.log('[DSS integration] extracted access token:', describe(access));
  console.log('[DSS integration] extracted refresh token:', describe(refresh));
  /* eslint-enable no-console */

  if (!access) return;
  saveTokens(refresh ? { access, refresh } : { access });
  TOKEN_PARAMS.forEach((k) => query.delete(k));
  const tokenHash = TOKEN_PARAMS.some((k) => hash.has(k));
  const search = query.toString();
  try {
    window.history.replaceState(window.history.state, '', window.location.pathname
      + (search ? `?${search}` : '')
      + (hashRaw && !tokenHash ? `#${hashRaw}` : ''));
  } catch { /* leave the URL as it is */ }
};

const expired = (token, skewSeconds = 30) => {
  const exp = decodeToken(token)?.exp;
  return !exp || exp * 1000 < Date.now() + skewSeconds * 1000;
};

// True when the saved session can still be used (access valid, or refresh token valid).
export const hasSession = () => {
  const t = readTokens();
  return Boolean(t?.access && (!expired(t.access) || (t.refresh && !expired(t.refresh))));
};

async function refresh() {
  const t = readTokens();
  if (!t?.refresh || expired(t.refresh, 0)) return null;
  try {
    const res = await fetch(`${AUTH_URL}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ refresh: t.refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.access) return null;
    const next = { ...t, ...data };
    saveTokens(next);
    return next;
  } catch {
    return null;
  }
}

// fetch with the Bearer token; refreshes once when the token has expired or the server says 401.
export async function authFetch(url, options = {}) {
  let t = readTokens();
  if (t?.access && expired(t.access)) t = await refresh();
  if (!t?.access) throw new AuthError(EXPIRED_MESSAGE);
  const call = (token) => fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } });
  let res;
  try {
    res = await call(t.access);
    if (res.status === 401) {
      t = await refresh();
      if (!t) throw new AuthError(EXPIRED_MESSAGE);
      res = await call(t.access);
      if (res.status === 401) throw new AuthError(EXPIRED_MESSAGE);
    }
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new Error('Could not reach the DSS server. Check your connection and try again.');
  }
  return res;
}
