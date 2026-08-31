'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Fetches the full published catalogue (fewer than 10 products) so cart views can
// reconcile stored { productId } against live product data — name, image, current
// price, availability. A module-level promise cache keeps the drawer and /cart page
// from double-fetching; `reload()` busts it.

let cache = null;

function fetchProducts() {
  if (!cache) {
    cache = fetch('/api/v1/products', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`API ${res.status}`);
        return res.json();
      })
      .catch((err) => {
        cache = null; // let the next caller retry
        throw err;
      });
  }
  return cache;
}

export function useCartProducts() {
  const [state, setState] = useState({
    productsById: {},
    list: [],
    loading: true,
    error: null,
  });
  const mounted = useRef(true);

  const load = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }));
    fetchProducts()
      .then((list) => {
        if (!mounted.current) return;
        const productsById = {};
        for (const p of list) productsById[p.id] = p;
        setState({ productsById, list, loading: false, error: null });
      })
      .catch((error) => {
        if (!mounted.current) return;
        setState({ productsById: {}, list: [], loading: false, error });
      });
  }, []);

  const reload = useCallback(() => {
    cache = null;
    load();
  }, [load]);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { ...state, reload };
}
