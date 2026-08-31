import { describe, expect, it } from 'vitest';

import {
  addImage,
  buildCreatePayload,
  buildUpdatePayload,
  imagesEqual,
  productFormErrors,
  removeImage,
  reorderImages,
  setPrimary,
  slugify,
  synthesizePublicId,
  toWorkingImages,
} from './product';

describe('slugify', () => {
  it('lowercases and dashes', () => {
    expect(slugify('The Bold Statement Queen')).toBe('the-bold-statement-queen');
  });
  it('strips punctuation and collapses dashes', () => {
    expect(slugify('  Queen’s —  Circle!! ')).toBe('queen-s-circle');
  });
  it('strips accents', () => {
    expect(slugify('Café Noir')).toBe('cafe-noir');
  });
  it('falls back to "item" when empty', () => {
    expect(slugify('   ')).toBe('item');
    expect(slugify('!!!')).toBe('item');
    expect(slugify(null)).toBe('item');
  });
});

describe('productFormErrors', () => {
  const ok = { name: 'X', price_ngn: '1000' };
  it('passes a valid form', () => {
    expect(productFormErrors(ok)).toEqual({});
  });
  it('flags a missing name', () => {
    expect(productFormErrors({ ...ok, name: '  ' }).name).toBeTruthy();
  });
  it('flags a bad price', () => {
    expect(productFormErrors({ ...ok, price_ngn: '' }).price_ngn).toBeTruthy();
    expect(productFormErrors({ ...ok, price_ngn: '-5' }).price_ngn).toBeTruthy();
    expect(productFormErrors({ ...ok, price_ngn: '99.5' }).price_ngn).toBeTruthy();
    expect(productFormErrors({ ...ok, price_ngn: 'abc' }).price_ngn).toBeTruthy();
  });
  it('accepts a zero price', () => {
    expect(productFormErrors({ ...ok, price_ngn: '0' })).toEqual({});
  });
});

describe('buildCreatePayload', () => {
  it('shapes the request and maps images', () => {
    const payload = buildCreatePayload(
      {
        name: '  The X  ',
        slug: '',
        description: 'd',
        price_ngn: '250000',
        category_id: '3',
        availability: 'IN_STOCK',
        is_published: true,
      },
      [{ url: 'u', public_id: 'p', alt_text: 'a', is_primary: true }]
    );
    expect(payload).toEqual({
      name: 'The X',
      slug: undefined,
      description: 'd',
      price_ngn: 250000,
      category_id: 3,
      availability: 'IN_STOCK',
      is_published: true,
      images: [{ url: 'u', public_id: 'p', alt_text: 'a', is_primary: true }],
    });
  });
});

describe('buildUpdatePayload', () => {
  const original = {
    name: 'Old',
    description: 'old desc',
    price_ngn: 100000,
    category: { id: 2 },
    availability: 'IN_STOCK',
    is_published: false,
    slug: 'old',
  };
  const base = {
    name: 'Old',
    description: 'old desc',
    price_ngn: '100000',
    category_id: '2',
    availability: 'IN_STOCK',
    is_published: false,
    slug: 'old',
  };

  it('omits everything when nothing changed', () => {
    expect(buildUpdatePayload(base, original)).toEqual({});
  });
  it('includes only changed fields', () => {
    expect(
      buildUpdatePayload({ ...base, price_ngn: '120000', is_published: true }, original)
    ).toEqual({ price_ngn: 120000, is_published: true });
  });
  it('omits slug on a rename', () => {
    expect(buildUpdatePayload({ ...base, name: 'New Name' }, original)).toEqual({
      name: 'New Name',
    });
  });
  it('includes slug only when explicitly edited', () => {
    expect(buildUpdatePayload({ ...base, slug: 'new-slug' }, original)).toEqual({
      slug: 'new-slug',
    });
  });
  it('clears category to null', () => {
    expect(buildUpdatePayload({ ...base, category_id: '' }, original)).toEqual({
      category_id: null,
    });
  });
});

describe('imagesEqual', () => {
  const a = [{ url: 'u', public_id: 'p', alt_text: '', is_primary: true }];
  it('is true for identical lists', () => {
    expect(imagesEqual(a, [{ ...a[0] }])).toBe(true);
  });
  it('is false when alt text changes', () => {
    expect(imagesEqual(a, [{ ...a[0], alt_text: 'x' }])).toBe(false);
  });
  it('is false when order changes', () => {
    const two = [
      { url: '1', public_id: '1', alt_text: '', is_primary: true },
      { url: '2', public_id: '2', alt_text: '', is_primary: false },
    ];
    expect(imagesEqual(two, [two[1], two[0]])).toBe(false);
  });
});

describe('image list ops', () => {
  const list = [
    { tmpId: 'a', url: '1', public_id: '1', is_primary: true },
    { tmpId: 'b', url: '2', public_id: '2', is_primary: false },
    { tmpId: 'c', url: '3', public_id: '3', is_primary: false },
  ];

  it('addImage appends', () => {
    expect(addImage(list, { tmpId: 'd' })).toHaveLength(4);
  });
  it('setPrimary makes exactly one primary', () => {
    const next = setPrimary(list, 2);
    expect(next.filter((i) => i.is_primary)).toHaveLength(1);
    expect(next[2].is_primary).toBe(true);
  });
  it('removeImage keeps a primary alive', () => {
    const next = removeImage(list, 0); // drops the primary
    expect(next).toHaveLength(2);
    expect(next.some((i) => i.is_primary)).toBe(true);
  });
  it('reorderImages moves an item', () => {
    expect(reorderImages(list, 0, 2).map((i) => i.tmpId)).toEqual(['b', 'c', 'a']);
  });
  it('reorderImages is a no-op for out-of-range', () => {
    expect(reorderImages(list, 0, 5)).toBe(list);
  });
});

describe('synthesizePublicId', () => {
  it('is unique per call and namespaced', () => {
    const a = synthesizePublicId('the-x', []);
    const b = synthesizePublicId('the-x', []);
    expect(a).not.toBe(b);
    expect(a.startsWith('manual/the-x-')).toBe(true);
  });
});

describe('toWorkingImages', () => {
  it('maps ProductOut images to the manager shape', () => {
    const rows = toWorkingImages([
      { id: 7, url: 'u', public_id: 'p', alt_text: 'a', is_primary: true },
    ]);
    expect(rows[0]).toMatchObject({
      tmpId: 'saved-7',
      url: 'u',
      public_id: 'p',
      alt_text: 'a',
      is_primary: true,
    });
  });
});
