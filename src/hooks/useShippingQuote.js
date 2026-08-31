'use client';

import { useEffect, useRef, useState } from 'react';

import { requestShippingQuote } from '../lib/api';

// Debounced, race-guarded shipping-quote lookup. Feeds the checkout summary and
// gates the submit button. The backend is authoritative — this is display only;
// POST /api/v1/orders re-quotes server-side (spec §24).
//
// status: 'idle' (no country yet) | 'loading' | 'ok' | 'unavailable' (422) | 'error'
export function useShippingQuote({ countryCode, stateRegion }) {
  const [state, setState] = useState({ quote: null, status: 'idle' });
  const requestId = useRef(0);

  useEffect(() => {
    if (!countryCode) {
      setState({ quote: null, status: 'idle' });
      return undefined;
    }

    const id = ++requestId.current;
    setState((prev) => ({ ...prev, status: 'loading' }));

    const timer = setTimeout(() => {
      requestShippingQuote({ countryCode, stateRegion })
        .then((quote) => {
          if (id === requestId.current) setState({ quote, status: 'ok' });
        })
        .catch((err) => {
          if (id !== requestId.current) return;
          setState({
            quote: null,
            status: err?.status === 422 ? 'unavailable' : 'error',
          });
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [countryCode, stateRegion]);

  return state;
}
