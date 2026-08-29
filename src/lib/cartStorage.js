// localStorage persistence for the guest cart. A versioned envelope so the schema can
// change later; anything unexpected (old version, corrupt JSON, private-mode throw)
// is treated as an empty cart rather than an error.

import { sanitizeItems } from './cartReducer';

export const CART_STORAGE_KEY = 'nankara.cart.v1';

export function readCart() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return [];
    return sanitizeItems(parsed.items);
  } catch {
    return [];
  }
}

export function writeCart(items) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify({ items: sanitizeItems(items) })
    );
  } catch {
    // Quota exceeded or storage unavailable (private mode) — non-fatal.
  }
}
