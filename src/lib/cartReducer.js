// Pure guest-cart reducer. A cart item is exactly { productId, quantity } (spec §8) —
// no price/name snapshot, so the UI always reflects the current backend price.
// Exported standalone so it can be unit-tested without React.

export const CART_ACTIONS = {
  HYDRATE: 'HYDRATE',
  ADD: 'ADD',
  INCREMENT: 'INCREMENT',
  DECREMENT: 'DECREMENT',
  SET_QUANTITY: 'SET_QUANTITY',
  REMOVE: 'REMOVE',
  CLEAR: 'CLEAR',
};

export const MIN_QTY = 1;
export const MAX_QTY = 99;

function clampQty(value) {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return null;
  if (n < MIN_QTY) return MIN_QTY;
  if (n > MAX_QTY) return MAX_QTY;
  return n;
}

function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

// Normalise arbitrary input (e.g. from localStorage) into a clean item list:
// integer ids, clamped quantities, de-duplicated by productId (quantities summed).
export function sanitizeItems(raw) {
  if (!Array.isArray(raw)) return [];
  const byId = new Map();
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const productId = Number(entry.productId);
    if (!isValidId(productId)) continue;
    const qty = clampQty(entry.quantity);
    if (qty === null) continue;
    const existing = byId.get(productId);
    byId.set(productId, existing ? clampQty(existing + qty) : qty);
  }
  return Array.from(byId, ([productId, quantity]) => ({ productId, quantity }));
}

export function cartReducer(state, action) {
  switch (action.type) {
    case CART_ACTIONS.HYDRATE:
      return { items: sanitizeItems(action.items) };

    case CART_ACTIONS.ADD: {
      if (!isValidId(action.productId)) return state;
      const addQty = clampQty(action.quantity ?? 1) ?? MIN_QTY;
      const existing = state.items.find((i) => i.productId === action.productId);
      const items = existing
        ? state.items.map((i) =>
            i.productId === action.productId
              ? { ...i, quantity: clampQty(i.quantity + addQty) }
              : i
          )
        : [...state.items, { productId: action.productId, quantity: addQty }];
      return { items };
    }

    case CART_ACTIONS.INCREMENT:
      return {
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: clampQty(i.quantity + 1) }
            : i
        ),
      };

    case CART_ACTIONS.DECREMENT: {
      const items = state.items
        .map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: Math.trunc(i.quantity) - 1 }
            : i
        )
        .filter((i) => i.quantity >= MIN_QTY);
      return { items };
    }

    case CART_ACTIONS.SET_QUANTITY: {
      const qty = clampQty(action.quantity);
      if (qty === null) return state;
      return {
        items: state.items.map((i) =>
          i.productId === action.productId ? { ...i, quantity: qty } : i
        ),
      };
    }

    case CART_ACTIONS.REMOVE:
      return { items: state.items.filter((i) => i.productId !== action.productId) };

    case CART_ACTIONS.CLEAR:
      return { items: [] };

    default:
      return state;
  }
}
