'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '../../hooks/useCart';
import { useCustomerAuth } from '../../hooks/useCustomerAuth';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { totalQuantity, isReady, openDrawer } = useCart();
  const { user, logout } = useCustomerAuth();
  const bagLabel = isReady && totalQuantity > 0 ? `Bag (${totalQuantity})` : 'Bag';

  const signOut = async () => {
    await logout();
    router.push('/');
  };

  const isHome = pathname === '/';
  const isSolid = scrolled || !isHome;
  const isConsultSection = pathname === '/contact' || pathname === '/identity-consultation';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const navClass = [
    styles.navbar,
    scrolled || !isHome ? styles.solid : styles.transparent,
    menuOpen ? styles.menuActive : '',
  ].join(' ');

  return (
    <header className={navClass} id="navbar">
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <Image
            src={isSolid ? '/logo/nankara-wordmark-black.svg' : '/logo/nankara-wordmark-white.png'}
            alt="Nankara"
            width={140}
            height={33}
            className={styles.logoMark}
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>Home</Link>
          <Link href="/about" className={`${styles.navLink} ${pathname === '/about' ? styles.active : ''}`}>About</Link>
          <Link href="/queens-circle" className={`${styles.navLink} ${pathname === '/queens-circle' ? styles.active : ''}`} id="nav-queens-circle">Queens Circle</Link>
          <Link href="/nankara-silhouette" className={`${styles.navLink} ${pathname === '/nankara-silhouette' ? styles.active : ''}`} id="nav-silhouette">Nankara Silhouette</Link>
          <div className={styles.navDropdown}>
            <button
              type="button"
              className={`${styles.navLink} ${styles.navDropdownTrigger} ${isConsultSection ? styles.active : ''}`}
              aria-haspopup="true"
              id="nav-identity-consultation"
            >
              Identity Consultation
            </button>
            <div className={styles.navDropdownMenu}>
              <div className={styles.navDropdownLinks}>
                <Link href="/identity-consultation" className={styles.navDropdownLink} id="nav-book-consultation">Book a Consultation</Link>
                <Link href="/contact" className={styles.navDropdownLink} id="nav-general-contact">General Contact</Link>
              </div>
            </div>
          </div>
          <Link href="/shop" className={styles.navLinkShop} id="nav-shop">Shop</Link>
          {user ? (
            <div className={styles.navDropdown}>
              <button type="button" className={`${styles.navLink} ${styles.navDropdownTrigger}`} aria-haspopup="true" id="nav-account">
                Account
              </button>
              <div className={styles.navDropdownMenu}>
                <div className={styles.navDropdownLinks}>
                  <Link href="/account/orders" className={styles.navDropdownLink}>My orders</Link>
                  <Link href="/account/addresses" className={styles.navDropdownLink}>Addresses</Link>
                  <Link href="/account/measurements" className={styles.navDropdownLink}>Measurements</Link>
                  <button type="button" className={styles.navDropdownLink} onClick={signOut} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>Sign out</button>
                </div>
              </div>
            </div>
          ) : (
            <Link href="/login" className={styles.navLink} id="nav-signin">Sign in</Link>
          )}
          <button
            type="button"
            className={styles.navCart}
            onClick={openDrawer}
            id="nav-cart-trigger"
            aria-label={`Open bag, ${isReady ? totalQuantity : 0} item${totalQuantity === 1 ? '' : 's'}`}
          >
            {bagLabel}
          </button>
        </nav>

        {/* Hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          id="hamburger-btn"
        >
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
          <span className={styles.bar}></span>
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileMenuOpen : ''}`} aria-hidden={!menuOpen}>
        <nav className={styles.mobileNav} aria-label="Mobile navigation">
          <Link href="/" className={styles.mobileNavLink} id="mobile-nav-home">Home</Link>
          <Link href="/about" className={styles.mobileNavLink} id="mobile-nav-about">About</Link>
          <Link href="/queens-circle" className={styles.mobileNavLink} id="mobile-nav-queens-circle">Queens Circle</Link>
          <Link href="/nankara-silhouette" className={styles.mobileNavLink} id="mobile-nav-silhouette">Nankara Silhouette</Link>
          <p className={styles.mobileNavGroupLabel}>Identity Consultation</p>
          <Link href="/identity-consultation" className={`${styles.mobileNavLink} ${styles.mobileNavSubLink}`} id="mobile-nav-book-consultation">Book a Consultation</Link>
          <Link href="/contact" className={`${styles.mobileNavLink} ${styles.mobileNavSubLink}`} id="mobile-nav-general-contact">General Contact</Link>
          <Link href="/shop" className={`${styles.mobileNavLink} ${styles.mobileNavLinkShop}`} id="mobile-nav-shop">Shop</Link>
          <p className={styles.mobileNavGroupLabel}>Account</p>
          {user ? (
            <>
              <Link href="/account" className={`${styles.mobileNavLink} ${styles.mobileNavSubLink}`}>My account</Link>
              <Link href="/account/orders" className={`${styles.mobileNavLink} ${styles.mobileNavSubLink}`}>My orders</Link>
              <button type="button" className={`${styles.mobileNavLink} ${styles.mobileNavSubLink}`} onClick={() => { setMenuOpen(false); signOut(); }} style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>Sign out</button>
            </>
          ) : (
            <Link href="/login" className={`${styles.mobileNavLink} ${styles.mobileNavSubLink}`} id="mobile-nav-signin">Sign in</Link>
          )}
          <button
            type="button"
            className={`${styles.mobileNavLink} ${styles.mobileNavCart}`}
            onClick={() => { setMenuOpen(false); openDrawer(); }}
            id="mobile-nav-cart-trigger"
          >
            {bagLabel}
          </button>
        </nav>
      </div>
    </header>
  );
}
