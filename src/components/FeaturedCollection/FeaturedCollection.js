'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './FeaturedCollection.module.css';

const collections = [
  {
    id: 'bold-statement-queen',
    title: 'The Bold Statement Queen',
    image: '/images/nankara-07.jpg',
  },
  {
    id: 'power-queen',
    title: 'The Power Queen',
    image: '/images/nankara-02.jpg',
  },
  {
    id: 'soft-elegant-queen',
    title: 'The Soft Elegant Queen',
    image: '/images/nankara-08.jpg',
  },
  {
    id: 'luminous-queen',
    title: 'The Luminous Queen',
    image: '/images/nankara-11.jpg',
  },
  {
    id: 'quiet-power-queen',
    title: 'The Quiet Power Queen',
    image: '/images/nankara-04.jpg',
  },
];

export default function FeaturedCollection() {
  const [revealRef, isVisible] = useScrollReveal();

  return (
    <section className={styles.section} id="featured-collection">
      <div className={styles.rule} />
      <div className={`${styles.header} ${isVisible ? 'reveal-visible' : 'reveal-hidden'}`} ref={revealRef}>
        <p className="section-label">The Identity Collection #1</p>
        <h2 className={styles.heading}>
          You haven&apos;t just found a piece of clothing.<br />
          <em>You&apos;ve discovered an identity.</em>
        </h2>
      </div>

      <div className={styles.grid}>
        {collections.map((col, i) => (
          <Link
            key={col.id}
            href="/shop"
            className={`${styles.card} ${i === 0 ? styles.cardLarge : ''}`}
            id={`collection-card-${col.id}`}
          >
            <div className={styles.imageWrap}>
              <Image
                src={col.image}
                alt={col.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover', objectPosition: 'center 15%', filter: 'var(--photo-tone)', transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </div>
            <div className={styles.cardOverlay} />
            <div className={styles.cardContent}>
              <h3 className={styles.cardTitle}>{col.title}</h3>
              <span className={styles.cardViewLink}>Discover &rarr;</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.ctaWrap}>
        <Link href="/shop" className="btn btn-dark" id="collection-view-all">
          Enter the Shop
        </Link>
      </div>
    </section>
  );
}
