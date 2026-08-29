# Milestone 2 — Storefront + Cart

## Context

The Nankara site (Next.js 14 App Router, JS, CSS Modules, at repo root) is currently a
static brand site. Session 1 built the FastAPI backend in `backend/` (Milestone 1):
admin auth, product/category models, Cloudinary images, and **public read endpoints**
(`GET /api/v1/products`, `/products/{slug}`, `/categories`). Nothing on the frontend
talks to it yet — `/shop` is a hardcoded "coming soon" splash.

Milestone 2 (per `NANKARA_SHOP_MVP.md` §5–9, §27–29) turns the storefront on:

> **Done when:** a visitor can browse the real catalogue and build a guest cart.

This is almost entirely frontend work. It introduces, for the first time in this repo:
data fetching, a React context, `localStorage`, a dynamic route, `loading`/`error`/
`not-found` segments, environment config, and a minimal test runner. It must match the
existing editorial aesthetic and conventions (design tokens in `src/styles/globals.css`,
per-component CSS Modules, relative imports, explicit `id=` attributes, `next/image`
full-bleed pattern with `filter: var(--photo-tone)`).

**In scope:** real `/shop` catalogue, `/shop/[slug]` detail + gallery, NGN price with
approximate USD for international visitors, availability / out-of-stock handling, guest
cart (context + localStorage), cart drawer, `/cart` page, minimal category filtering,
SEO basics for product pages, a placeholder `/checkout` page so the CTA isn't a 404,
plus a backend dev-only seed command.

**Out of scope (later milestones):** checkout form, shipping quote, order creation,
Paystack, admin order UI, admin product UI.

---

## Key decisions

1. **API access — Next.js `rewrites()` proxy + direct server fetch.**
   `next.config.mjs` proxies `/api/v1/:path*` → `${BACKEND_ORIGIN}/api/v1/:path*`
   (`BACKEND_ORIGIN` defaults to `http://localhost:8000`). Browser calls hit same-origin
   `/api/v1/...` (no CORS, backend host not shipped to client). Server components call
   the backend directly via `process.env.BACKEND_ORIGIN`. One resolver in
   `src/lib/api.js` switches on `typeof window`.

2. **Rendering — server components for pages, client islands for interactivity.**
   `/shop` and `/shop/[slug]` are server components fetching server-side
   (`fetch(..., { next: { revalidate: 60 } })`), which enables `generateMetadata`
   (spec §26) and crawlable HTML. Interactive pieces are small `'use client'` islands
   fed by server props: `ShopCatalogue` (filter), `ProductGallery`, `AddToBag`,
   `QuantitySelector`, `CartDrawer`, cart line items. The cart is 100% client-side.

3. **USD display — detect international visitors (client-side heuristic).**
   Domestic visitors see NGN only; international visitors also see a muted
   `Approx. $X USD` line. Detection runs after mount from timezone + language
   (`Intl.DateTimeFormat().resolvedOptions().timeZone`, `navigator.languages`);
   SSR and first client render show **NGN only** (no hydration mismatch), then the
   USD line is revealed for international visitors in an effect. The classification
   is a pure, unit-tested function; the production-grade signal (edge geo) is an M5
   refinement. Rate comes from `NEXT_PUBLIC_NGN_PER_USD` (fallback `1600`), isolated
   to one constant + one function so M3 can repoint it to a backend rate.

4. **Tests — Vitest for pure logic only.** Add `vitest` (dev dep) + `test` script.
   Cover **only** `cartReducer`, `src/lib/currency.js`, and the visitor-classifier
   helper. No `@testing-library`, no jsdom, no component tests (deferred to M5).

5. **Seed data — backend CLI command.** Add `python -m app.cli seed-demo-products`:
   ~5 published Identity Collection products (The Bold Statement Queen, The Power
   Queen, The Soft Elegant Queen, The Luminous Queen, The Quiet Power Queen), each
   with a category, 3 image rows using `images.pexels.com` URLs (already allowed in
   `next.config.mjs`), realistic `price_ngn`, one product `OUT_OF_STOCK`. Idempotent,
   follows the existing `seed_categories` pattern. **Only backend change in M2** —
   dev tooling, no schema/API/migration change.

6. **Cart persistence — versioned localStorage envelope.** Key `nankara.cart.v1`,
   value `{ "items": [{ "productId": 1, "quantity": 2 }] }`. Item shape is exactly
   `{ productId, quantity }` (spec §8) — **no price snapshot**, so the UI always shows
   the current backend price and price divergence is impossible in M2. Existence /
   availability is reconciled live against `GET /api/v1/products`. Authoritative
   price + availability reconciliation happens at order creation in M3.

7. **Drawer mount + scroll-lock.** `CartProvider` wraps everything in `layout.js`;
   `<CartDrawer/>` renders inside `<SmoothScroll>` (the `<ReactLenis root>` wrapper)
   so it can use `useLenis().stop()/.start()` for scroll-lock. Drawer body gets
   `data-lenis-prevent`. Provider auto-closes the drawer on `usePathname()` change.

---

## New files

### `src/lib/` (plain modules — `src/lib` is the Next.js community norm; no existing convention)

| File | Responsibility |
| --- | --- |
| `src/lib/api.js` | `baseUrl()` → `''` in browser, `process.env.BACKEND_ORIGIN \|\| 'http://localhost:8000'` on server. `getProducts({fresh})`, `getProduct(slug)`, `getCategories()`. Server calls pass `next:{revalidate:60}`; `fresh` passes `cache:'no-store'`. Non-2xx throws `Error` with `.status` (so `getProduct` → `notFound()` on 404). |
| `src/lib/currency.js` | `NGN_PER_USD` from `process.env.NEXT_PUBLIC_NGN_PER_USD` (fallback `1600`). `formatNgn(ngn)` → `"₦150,000"` (`Intl.NumberFormat('en-NG')`, `₦` prefix fallback). `toUsdApprox(ngn, rate?)` → number\|null. `formatUsdApprox(ngn, rate?)` → `"Approx. $98 USD"`\|null (`Math.ceil`, guards non-finite/≤0). |
| `src/lib/visitorLocale.js` | Pure `classifyVisitor({ timeZone, languages })` → `'domestic' \| 'international'`. Domestic if `timeZone === 'Africa/Lagos'` or any language matches `/^(en-NG\|ha\|yo\|ig)\b/i`. Unit-tested. |
| `src/lib/cartReducer.js` | Pure `cartReducer(state, action)` + `CART_ACTIONS` constants + `MIN_QTY`/`MAX_QTY` (1/99). Actions: `HYDRATE`, `ADD` (merge qty), `INCREMENT`, `DECREMENT` (drop at 0), `SET_QUANTITY` (clamp), `REMOVE`, `CLEAR`. Dedupe by `productId`. |
| `src/lib/cartStorage.js` | `CART_STORAGE_KEY='nankara.cart.v1'`. `readCart()` (guards `typeof window` + `try/catch`, validates shape/version, `[]` on any problem), `writeCart(items)` (persists `{items}`, swallows quota errors), `sanitizeItems(raw)`. |

### `src/hooks/` (named exports, per convention)

| File | Responsibility |
| --- | --- |
| `src/hooks/useCart.js` | `useContext(CartContext)`; throws if used outside `CartProvider`. |
| `src/hooks/useCartProducts.js` | `'use client'`. Fetches `/api/v1/products` (fresh) via a module-level promise cache shared by drawer + `/cart`. Returns `{ productsById, list, loading, error, reload }`. |
| `src/hooks/useInternationalVisitor.js` | `'use client'`. Returns `boolean` — `false` during SSR/first render, then `classifyVisitor(...) === 'international'` after mount. |
| `src/hooks/useScrollLock.js` | `'use client'`. `useScrollLock(active)` — `useLenis()?.stop()` + `body { overflow:hidden }` (+ scrollbar-width padding compensation) on active; reverse on cleanup. Central for future modals. |

### `src/components/` (`<PascalCase>/<PascalCase>.js` + `.module.css`)

| Component | Responsibility |
| --- | --- |
| `CartProvider/CartProvider.js` | `'use client'`. Defines + exports `CartContext`. `useReducer(cartReducer, {items:[]})` + `isReady` + drawer `useState` + `usePathname()` auto-close. Hydration effect (`HYDRATE` from `readCart()`, then `setReady(true)`); persist effect guarded by `isReady`. Exposes the full `useCart()` value (below). |
| `Price/Price.js` | `'use client'` (calls `useInternationalVisitor()`). Props: `amountNgn`, `variant` (`'card'\|'detail'\|'inline'`). Always renders `₦…`; renders `Approx. $… USD` only when international and `formatUsdApprox` is non-null. |
| `ShopCatalogue/ShopCatalogue.js` | `'use client'`. Props: `products`, `categories`. `activeCategory` state (`'all'`). Renders `CategoryTabs` + `.grid` of `ProductCard`. In-memory filter (dataset <10). Empty state. |
| `CategoryTabs/CategoryTabs.js` | `'use client'`. Props: `categories`, `active`, `onChange`. `All` + one tab per category. Ids `shop-category-tab-all` / `shop-category-tab-<slug>`, `aria-pressed`. Horizontal scroll on mobile. |
| `ProductCard/ProductCard.js` | Presentational. `<Link href={`/shop/${slug}`} id={`product-card-${slug}`}>`, aspect-ratio 3/4 image wrap (reuse `FeaturedCollection` idiom), `next/image fill` + `sizes` + `style={{objectFit:'cover',filter:'var(--photo-tone)'}}`, `alt = primary_image?.alt_text \|\| name`. Name, `<Price variant="card"/>`, "Out of Stock" chip when `OUT_OF_STOCK`. No hover-metadata clutter (§5). |
| `ProductGallery/ProductGallery.js` | `'use client'`. Props: `images` (backend-sorted), `productName`. Desktop: large active image + thumbnail strip. Mobile: CSS `scroll-snap-type: x mandatory` carousel + dot indicators (active dot via `IntersectionObserver`). `data-lenis-prevent` on the track; **no** `touch-action: pan-x` (keeps vertical page scroll). First image `priority`. Handles 0 / 1 image. Ids `product-gallery`, `product-gallery-thumb-<id>`. |
| `AddToBag/AddToBag.js` | `'use client'`. Props: `product` (`{id, availability}`). `IN_STOCK`: `QuantitySelector` + "Add to Bag" (`id="product-add-to-bag"`, `.btn .btn-dark`) → `addItem(id, qty)` then `openDrawer()`. `OUT_OF_STOCK`: selector hidden, disabled button "Out of Stock" + message, no navigation. |
| `QuantitySelector/QuantitySelector.js` | `'use client'`. Props: `value`, `onChange`, `min=1`, `max=99`, `idBase`, `size`. `−`/value/`+`; ids `${idBase}-decrement/-value/-increment`; `aria-label`s; `−` disabled at min. Reused in AddToBag, drawer, cart page. |
| `MadeToMeasureNote/MadeToMeasureNote.js` | Presentational. §6 "Made for your fit" copy block, `id="product-made-to-measure"`. Reused in checkout (M3). |
| `CartDrawer/CartDrawer.js` | `'use client'`. `useCart()` + `useCartProducts()` + `useScrollLock(isDrawerOpen)`. Fixed overlay (`z-index:190`) + right-slide panel (`z-index:200`, `transform` transition, honors `prefers-reduced-motion`). Header "Your Bag (n)" + close (`cart-drawer-close`). Scroll body (`data-lenis-prevent`) of `CartLineItem variant="drawer"`. Empty state. Footer: subtotal `<Price>`, `Checkout` (`cart-drawer-checkout` → `/checkout`), `View Bag` (`cart-drawer-view-bag` → `/cart`). `role="dialog"` `aria-modal`, Esc closes, focus trap + restore. `return null` until `isReady`. |
| `CartLineItem/CartLineItem.js` | `'use client'`. Props: `item`, `product` (or `null`), `variant` (`'drawer'\|'page'`). Thumbnail, name (→ PDP), `<Price>`, `QuantitySelector` wired to cart mutators, Remove (`cart-drawer-remove-<id>` / `cart-item-remove-<id>`). `null` product → greyed "No longer available", Remove only, **excluded from subtotal**. |
| `CartSummary/CartSummary.js` | Presentational. Props: `subtotalNgn`, `variant`, `children` (CTA slot). Subtotal row (`<Price>`) + "Shipping & taxes calculated at checkout". Shared by drawer footer and `/cart`. |

### Routes

| File | Responsibility |
| --- | --- |
| `src/app/shop/page.js` | **Rewrite.** Server component. `export const metadata` (title `Shop — The Identity Collection \| Nankara`). `Promise.all([getProducts(), getCategories()])`. `<Navbar/>`, `<main id="shop-main">` → `<section id="shop-intro">` (heading + §5 copy, reuse `.editorial-heading` / `.section-label`) → `<section id="shop-catalogue">` `<ShopCatalogue/>`, `<Footer/>`. Empty-list handling. |
| `src/app/shop/shop.module.css` | **Rewrite** to catalogue styles: intro section + `.grid` (`repeat(3,1fr)` → `repeat(2,1fr)` @1024 → `1fr` @768, mirroring `FeaturedCollection`) + skeleton styles. |
| `src/app/shop/loading.js` | Skeleton grid (reuses `.card` shell + pulse). |
| `src/app/shop/error.js` | `'use client'`. "We couldn't load the collection" + Retry (`reset()`), error color `#c0392b`. |
| `src/app/shop/[slug]/page.js` | Server component. `export const revalidate = 60`. `generateMetadata({params})` — `getProduct` in `try`; 404 → `{title:'Piece not found \| Nankara'}`; else `{ title:'<name> \| Nankara', description:<~155-char trim>, alternates:{canonical:'/shop/<slug>'}, openGraph:{title,description,images:[primary_image?.url],type:'website'}, twitter:{card:'summary_large_image',images:[...]} }`. Body: `getProduct` → catch 404 → `notFound()`. `<main id="product-main">` → `<section id="product-detail">` grid: `<ProductGallery/>` + info column (breadcrumb Shop / category, `<h1>`, `<Price variant="detail"/>`, availability line, `<MadeToMeasureNote/>`, description as paragraphs preserving `\n`, `<AddToBag/>`). JSON-LD `Product` script (name, image, description, `offers.priceCurrency:'NGN'`, availability). |
| `src/app/shop/[slug]/product.module.css` | 2-col grid (gallery / sticky info) → stacked @900. |
| `src/app/shop/[slug]/loading.js` | Skeleton PDP. |
| `src/app/shop/[slug]/not-found.js` | "This piece is no longer available" + link to `/shop`. |
| `src/app/shop/[slug]/error.js` | `'use client'`. Generic PDP error + retry. |
| `src/app/cart/page.js` | `'use client'`. Own `<Navbar/>`, `<main id="cart-main">`, `<Footer/>`. `useCart()` + `useCartProducts()`. Heading, `CartLineItem variant="page"` list, `<CartSummary variant="page">` with `Checkout` CTA (`id="cart-checkout"` → `/checkout`), "Continue shopping" → `/shop`. Empty state. Skeleton until `isReady`. |
| `src/app/cart/layout.js` | Server component wrapper for metadata a client page can't set: `{ title:'Your Bag \| Nankara', robots:{index:false} }`. |
| `src/app/cart/cart.module.css` | Items list + summary sidebar → stacked on mobile. |
| `src/app/checkout/page.js` | **Placeholder** so the CTA is a real link. Server component, own Navbar/Footer, `<main id="checkout-main">`, "Checkout opens soon…" + link back to `/cart`. `metadata` title. Comment-flagged M3 scope. |
| `src/app/checkout/checkout.module.css` | Small centered-message layout. |

### Tests

| File | Responsibility |
| --- | --- |
| `vitest.config.js` | `test: { environment: 'node', include: ['src/**/*.test.js'] }`. |
| `src/lib/cartReducer.test.js` | add/merge, increment, decrement-to-removal, `SET_QUANTITY` clamp (0→1, 200→99), remove, clear, dedupe. |
| `src/lib/currency.test.js` | `formatNgn` grouping; `formatUsdApprox` ceil + label; null on 0/negative/NaN; custom rate. |
| `src/lib/visitorLocale.test.js` | `Africa/Lagos` → domestic; `en-NG`/`yo`/`ha`/`ig` → domestic; `America/New_York` + `en-US` → international; empty/undefined inputs → international (safe default: show more info). |

### Backend (dev tooling only)

| File | Change |
| --- | --- |
| `backend/app/cli.py` | Add `seed-demo-products` subcommand (decision 5), mirroring `seed_categories` (`ensure_unique_slug`, `slugify_text`, idempotent by slug). |
| `backend/README.md` | One line under setup: `python -m app.cli seed-demo-products`. |

### Env

| File | Change |
| --- | --- |
| `.env.local.example` (new, repo root) | `BACKEND_ORIGIN=http://localhost:8000` and `NEXT_PUBLIC_NGN_PER_USD=1600`, with comments. (`.gitignore` only ignores `.env*.local`, so `.env.local.example` is committed.) |

---

## Files to modify

| File | Change |
| --- | --- |
| `next.config.mjs` | Add `async rewrites()` → `[{ source:'/api/v1/:path*', destination:`${process.env.BACKEND_ORIGIN \|\| 'http://localhost:8000'}/api/v1/:path*` }]`. `images.remotePatterns` unchanged (`res.cloudinary.com` + `images.pexels.com` already present). |
| `src/app/layout.js` | Wrap the `<SmoothScroll>` subtree in `<CartProvider>`; add `<CartDrawer/>` as last child inside `<SmoothScroll>`. Relative imports. `metadata` export untouched. |
| `src/components/Navbar/Navbar.js` | Add `useCart` import; add `nav-cart-trigger` (desktop, after the existing Shop `<Link>`) and `mobile-nav-cart-trigger` (mobile menu) buttons calling `openDrawer`, showing `Bag` then `Bag (n)` once `isReady && totalQuantity > 0`. **Purely additive — no existing markup/class/id changed.** |
| `src/components/Navbar/Navbar.module.css` | Add `.navCart` (mirror `.navLinkShop`) + small count styling. |
| `package.json` | Add `vitest` to `devDependencies`; add `"test": "vitest run"` and `"test:watch": "vitest"`. |

No changes to `Footer.js`, `SmoothScroll.js`, `globals.css` (all needed tokens/utilities
already exist), or any other existing page.

---

## Cart context API (`useCart()`)

```
{
  items: Array<{ productId: number, quantity: number }>,
  isReady: boolean,                                 // true once hydrated from localStorage
  totalQuantity: number,                            // Σ quantity
  addItem: (productId, quantity = 1) => void,       // merges if present
  incrementItem: (productId) => void,
  decrementItem: (productId) => void,               // removes at 0
  setItemQuantity: (productId, quantity) => void,   // clamped 1..99
  removeItem: (productId) => void,
  clearCart: () => void,
  isDrawerOpen: boolean,
  openDrawer: () => void,
  closeDrawer: () => void,
}
```

**SSR-safe hydration:** reducer initial state is always `{items:[]}` with `isReady:false`,
so server HTML === first client HTML (no mismatch). `readCart()` runs only in a mount
effect; the persist effect is guarded by `isReady` so it can't overwrite storage with
`[]`. Count-bearing UI renders a neutral state until `isReady`; `CartDrawer` returns
`null` until `isReady`.

**Stale items:** drawer + `/cart` join `items` against `useCartProducts()` data. No match
(unpublished/deleted) → muted "no longer available" row, Remove only, excluded from
subtotal and checkout count. `OUT_OF_STOCK` still-listed → "Out of stock" note, kept in
cart (checkout gating is M3).

---

## Verification (end-to-end)

### Run both services

```
# Terminal 1 — backend
cd backend && source .venv/bin/activate
docker compose up -d              # Postgres :5433
alembic upgrade head
python -m app.cli seed-categories
python -m app.cli seed-demo-products      # NEW — ~5 products, one OUT_OF_STOCK
uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend (repo root)
cp .env.local.example .env.local
npm install                       # picks up vitest
npm run dev                       # http://localhost:3000
```

### Smoke

- `curl http://localhost:3000/api/v1/products` → JSON array (proves the proxy; no CORS).
- `npm test` → reducer + currency + visitor-classifier green.

### "Done when: a visitor can browse the real catalogue and build a guest cart"

1. `/shop` shows a grid of seeded products, newest first: primary image, name, `₦…`,
   "Out of Stock" chip on the flagged one. Category tabs (`All` + seeded categories)
   filter instantly.
2. Click a card → `/shop/<slug>`: gallery (multiple photos, swipeable on mobile),
   description, category breadcrumb, availability, **Made for your fit** message,
   quantity selector, **Add to Bag**.
3. **Add to Bag** → drawer slides in over the page (no navigation), page scroll locked;
   drawer shows image, name, price, quantity controls, remove, subtotal, **Checkout**,
   **View Bag**.
4. Adjust quantity / remove in drawer → subtotal + Navbar `Bag (n)` update live.
5. **View Bag** → `/cart` shows the same items + controls + subtotal + Checkout CTA.
6. Refresh `/cart`; navigate `/cart` → `/shop` → a PDP → back — cart persists.
   `localStorage['nankara.cart.v1']` = `{"items":[{"productId":…,"quantity":…}]}`.
7. **Checkout** (drawer or `/cart`) → `/checkout` placeholder page (not a 404).

### Acceptance criteria §30 (4–10, 22)

| # | Check |
| --- | --- |
| 4 | Seeded product appears on `/shop`. `PATCH /admin/products/{id}` `{is_published:false}` → gone from `/shop` after ≤60s / hard refresh. |
| 5 | `/shop/<slug>` opens for a published product. |
| 6 | PDP shows name, description, category, `₦` price, availability. |
| 7 | With a non-Nigerian timezone/locale (DevTools → Sensors → Location, or set `TZ`), PDP/card/drawer/cart show `Approx. $X USD`; with `Africa/Lagos` they don't. Change `NEXT_PUBLIC_NGN_PER_USD`, restart → USD figure changes. |
| 8 | Add an `IN_STOCK` product → enters guest cart (drawer + `/cart` + Navbar badge). |
| 9 | Cart survives refresh + in-app navigation. |
| 10 | Drawer and `/cart`: `+`/`−`/type-quantity and Remove mutate cart + subtotal. |
| 22 | `OUT_OF_STOCK` PDP renders fully; quantity selector hidden, button disabled "Out of Stock", clear message, **no way to add to cart**. |

SEO §26 (PDP "View source"): unique `<title>`, `<meta name="description">`,
`<link rel="canonical">`, `<meta property="og:image">`, non-empty `alt` on every gallery
image.

### Mobile (§27) — DevTools 375px + one real device

Single-column grid; gallery swipes with snap + dot tracking while vertical page scroll
still works; Add to Bag reachable; drawer full-width, ≥44px tap targets; `/cart` usable;
Checkout CTA → placeholder (no 404).

---

## Riskiest parts

1. **SSR/hydration for the cart.** Mitigated by always-empty initial reducer state +
   `isReady` gate + effect-only `localStorage` reads + `null` drawer render pre-ready.
   Pin an explicit locale in `Intl` calls (Node vs browser differences).
2. **Lenis scroll-lock.** `@studio-freight/react-lenis@0.0.47` exports `useLenis`
   (returns the instance with `.stop()`/`.start()`). `CartDrawer` **must** be inside
   `<ReactLenis root>` (hence inside `<SmoothScroll>` in `layout.js`); drawer body gets
   `data-lenis-prevent`; provider closes drawer on route change so a lock is never
   orphaned. Fallback: `body { overflow:hidden }` + fixed-body technique.
3. **Mobile image gallery.** CSS scroll-snap only (no carousel lib). `data-lenis-prevent`
   on the track; do not set `touch-action: pan-x` (would block vertical scroll). Test
   momentum/snap on real iOS Safari + Android Chrome. Handle 0/1 image.
4. **Proxy + env split.** `BACKEND_ORIGIN` must be set before `next.config.mjs` loads
   (Next reads `.env.local` for config). Browser fetches must be relative `/api/v1/...`.
   `baseUrl()`'s `typeof window` branch is the single guard — covered by the smoke curl.
5. **International detection is a heuristic.** Timezone can be spoofed/absent; classifier
   defaults to `international` on missing data (shows more info, never hides NGN). Pure
   function is unit-tested; edge-geo signal is an M5 refinement. Rate lives in one place
   for the M3 backend-rate swap.
6. **Stale-cart subtotal.** Subtotal must sum only items that resolve to a live product;
   an unavailable item silently included would show a wrong total and mismatch at M3
   order creation. Verify by unpublishing a product that's in the cart.
