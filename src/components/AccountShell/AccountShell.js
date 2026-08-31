'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import styles from '../../app/account/account.module.css';

const LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/measurements', label: 'Measurements' },
  { href: '/account/settings', label: 'Settings' },
];

export default function AccountShell({ children }) {
  const { user, isReady, logout } = useCustomerAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isReady && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isReady, user, router, pathname]);

  const signOut = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.inner}>
          <nav className={styles.sidebar}>
            <p className={styles.sidebarTitle}>My account</p>
            {LINKS.map((l) => {
              const active =
                l.href === '/account'
                  ? pathname === '/account'
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`${styles.navLink} ${active ? styles.navActive : ''}`}
                >
                  {l.label}
                </Link>
              );
            })}
            <button type="button" className={styles.signout} onClick={signOut}>
              Sign out
            </button>
          </nav>
          <div className={styles.content}>
            {!isReady || !user ? (
              <p className={styles.muted}>Loading…</p>
            ) : (
              children
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
