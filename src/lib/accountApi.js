// Client for the customer account API. Auth is an HttpOnly `nk_customer` session
// cookie set by the backend — nothing to store or attach here. Same-origin calls
// send the cookie automatically; the backend checks Origin on state-changing calls.

async function parse(res) {
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const error = new Error(`Account API ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

async function request(path, { method = 'GET', body } = {}) {
  const hasBody = body !== undefined;
  const res = await fetch(`/api/v1/account${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      accept: 'application/json',
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 204) return null;
  return parse(res);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (body) => request('/register', { method: 'POST', body });
export const login = (body) => request('/login', { method: 'POST', body });
export const logout = () => request('/logout', { method: 'POST' });
export const getMe = () => request('/me');
export const updateProfile = (body) => request('/me', { method: 'PATCH', body });
export const changePassword = (body) =>
  request('/password', { method: 'POST', body });
export const forgotPassword = (email) =>
  request('/password/forgot', { method: 'POST', body: { email } });
export const resetPassword = (body) =>
  request('/password/reset', { method: 'POST', body });
export const verifyEmail = (token) =>
  request('/verify-email', { method: 'POST', body: { token } });
export const resendVerification = () =>
  request('/verify-email/resend', { method: 'POST' });

// ── Orders ────────────────────────────────────────────────────────────────────
export const getMyOrders = () => request('/orders');
export const getMyOrder = (reference) =>
  request(`/orders/${encodeURIComponent(reference)}`);

// ── Addresses ─────────────────────────────────────────────────────────────────
export const getAddresses = () => request('/addresses');
export const createAddress = (body) =>
  request('/addresses', { method: 'POST', body });
export const updateAddress = (id, body) =>
  request(`/addresses/${id}`, { method: 'PATCH', body });
export const deleteAddress = (id) =>
  request(`/addresses/${id}`, { method: 'DELETE' });

// ── Measurements ──────────────────────────────────────────────────────────────
export const getMeasurements = () => request('/measurements');
export const saveMeasurements = (body) =>
  request('/measurements', { method: 'PUT', body });
