import Image from 'next/image';
import styles from './EditorialShowcase.module.css';

const editorials = [
  { src: '/images/2f6c4df545a18059affea02ef38815da.jpg', alt: 'Editorial look — silk evening gown', caption: 'The Evening' },
  { src: '/images/c4e7b927e1ccbb63db2d9d1e67481225.jpg', alt: 'Editorial look — confident daywear', caption: 'Daytime Authority' },
  { src: '/images/9b6153bcde944c6cb838426e066ec8cc.jpg', alt: 'Editorial look — flowing dress', caption: 'In Motion' },
  { src: '/images/8d6a999ba6877ea16d07e0808744777e.jpg', alt: 'Editorial look — luxury details', caption: 'The Detail' },
  { src: '/images/4f93702c791decbe30d156e56b2d2368.jpg', alt: 'Editorial — feminine strength', caption: 'Strength' },
];

export default function EditorialShowcase() {
  return (
    <section className={styles.section} id="editorial-showcase">
      <div className={styles.header}>
        <p className="section-label">Editorial</p>
        <h2 className={styles.heading}>
          The woman.<br /><em>The moment.</em>
        </h2>
      </div>
      <div className={styles.grid}>
        {editorials.map((ed, i) => (
          <div
            key={i}
            className={`${styles.item} ${i === 2 ? styles.itemTall : ''} ${i === 0 ? styles.itemWide : ''}`}
          >
            <Image
              src={ed.src}
              alt={ed.alt}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover', objectPosition: 'center top', transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1)' }}
            />
            <div className={styles.itemOverlay} />
            <p className={styles.caption}>{ed.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
