'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import Badge from '../../../components/Badge/Badge';
import { getMyOrders } from '../../../lib/accountApi';
import { formatNgn } from '../../../lib/currency';
import { orderStatusLabel } from '../../../lib/payment';
import styles from '../account.module.css';

const TONE = {
  PENDING_PAYMENT: 'wait', PAID: 'go', IN_PRODUCTION: 'work', READY: 'work',
  SHIPPED: 'work', DELIVERED: 'done', CANCELLED: 'stop',
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function AccountOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    getMyOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <>
      <h1 className={styles.heading}>Orders</h1>
      {orders === null && <p className={styles.muted}>Loading…</p>}
      {orders && orders.length === 0 && (
        <p className={styles.muted}>
          No orders yet. <Link href="/shop">Explore the collection.</Link>
        </p>
      )}
      {orders && orders.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Reference</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr
                key={o.reference}
                className={styles.rowLink}
                onClick={() => router.push(`/account/orders/${o.reference}`)}
              >
                <td>{o.reference}</td>
                <td>{formatNgn(o.total)}</td>
                <td><Badge tone={TONE[o.status] || 'muted'}>{orderStatusLabel(o.status)}</Badge></td>
                <td className={styles.muted}>{fmtDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
