import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer} id="footer">
      <div className={styles.inner}>
        {/* Top: brand + nav columns */}
        <div className={styles.top}>
          <div className={styles.brand}>
            <h2 className={styles.logo}>Clothie Dynasty</h2>
            <p className={styles.tagline}>
              Designed for women who lead with confidence, dress with intention, and embrace their authentic elegance.
            </p>
            <div className={styles.socials}>
              <a href="https://www.instagram.com/clothie_dynasty?igsh=Z29scG5wN3Ayam50" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialLink} id="footer-instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className={styles.socialLink} id="footer-pinterest">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.38 1.27-5.38s-.33-.65-.33-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .93-.6 2.34-.9 3.64-.26 1.09.54 1.97 1.6 1.97 1.92 0 3.4-2.02 3.4-4.94 0-2.58-1.86-4.39-4.51-4.39-3.07 0-4.87 2.3-4.87 4.68 0 .93.36 1.92.8 2.46.09.11.1.2.07.31-.08.34-.27 1.09-.3 1.24-.05.2-.17.24-.38.14-1.39-.65-2.26-2.69-2.26-4.33 0-3.52 2.56-6.76 7.38-6.76 3.88 0 6.89 2.76 6.89 6.46 0 3.85-2.43 6.95-5.8 6.95-1.13 0-2.2-.59-2.57-1.28l-.69 2.6c-.25.97-.93 2.18-1.39 2.91.05.01.1.01.15.01z"/></svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={styles.socialLink} id="footer-tiktok">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.03a8.16 8.16 0 004.77 1.52V7.12a4.85 4.85 0 01-1-.43z"/></svg>
              </a>
            </div>
          </div>

          <div className={styles.navColumns}>
            <div className={styles.navCol}>
              <h3 className={styles.colTitle}>Navigate</h3>
              <Link href="/" className={styles.footerLink} id="footer-home">Home</Link>
              <Link href="/about" className={styles.footerLink} id="footer-about">About</Link>
              <Link href="/contact" className={styles.footerLink} id="footer-contact">Contact</Link>
              <Link href="/store" className={styles.footerLink} id="footer-store">Store</Link>
            </div>
            <div className={styles.navCol}>
              <h3 className={styles.colTitle}>The Brand</h3>
              <Link href="/about#mission" className={styles.footerLink}>Our Mission</Link>
              <Link href="/about#founder" className={styles.footerLink}>Founder Story</Link>
              <Link href="/about#craftsmanship" className={styles.footerLink}>Craftsmanship</Link>
              <Link href="/about#philosophy" className={styles.footerLink}>Design Philosophy</Link>
            </div>
            <div className={styles.navCol}>
              <h3 className={styles.colTitle}>Contact</h3>
              <a href="mailto:hello@clothiedynasty.com" className={styles.footerLink} id="footer-email">hello@clothiedynasty.com</a>
              <Link href="/contact" className={styles.footerLink}>Business Inquiries</Link>
              <Link href="/store" className={styles.footerLink}>Shop Collection</Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider} />

        {/* Bottom */}
        <div className={styles.bottom}>
          <p className={styles.copy}>© {year} Clothie Dynasty. All rights reserved.</p>
          <p className={styles.copy}>Designed with elegance. Crafted with purpose.</p>
        </div>
      </div>
    </footer>
  );
}
