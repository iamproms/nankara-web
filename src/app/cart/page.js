'use client';

import Link from 'next/link';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import CartLineItem from '../../components/CartLineItem/CartLineItem';
import CartSummary from '../../components/CartSummary/CartSummary';
import { useResolvedCart } from '../../hooks/useResolvedCart';
import styles from './cart.module.css';

export default function CartPage() {
  const { rows, subtotalNgn, isReady, loading, error, hasUnavailable } = useResolvedCart();

  const isEmpty = isReady && rows.length === 0;

  return (
    <>
      <Navbar />
      <main id="cart-main" className={styles.main}>
        <div className={styles.inner}>
          <h1 className={styles.heading}>Your Bag</h1>

          {!isReady ? (
            <p className={styles.status}>Loading your bag…</p>
          ) : isEmpty ? (
            <div className={styles.empty}>
              <p>Your bag is empty.</p>
              <Link href="/shop" className="btn btn-dark" id="cart-empty-explore">
                Explore the collection
              </Link>
            </div>
          ) : (
            <div className={styles.layout}>
              <div className={styles.items}>
                {error && (
                  <p className={styles.error}>
                    We couldn&apos;t refresh your bag. Prices shown may be out of date.
                  </p>
                )}
                {loading && <p className={styles.status}>Updating your bag…</p>}
                {rows.map((row) => (
                  <CartLineItem
                    key={row.item.productId}
                    item={row.item}
                    product={row.product}
                    unavailable={row.unavailable}
                    outOfStock={row.outOfStock}
                    variant="page"
                  />
                ))}
                {hasUnavailable && (
                  <p className={styles.status}>
                    Items marked unavailable won&apos;t be included at checkout.
                  </p>
                )}
              </div>

              <aside className={styles.summary}>
                <CartSummary subtotalNgn={subtotalNgn} variant="page">
                  <Link
                    href="/checkout"
                    className={`btn btn-dark ${styles.checkout}`}
                    id="cart-checkout"
                  >
                    Checkout
                  </Link>
                  <Link href="/shop" className={styles.continue} id="cart-continue">
                    Continue shopping
                  </Link>
                </CartSummary>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
