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
    image: '/images/68e8b5bbf8b80424ec098964b1ebe7f8.jpg',
    pieces: '12 Pieces',
  },
  {
    id: 'quiet-power',
    title: 'Quiet Power',
    subtitle: 'Day to Evening',
    image: '/images/6599626fe631593ac1d1b74f1f053257.jpg',
    pieces: '8 Pieces',
  },
  {
    id: 'soft-authority',
    title: 'Soft Authority',
    subtitle: 'The Power Dressing Edit',
    image: '/images/0481794db27e2a26c0c9270a1390a116.jpg',
    pieces: '10 Pieces',
  },
  {
    id: 'luminous',
    title: 'Luminous',
    subtitle: 'The Bridal Edit',
    image: '/images/ede8cddc9a34ad48ec667fd182136c85.jpg',
    pieces: '6 Pieces',
  },
];

export default function FeaturedCollection() {
  const [revealRef, isVisible] = useScrollReveal();

  return (
    <section className={styles.section} id="featured-collection">
      <div className={`${styles.header} ${isVisible ? 'reveal-visible' : 'reveal-hidden'}`} ref={revealRef}>
        <div className={styles.headerInner}>
          <p className="section-label">The Collections</p>
          <h2 className={styles.heading}>
            Curated for the<br />
            <em>seasons of your life.</em>
          </h2>
        </div>
        <Link href="/store" className="btn btn-dark" id="collection-view-all">
          View All
        </Link>
      </div>

      <div className={styles.grid}>
        {collections.map((col, i) => (
          <Link
            key={col.id}
            href="/store"
            className={`${styles.card} ${i === 0 ? styles.cardLarge : ''}`}
            id={`collection-card-${col.id}`}
          >
            <div className={styles.imageWrap}>
              <Image
                src={col.image}
                alt={`${col.title} — ${col.subtitle}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover', objectPosition: 'center 15%', transition: 'transform 0.8s cubic-bezier(0.16,1,0.3,1)' }}
              />
            </div>
            <div className={styles.cardOverlay} />
            <div className={styles.cardContent}>
              <p className={styles.cardSubtitle}>{col.subtitle}</p>
              <h3 className={styles.cardTitle}>{col.title}</h3>
              <p className={styles.cardPieces}>{col.pieces}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
