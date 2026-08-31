// Pure helpers for the payment + order-management flows. Kept framework-free so
// they can be unit-tested. The backend is authoritative for money and for the
// PAID transition — these only shape requests and map status to UI copy.

// An order that has moved past PENDING_PAYMENT has been paid (spec §13, §15).
export function isPaid(order) {
  return Boolean(order) && order.status !== 'PENDING_PAYMENT';
}

// Paystack appends `?trxref=...&reference=...` to the callback URL. Prefer
// `reference` (what we set), fall back to `trxref`.
export function readCallbackReference(searchParams) {
  if (!searchParams) return null;
  const get = typeof searchParams.get === 'function'
    ? (k) => searchParams.get(k)
    : (k) => searchParams[k];
  return get('reference') || get('trxref') || null;
}

const ORDER_STATUS_LABELS = {
  PENDING_PAYMENT: 'Pending payment',
  PAID: 'Paid',
  IN_PRODUCTION: 'In production',
  READY: 'Ready to ship',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

const PAYMENT_STATUS_LABELS = {
  PENDING: 'Pending',
  SUCCESS: 'Paid',
  FAILED: 'Failed',
  ABANDONED: 'Abandoned',
};

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status || '—';
}

export function paymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[status] || status || 'No payment';
}

// Mirror of the backend ALLOWED_STATUS_TRANSITIONS (app/orders/service.py). The
// backend stays authoritative (409 on anything else); this just builds the
// admin <select>.
const FULFILMENT_TRANSITIONS = {
  PENDING_PAYMENT: ['CANCELLED'],
  PAID: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function nextFulfilmentStatuses(status) {
  return FULFILMENT_TRANSITIONS[status] || [];
}
