// Client for the admin API — products, categories, media, shipping zones, orders,
// dashboard overview.
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
  const hasBody = body !== undefined;
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });
  return parse(res);
}

// Multipart upload — adminFetch can't do this (it forces JSON). The browser sets
// the multipart boundary, so we must NOT set content-type ourselves.
async function adminUpload(path, formData) {
  const token = getAdminToken();
  const res = await fetch(`/api/v1${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  return parse(res);
}

// ── Products ──────────────────────────────────────────────────────────────────

export function getAdminProducts() {
  return adminFetch('/admin/products');
}

export function getAdminProduct(id) {
  return adminFetch(`/admin/products/${id}`);
}

export function createProduct(body) {
  return adminFetch('/admin/products', { method: 'POST', body });
}

export function updateProduct(id, body) {
  return adminFetch(`/admin/products/${id}`, { method: 'PATCH', body });
}

// The backend expects a bare JSON array of {url, public_id, alt_text, is_primary};
// list order becomes sort order, and it replaces the whole set.
export function replaceProductImages(id, images) {
  return adminFetch(`/admin/products/${id}/images`, { method: 'PUT', body: images });
}

export function getAdminCategories() {
  return adminFetch('/admin/categories');
}

export function createCategory(body) {
  return adminFetch('/admin/categories', { method: 'POST', body });
}

export function uploadMedia(file) {
  const fd = new FormData();
  fd.append('file', file);
  return adminUpload('/admin/media/upload', fd);
}

// ── Shipping ──────────────────────────────────────────────────────────────────

export function getShippingZones() {
  return adminFetch('/admin/shipping-zones');
}

export function updateShippingZone(id, body) {
  return adminFetch(`/admin/shipping-zones/${id}`, { method: 'PATCH', body });
}

export function getOverview() {
  return adminFetch('/admin/overview');
}

export function getAdminOrders({ status } = {}) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return adminFetch(`/admin/orders${qs}`);
}

export function getAdminOrder(id) {
  return adminFetch(`/admin/orders/${id}`);
}

export function updateAdminOrderStatus(id, status) {
  return adminFetch(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}
