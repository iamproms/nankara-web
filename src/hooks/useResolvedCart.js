'use client';

import { useMemo } from 'react';

import { useCart } from './useCart';
import { useCartProducts } from './useCartProducts';

// Joins the stored cart ({ productId, quantity }) against live product data so the
// drawer and /cart page render identically and compute the subtotal from the same
// source. A stored id with no matching live product (unpublished / deleted) becomes an
// `unavailable` row and is excluded from the subtotal — the authoritative check still
// happens at order creation in Milestone 3.
export function useResolvedCart() {
  const { items, isReady } = useCart();
  const { productsById, loading, error, reload } = useCartProducts();

  return useMemo(() => {
    const rows = items.map((item) => {
      const product = productsById[item.productId] || null;
      return {
        item,
        product,
        unavailable: !product,
        outOfStock: product?.availability === 'OUT_OF_STOCK',
        lineTotalNgn: product ? product.price_ngn * item.quantity : 0,
      };
    });

    const subtotalNgn = rows.reduce(
      (sum, row) => (row.unavailable ? sum : sum + row.lineTotalNgn),
      0
    );
    const purchasableQuantity = rows.reduce(
      (sum, row) => (row.unavailable ? sum : sum + row.item.quantity),
      0
    );

    return {
      rows,
      subtotalNgn,
      purchasableQuantity,
      isReady,
      loading,
      error,
      reload,
      hasUnavailable: rows.some((r) => r.unavailable),
    };
  }, [items, productsById, isReady, loading, error, reload]);
}
