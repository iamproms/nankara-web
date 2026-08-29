'use client';

import { useEffect } from 'react';
import { useLenis } from '@studio-freight/react-lenis';

// Locks page scroll while `active` (e.g. the cart drawer is open). Stops Lenis so the
// smooth-scroll loop doesn't fight the lock, freezes the body, and compensates for
// the removed scrollbar so the layout doesn't shift.
export function useScrollLock(active) {
  const lenis = useLenis();

  useEffect(() => {
    if (!active || typeof document === 'undefined') return undefined;

    const { body, documentElement } = document;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    lenis?.stop();
    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      lenis?.start();
    };
  }, [active, lenis]);
}
