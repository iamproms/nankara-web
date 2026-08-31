'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getAdminMe } from '../lib/adminApi';

// Shared auth boilerplate for the admin pages. Auth is an HttpOnly session cookie
// the browser can't read, so we probe `GET /admin/auth/me` on mount: 200 → in;
// 401 → bounce to /admin/login. `onAuthError` handles a 401 from any later call.
export function useAdminGuard() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAdminMe()
      .then(() => {
        if (!cancelled) setAuthReady(true);
      })
      .catch(() => {
        if (!cancelled) router.replace('/admin/login');
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const onAuthError = useCallback(
    (err) => {
      if (err?.status === 401) {
        router.replace('/admin/login');
        return true;
      }
      return false;
    },
    [router]
  );

  return { authReady, onAuthError };
}
