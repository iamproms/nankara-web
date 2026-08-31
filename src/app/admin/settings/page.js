'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import AdminNav from '../../../components/AdminNav/AdminNav';
import { useAdminGuard } from '../../../hooks/useAdminGuard';
import { changeAdminPassword } from '../../../lib/adminApi';
import styles from '../admin.module.css';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { authReady, onAuthError } = useAdminGuard();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState('idle'); // idle | saving | error
  const [error, setError] = useState('');

  if (!authReady) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (next.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError('The new passwords don’t match.');
      return;
    }
    setState('saving');
    try {
      await changeAdminPassword({ current_password: current, new_password: next });
      // token_version bumped — this session was re-issued, but log out cleanly.
      router.replace('/admin/login');
    } catch (err) {
      if (onAuthError(err)) return;
      setState('error');
      setError(
        err?.status === 401
          ? 'Current password is incorrect.'
          : 'Could not change the password.'
      );
    }
  };

  return (
    <>
      <AdminNav />
      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.groupTitle}>Change password</p>
        <form className={styles.authCard} onSubmit={submit} style={{ maxWidth: 360 }}>
          <label className={styles.label} htmlFor="cur">Current password</label>
          <input
            id="cur"
            type="password"
            className={styles.input}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
            required
          />
          <label className={styles.label} htmlFor="new">New password</label>
          <input
            id="new"
            type="password"
            className={styles.input}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            required
          />
          <label className={styles.label} htmlFor="cfm">Confirm new password</label>
          <input
            id="cfm"
            type="password"
            className={styles.input}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={state === 'saving'}
          >
            {state === 'saving' ? 'Saving…' : 'Change password'}
          </button>
          <p className={styles.muted} style={{ fontSize: '0.78rem' }}>
            Changing your password signs out every other session.
          </p>
        </form>
      </main>
    </>
  );
}
