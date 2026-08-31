'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import { resetPassword } from '../../lib/accountApi';
import { hasErrors, newPasswordErrors } from '../../lib/account';
import styles from '../../styles/auth.module.css';

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') || '';
  const { refresh } = useCustomerAuth();
  const [values, setValues] = useState({ next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = newPasswordErrors(values);
    if (hasErrors(errs)) return setErrors(errs);
    setBusy(true);
    setBanner('');
    try {
      await resetPassword({ token, new_password: values.next });
      await refresh();
      router.replace('/account');
    } catch (err) {
      setBanner(
        err?.status === 400
          ? 'This reset link is invalid or has expired. Request a new one.'
          : 'Could not reset your password. Please try again.'
      );
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.inner} ${styles.single}`}>
      <div className={styles.formCol}>
        <p className="section-label">Account</p>
        <h1 className={styles.heading}>Choose a new password</h1>
        {!token ? (
          <p className={styles.banner}>
            This page needs a reset link. <Link href="/forgot-password">Request one</Link>.
          </p>
        ) : (
          <form className={styles.form} onSubmit={submit} noValidate>
            {banner && <p className={styles.banner} role="alert">{banner}</p>}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="np">New password</label>
              <input id="np" type="password" className={styles.input}
                value={values.next} onChange={set('next')} autoComplete="new-password" />
              {errors.next && <p className={styles.errorMsg}>{errors.next}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="cp">Confirm new password</label>
              <input id="cp" type="password" className={styles.input}
                value={values.confirm} onChange={set('confirm')}
                autoComplete="new-password" />
              {errors.confirm && <p className={styles.errorMsg}>{errors.confirm}</p>}
            </div>
            <div className={styles.submitRow}>
              <button type="submit" className="btn btn-dark" disabled={busy}>
                {busy ? 'Saving…' : 'Reset password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.inner} />}>
          <ResetForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
