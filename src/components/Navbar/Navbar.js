'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHome = pathname === '/';

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
          <span className={styles.logoMain}>Clothie Dynasty</span>
        </Link>

        {/* Desktop nav */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          <Link href="/" className={`${styles.navLink} ${pathname === '/' ? styles.active : ''}`}>Home</Link>
          <Link href="/about" className={`${styles.navLink} ${pathname === '/about' ? styles.active : ''}`}>About</Link>
          <Link href="/contact" className={`${styles.navLink} ${pathname === '/contact' ? styles.active : ''}`}>Contact</Link>
          <Link href="/store" className={styles.navLinkStore} id="nav-store">Store</Link>
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
          <Link href="/contact" className={styles.mobileNavLink} id="mobile-nav-contact">Contact</Link>
          <Link href="/store" className={`${styles.mobileNavLink} ${styles.mobileNavLinkStore}`} id="mobile-nav-store">Store</Link>
        </nav>
      </div>
    </header>
  );
}
