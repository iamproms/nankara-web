import { describe, expect, it } from 'vitest';

import { formatNgn, formatUsdApprox, toUsdApprox } from './currency';

describe('formatNgn', () => {
  it('groups thousands and shows no decimals', () => {
    const out = formatNgn(150000);
    expect(out).toMatch(/150,000/);
    expect(out).not.toMatch(/\.\d/);
  });

  it('handles invalid input as zero', () => {
    expect(formatNgn(NaN)).toMatch(/0/);
  });
});

describe('toUsdApprox', () => {
  it('rounds up so USD is never understated', () => {
    // 150000 / 1600 = 93.75 -> 94
    expect(toUsdApprox(150000, 1600)).toBe(94);
  });

  it('respects a custom rate', () => {
    expect(toUsdApprox(200000, 1000)).toBe(200);
  });

  it('returns null for non-positive or non-finite amounts', () => {
    expect(toUsdApprox(0)).toBeNull();
    expect(toUsdApprox(-5)).toBeNull();
    expect(toUsdApprox(NaN)).toBeNull();
  });

  it('returns null for an invalid rate', () => {
    expect(toUsdApprox(1000, 0)).toBeNull();
    expect(toUsdApprox(1000, -3)).toBeNull();
  });
});

describe('formatUsdApprox', () => {
  it('formats with the approximate label', () => {
    expect(formatUsdApprox(150000, 1600)).toBe('Approx. $94 USD');
  });

  it('groups thousands', () => {
    expect(formatUsdApprox(20000000, 1000)).toBe('Approx. $20,000 USD');
  });

  it('returns null when there is nothing to show', () => {
    expect(formatUsdApprox(0)).toBeNull();
    expect(formatUsdApprox(NaN)).toBeNull();
  });
});
