'use client';

import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../../components/Navbar/Navbar';
import Footer from '../../components/Footer/Footer';
import styles from './store.module.css';




export default function StorePage() {
  return (
    <>
      <Navbar />
      <main id="store-main" className={styles.main}>
        {/* Background image */}
        <div className={styles.bg}>
          <Image
            src="/images/2f6c4df545a18059affea02ef38815da.jpg"
            alt="Clothie Dynasty collection — coming soon"
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center top' }}
            priority
          />
          <div className={styles.overlay} />
        </div>

        {/* Content */}
        <div className={styles.content}>
          <p className={styles.label}>The Store</p>

          <h1 className={styles.heading}>
            Something<br />
            <em>beautiful</em><br />
            is coming.
          </h1>

          <div className={styles.divider} />

          <p className={styles.body}>
            Our collection is being carefully curated for you. Each piece chosen with intention, crafted with care, and designed for the woman who deserves nothing less than extraordinary.
          </p>

          <p className={styles.launchNote}>
            Launching soon — be the first to know.
          </p>

          {/* Inline newsletter just for this page */}
          <div className={styles.notifyWrap}>
            <form
              className={styles.notifyForm}
              onSubmit={(e) => e.preventDefault()}
              id="store-notify-form"
            >
              <input
                type="email"
                className={styles.notifyInput}
                placeholder="Your email address"
                id="store-notify-email"
                aria-label="Email to be notified when store launches"
              />
              <button type="submit" className={styles.notifyBtn} id="store-notify-submit">
                Notify Me
              </button>
            </form>
          </div>

          <Link href="/" className={styles.backLink} id="store-back-home">
            ← Return Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
