'use client';

import Price from '../Price/Price';
import MadeToMeasureNote from '../MadeToMeasureNote/MadeToMeasureNote';
import { formatNgn } from '../../lib/currency';
import styles from './CheckoutSummary.module.css';

// Order summary shown beside the checkout form (spec §10). Display only — the
// backend recalculates every figure when the order is placed (spec §24).
function shippingLabel(status, amountNgn) {
  switch (status) {
    case 'ok':
      return formatNgn(amountNgn);
    case 'loading':
      return 'Calculating…';
    case 'unavailable':
      return 'Unavailable for this address';
    case 'error':
      return 'Could not calculate';
    default:
      return 'Enter your address';
  }
}

export default function CheckoutSummary({
  rows,
  subtotalNgn,
  shippingStatus = 'idle',
  shippingAmountNgn = 0,
}) {
  const payable = rows.filter((r) => !r.unavailable && !r.outOfStock);
  const totalKnown = shippingStatus === 'ok';
  const totalNgn = subtotalNgn + (totalKnown ? shippingAmountNgn : 0);

  return (
    <div className={styles.summary} id="checkout-summary">
      <h2 className={styles.heading}>Order summary</h2>

      <ul className={styles.items}>
        {payable.map((row) => (
          <li key={row.item.productId} className={styles.item}>
            <span className={styles.itemName}>
              {row.product.name}
              <span className={styles.itemQty}> × {row.item.quantity}</span>
            </span>
            <Price amountNgn={row.lineTotalNgn} variant="inline" />
          </li>
        ))}
      </ul>

      <div className={styles.rowLine}>
        <span>Subtotal</span>
        <Price amountNgn={subtotalNgn} variant="inline" />
      </div>
      <div className={styles.rowLine}>
        <span>Shipping</span>
        <span className={styles.shipping}>
          {shippingLabel(shippingStatus, shippingAmountNgn)}
        </span>
      </div>
      <div className={`${styles.rowLine} ${styles.total}`}>
        <span>Total</span>
        {totalKnown ? (
          <Price amountNgn={totalNgn} variant="inline" />
        ) : (
          <span className={styles.shipping}>—</span>
        )}
      </div>

      <p className={styles.note}>Prices in NGN. Final total confirmed on the next step.</p>

      <MadeToMeasureNote className={styles.measure} />
    </div>
  );
}
