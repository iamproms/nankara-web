'use client';

import styles from './CategoryTabs.module.css';

// Minimal filtering only (spec §5): "All" plus one tab per category. No search.
export default function CategoryTabs({ categories, active, onChange }) {
  if (!categories || categories.length === 0) return null;

  const tabs = [{ slug: 'all', name: 'All' }, ...categories];

  return (
    <div className={styles.tabs} role="group" aria-label="Filter by category">
      {tabs.map((tab) => (
        <button
          key={tab.slug}
          type="button"
          id={`shop-category-tab-${tab.slug}`}
          className={`${styles.tab} ${active === tab.slug ? styles.active : ''}`}
          aria-pressed={active === tab.slug}
          onClick={() => onChange(tab.slug)}
        >
          {tab.name}
        </button>
      ))}
    </div>
  );
}
