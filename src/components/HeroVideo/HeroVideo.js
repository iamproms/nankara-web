'use client';
import Link from 'next/link';
import Image from 'next/image';
import styles from './HeroVideo.module.css';

export default function HeroVideo() {
  return (
    <section className={styles.hero} id="hero">
      {/* Cinematic image background with Ken Burns slow-zoom animation */}
      {/* Video Background (Pinterest Download) */}
      <div className={styles.videoWrapper}>
        {/* YouTube Background Video */}
        <div className={styles.youtubeContainer}>
          <iframe
            className={styles.youtubeIframe}
            src="https://www.youtube.com/embed/YRrvVR_zB2w?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&modestbranding=1&loop=1&playlist=YRrvVR_zB2w&playsinline=1"
            title="Clothie Dynasty Background Video"
            frameBorder="0"
            allow="autoplay; encrypted-media"
            tabIndex="-1"
            aria-hidden="true"
          />
        </div>
        
        {/* Fallback Cinematic Image if video fails to load */}
        <div className={styles.kenBurns}>
          <Image
            src="/images/260975f13f8e0b7639005c2b230c799a.jpg"
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: 'cover', objectPosition: 'center 20%' }}
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
            Clothie Dynasty — luxury reimagined for the intentional woman.
          </p>
          <div className={styles.ctas}>
            <Link href="/store" className={`btn btn-light ${styles.cta}`} id="hero-explore-collection">
              Explore Collection
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
