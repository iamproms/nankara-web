'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import Price from '../../../../components/Price/Price';
import { getMyOrder } from '../../../../lib/accountApi';
import { ORDER_JOURNEY, orderStatusStep } from '../../../../lib/account';
import styles from '../../account.module.css';

export default function AccountOrderDetailPage({ params }) {
  const { reference } = params;
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyOrder(reference)
      .then(setOrder)
      .catch((err) =>
        setError(err?.status === 404 ? 'notfound' : 'Could not load this order.')
      );
  }, [reference]);

  if (error === 'notfound') {
    return (
      <>
        <Link href="/account/orders" className={styles.backLink}>← All orders</Link>
        <p className={styles.muted}>Order not found.</p>
      </>
    );
  }
  if (error) return <p className={styles.muted}>{error}</p>;
  if (!order) return <p className={styles.muted}>Loading…</p>;

  const step = orderStatusStep(order.status);

  return (
    <>
      <Link href="/account/orders" className={styles.backLink}>← All orders</Link>
      <h1 className={styles.heading}>{order.reference}</h1>

      {step >= 0 && (
        <div className={styles.journey}>
          {ORDER_JOURNEY.map((label, i) => (
            <span
              key={label}
              className={`${styles.step} ${i <= step ? styles.stepDone : ''}`}
            >
              {label}
            </span>
          ))}
        </div>
      )}
      {step < 0 && (
        <p className={styles.muted}>
          This order is {order.status.replace(/_/g, ' ').toLowerCase()}.
        </p>
      )}

      <p className={styles.subheading}>Items</p>
      <table className={styles.table}>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i}>
              <td>{it.product_name}<span className={styles.muted}> × {it.quantity}</span></td>
              <td style={{ textAlign: 'right' }}>
                <Price amountNgn={it.subtotal} variant="inline" />
              </td>
            </tr>
          ))}
          <tr>
            <td className={styles.muted}>Subtotal</td>
            <td style={{ textAlign: 'right' }}>
              <Price amountNgn={order.subtotal} variant="inline" />
            </td>
          </tr>
          <tr>
            <td className={styles.muted}>Shipping</td>
            <td style={{ textAlign: 'right' }}>
              <Price amountNgn={order.shipping_amount} variant="inline" />
            </td>
          </tr>
          <tr>
            <td><strong>Total</strong></td>
            <td style={{ textAlign: 'right' }}>
              <strong><Price amountNgn={order.total} variant="inline" /></strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p className={styles.subheading}>Delivery</p>
      <p className={styles.muted}>
        {order.delivery_address_1}
        {order.delivery_address_2 ? `, ${order.delivery_address_2}` : ''}<br />
        {order.delivery_city}, {order.delivery_state_region}
        {order.delivery_postal_code ? ` ${order.delivery_postal_code}` : ''}<br />
        {order.delivery_country} · {order.customer_phone}
      </p>

      {order.payment_reference && (
        <>
          <p className={styles.subheading}>Payment</p>
          <p className={styles.muted}>Paystack reference {order.payment_reference}</p>
        </>
      )}
    </>
  );
}
