'use client';

import { useState } from 'react';

import AccountBenefits from '../AccountBenefits/AccountBenefits';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import styles from './CreateAccountPrompt.module.css';

// Shown to guests after an order. Registering links this order — and any prior
// guest orders on the same email — to the new account.
export default function CreateAccountPrompt({ email, firstName, lastName }) {
  const { user, register } = useCustomerAuth();
  const [password, setPassword] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | done | error
  const [error, setError] = useState('');

  if (user) return null; // already signed in

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    setState('busy');
    setError('');
    try {
      await register({
        email,
        password,
        first_name: firstName || 'Nankara',
        last_name: lastName || 'Customer',
      });
      setState('done');
    } catch (err) {
      setState('idle');
      setError(
        err?.status === 409
          ? 'That email already has an account — sign in instead.'
          : 'Could not create your account. Please try again.'
      );
    }
  };

  if (state === 'done') {
    return (
      <div className={styles.wrap}>
        <p className={styles.done}>
          Account created — this order is now in <strong>your account</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <p className={styles.title}>Create an account to track this order</p>
      <AccountBenefits compact />
      <form className={styles.form} onSubmit={submit}>
        <label className={styles.label} htmlFor="cap-email">Email</label>
        <input id="cap-email" className={styles.input} value={email} readOnly />
        <label className={styles.label} htmlFor="cap-pw">Choose a password</label>
        <input
          id="cap-pw"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className="btn btn-dark" disabled={state === 'busy'}>
          {state === 'busy' ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
