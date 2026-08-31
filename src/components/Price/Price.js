'use client';

import { formatNgn, formatUsdApprox } from '../../lib/currency';
import { useInternationalVisitor } from '../../hooks/useInternationalVisitor';
import styles from './Price.module.css';

// NGN is always shown. The approximate USD line appears only for visitors who look
// international (revealed after mount, so it never causes a hydration mismatch).
export default function Price({ amountNgn, variant = 'inline', className = '' }) {
  const isInternational = useInternationalVisitor();
  const usd = isInternational ? formatUsdApprox(amountNgn) : null;

  return (
    <span className={`${styles.price} ${styles[variant] || ''} ${className}`}>
      <span className={styles.ngn}>{formatNgn(amountNgn)}</span>
      {usd && <span className={styles.usd}>{usd}</span>}
    </span>
  );
}
