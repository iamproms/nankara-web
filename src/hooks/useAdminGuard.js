'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { clearAdminToken, getAdminToken } from '../lib/adminApi';

// Shared auth boilerplate for the admin pages: bounce to /admin/login when there
// is no token, and give callers an `onAuthError` to run when an admin request
// comes back 401. `authReady` is true once the token check has run on the client.
export function useAdminGuard() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) {
      router.replace('/admin/login');
      return;
    }
    setAuthReady(true);
  }, [router]);

  const onAuthError = useCallback(
    (err) => {
      if (err?.status === 401) {
        clearAdminToken();
        router.replace('/admin/login');
        return true;
      }
      return false;
    },
    [router]
  );

  return { authReady, onAuthError };
}
