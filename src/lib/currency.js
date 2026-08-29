// NGN is the canonical product price (whole Naira, integer). USD is a display-only
// approximation shown to international visitors (spec §9). The rate lives here in one
// place so Milestone 3 can repoint it at a backend-supplied rate without touching
// call sites.

const FALLBACK_NGN_PER_USD = 1600;

const parsedRate = Number(process.env.NEXT_PUBLIC_NGN_PER_USD);
export const NGN_PER_USD =
  Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : FALLBACK_NGN_PER_USD;

function isValidAmount(amountNgn) {
  return Number.isFinite(amountNgn) && amountNgn > 0;
}

// "₦150,000" — explicit locale so Node (SSR) and the browser agree.
export function formatNgn(amountNgn) {
  const value = Number.isFinite(amountNgn) ? Math.round(amountNgn) : 0;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      currencyDisplay: 'symbol',
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `₦${value.toLocaleString('en-US')}`;
  }
}

// Approximate USD as a number, or null when the input isn't a usable amount.
export function toUsdApprox(amountNgn, rate = NGN_PER_USD) {
  if (!isValidAmount(amountNgn) || !Number.isFinite(rate) || rate <= 0) return null;
  // Round up so the approximate figure is never understated.
  return Math.ceil(amountNgn / rate);
}

// "Approx. $98 USD", or null when there's nothing meaningful to show.
export function formatUsdApprox(amountNgn, rate = NGN_PER_USD) {
  const usd = toUsdApprox(amountNgn, rate);
  if (usd === null) return null;
  return `Approx. $${usd.toLocaleString('en-US')} USD`;
}
