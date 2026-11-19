'use client';

import { useCallback, useEffect, useState } from 'react';

import AdminNav from '../../../components/AdminNav/AdminNav';
import { useAdminGuard } from '../../../hooks/useAdminGuard';
import { deleteCategory, getAdminCategories } from '../../../lib/adminApi';
import styles from '../admin.module.css';

export default function AdminCategoriesPage() {
  const { authReady, onAuthError } = useAdminGuard();
  const [categories, setCategories] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await getAdminCategories());
    } catch (err) {
      if (!onAuthError(err)) setError('Could not load categories.');
    }
  }, [onAuthError]);

  useEffect(() => {
    if (authReady) loadCategories();
  }, [authReady, loadCategories]);

  const remove = async (category) => {
    const confirmed = window.confirm(
      `Delete “${category.name}”? Products in this category will remain, but become uncategorised.`
    );
    if (!confirmed) return;

    setDeletingId(category.id);
    setError('');
    try {
      await deleteCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
    } catch (err) {
      if (!onAuthError(err)) setError(`Could not delete “${category.name}”.`);
    } finally {
      setDeletingId(null);
    }
  };

  if (!authReady) return null;

  return (
    <>
      <AdminNav />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Categories</h1>
        </div>

        <p className={styles.warning}>
          Deleting a category does not delete its products. Those products become
          uncategorised and can be reassigned from the product editor.
        </p>

        {error && <p className={styles.error}>{error}</p>}
        {!categories && !error && <p className={styles.muted}>Loading…</p>}
        {categories?.length === 0 && (
          <p className={styles.muted}>No categories yet. Add one from a product form.</p>
        )}

        {categories?.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Storefront slug</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td className={styles.muted}>{category.slug}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      disabled={deletingId === category.id}
                      onClick={() => remove(category)}
                    >
                      {deletingId === category.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
