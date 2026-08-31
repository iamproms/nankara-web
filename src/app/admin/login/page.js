'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { adminLogin } from '../../../lib/adminApi';
import styles from '../admin.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await adminLogin(email.trim(), password);
      router.replace('/admin/shipping');
    } catch (err) {
      setError(
        err?.status === 401
          ? 'Invalid email or password.'
          : 'Could not sign in. Please try again.'
      );
      setBusy(false);
    }
  };

  return (
    <main className={styles.authMain}>
      <form className={styles.authCard} onSubmit={handleSubmit}>
        <h1 className={styles.authTitle}>Nankara Admin</h1>
        <label className={styles.label} htmlFor="admin-email">
          Email
        </label>
        <input
          id="admin-email"
          type="email"
          className={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <label className={styles.label} htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          className={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button type="submit" className={styles.primaryBtn} disabled={busy} id="admin-login-submit">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
