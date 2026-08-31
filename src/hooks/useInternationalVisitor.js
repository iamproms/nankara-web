'use client';

import { useEffect, useState } from 'react';
import { classifyVisitor } from '../lib/visitorLocale';

// Returns false during SSR and the first client render (so server and client markup
// match), then true after mount if the visitor looks international. Consumers use it
// to reveal the approximate USD price line.
export function useInternationalVisitor() {
  const [isInternational, setIsInternational] = useState(false);

  useEffect(() => {
    let timeZone;
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      timeZone = undefined;
    }
    const languages =
      typeof navigator !== 'undefined'
        ? navigator.languages || (navigator.language ? [navigator.language] : [])
        : [];

    setIsInternational(classifyVisitor({ timeZone, languages }) === 'international');
  }, []);

  return isInternational;
}
