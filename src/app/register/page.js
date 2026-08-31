'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import AccountBenefits from '../../components/AccountBenefits/AccountBenefits';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import { buildRegisterPayload, hasErrors, registerErrors } from '../../lib/account';
import styles from '../../styles/auth.module.css';

function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') || '/account';
  const { register } = useCustomerAuth();
  const [values, setValues] = useState({
    firstName: '', lastName: '', email: '', password: '', phone: '',
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setValues((v) => ({ ...v, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: '' }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = registerErrors(values);
    if (hasErrors(errs)) return setErrors(errs);
    setBusy(true);
    setBanner('');
    try {
      await register(buildRegisterPayload(values));
      router.replace(next);
    } catch (err) {
      setBanner(
        err?.status === 409
          ? 'That email already has an account — try signing in.'
          : 'Could not create your account. Please try again.'
      );
      setBusy(false);
    }
  };

  return (
    <div className={styles.inner}>
      <div className={styles.formCol}>
        <p className="section-label">Account</p>
        <h1 className={styles.heading}>Create an account</h1>
        <p className={styles.sub}>It takes a moment and makes every future order easier.</p>
        <form className={styles.form} onSubmit={submit} noValidate>
          {banner && <p className={styles.banner} role="alert">{banner}</p>}
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="fn">First name</label>
              <input id="fn" className={styles.input} value={values.firstName}
                onChange={set('firstName')} autoComplete="given-name" />
              {errors.firstName && <p className={styles.errorMsg}>{errors.firstName}</p>}
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="ln">Last name</label>
              <input id="ln" className={styles.input} value={values.lastName}
                onChange={set('lastName')} autoComplete="family-name" />
              {errors.lastName && <p className={styles.errorMsg}>{errors.lastName}</p>}
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input id="email" type="email" className={styles.input} value={values.email}
              onChange={set('email')} autoComplete="email" />
            {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">Phone / WhatsApp (optional)</label>
            <input id="phone" type="tel" className={styles.input} value={values.phone}
              onChange={set('phone')} autoComplete="tel" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="pw">Password</label>
            <input id="pw" type="password" className={styles.input} value={values.password}
              onChange={set('password')} autoComplete="new-password" />
            {errors.password && <p className={styles.errorMsg}>{errors.password}</p>}
          </div>
          <div className={styles.submitRow}>
            <button type="submit" className="btn btn-dark" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
        <div className={styles.altLinks}>
          <span />
          <Link href={`/login${next !== '/account' ? `?next=${next}` : ''}`}>
            Already have an account? Sign in
          </Link>
        </div>
      </div>
      <AccountBenefits />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <Suspense fallback={<div className={styles.inner} />}>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
