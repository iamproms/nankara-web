'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import AdminNav from '../../../../components/AdminNav/AdminNav';
import ProductForm from '../../../../components/ProductForm/ProductForm';
import { useAdminGuard } from '../../../../hooks/useAdminGuard';
import { createProduct } from '../../../../lib/adminApi';
import styles from '../../admin.module.css';

export default function NewProductPage() {
  const router = useRouter();
  const { authReady, onAuthError } = useAdminGuard();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!authReady) return null;

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setError('');
    try {
      const created = await createProduct(payload); // images go in the POST body
      router.push(`/admin/products/${created.id}`);
    } catch (err) {
      if (!onAuthError(err)) {
        setError(
          err?.status === 422
            ? 'Please check the fields and try again.'
            : 'Could not create the product. Please try again.'
        );
        setSubmitting(false);
      }
    }
  };

  return (
    <>
      <AdminNav />
      <main className={styles.main}>
        <Link href="/admin/products" className={styles.backLink}>
          ← All products
        </Link>
        <h1 className={styles.title}>New product</h1>
        <ProductForm
          initial={null}
          onSubmit={handleSubmit}
          submitting={submitting}
          error={error}
        />
      </main>
    </>
  );
}
