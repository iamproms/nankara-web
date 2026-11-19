'use client';

import { useMemo, useState } from 'react';

import CategoryTabs from '../CategoryTabs/CategoryTabs';
import ProductCard from '../ProductCard/ProductCard';
import styles from './ShopCatalogue.module.css';

// Client island: category filter over the server-fetched product list. The dataset is
// under 10 items (spec §2), so filtering is a plain in-memory pass.
export default function ShopCatalogue({ products, categories }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const visible = useMemo(() => {
    if (activeCategory === 'all') return products;
    return products.filter((p) => p.category?.slug === activeCategory);
  }, [products, activeCategory]);

  if (products.length === 0) {
    return (
      <p className={styles.empty}>
        The collection is being prepared. Please check back soon.
      </p>
    );
  }

  return (
    <div className={styles.catalogue}>
      <CategoryTabs
        categories={categories || []}
        active={activeCategory}
        onChange={setActiveCategory}
      />
      {visible.length === 0 ? (
        <p className={styles.empty}>No pieces in this category yet.</p>
      ) : (
        <div className={styles.grid} id="shop-product-grid">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
