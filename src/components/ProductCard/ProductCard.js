import Image from 'next/image';
import Link from 'next/link';

import Price from '../Price/Price';
import styles from './ProductCard.module.css';

// Editorial card: large photo, name, price. No badges/metadata clutter (spec §5),
// beyond a single "Out of Stock" marker.
export default function ProductCard({ product }) {
  const { slug, name, price_ngn, availability, primary_image } = product;
  const outOfStock = availability === 'OUT_OF_STOCK';
  const image = primary_image || product.images?.[0] || null;

  return (
    <Link
      href={`/shop/${slug}`}
      className={styles.card}
      id={`product-card-${slug}`}
    >
      <div className={styles.imageWrap}>
        {image ? (
          <Image
            src={image.url}
            alt={image.alt_text || name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center 15%',
              filter: 'var(--photo-tone)',
            }}
          />
        ) : (
          <div className={styles.imagePlaceholder} aria-hidden="true" />
        )}
        {outOfStock && <span className={styles.outOfStock}>Out of Stock</span>}
      </div>
      <div className={styles.meta}>
        <h3 className={styles.name}>{name}</h3>
        <Price amountNgn={price_ngn} variant="card" />
      </div>
    </Link>
  );
}
