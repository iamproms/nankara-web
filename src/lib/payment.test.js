import { describe, expect, it } from 'vitest';

import {
  isPaid,
  nextFulfilmentStatuses,
  orderStatusLabel,
  paymentStatusLabel,
  readCallbackReference,
} from './payment';

describe('isPaid', () => {
  it('is false for a pending order', () => {
    expect(isPaid({ status: 'PENDING_PAYMENT' })).toBe(false);
  });

  it('is true once the order moves past pending', () => {
    for (const status of ['PAID', 'IN_PRODUCTION', 'READY', 'SHIPPED', 'DELIVERED']) {
      expect(isPaid({ status })).toBe(true);
    }
  });

  it('is false for a missing order', () => {
    expect(isPaid(null)).toBe(false);
    expect(isPaid(undefined)).toBe(false);
  });
});

describe('readCallbackReference', () => {
  it('prefers reference over trxref', () => {
    const params = new URLSearchParams('trxref=AAA&reference=BBB');
    expect(readCallbackReference(params)).toBe('BBB');
  });

  it('falls back to trxref', () => {
    expect(readCallbackReference(new URLSearchParams('trxref=AAA'))).toBe('AAA');
  });

  it('returns null when neither is present', () => {
    expect(readCallbackReference(new URLSearchParams(''))).toBe(null);
    expect(readCallbackReference(null)).toBe(null);
  });

  it('accepts a plain object', () => {
    expect(readCallbackReference({ reference: 'X' })).toBe('X');
  });
});

describe('status labels', () => {
  it('maps known order statuses', () => {
    expect(orderStatusLabel('IN_PRODUCTION')).toBe('In production');
    expect(orderStatusLabel('PENDING_PAYMENT')).toBe('Pending payment');
  });

  it('maps payment statuses and handles null', () => {
    expect(paymentStatusLabel('SUCCESS')).toBe('Paid');
    expect(paymentStatusLabel(null)).toBe('No payment');
  });
});

describe('nextFulfilmentStatuses', () => {
  it('offers forward moves plus cancel from PAID', () => {
    expect(nextFulfilmentStatuses('PAID')).toEqual(['IN_PRODUCTION', 'CANCELLED']);
  });

  it('is empty for terminal states', () => {
    expect(nextFulfilmentStatuses('DELIVERED')).toEqual([]);
    expect(nextFulfilmentStatuses('CANCELLED')).toEqual([]);
  });

  it('never offers PAID or PENDING_PAYMENT', () => {
    const all = Object.keys({
      PENDING_PAYMENT: 1, PAID: 1, IN_PRODUCTION: 1, READY: 1, SHIPPED: 1,
      DELIVERED: 1, CANCELLED: 1,
    }).flatMap(nextFulfilmentStatuses);
    expect(all).not.toContain('PAID');
    expect(all).not.toContain('PENDING_PAYMENT');
  });
});
