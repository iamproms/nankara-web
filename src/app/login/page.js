'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import { loginErrors, hasErrors } from '../../lib/account';
import styles from '../../styles/auth.module.css';

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/account';
  const { login } = useCustomerAuth();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = loginErrors(values);
    if (hasErrors(errs)) return setErrors(errs);
    setBusy(true);
    setBanner('');
    try {
      await login(values.email.trim(), values.password);
      router.replace(next);
    } catch (err) {
      setBanner(
        err?.status === 401
          ? 'That email and password don’t match.'
          : 'Could not sign in. Please try again.'
      );
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.inner} ${styles.single}`}>
      <div className={styles.formCol}>
        <p className="section-label">Account</p>
        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.sub}>Welcome back.</p>
        <form className={styles.form} onSubmit={submit} noValidate>
          {banner && <p className={styles.banner} role="alert">{banner}</p>}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input id="email" type="email" className={styles.input}
              value={values.email} onChange={set('email')} autoComplete="email" />
            {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <input id="password" type="password" className={styles.input}
              value={values.password} onChange={set('password')}
              autoComplete="current-password" />
            {errors.password && <p className={styles.errorMsg}>{errors.password}</p>}
          </div>
          <div className={styles.submitRow}>
            <button type="submit" className="btn btn-dark" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className={styles.altLinks}>
          <Link href="/forgot-password">Forgot password?</Link>
          <Link href={`/register${next !== '/account' ? `?next=${next}` : ''}`}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.inner} />}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
