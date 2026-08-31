// Pure helpers for the admin product form + image manager. Kept framework-free so
// they can be unit-tested. The backend owns slug uniqueness, price validation, and
// the single-primary rule — these only shape requests and give a live preview.

// Mirror of backend `slugify_text` (python-slugify) closely enough for a preview.
// The server's returned `ProductOut.slug` is authoritative after save (it adds the
// `-2` / `-3` suffix on a collision, which we can't predict here).
export function slugify(name) {
  return (
    String(name || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '') // strip combining accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'item'
  );
}

export function productFormErrors(values) {
  const errors = {};
  if (!String(values.name || '').trim()) {
    errors.name = 'Enter a product name.';
  }
  const price = Number(values.price_ngn);
  if (
    values.price_ngn === '' ||
    !Number.isFinite(price) ||
    !Number.isInteger(price) ||
    price < 0
  ) {
    errors.price_ngn = 'Enter the price in whole Naira (0 or more).';
  }
  return errors;
}

function toImagePayload(images) {
  return (images || []).map((img) => ({
    url: img.url,
    public_id: img.public_id,
    alt_text: img.alt_text || '',
    is_primary: Boolean(img.is_primary),
  }));
}

export function buildCreatePayload(values, images) {
  return {
    name: values.name.trim(),
    slug: values.slug ? values.slug.trim() : undefined,
    description: values.description || '',
    price_ngn: Number(values.price_ngn),
    category_id: values.category_id ? Number(values.category_id) : null,
    availability: values.availability || 'IN_STOCK',
    is_published: Boolean(values.is_published),
    images: toImagePayload(images),
  };
}

// PATCH is partial — only send what changed. `slug` is included ONLY when the
// admin actually edited it, so a rename never silently re-slugs a live URL.
export function buildUpdatePayload(values, original) {
  const payload = {};
  if (values.name.trim() !== original.name) payload.name = values.name.trim();
  if ((values.description || '') !== (original.description || '')) {
    payload.description = values.description || '';
  }
  if (Number(values.price_ngn) !== original.price_ngn) {
    payload.price_ngn = Number(values.price_ngn);
  }
  const nextCategory = values.category_id ? Number(values.category_id) : null;
  const originalCategory = original.category?.id ?? null;
  if (nextCategory !== originalCategory) {
    payload.category_id = nextCategory;
  }
  if (values.availability !== original.availability) {
    payload.availability = values.availability;
  }
  if (Boolean(values.is_published) !== original.is_published) {
    payload.is_published = Boolean(values.is_published);
  }
  if (values.slug && values.slug.trim() !== original.slug) {
    payload.slug = values.slug.trim();
  }
  return payload;
}

export function imagesEqual(a, b) {
  const norm = (list) =>
    JSON.stringify(
      toImagePayload(list).map((i) => [i.url, i.public_id, i.alt_text, i.is_primary])
    );
  return norm(a) === norm(b);
}

// ── Image list operations (pure — each returns a new array) ───────────────────

export function addImage(list, image) {
  return [...list, image];
}

export function removeImage(list, index) {
  const next = list.filter((_, i) => i !== index);
  // Guarantee a primary survives.
  if (next.length && !next.some((i) => i.is_primary)) {
    next[0] = { ...next[0], is_primary: true };
  }
  return next;
}

export function setPrimary(list, index) {
  return list.map((img, i) => ({ ...img, is_primary: i === index }));
}

export function reorderImages(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function synthesizePublicId(slug, list) {
  const base = slug || 'image';
  const rand = Math.random().toString(36).slice(2, 8);
  return `manual/${base}-${(list?.length || 0) + 1}-${rand}`;
}

// Convert a ProductOut.images array into the manager's working shape.
export function toWorkingImages(images) {
  return (images || []).map((img, i) => ({
    tmpId: `saved-${img.id ?? i}`,
    url: img.url,
    public_id: img.public_id,
    alt_text: img.alt_text || '',
    is_primary: Boolean(img.is_primary),
  }));
}
