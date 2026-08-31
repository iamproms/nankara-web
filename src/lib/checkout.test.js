import { describe, expect, it } from 'vitest';

import {
  buildOrderItems,
  buildOrderPayload,
  contactErrors,
  deliveryErrors,
  hasErrors,
  hasUnfulfillableRows,
} from './checkout';

const row = (productId, quantity, extra = {}) => ({
  item: { productId, quantity },
  product: { id: productId, name: `P${productId}`, price_ngn: 1000 },
  unavailable: false,
  outOfStock: false,
  lineTotalNgn: 1000 * quantity,
  ...extra,
});

describe('buildOrderItems', () => {
  it('maps every row to {product_id, quantity}', () => {
    expect(buildOrderItems([row(1, 2), row(5, 1)])).toEqual([
      { product_id: 1, quantity: 2 },
      { product_id: 5, quantity: 1 },
    ]);
  });

  it('sends unavailable / out-of-stock rows too (server rejects the order)', () => {
    const rows = [
      row(1, 1),
      row(2, 1, { unavailable: true, product: null }),
      row(3, 1, { outOfStock: true }),
    ];
    expect(buildOrderItems(rows)).toEqual([
      { product_id: 1, quantity: 1 },
      { product_id: 2, quantity: 1 },
      { product_id: 3, quantity: 1 },
    ]);
  });
});

describe('hasUnfulfillableRows', () => {
  it('is false for an all-available bag', () => {
    expect(hasUnfulfillableRows([row(1, 1), row(2, 3)])).toBe(false);
  });

  it('is true when a row is unavailable or out of stock', () => {
    expect(hasUnfulfillableRows([row(1, 1), row(2, 1, { unavailable: true })])).toBe(true);
    expect(hasUnfulfillableRows([row(3, 1, { outOfStock: true })])).toBe(true);
  });
});

describe('buildOrderPayload', () => {
  it('trims strings and shapes the request body', () => {
    const payload = buildOrderPayload([row(1, 1)], {
      contact: {
        firstName: ' Ada ',
        lastName: 'Obi',
        email: ' ada@example.com ',
        phone: ' +234 801 234 5678 ',
      },
      delivery: {
        countryCode: 'NG',
        countryName: 'Nigeria',
        address1: ' 12 Aptech Close ',
        address2: '',
        city: 'Lagos',
        stateRegion: 'Lagos',
        postalCode: '',
        notes: ' leave at gate ',
      },
    });

    expect(payload.contact).toEqual({
      first_name: 'Ada',
      last_name: 'Obi',
      email: 'ada@example.com',
      phone: '+234 801 234 5678',
    });
    expect(payload.delivery.address_1).toBe('12 Aptech Close');
    expect(payload.delivery.notes).toBe('leave at gate');
    expect(payload.delivery.country_code).toBe('NG');
    expect(payload.items).toEqual([{ product_id: 1, quantity: 1 }]);
  });
});

describe('contactErrors', () => {
  const ok = {
    firstName: 'Ada',
    lastName: 'Obi',
    email: 'ada@example.com',
    phone: '08012345678',
  };

  it('passes a complete contact', () => {
    expect(contactErrors(ok)).toEqual({});
  });

  it('flags missing names', () => {
    const e = contactErrors({ ...ok, firstName: '  ', lastName: '' });
    expect(e.firstName).toBeTruthy();
    expect(e.lastName).toBeTruthy();
  });

  it('flags a bad email', () => {
    expect(contactErrors({ ...ok, email: 'ada@' }).email).toBeTruthy();
    expect(contactErrors({ ...ok, email: 'nope' }).email).toBeTruthy();
  });

  it('flags a too-short phone', () => {
    expect(contactErrors({ ...ok, phone: '123' }).phone).toBeTruthy();
  });
});

describe('deliveryErrors', () => {
  const ok = {
    countryCode: 'NG',
    address1: '12 Aptech Close',
    city: 'Lagos',
    stateRegion: 'Lagos',
  };

  it('passes a complete delivery', () => {
    expect(deliveryErrors(ok)).toEqual({});
  });

  it('requires country, address, city and state/region', () => {
    const e = deliveryErrors({
      countryCode: '',
      address1: ' ',
      city: '',
      stateRegion: '',
    });
    expect(Object.keys(e).sort()).toEqual(
      ['address1', 'city', 'countryCode', 'stateRegion'].sort()
    );
  });

  it('accepts a free-text region for non-Nigeria addresses', () => {
    expect(
      deliveryErrors({
        countryCode: 'US',
        address1: '1 Main St',
        city: 'Austin',
        stateRegion: 'Texas',
      })
    ).toEqual({});
  });
});

describe('hasErrors', () => {
  it('is true when any object has keys', () => {
    expect(hasErrors({}, { a: 'x' })).toBe(true);
    expect(hasErrors({}, {})).toBe(false);
  });
});
