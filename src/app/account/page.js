'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import { getMyOrders, resendVerification } from '../../lib/accountApi';
import { formatNgn } from '../../lib/currency';
import styles from './account.module.css';

export default function AccountOverviewPage() {
  const { user } = useCustomerAuth();
  const [orders, setOrders] = useState(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    getMyOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <>
      <h1 className={styles.heading}>Hello, {user.first_name}</h1>

      {!user.email_verified && (
        <p className={styles.banner}>
          Please confirm your email address.{' '}
          {resent ? (
            <span>Verification email sent.</span>
          ) : (
            <button
              type="button"
              onClick={() => resendVerification().then(() => setResent(true))}
            >
              Resend the link
            </button>
          )}
        </p>
      )}

      <p className={styles.subheading}>Recent order</p>
      {orders === null && <p className={styles.muted}>Loading…</p>}
      {orders && orders.length === 0 && (
        <p className={styles.muted}>
          No orders yet. <Link href="/shop">Explore the collection.</Link>
        </p>
      )}
      {orders && orders.length > 0 && (
        <div className={styles.card}>
          <Link href={`/account/orders/${orders[0].reference}`}>
            <strong>{orders[0].reference}</strong>
          </Link>
          {' — '}
          {formatNgn(orders[0].total)} · {orders[0].status.replace(/_/g, ' ').toLowerCase()}
        </div>
      )}
    </>
  );
}
