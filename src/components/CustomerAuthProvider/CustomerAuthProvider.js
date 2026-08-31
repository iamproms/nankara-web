'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import * as api from '../../lib/accountApi';

export const CustomerAuthContext = createContext(null);

export default function CustomerAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await api.getMe();
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsReady(true));
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      const me = await api.login({ email, password });
      setUser(me);
      return me;
    },
    []
  );

  const register = useCallback(async (payload) => {
    const me = await api.register(payload);
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* clear locally anyway */
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isReady, refresh, login, register, logout }),
    [user, isReady, refresh, login, register, logout]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}
