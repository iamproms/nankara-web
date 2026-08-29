'use client';

import Image from 'next/image';
import Link from 'next/link';

import { useCart } from '../../hooks/useCart';
import Price from '../Price/Price';
import QuantitySelector from '../QuantitySelector/QuantitySelector';
import styles from './CartLineItem.module.css';

// One row in the drawer (`variant="drawer"`) or the /cart page (`variant="page"`).
// `product` is null when the stored id no longer resolves to a live product.
export default function CartLineItem({ item, product, unavailable, outOfStock, variant = 'drawer' }) {
  const { setItemQuantity, removeItem } = useCart();
  const idSuffix = item.productId;
  const removeId =
    variant === 'page' ? `cart-item-remove-${idSuffix}` : `cart-drawer-remove-${idSuffix}`;

  if (unavailable) {
    return (
      <div className={`${styles.row} ${styles[variant]} ${styles.unavailable}`}>
        <div className={styles.thumb} aria-hidden="true" />
        <div className={styles.info}>
          <p className={styles.name}>This piece is no longer available</p>
          <button
            type="button"
            className={styles.remove}
            id={removeId}
            onClick={() => removeItem(item.productId)}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  const image = product.primary_image || product.images?.[0] || null;

  return (
    <div className={`${styles.row} ${styles[variant]}`}>
      <Link href={`/shop/${product.slug}`} className={styles.thumb}>
        {image ? (
          <Image
            src={image.url}
            alt={image.alt_text || product.name}
            fill
            sizes="96px"
            style={{ objectFit: 'cover', filter: 'var(--photo-tone)' }}
          />
        ) : (
          <span className={styles.thumbPlaceholder} aria-hidden="true" />
        )}
      </Link>

      <div className={styles.info}>
        <Link href={`/shop/${product.slug}`} className={styles.name}>
          {product.name}
        </Link>
        <Price amountNgn={product.price_ngn} variant="inline" />
        {outOfStock && <p className={styles.outOfStock}>Out of stock</p>}

        <div className={styles.controls}>
          <QuantitySelector
            value={item.quantity}
            onChange={(q) => setItemQuantity(item.productId, q)}
            idBase={`cart-quantity-${idSuffix}`}
            size="sm"
          />
          <button
            type="button"
            className={styles.remove}
            id={removeId}
            onClick={() => removeItem(item.productId)}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
