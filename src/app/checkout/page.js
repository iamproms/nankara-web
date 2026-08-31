'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import CheckoutForm from '../../components/CheckoutForm/CheckoutForm';
import CheckoutSummary from '../../components/CheckoutSummary/CheckoutSummary';
import OrderPlacedSummary from '../../components/OrderPlacedSummary/OrderPlacedSummary';
import { useResolvedCart } from '../../hooks/useResolvedCart';
import { useShippingQuote } from '../../hooks/useShippingQuote';
import { buildOrderPayload, hasUnfulfillableRows } from '../../lib/checkout';
import { createOrder } from '../../lib/api';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  const { rows, subtotalNgn, isReady } = useResolvedCart();
  const [destination, setDestination] = useState({
    countryCode: '',
    countryName: '',
    stateRegion: '',
  });
  const { quote, status: shippingStatus } = useShippingQuote(destination);

  const [order, setOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null); // { kind, items?, message? }

  const onDestinationChange = useCallback((next) => setDestination(next), []);

  const isEmpty = isReady && rows.length === 0;
  const blockedByBag = isReady && hasUnfulfillableRows(rows);

  const submitDisabledReason = blockedByBag
    ? 'Some items in your bag are no longer available. Update your bag to continue.'
    : shippingStatus === 'ok'
      ? null
      : shippingStatus === 'unavailable' || shippingStatus === 'error'
        ? 'We can’t ship to this address yet. Please check the country and region.'
        : 'Enter your delivery address to see shipping and place your order.';

  const handleSubmit = async (formValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildOrderPayload(rows, formValues);
      const placed = await createOrder(payload);
      setOrder(placed); // cart is intentionally kept — payment is still pending
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (err?.status === 409) {
        const problems = err.data?.detail?.items || [];
        const named = problems.map((p) => ({
          ...p,
          product_name:
            p.product_name ||
            rows.find((r) => r.item.productId === p.product_id)?.product?.name ||
            null,
        }));
        setError({ kind: 'items', items: named });
      } else if (err?.status === 422) {
        const detail = err.data?.detail;
        setError({
          kind: 'validation',
          message:
            typeof detail === 'string'
              ? detail
              : 'Please check your details and try again.',
        });
      } else {
        setError({ kind: 'generic' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main id="checkout-main" className={styles.main}>
        <div className={styles.inner}>
          {order ? (
            <OrderPlacedSummary order={order} />
          ) : !isReady ? (
            <p className={styles.status}>Loading your bag…</p>
          ) : isEmpty ? (
            <div className={styles.empty}>
              <h1 className={styles.heading}>Your bag is empty</h1>
              <p>There&apos;s nothing to check out yet.</p>
              <Link href="/shop" className="btn btn-dark" id="checkout-empty-shop">
                Explore the collection
              </Link>
            </div>
          ) : (
            <>
              <h1 className={styles.heading}>Checkout</h1>
              <Link href="/cart" className={styles.backLink} id="checkout-back-to-cart">
                ← Back to bag
              </Link>

              {blockedByBag && (
                <div className={styles.banner} role="alert" id="checkout-bag-blocked">
                  <p>
                    Some items in your bag are no longer available. Update your bag
                    before checking out.
                  </p>
                  <Link href="/cart" id="checkout-fix-bag-blocked">
                    Go to bag
                  </Link>
                </div>
              )}

              {error?.kind === 'items' && (
                <div className={styles.banner} role="alert">
                  <p>Some items are no longer available and weren&apos;t ordered:</p>
                  <ul>
                    {error.items.map((it, i) => (
                      <li key={i}>
                        {it.product_name || `Item #${it.product_id}`} —{' '}
                        {it.reason === 'out_of_stock' ? 'out of stock' : 'unavailable'}
                      </li>
                    ))}
                  </ul>
                  <Link href="/cart" id="checkout-fix-bag">
                    Return to bag
                  </Link>
                </div>
              )}
              {error?.kind === 'validation' && (
                <p className={styles.banner} role="alert">
                  {error.message}
                </p>
              )}
              {error?.kind === 'generic' && (
                <p className={styles.banner} role="alert">
                  Something went wrong placing your order. Please try again.
                </p>
              )}

              <div className={styles.layout}>
                <CheckoutForm
                  onSubmit={handleSubmit}
                  onDestinationChange={onDestinationChange}
                  submitting={submitting}
                  submitDisabledReason={submitDisabledReason}
                />
                <aside className={styles.summary}>
                  <CheckoutSummary
                    rows={rows}
                    subtotalNgn={subtotalNgn}
                    shippingStatus={shippingStatus}
                    shippingAmountNgn={quote?.amount || 0}
                  />
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
