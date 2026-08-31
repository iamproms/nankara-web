# Completing Milestone 1 — Admin Product UI

> **Status: implemented** (2026-08-31). `/admin/products`, `/admin/products/new`,
> `/admin/products/[id]` are live; `<ProductForm>` + `<ImageManager>` +
> `<Badge>` built; `/shop` and `/shop/[slug]` now fetch fresh (no ISR lag);
> inline "＋ new category"; 24 new unit tests. Walkthrough in
> `SHOP_TESTING_GUIDE.md` §2. See `SESSION_PRODUCT_UI_REPORT.md` for the recap.

## Context

`NANKARA_SHOP_MVP.md` §29 Milestone 1 ("Data + Product Administration") lists
**"Admin product UI"** alongside the backend work, with:

> **Done when:** admin can publish a real Nankara product without developer intervention.

M1 shipped the backend and CLI only; the `/admin/products` screens (spec §18, §23)
were never built, and M2–M4 each only built the admin screen they needed for their
own slice (`/admin/shipping` in M3; `/admin`, `/admin/orders` in M4). Today a
product is added through the Swagger UI, `curl`, or `seed-demo-products` — which
means acceptance criteria **#2** ("admin can create, edit, publish, unpublish a
product") and **#3** ("admin can upload several product images") can't be passed by
a non-developer.

This is a **frontend-only** task. The backend API is complete and unchanged:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/admin/products` | List, **including drafts**, newest first |
| `POST` | `/api/v1/admin/products` | Create (`name`, `slug?`, `description`, `price_ngn`, `category_id?`, `availability`, `is_published`, `images[]`) |
| `GET` | `/api/v1/admin/products/{id}` | One product (with images + category) |
| `PATCH` | `/api/v1/admin/products/{id}` | Partial update (any of the above fields; slug only changes if sent) |
| `PUT` | `/api/v1/admin/products/{id}/images` | Replace the full ordered image list (`[{url, public_id, alt_text, is_primary}]`; index = sort order, one primary enforced, removed assets deleted from Cloudinary) |
| `POST` | `/api/v1/admin/media/upload` | multipart `file` (jpeg/png/webp/avif, ≤10 MB) → `{url, public_id}` — **503 if Cloudinary keys unset** |
| `GET/POST` | `/api/v1/admin/categories` | Category list + create (for the picker) |

Reuse the admin foundation built in M3/M4: `src/lib/adminApi.js` (token + fetch),
`src/hooks/useAdminGuard.js`, `src/components/AdminNav/`, `src/app/admin/admin.module.css`.

---

## Decisions

1. **Three routes**, matching §23: `/admin/products` (list), `/admin/products/new`
   (create), `/admin/products/[id]` (edit). Client components behind `useAdminGuard`,
   same as the orders screens.
2. **One shared `<ProductForm>`** for new + edit. New → `POST` (images inline).
   Edit → `PATCH` for the scalar fields + `PUT /images` only when the image list
   changed. Keeps each request doing one clear thing.
3. **Images: upload *and* paste-URL.** Cloudinary upload is the primary path, but
   `PUT /images` accepts a raw `{url, public_id}`, so the manager also allows
   adding an image by URL — this keeps the screen usable when Cloudinary keys
   aren't configured (dev, or pre-launch), and it's how `seed-demo-products`
   already works. A clear inline notice when `/media/upload` returns 503.
4. **Slug**: auto-derived from the name while typing on the **new** form (editable);
   on the **edit** form it's shown but only sent if the admin changes it (the
   backend already refuses to silently re-slug on rename — this just matches that).
5. **No hard delete** (spec §18) — the list has "Unpublish" / "Publish" and
   "Set out of stock", never Delete.
6. **`AdminNav`** gains a **Products** link (Overview · Products · Orders · Shipping).
7. **Styling**: the existing utilitarian `admin.module.css` system — not editorial.

---

## Frontend work

### `src/lib/adminApi.js` — add

| Function | Call |
| --- | --- |
| `getAdminProducts()` | `adminFetch('/admin/products')` |
| `getAdminProduct(id)` | `adminFetch('/admin/products/${id}')` |
| `createProduct(body)` | `adminFetch('/admin/products', { method: 'POST', body })` |
| `updateProduct(id, body)` | `adminFetch('/admin/products/${id}', { method: 'PATCH', body })` |
| `replaceProductImages(id, images)` | `adminFetch('/admin/products/${id}/images', { method: 'PUT', body: images })` — note the body is a bare array |
| `getAdminCategories()` / `createCategory(body)` | `adminFetch('/admin/categories', …)` |
| `uploadMedia(file)` | **new `adminUpload` helper** — `fetch` with `FormData` (`file`), `Authorization` header, **no `content-type`** (browser sets the multipart boundary); `parse()` the response |

`adminFetch` today assumes a JSON body; `PUT /images` sends a top-level array —
verify `JSON.stringify([...])` is what goes out (it is), and add `adminUpload`
separately rather than overloading `adminFetch`.

### `src/lib/product.js` (new, pure — unit-tested)

- `slugify(name)` — lowercase, spaces→`-`, strip non-`[a-z0-9-]`, collapse dashes
  (mirror of `backend/app/core/slugs.slugify_text` closely enough for a live preview;
  the server still has the last word).
- `productFormErrors(values)` — `name` required, `price_ngn` a non-negative integer,
  at least… (images optional). Returns `{field: message}`.
- `buildCreatePayload(values, images)` / `buildUpdatePayload(values, original)` —
  shape the request; `buildUpdatePayload` omits unchanged fields and omits `slug`
  unless the admin edited it.
- `reorderImages(list, from, to)` / `setPrimary(list, index)` / `removeImage(list, index)`
  — pure list operations for the image manager.

### `src/components/ProductForm/` (new)

`'use client'`. Props: `initial` (null for new), `onSubmit`. Fields per §18:

- **Name** (drives the slug preview on new)
- **Slug** (editable; helper text "used in the URL /shop/…")
- **Description** (textarea)
- **Price (NGN)** (number, whole naira)
- **Category** (`<select>` from `getAdminCategories()`; "— none —" allowed; a small
  "＋ new category" affordance that calls `createCategory` inline is optional-nice)
- **Availability** (`IN_STOCK` / `OUT_OF_STOCK` radio or select)
- **Published / Draft** (checkbox — default Draft on new, per `ProductCreate`)
- **`<ImageManager>`** (below)

Inline `role="alert"` errors from `productFormErrors`; submit disabled while saving;
success → redirect to the list (new) or a "Saved" line (edit).

### `src/components/ImageManager/` (new)

`'use client'`. Owns the working image list (`[{url, public_id, alt_text, is_primary}]`).

- **Add** — a file input → `uploadMedia(file)` → append `{url, public_id}`; **and** an
  "add by URL" row (`url` + a generated `public_id` like `manual/<slug>-<n>`).
- Each row: thumbnail (`next/image`), an **alt text** input, **Make primary** (radio),
  **↑ / ↓** reorder, **Remove**.
- 503 from `uploadMedia` → a persistent notice: *"Image hosting isn't configured —
  add images by URL for now."* (link the Cloudinary env vars in the notice).
- On the **new** form the list is passed up in the create payload (`images`); on the
  **edit** form, a "Save images" action calls `replaceProductImages` (or fold it into
  the form's single Save — do the `PATCH` then the `PUT` in sequence).

### Routes

| File | Content |
| --- | --- |
| `src/app/admin/products/page.js` (new) | Guard + `<AdminNav>`. `getAdminProducts()`. Table (spec §18): **Product** (name + thumbnail) · **Price** (`formatNgn`) · **Category** · **Availability** badge · **Published** badge · **Edit** link. "＋ New product" button → `/admin/products/new`. Loading / empty / error states like `/admin/orders`. |
| `src/app/admin/products/new/page.js` (new) | Guard + `<AdminNav>`. `<ProductForm initial={null} onSubmit={createProduct→redirect}>`. |
| `src/app/admin/products/[id]/page.js` (new) | Guard + `<AdminNav>`. `getAdminProduct(id)` → `<ProductForm initial={product}>`; Save = `updateProduct` (+ `replaceProductImages` if images changed). Quick actions: **Publish/Unpublish**, **Set in/out of stock** (one-field `PATCH`). 404 → "Product not found" + back link. A link to the live `/shop/{slug}` when published. |
| `src/components/AdminNav/AdminNav.js` (edit) | Add `{ href: '/admin/products', label: 'Products' }` between Overview and Orders. |
| `src/app/admin/admin.module.css` (edit) | Form field styles (`.formGrid`, `.field`, `.textarea`), the image-manager grid, thumbnail sizing. Reuse `.badge*` from M4. |
| `next.config.mjs` | Already allows `res.cloudinary.com` and `images.pexels.com` — no change. |

### Tests

- `src/lib/product.test.js` — `slugify`, `productFormErrors`, `buildCreatePayload` /
  `buildUpdatePayload` (omits unchanged, omits slug unless edited), `reorderImages` /
  `setPrimary` / `removeImage`.
- No component/render tests (matches the repo's pure-logic-only Vitest setup).

### Docs / housekeeping

- `backend/README.md` + `SHOP_TESTING_GUIDE.md` — flip the "no product form" notes to
  "done"; the guide's §2 becomes a **UI** walkthrough (keep the Swagger version as an
  API-level appendix).
- Update `SESSION_1_REPORT.md` (mark the M1 line ✅) and the memory
  `project_shop_backend.md`.
- New `SESSION_5_REPORT.md` (git-ignored) or fold into the M5 report.

---

## Verification (end-to-end — closes spec §30 #2 / #3)

Run both servers (see `SHOP_TESTING_GUIDE.md` §0). Then, **entirely through the UI**:

1. `/admin/login` → `/admin` → **Products** → **＋ New product**.
2. Type "The Verified Queen" → slug preview shows `the-verified-queen`. Set a
   description, `price_ngn` 250000, a category, availability In stock.
3. **Images** — upload 2–3 files (or add by URL if Cloudinary is off). Reorder,
   set a primary, add alt text.
4. Leave as **Draft**, Save → back on the list, the product shows with a "Draft" badge.
5. Open `/shop` → the product is **absent** (draft). `/shop/the-verified-queen` → not found.
6. Edit it → **Publish** → Save.
7. `/shop` → the product now appears with its primary image and price; the approx-USD
   line shows for an international visitor. `/shop/the-verified-queen` → full detail,
   gallery in the order you set, alt text on the images (view source).
8. Add it to the bag → checkout → place order → the whole M2–M4 flow still works
   with an admin-created product.
9. Back in admin: edit price → Save → `/shop` reflects the new price on refresh.
   Set **Out of stock** → the storefront disables Add to Bag; the order endpoint
   `409`s it.
10. Rename the product → Save → the slug does **not** change (existing `/shop/…` URL
    still resolves).
11. `npm test` (new `product.test.js`) + `npm run lint` + `npm run build` clean.

**Milestone 1 is done when steps 1–10 need no `curl`, no Swagger, no seed script.**

---

## Effort / sequencing

| Piece | Notes |
| --- | --- |
| `adminApi.js` additions + `adminUpload` | small; the multipart helper is the only new pattern |
| `src/lib/product.js` + tests | small, pure |
| `<ImageManager>` | the meatiest component — upload, URL-add, reorder, primary, alt, 503 handling |
| `<ProductForm>` | medium — fields + validation + category picker |
| 3 routes + list table | small each, reuse the orders-screen patterns |
| `AdminNav` + CSS | trivial |
| docs + memory + report | small |

No new npm dependency. No backend change. No new migration.

---

## Risks / notes

1. **Cloudinary not configured in dev** — the "add by URL" path must be first-class,
   not an afterthought, or the screen is untestable locally. Covered by decision 3.
2. **`PUT /images` is a full replace** — the manager must always send the complete
   list; a partial send silently drops images. Make "Save images" send the working
   list verbatim.
3. **Multipart through `adminFetch`** — don't set `content-type` for `FormData`;
   use the separate `adminUpload`.
4. **Slug drift** — the live preview is cosmetic; the server owns uniqueness
   (`ensure_unique_slug` adds `-2`). Show the server's returned slug after save.
5. **`/shop` ISR** — `/shop` is `force-dynamic` so new/edited products show on
   refresh; `/shop/[slug]` has `revalidate = 60`, so a just-published product's
   detail page can lag up to a minute (or 404 briefly before first render) — note
   this in the guide, it's not a bug.
6. **Draft leakage** — double-check the public `GET /products/{slug}` still 404s a
   draft after the edit flow toggles publish state back and forth.
