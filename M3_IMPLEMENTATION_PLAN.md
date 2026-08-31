# Milestone 3 — Checkout + Shipping

## Context

The Nankara commerce MVP (`NANKARA_SHOP_MVP.md`) is built in milestones. M1 (backend: admin
auth, product/category models, Cloudinary, public read endpoints) and M2 (storefront: `/shop`,
`/shop/[slug]`, gallery, `Price`, guest cart + drawer + `/cart`, placeholder `/checkout`) are
done on branch `feat/shop-backend-milestone-1`.

**M3 turns a cart into an order.** Per spec §10–15, §20, §22, §24, §28–29:

> **Done when:** a valid guest cart becomes a `PENDING_PAYMENT` order with a
> server-recalculated subtotal + shipping + total, via a real `/checkout` form.

Paystack (M4) is **not** in scope. After the order is created the flow stops at a
server-calculated summary with a disabled "Pay" action — no fake payment step.

This introduces the first write endpoints, the first money math, and the first admin UI
in the repo. It must respect the money rule (§24): **the browser may display totals; FastAPI
recalculates and validates every figure before persisting an order.**

---

## Decisions

1. **Order creation** — checkout submit calls `POST /api/v1/orders`, which **persists** a
   `PENDING_PAYMENT` order + item snapshot; the page then shows the server's summary + a
   disabled "Pay with Paystack — opening soon" button. Cart is **not** cleared (payment
   still pending). This is the literal §29 "Done when". M4 swaps the disabled button for
   the real Paystack handoff.
2. **Admin shipping** — ship the API **and** a minimal admin UI (`/admin/login` +
   `/admin/shipping`). This establishes the admin-auth-UI foundation M4 reuses for
   `/admin` and `/admin/orders`. Utilitarian styling, not editorial.
3. **Unavailable cart item at order creation** — reject the whole order (`409`) with the
   list of offending items; the frontend surfaces them and links back to `/cart`.
4. **Backend tests** — add a committed `backend/tests/` pytest suite (pytest + httpx are
   already in `requirements-dev.txt` but unused). Money math needs real tests now.
5. **Country input** — native `<select>` populated at runtime from `Intl.supportedValuesOf`
   / `Intl.DisplayNames` (no bundled 250-country list, no new dep); most mobile-friendly
   for a long list (§27). Nigeria states: a static 37-entry list.
6. **Zone resolution is backend-authoritative.** The frontend sends an ISO-3166 alpha-2
   country code + state/region string; the backend maps it to a zone and rate.

---

## Backend

### New models (`backend/app/models/`)

| File | Model | Notes |
| --- | --- | --- |
| `shipping_zone.py` | `ShippingZone` | `id`, `code` (unique, e.g. `rivers`, `us-canada`), `name`, `region_type` (`nigeria`/`international`, plain `String(20)`), `rate` (int, whole NGN, `CheckConstraint >= 0`), `currency` (`String(3)`, default `NGN`), `is_active` (bool, default true), `TimestampMixin`. |
| `order.py` | `Order` | `reference` (`String(20)`, unique, indexed), `user_id` (nullable `Integer`, **no FK** — no users table yet, §31), contact (`customer_first_name/last_name/email/phone`), delivery (`delivery_country`, `delivery_address_1`, `delivery_address_2`, `delivery_city`, `delivery_state_region`, `delivery_postal_code`, `delivery_notes` — optionals default `""`), `shipping_zone_id` (FK `shipping_zones.id` `ondelete=SET NULL`, nullable), `shipping_zone_name` (snapshot), `shipping_amount`, `subtotal`, `total` (ints, NGN), `currency`, `status` (`OrderStatus` enum, default `PENDING_PAYMENT`), `TimestampMixin`. `items` relationship, `cascade="all, delete-orphan"`. |
| `order_item.py` | `OrderItem` | `order_id` (FK `ondelete=CASCADE`), `product_id` (FK `products.id` `ondelete=SET NULL`, nullable), snapshots: `product_name`, `product_slug`, `unit_price` (NGN), `quantity`, `subtotal`. |

`backend/app/models/enums.py` — add `OrderStatus(str, enum.Enum)`: `PENDING_PAYMENT`, `PAID`,
`IN_PRODUCTION`, `READY`, `SHIPPED`, `DELIVERED`, `CANCELLED` (§15).
`backend/app/models/__init__.py` — export the three new models + `OrderStatus`.

### Migration

`backend/alembic/versions/0002_orders_shipping.py` — mirror `0001_initial.py`:
- `postgresql.ENUM(..., name="order_status", create_type=False)` + `.create(bind, checkfirst=True)`; drop in `downgrade()`.
- `create_table` for `shipping_zones`, `orders`, `order_items` + indexes (`ix_shipping_zones_code` unique, `ix_orders_reference` unique, `ix_order_items_order_id`).
- `down_revision = "0001_initial"`.
- Verify `alembic upgrade head` then `alembic check` is clean (`compare_type=True` is set in `env.py`).

### Shipping (`backend/app/shipping/`, new package)

| File | Responsibility |
| --- | --- |
| `zones.py` | Pure `resolve_zone_code(country_code, state_region) -> str`. Nigeria (`NG`): state → `rivers` / `lagos` / `abuja-fct` (matches `fct`, `abuja`, `federal capital territory`) / `other-nigeria`. Else: `GB` → `united-kingdom`; `US`/`CA` → `us-canada`; ECOWAS set → `west-africa`; other-African set → `rest-of-africa`; everything else → `rest-of-world`. Hardcoded `WEST_AFRICAN` (16 ISO-2) + `AFRICAN` (54 ISO-2) frozensets. |
| `service.py` | `ShippingUnavailable(Exception)`; `quote_shipping(db, *, country_code, state_region) -> ShippingQuote` (dataclass: `zone_id`, `zone_code`, `zone_name`, `amount`, `currency`) — resolves code, loads the active `ShippingZone`, raises `ShippingUnavailable` if missing/inactive. Reused by the order service. |
| `router.py` | `POST /api/v1/shipping/quote` (public). Body `ShippingQuoteRequest{country_code, state_region: str \| None}`. `200` → `ShippingQuoteOut{zone_code, zone_name, amount, currency}`; `422` on `ShippingUnavailable`. |
| `admin_router.py` | `GET /api/v1/admin/shipping-zones` → `list[ShippingZoneOut]` (all, ordered by `region_type`, `rate`). `PATCH /api/v1/admin/shipping-zones/{id}` → body `ShippingZoneUpdate{rate?: int>=0, is_active?: bool}`, `404` on unknown id. Guarded by `Depends(get_current_admin)` (router-level, like `products/admin_router.py`). |

### Orders (`backend/app/orders/`, new package)

| File | Responsibility |
| --- | --- |
| `reference.py` | `generate_reference() -> "NK-XXXXXXXX"` (8 chars, Crockford base32 from `secrets`, no ambiguous chars); `unique_reference(db)` loops until unused (like `ensure_unique_slug`). |
| `service.py` | `EmptyCartError`, `OrderValidationError(problems: list)`. `create_order(db, payload: OrderCreate) -> Order`: (1) non-empty items or `EmptyCartError`; (2) load products by id with `selectinload(images)`; collect problems — missing/unpublished → `unavailable`, `availability != IN_STOCK` → `out_of_stock`, `quantity < 1` → `invalid_quantity`; any → `OrderValidationError`; (3) **recompute** each `unit_price` + line `subtotal` from `product.price_ngn`, sum `subtotal`; (4) `quote_shipping(...)` (propagates `ShippingUnavailable`); (5) `total = subtotal + amount`; (6) build `Order` + `OrderItem` snapshots in one transaction, `status=PENDING_PAYMENT`. |
| `router.py` | `POST /api/v1/orders` (public) → `201` `OrderConfirmationOut`; `422` `EmptyCartError` / `ShippingUnavailable`; `409` `OrderValidationError` (`detail={message, items:[{product_id, reason, product_name?}]}`). `GET /api/v1/orders/{reference}/confirmation` (public, unguessable ref) → `200` `OrderConfirmationOut`; `404` unknown. |

### Schemas (`backend/app/schemas/`)

- `shipping.py` — `ShippingQuoteRequest`, `ShippingQuoteOut`, `ShippingZoneOut` (`from_attributes`), `ShippingZoneUpdate`.
- `order.py` — `ContactIn` (first_name, last_name, email `EmailStr`, phone — all required, trimmed, length-bounded), `DeliveryIn` (`country_code` 2-letter, `country_name`, `address_1`, `city`, `state_region` required; `address_2`, `postal_code`, `notes` optional), `CartItemIn{product_id: int, quantity: int Field(ge=1, le=99)}`, `OrderCreate{contact, delivery, items: list[CartItemIn] (min_length=1)}`, `OrderItemOut`, `OrderConfirmationOut` (reference, status, currency, subtotal, shipping_amount, total, `items: list[OrderItemOut]`, `delivery: {city, state_region, country}`, `customer: {first_name, email}` — **safe fields only**, §22).

### Wiring (`backend/app/main.py`)

Add 4 routers: `shipping_router` → `/api/v1/shipping`, `orders_router` → `/api/v1/orders`,
`admin_shipping_router` → `/api/v1/admin/shipping-zones`, with tags. Import models via
existing `app.models` (already imported by `alembic/env.py`).

### CLI + seed (`backend/app/cli.py`)

Add `seed-shipping-zones` subcommand (mirrors `seed_categories`, idempotent by `code`):

| code | region_type | rate (dummy, NGN) |
| --- | --- | --- |
| `rivers` | nigeria | 5 000 |
| `lagos` | nigeria | 8 000 |
| `abuja-fct` | nigeria | 9 000 |
| `other-nigeria` | nigeria | 10 000 |
| `west-africa` | international | 25 000 |
| `rest-of-africa` | international | 40 000 |
| `united-kingdom` | international | 55 000 |
| `us-canada` | international | 60 000 |
| `rest-of-world` | international | 70 000 |

Register in `main()` subparsers. **Dummy figures — must be replaced/approved before launch (§11, M5).**

### Backend tests (`backend/tests/`, new)

`conftest.py` — session engine on `settings.database_url`, `Base.metadata.create_all` /
`drop_all` around the session, function-scoped transaction rollback; `TestClient` with
`get_db` overridden; an `admin_token` fixture. Then:

- `test_shipping_zones.py` — `resolve_zone_code` table (Rivers/Lagos/FCT/other-NG, `GH`→west-africa, `KE`→rest-of-africa, `GB`→uk, `US`+`CA`→us-canada, `JP`→rest-of-world).
- `test_shipping_api.py` — `POST /shipping/quote` `200`; `422` when the zone is inactive / absent.
- `test_orders.py` — happy path (`PENDING_PAYMENT`, snapshot rows, `total == subtotal + shipping`); `unit_price` taken from DB not payload; `409` + item list for unpublished / `OUT_OF_STOCK`; `422` empty items; `422` unquotable destination.
- `test_orders_confirmation.py` — `GET .../confirmation` returns only safe fields; `404` unknown ref.
- `test_admin_shipping.py` — list `401` without bearer; `PATCH` rate + `is_active`; `404` unknown id.

---

## Frontend

### `src/lib/` (new + edit)

| File | Change |
| --- | --- |
| `api.js` (edit) | Add `apiPost(path, body)` (JSON, attaches `.status` + `.data` on non-2xx); export `requestShippingQuote(payload)`, `createOrder(payload)`, `getOrderConfirmation(ref)`. |
| `checkout.js` (new) | Pure helpers: `buildOrderPayload(rows, {contact, delivery})` (filters `unavailable`/`outOfStock`, maps `{product_id, quantity}`); `contactErrors(values)` / `deliveryErrors(values)` (required-field + email + phone checks). Unit-tested. |
| `nigeriaStates.js` (new) | Static array of 36 states + `Federal Capital Territory`. |
| `countries.js` (new) | `listCountries()` → `[{code, name}]` from `Intl.supportedValuesOf('region')` + `Intl.DisplayNames`, sorted; tiny hardcoded fallback if unavailable. |
| `adminApi.js` (new) | `ADMIN_TOKEN_KEY = 'nankara.admin.token'`; `adminLogin(email, password)`, `adminFetch(path, opts)` (adds `Authorization: Bearer`, throws `.status` on non-2xx, `401` → caller redirects), `getShippingZones()`, `updateShippingZone(id, body)`. |

`currency.js` unchanged — USD stays display-only via `<Price>`; repointing the rate to the
backend remains an M5 note.

### `src/hooks/` (new)

- `useShippingQuote.js` — `'use client'`. Input `{countryCode, stateRegion}`; debounced (~400ms) `requestShippingQuote`, race-guarded (mounted-ref, like `useCartProducts.js`). Returns `{quote, status: 'idle'|'loading'|'ok'|'unavailable'|'error'}`.

### `src/components/` (new)

| Component | Responsibility |
| --- | --- |
| `CheckoutForm/` | `'use client'`. Contact fieldset (first/last name, email, phone) + Delivery fieldset (country `<select>`, address 1, address 2, city, state/region — NG → `<select>` of `nigeriaStates`, else text — postal code, notes). Local state + `contactErrors`/`deliveryErrors` on submit, inline `role="alert"` messages. Lifts `{countryCode, stateRegion}` up via `onDestinationChange`. Calls `onSubmit(formValues)`. Follows the `contact/page.js` form idiom (`.field`/`.label`/`.input`/`.errorMsg`). Native `<select>` styled via `.select`. |
| `CheckoutSummary/` | `'use client'`. Props: `rows`, `subtotalNgn`, `shippingStatus`, `shippingAmountNgn`. Line items (name, `× qty`, line total `<Price>`), Subtotal, Shipping (`—` idle / "Calculating…" / amount / "Unavailable for this address"), Total (`<Price>` when known), `<MadeToMeasureNote/>`, currency note. Reuses `<Price>`. |
| `OrderPlacedSummary/` | `'use client'`. Props: `order` (the `POST /orders` response). Reference, status line, item list, subtotal/shipping/total, delivery summary, made-to-measure reminder, **disabled** `.btn .btn-dark` "Pay with Paystack — opening soon", note that the bag is held until payment. `id="order-placed"`. |

### Routes

| File | Change |
| --- | --- |
| `src/app/checkout/layout.js` (new) | Server component — `export const metadata = { title: 'Checkout \| Nankara', robots: { index: false } }` (same pattern as `src/app/cart/layout.js`, needed because the page becomes a client component). |
| `src/app/checkout/page.js` (rewrite) | `'use client'`. `Navbar` + `main#checkout-main` + `Footer`. `useResolvedCart()` + `useShippingQuote()`. States: skeleton until `isReady`; empty state (no purchasable rows) → link to `/shop`; `order` set → `<OrderPlacedSummary>`; else `.layout` = `<CheckoutForm onSubmit onDestinationChange>` + `<aside><CheckoutSummary/></aside>`. `handleSubmit`: `buildOrderPayload` → `createOrder` → `setOrder` (no `clearCart`); `409` → banner listing items + "Return to bag"; `422` → destination / validation message; else generic + retry. `submitting` guard against double-submit. |
| `src/app/checkout/checkout.module.css` (rewrite) | 2-col `.layout` (form / sticky summary) → stacked @900; `.field`/`.label`/`.input`/`.select`/`.errorMsg`/`.fieldset`/`.banner` mirroring `contact.module.css` tokens. |
| `src/app/admin/layout.js` (new) | Server — `metadata { robots: { index: false } }`; bare wrapper, **no** Navbar/Footer. |
| `src/app/admin/login/page.js` (new) | `'use client'`. Email + password → `adminLogin` → store token → `router.replace('/admin/shipping')`. Error line on `401`. |
| `src/app/admin/shipping/page.js` (new) | `'use client'`. On mount: no token → `/admin/login`; `getShippingZones()`; `401` → clear token + `/admin/login`. Table: name, region, `rate` (number input), `is_active` (checkbox), per-row Save → `updateShippingZone`. "Logout" clears token. Dummy-rate warning banner. |
| `src/app/admin/admin.module.css` (new) | Plain utilitarian table/form styling (system-ish), not the editorial system. |

### Modified

| File | Change |
| --- | --- |
| `src/components/CartSummary/CartSummary.js` | Copy tweak only — the "calculated at checkout" note already fits; no structural change. (Confirm during build; likely untouched.) |
| `package.json` | No new dep. (`vitest` already present.) |
| `next.config.mjs` | No change (`rewrites()` already proxies `/api/v1/*`; admin calls go through the same proxy). |

### Frontend tests (`vitest`, pure logic only — matches M2)

- `src/lib/checkout.test.js` — `buildOrderPayload` (excludes unavailable + out-of-stock rows, maps shape, empty result); `contactErrors` / `deliveryErrors` (missing required, bad email, short phone, NG-vs-international state handling).

---

## Docs / housekeeping

- This document is `M3_IMPLEMENTATION_PLAN.md` (matches `M2_IMPLEMENTATION_PLAN.md`).
- `backend/README.md` — new endpoints table rows, `seed-shipping-zones`, dummy-rate warning, `pytest` run line.
- `SESSION_3_REPORT.md` (git-ignored per root `.gitignore`).
- Update memory `project_shop_backend.md` — M3 status + `seed-shipping-zones` + `backend/tests/` note.

---

## Verification (end-to-end)

### Run both services
```
cd backend && source .venv/bin/activate && docker compose up -d
alembic upgrade head
python -m app.cli seed-categories && python -m app.cli seed-demo-products && python -m app.cli seed-shipping-zones
python -m app.cli create-admin --email you@nankara.com --password '<8+ chars>'
uvicorn app.main:app --reload --port 8000
# repo root
npm run dev
```

### Backend
- `alembic check` clean; `cd backend && pytest` green.
- `curl -X POST localhost:3000/api/v1/shipping/quote -d '{"country_code":"NG","state_region":"Lagos"}' -H content-type:application/json` → `{"zone_code":"lagos","amount":8000,...}` (proves proxy + resolution).
- `POST /api/v1/orders` with a valid cart → `201`, `total == subtotal + shipping`; row in `orders` with `status=PENDING_PAYMENT` + `order_items` snapshot. Re-send with a bogus `unit_price` field → ignored, price still from DB.
- Include an `OUT_OF_STOCK` product id → `409` with the item listed.
- `GET /api/v1/orders/<ref>/confirmation` → safe fields only; bad ref → `404`.

### Frontend (acceptance criteria §30 #11–15)
1. `/cart` → **Checkout** → `/checkout` renders the form + live summary (not the M2 placeholder).
2. Fill a **Nigerian** address (Lagos) → summary shows `Shipping ₦8,000` and `Total = subtotal + ₦8,000`.
3. Fill an **international** address (e.g. United States) → shipping updates to the `us-canada` rate; `Approx. $X USD` shown (international visitor).
4. Unmappable / inactive destination → summary shows "Unavailable for this address", **submit disabled**.
5. Submit a valid order → `<OrderPlacedSummary>` with `NK-…` reference, server totals, disabled "Pay with Paystack — opening soon"; bag still populated (Navbar badge unchanged); DB has the `PENDING_PAYMENT` order.
6. Invalid contact info → inline errors, no request sent.
7. Add product → in another tab `PATCH /admin/products/{id} {is_published:false}` → submit → `409` banner lists the item + "Return to bag".
8. `/admin/login` with the seeded admin → `/admin/shipping`; edit the Lagos rate → Save → re-quote on `/checkout` reflects the new amount. Bad token → bounced to login.
9. Mobile 375px (§27): form single-column, native selects usable, summary stacks, submit reachable.
10. `npm test` green; `npm run lint` + `npm run build` clean.

---

## Riskiest parts

1. **Money recalculation path** — the order service must never trust payload amounts; `unit_price`/`subtotal`/`total` come only from `product.price_ngn` + the DB zone rate. Covered by `test_orders.py`.
2. **Enum migration** — `order_status` must be created with `create_type=False` + explicit `.create(checkfirst=True)` and dropped in `downgrade`, exactly like `product_availability` in `0001`. Verify `alembic check` + a full `downgrade base` / `upgrade head` round-trip.
3. **`/checkout` server→client conversion** — page loses its `metadata` export; the new `checkout/layout.js` must carry it (mirrors `cart/layout.js`).
4. **Shipping quote race** — fast country/state edits; `useShippingQuote` needs debounce + mounted-ref guard so a stale response can't overwrite a newer one (pattern from `useCartProducts.js`).
5. **First admin UI** — token in `localStorage`, `401` handling, no SSR. Keep it a thin, self-contained surface (no Navbar/Footer, own CSS) so it doesn't entangle the editorial layout; M4 builds `/admin` + `/admin/orders` on this same `adminApi.js` + auth pattern.
6. **Country list from `Intl`** — `Intl.supportedValuesOf` needs Node 18+/modern browser (fine for Next 14) but guard with a fallback list and pin `'en'` for `DisplayNames`.
7. **Backend test DB** — `create_all` builds the enums; run pytest against the compose Postgres (or a `nankara_test` DB), function-scoped rollback so tests don't accrete rows.
