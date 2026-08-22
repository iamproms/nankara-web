'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './HeroVideo.module.css';

export default function HeroVideo() {
  return (
    <section className={styles.hero} id="hero">
      {/* Cinematic image background with Ken Burns slow-zoom animation */}
      <div className={styles.videoWrapper}>
        <div className={styles.kenBurns}>
          <Image
            src="/images/nankara-10.jpg"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 20%', filter: 'var(--photo-tone)' }}
            priority
            aria-hidden="true"
          />
        </div>
        <div className={styles.overlay} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.contentInner}>
          <p className={styles.preLabel}>The New Collection</p>
          <h1 className={styles.headline}>
            Dressed for the<br />
            <em>Woman You Are</em>
          </h1>
          <p className={styles.description}>
            Where elegance is not a choice, it is a language. <br />
            Nankara: luxury reimagined for the intentional woman.
          </p>
          <div className={styles.ctas}>
            <Link href="/shop" className={`btn btn-light ${styles.cta}`} id="hero-explore-collection">
              Explore Nankara Collection
            </Link>
            <Link href="/about" className={`btn btn-outline ${styles.cta}`} id="hero-discover-story">
              Discover Our Story
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollLine} />
        <span className={styles.scrollText}>Scroll</span>
      </div>
    </section>
  );
}
