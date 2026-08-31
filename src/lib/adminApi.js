// Minimal client for the admin API. Milestone 3 uses it for the shipping-zone
// editor; Milestone 4 reuses the same token + fetch pattern for /admin/orders.
//
// The JWT lives in localStorage (single-admin MVP, admin-only surface). Every call
// goes through the same-origin /api/v1 proxy, so the backend host is never shipped.

export const ADMIN_TOKEN_KEY = 'nankara.admin.token';

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token) {
  try {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch {
    /* private mode / quota — the page will just re-prompt for login */
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function parse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(`Admin API ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export async function adminLogin(email, password) {
  const res = await fetch('/api/v1/admin/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parse(res);
  setAdminToken(data.access_token);
  return data;
}

async function adminFetch(path, { method = 'GET', body } = {}) {
  const token = getAdminToken();
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return parse(res);
}

export function getShippingZones() {
  return adminFetch('/admin/shipping-zones');
}

export function updateShippingZone(id, body) {
  return adminFetch(`/admin/shipping-zones/${id}`, { method: 'PATCH', body });
}
