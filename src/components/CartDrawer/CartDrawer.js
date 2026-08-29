'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

import { useCart } from '../../hooks/useCart';
import { useResolvedCart } from '../../hooks/useResolvedCart';
import { useScrollLock } from '../../hooks/useScrollLock';
import CartLineItem from '../CartLineItem/CartLineItem';
import CartSummary from '../CartSummary/CartSummary';
import styles from './CartDrawer.module.css';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export default function CartDrawer() {
  const { isReady, isDrawerOpen, closeDrawer, totalQuantity } = useCart();
  const { rows, subtotalNgn, loading, error } = useResolvedCart();
  const panelRef = useRef(null);
  const lastFocused = useRef(null);

  useScrollLock(isDrawerOpen);

  // Esc to close; focus into the panel on open and back on close; simple focus trap.
  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    lastFocused.current = document.activeElement;
    const panel = panelRef.current;
    panel?.querySelector(FOCUSABLE)?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (lastFocused.current instanceof HTMLElement) lastFocused.current.focus();
    };
  }, [isDrawerOpen, closeDrawer]);

  // Don't render cart contents until hydrated, to avoid a flash of an empty bag.
  if (!isReady) return null;

  const isEmpty = rows.length === 0;

  return (
    <div
      className={`${styles.overlay} ${isDrawerOpen ? styles.overlayOpen : ''}`}
      onClick={closeDrawer}
      aria-hidden={!isDrawerOpen}
    >
      <aside
        className={`${styles.panel} ${isDrawerOpen ? styles.panelOpen : ''}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Your bag"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>
            Your Bag{totalQuantity > 0 ? ` (${totalQuantity})` : ''}
          </h2>
          <button
            type="button"
            className={styles.close}
            id="cart-drawer-close"
            onClick={closeDrawer}
            aria-label="Close bag"
          >
            &times;
          </button>
        </header>

        <div className={styles.body} data-lenis-prevent>
          {isEmpty ? (
            <div className={styles.empty}>
              <p>Your bag is empty.</p>
              <Link href="/shop" className={styles.emptyLink} id="cart-drawer-explore">
                Explore the collection
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <p className={styles.error}>
                  We couldn&apos;t refresh your bag. Prices shown may be out of date.
                </p>
              )}
              {loading && <p className={styles.loading}>Updating your bag…</p>}
              {rows.map((row) => (
                <CartLineItem
                  key={row.item.productId}
                  item={row.item}
                  product={row.product}
                  unavailable={row.unavailable}
                  outOfStock={row.outOfStock}
                  variant="drawer"
                />
              ))}
            </>
          )}
        </div>

        {!isEmpty && (
          <footer className={styles.footer}>
            <CartSummary subtotalNgn={subtotalNgn} variant="drawer">
              <div className={styles.actions}>
                <Link
                  href="/checkout"
                  className={`btn btn-dark ${styles.checkout}`}
                  id="cart-drawer-checkout"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  className={styles.viewBag}
                  id="cart-drawer-view-bag"
                >
                  View Bag
                </Link>
              </div>
            </CartSummary>
          </footer>
        )}
      </aside>
    </div>
  );
}
