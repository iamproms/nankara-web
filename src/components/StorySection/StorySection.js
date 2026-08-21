'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './StorySection.module.css';

export default function StorySection() {
  const [revealRef, isVisible] = useScrollReveal();

  return (
    <section className={styles.section} id="story">
      <div className={`${styles.inner} ${isVisible ? 'reveal-visible' : 'reveal-hidden'}`} ref={revealRef}>
        {/* Text block — left */}
        <div className={styles.textBlock}>
          <p className="section-label">Our Story</p>
          <h2 className={styles.heading}>
            Born from a conviction<br />
            that <em>every woman</em><br />
            deserves to feel<br />
            <em>magnificent.</em>
          </h2>
          <div className={styles.divider} />
          <p className={styles.body}>
            Clothie Dynasty was founded on a simple but powerful belief: that fashion, when done right, is not decoration — it is transformation. We saw a gap between the woman who exists and the woman who the fashion industry designed for.
          </p>
          <p className={styles.body}>
            So we built a brand for her. For the woman who is multidimensional, ambitious, tender, fierce, and elegantly complex. Each collection is a conversation with that woman — asking not what is trending, but what is true.
          </p>
          <Link href="/about" className="btn btn-lavender" id="story-learn-more">
            Our Full Story
          </Link>
        </div>

        {/* Photo block — right, bleeds */}
        <div className={styles.photoBlock}>
          <div className={styles.photoMain}>
            <Image
              src="/images/1e7204cbacd7d8aa19636470d1857c85.jpg"
              alt="Clothie Dynasty brand story — elegance in motion"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
          <div className={styles.photoAccent}>
            <Image
              src="/images/3659b2c83be723a1b7ff166860b3533d.jpg"
              alt="Clothie Dynasty craftsmanship detail"
              fill
              sizes="(max-width: 768px) 60vw, 25vw"
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
            />
          </div>
          {/* Floating text */}
          <div className={styles.floatingLabel}>
            <p>Established in 2015</p>
            <p>Luxury Fashion</p>
          </div>
        </div>
      </div>
    </section>
  );
}
