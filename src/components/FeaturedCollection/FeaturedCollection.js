'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './FeaturedCollection.module.css';

const collections = [
  {
    id: 'silk-reverie',
    title: 'Silk Reverie',
    subtitle: 'The Evening Collection',
    tag: 'New Arrival',
    image: '/images/nankara-07.jpg',
    pieces: '12 Pieces',
  },
  {
    id: 'quiet-power',
    title: 'Quiet Power',
    subtitle: 'Day to Evening',
    tag: 'Editor’s Pick',
    image: '/images/nankara-02.jpg',
    pieces: '8 Pieces',
  },
  {
    id: 'soft-authority',
    title: 'Soft Authority',
    subtitle: 'The Power Dressing Edit',
    tag: 'Bestseller',
    image: '/images/nankara-08.jpg',
    pieces: '10 Pieces',
  },
  {
    id: 'luminous',
    title: 'Luminous',
    subtitle: 'The Bridal Edit',
    tag: 'Limited',
    image: '/images/nankara-11.jpg',
    pieces: '6 Pieces',
  },
];

export default function FeaturedCollection() {
  const [revealRef, isVisible] = useScrollReveal();

  return (
    <section className={styles.section} id="featured-collection">
      <div className={styles.rule} />
      <div className={`${styles.header} ${isVisible ? 'reveal-visible' : 'reveal-hidden'}`} ref={revealRef}>
        <p className="section-label">Shop Nankara</p>
        <h2 className={styles.heading}>
          Pieces worth<br />
          <em>returning to.</em>
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
            <span className={styles.cardTag}>{col.tag}</span>
            <div className={styles.imageWrap}>
              <Image
                src={col.image}
                alt={`${col.title}: ${col.subtitle}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover', objectPosition: 'center 15%', filter: 'var(--photo-tone)', transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </div>
            <div className={styles.cardOverlay} />
            <div className={styles.cardContent}>
              <p className={styles.cardSubtitle}>{col.subtitle}</p>
              <h3 className={styles.cardTitle}>{col.title}</h3>
              <p className={styles.cardPieces}>{col.pieces}</p>
              <span className={styles.cardViewLink}>View Piece &rarr;</span>
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
