import { describe, expect, it } from 'vitest';

import {
  CART_ACTIONS,
  MAX_QTY,
  cartReducer,
  sanitizeItems,
} from './cartReducer';

const state = (items) => ({ items });

describe('cartReducer', () => {
  it('adds a new item', () => {
    const next = cartReducer(state([]), {
      type: CART_ACTIONS.ADD,
      productId: 1,
      quantity: 2,
    });
    expect(next.items).toEqual([{ productId: 1, quantity: 2 }]);
  });

  it('merges quantity when adding an item already in the cart', () => {
    const next = cartReducer(state([{ productId: 1, quantity: 2 }]), {
      type: CART_ACTIONS.ADD,
      productId: 1,
      quantity: 3,
    });
    expect(next.items).toEqual([{ productId: 1, quantity: 5 }]);
  });

  it('defaults ADD quantity to 1 and ignores invalid ids', () => {
    expect(
      cartReducer(state([]), { type: CART_ACTIONS.ADD, productId: 7 }).items
    ).toEqual([{ productId: 7, quantity: 1 }]);
    expect(
      cartReducer(state([]), { type: CART_ACTIONS.ADD, productId: 0, quantity: 1 }).items
    ).toEqual([]);
  });

  it('increments up to the max', () => {
    const next = cartReducer(state([{ productId: 1, quantity: MAX_QTY }]), {
      type: CART_ACTIONS.INCREMENT,
      productId: 1,
    });
    expect(next.items[0].quantity).toBe(MAX_QTY);
  });

  it('decrements and removes the row at zero', () => {
    const next = cartReducer(state([{ productId: 1, quantity: 1 }]), {
      type: CART_ACTIONS.DECREMENT,
      productId: 1,
    });
    expect(next.items).toEqual([]);
  });

  it('clamps SET_QUANTITY into range', () => {
    expect(
      cartReducer(state([{ productId: 1, quantity: 5 }]), {
        type: CART_ACTIONS.SET_QUANTITY,
        productId: 1,
        quantity: 0,
      }).items[0].quantity
    ).toBe(1);
    expect(
      cartReducer(state([{ productId: 1, quantity: 5 }]), {
        type: CART_ACTIONS.SET_QUANTITY,
        productId: 1,
        quantity: 200,
      }).items[0].quantity
    ).toBe(MAX_QTY);
  });

  it('ignores SET_QUANTITY with a non-numeric value', () => {
    const start = state([{ productId: 1, quantity: 5 }]);
    expect(
      cartReducer(start, {
        type: CART_ACTIONS.SET_QUANTITY,
        productId: 1,
        quantity: 'abc',
      })
    ).toBe(start);
  });

  it('removes and clears', () => {
    expect(
      cartReducer(state([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }]), {
        type: CART_ACTIONS.REMOVE,
        productId: 1,
      }).items
    ).toEqual([{ productId: 2, quantity: 1 }]);
    expect(
      cartReducer(state([{ productId: 1, quantity: 2 }]), { type: CART_ACTIONS.CLEAR }).items
    ).toEqual([]);
  });

  it('hydrates and sanitises stored items', () => {
    const next = cartReducer(state([]), {
      type: CART_ACTIONS.HYDRATE,
      items: [
        { productId: 1, quantity: 2 },
        { productId: 1, quantity: 3 },
        { productId: 'x', quantity: 1 },
        { productId: 4, quantity: 999 },
      ],
    });
    expect(next.items).toEqual([
      { productId: 1, quantity: 5 },
      { productId: 4, quantity: MAX_QTY },
    ]);
  });
});

describe('sanitizeItems', () => {
  it('returns [] for non-array input', () => {
    expect(sanitizeItems(null)).toEqual([]);
    expect(sanitizeItems({})).toEqual([]);
    expect(sanitizeItems('nope')).toEqual([]);
  });

  it('drops malformed entries', () => {
    expect(
      sanitizeItems([null, 5, { productId: 2 }, { quantity: 2 }, { productId: 3, quantity: 2 }])
    ).toEqual([{ productId: 3, quantity: 2 }]);
  });
});
