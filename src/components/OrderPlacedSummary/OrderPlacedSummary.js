'use client';

import Price from '../Price/Price';
import styles from './OrderPlacedSummary.module.css';

// Shown after POST /api/v1/orders succeeds. The order exists as PENDING_PAYMENT;
// the Paystack hand-off is Milestone 4, so the pay action is disabled for now and
// the bag is deliberately kept.
export default function OrderPlacedSummary({ order }) {
  return (
    <div className={styles.wrap} id="order-placed">
      <p className="section-label">Order received</p>
      <h1 className={styles.heading}>Your bag is reserved.</h1>
      <p className={styles.reference}>
        Reference <strong>{order.reference}</strong>
      </p>
      <p className={styles.body}>
        We&apos;ve saved your order and delivery details. Secure payment with Paystack
        is opening shortly — your bag stays reserved until then, and we&apos;ll email{' '}
        <strong>{order.customer.email}</strong> when you can complete it.
      </p>

      <ul className={styles.items}>
        {order.items.map((item, i) => (
          <li key={i} className={styles.item}>
            <span>
              {item.product_name}
              <span className={styles.qty}> × {item.quantity}</span>
            </span>
            <Price amountNgn={item.subtotal} variant="inline" />
          </li>
        ))}
      </ul>

      <div className={styles.line}>
        <span>Subtotal</span>
        <Price amountNgn={order.subtotal} variant="inline" />
      </div>
      <div className={styles.line}>
        <span>Shipping — {order.delivery.city}, {order.delivery.country}</span>
        <Price amountNgn={order.shipping_amount} variant="inline" />
      </div>
      <div className={`${styles.line} ${styles.total}`}>
        <span>Total</span>
        <Price amountNgn={order.total} variant="inline" />
      </div>

      <button type="button" className="btn btn-dark" id="order-pay" disabled>
        Pay with Paystack — opening soon
      </button>

      <div className={styles.measure}>
        <p className={styles.measureTitle}>Made for your fit</p>
        <p className={styles.measureBody}>
          After payment is confirmed, our team will contact you to collect the
          measurements required to tailor your piece.
        </p>
      </div>
    </div>
  );
}
