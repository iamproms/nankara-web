'use client';

import Price from '../Price/Price';
import styles from './CartSummary.module.css';

// Subtotal + a note that shipping/total is settled at checkout (Milestone 3). The CTA
// is passed in as children so the drawer and /cart page can supply their own.
export default function CartSummary({ subtotalNgn, variant = 'drawer', children }) {
  return (
    <div className={`${styles.summary} ${styles[variant] || ''}`}>
      <div className={styles.row}>
        <span className={styles.label}>Subtotal</span>
        <Price amountNgn={subtotalNgn} variant="inline" />
      </div>
      <p className={styles.note}>Shipping and total are calculated at checkout.</p>
      {children}
    </div>
  );
}
