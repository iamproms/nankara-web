import { useContext } from 'react';

import { CustomerAuthContext } from '../components/CustomerAuthProvider/CustomerAuthProvider';

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error('useCustomerAuth must be used within <CustomerAuthProvider>');
  }
  return ctx;
}
