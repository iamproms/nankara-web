'use client';

import { useEffect, useMemo, useState } from 'react';

import ImageManager from '../ImageManager/ImageManager';
import { createCategory, getAdminCategories } from '../../lib/adminApi';
import {
  buildCreatePayload,
  buildUpdatePayload,
  imagesEqual,
  productFormErrors,
  slugify,
  toWorkingImages,
} from '../../lib/product';
import styles from './ProductForm.module.css';

function Field({ id, label, error, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
      {hint && !error && <p className={styles.hint}>{hint}</p>}
      {error && (
        <p className={styles.errorMsg} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProductForm({ initial, onSubmit, submitting, error }) {
  const isEdit = Boolean(initial);

  const [values, setValues] = useState(() => ({
    name: initial?.name || '',
    slug: initial?.slug || '',
    description: initial?.description || '',
    price_ngn: initial ? String(initial.price_ngn) : '',
    category_id: initial?.category?.id ? String(initial.category.id) : '',
    availability: initial?.availability || 'IN_STOCK',
    is_published: initial?.is_published || false,
  }));
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [images, setImages] = useState(() => toWorkingImages(initial?.images));
  const [errors, setErrors] = useState({});

  const [categories, setCategories] = useState([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    getAdminCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const originalImages = useMemo(
    () => toWorkingImages(initial?.images),
    [initial]
  );

  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const onNameChange = (e) => {
    const name = e.target.value;
    setValues((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
    setErrors((prev) => ({ ...prev, name: '' }));
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return;
    setCategoryError('');
    try {
      const created = await createCategory({ name });
      setCategories((prev) =>
        [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      );
      setValues((prev) => ({ ...prev, category_id: String(created.id) }));
      setNewCategory('');
      setAddingCategory(false);
    } catch {
      setCategoryError('Could not add that category.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = productFormErrors(values);
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    if (isEdit) {
      const payload = buildUpdatePayload(values, initial);
      const changed = !imagesEqual(originalImages, images);
      onSubmit(payload, images, changed);
    } else {
      onSubmit(buildCreatePayload(values, images), images, true);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {error && (
        <p className={styles.banner} role="alert">
          {error}
        </p>
      )}

      <Field id="product-name" label="Name" error={errors.name}>
        <input
          id="product-name"
          className={styles.input}
          value={values.name}
          onChange={onNameChange}
        />
      </Field>

      <Field
        id="product-slug"
        label="Slug"
        hint="Used in the storefront URL: /shop/…"
      >
        <input
          id="product-slug"
          className={styles.input}
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set('slug')(e);
          }}
        />
      </Field>

      <Field id="product-description" label="Description">
        <textarea
          id="product-description"
          className={`${styles.input} ${styles.textarea}`}
          rows={5}
          value={values.description}
          onChange={set('description')}
        />
      </Field>

      <div className={styles.row}>
        <Field id="product-price" label="Price (NGN)" error={errors.price_ngn}>
          <input
            id="product-price"
            type="number"
            min="0"
            step="1"
            className={styles.input}
            value={values.price_ngn}
            onChange={set('price_ngn')}
          />
        </Field>

        <Field id="product-availability" label="Availability">
          <select
            id="product-availability"
            className={styles.input}
            value={values.availability}
            onChange={set('availability')}
          >
            <option value="IN_STOCK">In stock</option>
            <option value="OUT_OF_STOCK">Out of stock</option>
          </select>
        </Field>
      </div>

      <Field id="product-category" label="Category" error={categoryError}>
        {addingCategory ? (
          <div className={styles.inlineAdd}>
            <input
              className={styles.input}
              placeholder="New category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
            />
            <button type="button" className={styles.smallBtn} onClick={addCategory}>
              Add
            </button>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => {
                setAddingCategory(false);
                setNewCategory('');
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className={styles.inlineAdd}>
            <select
              id="product-category"
              className={styles.input}
              value={values.category_id}
              onChange={set('category_id')}
            >
              <option value="">— none —</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setAddingCategory(true)}
            >
              ＋ new
            </button>
          </div>
        )}
      </Field>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={values.is_published}
          onChange={set('is_published')}
        />
        Published (visible on the storefront)
      </label>

      <ImageManager value={images} onChange={setImages} slug={values.slug} />

      <div className={styles.actions}>
        <button
          type="submit"
          className="btn btn-dark"
          disabled={submitting}
        >
          {submitting
            ? 'Saving…'
            : isEdit
              ? 'Save changes'
              : 'Create product'}
        </button>
      </div>
    </form>
  );
}
