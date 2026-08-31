# Nankara Shop — Full MVP Testing Guide & Walkthrough

End-to-end manual QA for everything built across Milestones 1–4: admin auth,
product administration, the storefront, guest cart, checkout, destination
shipping, Paystack payment, order confirmation, and admin order management.

Follow it top to bottom once and you will have exercised the entire
> **discover → cart → checkout → pay → PAID → admin fulfils** loop.

The per-milestone guides go deeper on their slice:
`M2_IMPLEMENTATION_PLAN.md` · `M3_TESTING_GUIDE.md` · `M4_TESTING_GUIDE.md`.

---

## ⚠️ Read first — what has a UI and what doesn't

| Capability | How you use it today |
| --- | --- |
| Admin login, dashboard, **products**, **orders**, shipping | Full web UI at `/admin/*` |
| Storefront, cart, checkout, payment, confirmation | Full web UI |
| **Adding / editing products** | Full web UI: `/admin/products`, `/admin/products/new`, `/admin/products/[id]` — create, edit, publish/unpublish, in/out of stock, image upload + reorder + primary, inline category creation. (The Swagger/`curl` path in the appendix still works and is handy for bulk/scripted setup.) |
| Product images | Upload via `/admin/products` needs Cloudinary keys; without them the image manager falls back to "add by URL" (paste a Cloudinary or Pexels link — `next/image` only renders those hosts on the storefront). |
| Real Paystack card payment | Needs a real Paystack **test** secret key. Without one, use the forged-webhook / verify path in §6.3. |

---

## 0. One-time setup

### 0.1 Backend

```bash
cd backend
source .venv/bin/activate                 # created with: uv venv --python 3.12 .venv

# Postgres (host port 5433). If `docker` isn't running, podman works:
#   systemctl --user start podman.socket
#   export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
docker compose up -d

alembic upgrade head

# .env — minimum for a full run:
#   SECRET_KEY=<openssl rand -hex 32>
#   PAYSTACK_SECRET_KEY=sk_test_xxxx        # optional; enables §6.2. Leave blank → §6.3 path
#   FRONTEND_ORIGIN=http://localhost:3000

python -m app.cli create-admin --email you@nankara.example --password 'devpass12'
python -m app.cli seed-categories
python -m app.cli seed-shipping-zones      # 9 zones, DUMMY rates
# Optional demo data — skip these if you want to test with a truly empty catalogue:
python -m app.cli seed-demo-products       # 5 pieces (one out of stock)
python -m app.cli seed-demo-orders         # 4 orders across statuses

uvicorn app.main:app --reload --port 8000
```

### 0.2 Frontend

```bash
# repo root
cp .env.local.example .env.local           # first time only
npm install                                # first time only
npm run dev
```

| Service | URL |
| --- | --- |
| Storefront | **http://localhost:3000** |
| Backend API | http://localhost:8000 |
| **Swagger UI** (product admin) | **http://localhost:8000/docs** |

**Admin login:** `you@nankara.example` / `devpass12`

> Stale Next cache (`TypeError: originalFactory is undefined`)? Stop `npm run dev`,
> `rm -rf .next`, restart, hard-reload (Ctrl+Shift+R).

---

## 1. Admin — log in and land on the dashboard

| # | Action | Expected |
| --- | --- | --- |
| 1.1 | Visit `http://localhost:3000/admin` | Redirects to `/admin/login` (no token yet) |
| 1.2 | Log in with a wrong password | "Invalid email or password." |
| 1.3 | Log in with `you@nankara.example` / `devpass12` | Lands on **/admin** — the dashboard |
| 1.4 | Dashboard content | Two rows of count cards: **Orders** (Pending payment / Paid / In production / Awaiting shipment) and **Catalogue** (Products / Published / Drafts / Out of stock). Top nav: **Overview · Orders · Shipping · Log out** |
| 1.5 | Click through **Orders**, **Shipping**, **Overview** in the nav | Each page loads; the active link is underlined |
| 1.6 | Open a new tab to `/admin/orders` directly (same browser) | Still authenticated (token in `localStorage` `nankara.admin.token`) |
| 1.7 | **Log out** | Back to `/admin/login`; revisiting `/admin` or `/admin/orders` bounces to login |

Log back in before continuing.

---

## 2. Admin — add and manage a product

Web UI. Proves spec acceptance criteria **#2** (create/edit/publish/unpublish) and
**#3** (upload several images) with no developer tools. (The Swagger version is
kept as **Appendix A** for scripted/bulk setup.)

### 2.1 Create

1. `/admin` → nav → **Products** → **＋ New product**.
2. **Name** "The Verified Queen" → the **Slug** field auto-fills `the-verified-queen`
   (editable; once you type in it, it stops auto-following the name).
3. **Description** a line or two. **Price (NGN)** `250000` (whole naira — the field
   rejects decimals). **Availability** In stock.
4. **Category** → **＋ new** → type "Kaftans" → **Add** → it's created and selected.
   (Or pick an existing one, or leave "— none —".)
5. **Images**:
   - **Upload image** → pick a file → it appears in the list. (No Cloudinary keys?
     The upload button is replaced by a notice — use the URL box instead.)
   - **…or paste an image URL** → a Pexels or Cloudinary link → **Add URL**.
   - For each row: type **alt text**, use **↑/↓** to reorder, click **Primary** on
     the one that should lead, **Remove** to drop one.
6. Leave **Published** unticked → **Create product** → lands on the edit page.

| Try | Expected |
| --- | --- |
| Empty name → Create | Inline "Enter a product name." — no request sent |
| Price `99.5` or `-5` | Inline "Enter the price in whole Naira…" |
| No images at all | Allowed — storefront shows a neutral placeholder |

### 2.2 Edit + quick actions

On `/admin/products/[id]`:

| Action | Expected |
| --- | --- |
| **Publish** button (top) | badge flips to "Published"; a "View on storefront ↗" link appears |
| **Mark out of stock** button | badge flips to "Out of stock" |
| Change **Price** → **Save changes** | "Saved."; the list column updates |
| Change an image's alt / order / primary → **Save changes** | image set replaced (one `PUT`); "Saved." |
| Edit **Name** only → Save | slug **unchanged** (rename never breaks a live URL) |
| Edit the **Slug** field itself → Save | slug changes (add `-2` if it collides) |

### 2.3 List

`/admin/products` shows every product **including drafts**: thumbnail + name,
price, category, an **In stock / Out of stock** badge, a **Published / Draft**
badge. Click a row → edit. The `/admin` dashboard's Catalogue cards
(Products / Published / Drafts / Out of stock) reflect your changes on refresh.

---

## 3. Public API — the storefront's data source

Quick sanity checks (browser or `curl`), before looking at the UI:

```bash
curl -s localhost:3000/api/v1/products        | python -m json.tool   # published only, newest first
curl -s localhost:3000/api/v1/products/the-verified-queen | python -m json.tool
curl -s localhost:3000/api/v1/categories      | python -m json.tool
```

| Check | Expected |
| --- | --- |
| Your **published** product is in `/products` | ✅ |
| A **draft** product is **absent** from `/products` | ✅ |
| `GET /products/<draft-slug>` | **404** |
| `primary_image` is the one you marked, `images` are in sort order | ✅ |

---

## 4. Storefront — shop & product pages

### 4.1 Shop page — `http://localhost:3000/shop`

| # | Check | Expected |
| --- | --- | --- |
| 4.1a | Grid of products | Every **published** product, including "The Verified Queen" you added. Large photo, name, price. No badges beyond a single "Out of Stock" marker |
| 4.1b | Prices | `₦275,000` style formatting (NGN always) |
| 4.1c | Category tabs (if categories are in use) | "All" + tabs; clicking filters instantly, no reload |
| 4.1d | Out-of-stock piece ("The Quiet Power Queen" from the seed) | Shows an **Out of Stock** chip; still clickable |
| 4.1e | A product with no image | Neutral placeholder block, no broken image |
| 4.1f | New product appears immediately | `/shop` and `/shop/[slug]` fetch fresh on every request — publish in admin, refresh the storefront, it is there (no ISR lag) |

### 4.2 International price display

Force an "international" visitor: DevTools → ⋮ → More tools → **Sensors** →
Location = Berlin; set browser language to English (US); reload `/shop`.

| Check | Expected |
| --- | --- |
| Under each NGN price | `Approx. $172 USD` line (rate = `NEXT_PUBLIC_NGN_PER_USD`, default 1600) |
| Switch Sensors back to Lagos + language `en-NG`, reload | The USD line disappears; NGN only |

### 4.3 Draft product is hidden

With "The Verified Queen" left as a Draft (§2.1), reload `/shop` — it is **gone**.
Visiting `/shop/the-verified-queen` directly → the product page returns **not
found**. Publish it (§2.2) and it appears immediately.

### 4.4 Product detail — `/shop/[slug]`

Open "The Verified Queen":

| Check | Expected |
| --- | --- |
| Name, `₦` price, (+ approx USD if international), description, category | ✅ |
| Image gallery | All photos; thumbnails / swipe switch the main image |
| "Made for your fit" note | Present — explains measurements are collected after payment |
| Quantity selector + **Add to Bag** | Present and enabled |
| Page `<title>` / meta description / canonical | Unique per product (view source) |

### 4.5 Out-of-stock detail page

Open "The Quiet Power Queen" (`/shop/the-quiet-power-queen`):

| Check | Expected |
| --- | --- |
| Page still loads and is readable | ✅ |
| **Add to Bag** | **Disabled**, labelled "Out of Stock" |
| No quantity selector | ✅ |
| "currently unavailable" message | ✅ |

---

## 5. Guest cart

### 5.1 Add to bag → drawer

1. On "The Verified Queen" detail page, set quantity **2** → **Add to Bag**.
2. **Cart drawer** slides in from the side (no navigation away). Page scroll locks.
3. Navbar shows **Bag (2)**.

Drawer contents:

| Element | Expected |
| --- | --- |
| Product image, name, unit price | ✅ |
| Quantity controls (+ / −) | Adjust the line; Navbar badge + subtotal update live |
| Remove action | Removes the line |
| Subtotal | Sum of line totals |
| **Checkout** button (`#cart-drawer-checkout`) → `/checkout` | ✅ |
| **View Bag** link (`#cart-drawer-view-bag`) → `/cart` | ✅ |

### 5.2 Add a second product

Browse to another product → **Add to Bag**. Drawer now lists both lines; badge
and subtotal reflect the combined quantity.

### 5.3 Cart page — `http://localhost:3000/cart`

| Check | Expected |
| --- | --- |
| All lines listed with image, name, unit price, quantity controls, remove | ✅ |
| Subtotal | Matches the drawer |
| **Checkout** CTA (`#cart-checkout`) → `/checkout` | ✅ |
| **Continue shopping** (`#cart-continue`) → `/shop` | ✅ |
| Empty the cart (remove every line) | "Your bag is empty" + "Explore the collection" link |

### 5.4 Persistence

With items in the bag:

| Action | Expected |
| --- | --- |
| Hard refresh any page | Bag survives (stored in `localStorage` key `nankara.cart.v1`) |
| Close the tab, reopen `localhost:3000` | Bag still there |
| DevTools → Application → Local Storage → delete `nankara.cart.v1` → reload | Bag is empty |

### 5.5 Invalid quantity guard

In the cart page, try to type `0` or a huge number in a quantity field — it
clamps to 1–99. Item shape stored is only `{ productId, quantity }` (no price
snapshot — the price always reflects the live backend value).

---

## 6. Checkout & payment

Have at least one **in-stock** item in the bag, then go to `/checkout`.

### 6.1 The checkout form + live shipping

| # | Step | Expected |
| --- | --- | --- |
| 6.1a | Before entering an address | Order summary lists items + Subtotal; **Shipping** row = "Enter your address"; **Total** = "—"; **Place order** disabled |
| 6.1b | Fill Contact (first/last name, valid email, phone) + Delivery: Country **Nigeria** → State field becomes a **dropdown** → **Lagos**, address line 1, city | After ~0.5 s the Shipping row shows **₦8,000**; Total = Subtotal + ₦8,000; **Place order** enabled |
| 6.1c | Change State → **Rivers** / **Federal Capital Territory** / **Kano** | Shipping re-quotes: ₦5,000 / ₦9,000 / ₦10,000 |
| 6.1d | Change Country → **Ghana** / **United Kingdom** / **United States** (State becomes free text) | ₦25,000 / ₦55,000 / ₦60,000 |
| 6.1e | Clear the email (or type `nope`) and a name → **Place order** | Inline field errors; **no** network request; no order created |
| 6.1f | Put an out-of-stock item in the bag (`/shop/the-quiet-power-queen` can't be added, but you can force it: DevTools console → `localStorage.setItem('nankara.cart.v1', JSON.stringify({items:[{productId:5,quantity:1}]}))` → reload `/checkout`) | Red banner: "Some items in your bag are no longer available…" + **Place order** disabled |

### 6.2 Place the order

Restore a valid in-stock bag, fill a valid address, **Place order**:

| Element | Expected |
| --- | --- |
| Page switches to **"Your bag is reserved."** | ✅ |
| Reference | `NK-XXXXXXXX` (8 chars) — **copy it** |
| Amounts | Server-calculated Subtotal / Shipping / **Total** |
| **Pay with Paystack** button | **Enabled** (no longer "opening soon") |
| Bag | **Still full** — the order is `PENDING_PAYMENT`, not paid |

Check the public confirmation (safe fields only — no phone / street):
```bash
curl -s localhost:3000/api/v1/orders/NK-XXXXXXXX/confirmation | python -m json.tool
```

### 6.2b Pay — with a real Paystack test key

If `PAYSTACK_SECRET_KEY=sk_test_…` is set:

1. Click **Pay with Paystack** → button shows "Opening Paystack…" → redirected to
   `checkout.paystack.com`.
2. Pay with a Paystack **test card**: `4084 0840 8408 4081`, any future expiry,
   any CVV, OTP `123456`.
3. Paystack redirects to `/order/NK-XXXXXXXX/success`.
4. Page shows a spinner → **"Your Nankara piece is being prepared for your story."**
   with reference, email, items, **Amount paid**, delivery summary, and the
   measurements message.
5. The **bag is cleared** (Navbar badge → 0).

### 6.2c Pay — with no / a fake key

Click **Pay with Paystack** → inline error:
- no key → "Payments aren't available right now." (503)
- fake key → "We couldn't start payment. Please try again." (502 from Paystack)

The bag stays; the order stays `PENDING_PAYMENT`. Use §6.3 to simulate the result.

### 6.3 Simulate a paid result (no real key needed)

This exercises acceptance criteria **#17 / #18** — server-side verification and
the `PAID` transition — using a forged, correctly-signed webhook.

```bash
# 1. Create a PENDING payment row for the order (init would do this, but it needs
#    a live Paystack call). From backend/, venv active:
python - <<'PY'
from app.core.database import SessionLocal
from app.models import Order, Payment, PaymentStatus
from sqlalchemy import select
db = SessionLocal()
o = db.scalar(select(Order).where(Order.reference == "NK-XXXXXXXX"))
p = Payment(order_id=o.id, provider_reference="NK-XXXXXXXX",
            amount=o.total * 100, currency="NGN", status=PaymentStatus.PENDING)
db.add(p); db.commit()
print("payment amount (kobo):", p.amount)
PY

# 2. Forge a signed charge.success webhook. SECRET must equal the server's
#    PAYSTACK_SECRET_KEY (any value works if it matches; use a placeholder if unset,
#    but the server needs that same value in its env).
SECRET='sk_test_placeholder'
REF='NK-XXXXXXXX'
KOBO=<amount from step 1>
BODY="{\"event\":\"charge.success\",\"data\":{\"reference\":\"$REF\",\"amount\":$KOBO,\"currency\":\"NGN\",\"status\":\"success\"}}"
SIG=$(printf '%s' "$BODY" | openssl dgst -sha512 -hmac "$SECRET" | sed 's/^.* //')
curl -s -X POST localhost:3000/api/v1/payments/paystack/webhook \
  -H "x-paystack-signature: $SIG" -H content-type:application/json -d "$BODY"
# → {"status":"ok"}
```

| Check | Expected |
| --- | --- |
| `GET /api/v1/orders/$REF/confirmation` → `status` | **PAID** |
| Re-send the exact same `curl` | 200, still `PAID`, still one payment row (idempotent) |
| Tamper one char of `$SIG` and send | **401 Invalid signature** |
| Send with `amount` off by 100 | 200, but order stays `PENDING_PAYMENT`, payment `FAILED` |
| Open `http://localhost:3000/order/$REF/success` | Paid confirmation renders; the bag clears on that visit |

### 6.4 Payment failed page

`http://localhost:3000/payment/failed?reference=NK-XXXX` →
"Your payment wasn't completed.", shows the reference, "Return to checkout" /
"View bag". The bag is untouched.

---

## 7. Admin — orders

Back to `/admin` (log in if needed).

| # | Action | Expected |
| --- | --- | --- |
| 7.1 | **Overview** cards | Order counts reflect your activity — the order you just paid is under **Paid**; the demo orders populate the others |
| 7.2 | **Orders** | Table: Reference · Customer · Total · **Payment** badge · **Status** badge · Destination · Date. Newest first. Your order + the 4 demo orders |
| 7.3 | Status filter → **Paid** | Only `PAID` orders |
| 7.4 | Click your order's row | `/admin/orders/{id}` detail |
| 7.5 | Detail — **Customer** | Full name, email, **phone** (admin sees everything, unlike the public confirmation) |
| 7.6 | Detail — **Delivery** | Full address, state/region, postal code, notes, shipping zone name, shipping charged |
| 7.7 | Detail — **Items** | Product, qty, unit price, subtotal + Subtotal/Total rows |
| 7.8 | Detail — **Payment** | Provider `paystack`, the Paystack reference, amount in ₦ (kobo ÷ 100), status badge, verified-at timestamp |
| 7.9 | Detail — **Fulfilment**: the "Move to…" dropdown | Only **In production** and **Cancelled** offered (a `PAID` order can't jump to `Shipped`, and `Paid`/`Pending payment` are never offered) |
| 7.10 | Pick **In production** → Save | "Saved"; the status badge updates; the list row reflects it |
| 7.11 | Walk it forward | `In production → Ready → Shipped → Delivered`; `Delivered` offers no further moves |
| 7.12 | Force an illegal move via API: `PATCH /api/v1/admin/orders/{id}/status` with `{"status":"SHIPPED"}` on a `PAID` order | **409** |
| 7.13 | `GET /api/v1/admin/orders` with **no** bearer token | **401 / 403** |
| 7.14 | Overview after moving orders | "In production" / "Awaiting shipment" (Ready) counts change |

---

## 8. Admin — shipping (regression from M3)

| # | Action | Expected |
| --- | --- | --- |
| 8.1 | `/admin/shipping` | 9-zone table with editable rate + Active checkbox; "placeholder rates" warning banner; shared nav present |
| 8.2 | Change **Lagos** rate to `15000` → Save | "Saved" |
| 8.3 | `/checkout` with a Lagos address | Shipping now shows **₦15,000** |
| 8.4 | Untick **Lagos → Active** → Save; re-quote a Lagos address | Shipping row: "Unavailable for this address"; Place order disabled |
| 8.5 | Restore Lagos to `8000` + Active | ✅ |

---

## 9. Error-state matrix (spec §28)

| Area | Trigger | Expected |
| --- | --- | --- |
| Product | Out of stock | Add to Bag disabled, clear message (§4.5) |
| Product | Unpublished / deleted | `/shop/[slug]` not found (§4.3) |
| Cart | Product became unavailable | Checkout pre-blocks with a banner (§6.1f) |
| Cart | Invalid quantity | Clamped to 1–99 (§5.5) |
| Checkout | Invalid customer info | Inline errors, no submit (§6.1e) |
| Checkout | Destination can't be quoted | "Unavailable for this address", submit disabled (§8.4) |
| Checkout | Product goes unavailable between load and submit | `409` banner listing the offending items + "Return to bag" |
| Payment | Cancelled / failed | `/payment/failed`, bag kept (§6.4) |
| Payment | Bad webhook signature | `401` (§6.3) |
| Payment | Amount mismatch | Order NOT paid, payment `FAILED` (§6.3) |
| Payment | Customer closes browser after paying | Webhook still flips the order to `PAID`; success page shows it on next visit |

---

## 10. Automated test suites

```bash
# Backend — from backend/, venv active, Postgres up
pytest                     # 57 tests
alembic check              # models vs migrations in sync
alembic downgrade 0002_orders_shipping && alembic upgrade head   # migration round-trip

# Frontend — repo root
npm test                   # 51 Vitest unit tests
npm run lint               # clean
npm run build              # clean — 18 routes
```

---

## 11. Acceptance criteria coverage (spec §30)

| # | Criterion | Where |
| --- | --- | --- |
| 1 | Admin logs in securely | §1 |
| 2 | Admin creates / edits / publishes / unpublishes a product | §2.1, §2.2 (web UI, no dev tools) |
| 3 | Admin uploads several product images | §2.1 step 5 (upload + reorder + primary + alt) |
| 4 | Published product appears on `/shop` | §4.1 |
| 5 | Customer opens `/shop/[slug]` | §4.4 |
| 6 | Product info, price, availability shown | §4.4, §4.5 |
| 7 | Approximate USD for international visitors | §4.2 |
| 8 | Add an available product to a guest cart | §5.1 |
| 9 | Cart persists through navigation / refresh | §5.4 |
| 10 | Update / remove cart items | §5.1, §5.3 |
| 11 | Checkout without an account | §6 (no login anywhere) |
| 12 | Nigerian or international delivery address | §6.1b–d |
| 13 | Backend determines shipping from a configured zone | §6.1, §8 |
| 14 | Backend recalculates prices, shipping, total | §6.2, and M3 guide §7 (price-tamper) |
| 15 | Order created before payment | §6.2 (`PENDING_PAYMENT`) |
| 16 | Customer pays through Paystack | §6.2b |
| 17 | Successful payment verified server-side | §6.3 (signature), §6.2b (redirect + verify) |
| 18 | Verified payment marks the correct order `PAID` | §6.3 |
| 19 | On-site confirmation explaining the measurements follow-up | §6.2b step 4 |
| 20 | Admin sees the paid order + contact details | §7.5–7.8 |
| 21 | Admin moves the order through production / shipping statuses | §7.9–7.11 |
| 22 | Out-of-stock products cannot be purchased | §4.5, §6.1f |
| 23 | Payment / admin secrets not exposed to the browser | Secret key is backend-only; admin token is a bearer JWT, never a payment secret |
| 24 | Full purchase flow works on mobile | Spot-check §4–6 at 375 px; formal mobile QA is part of launch hardening |

**Milestones 1–4 are complete.** M1's `/admin/products` screens (the piece that
originally shipped API-only) are now built — §2 runs entirely through the UI.

**Launch hardening (Milestone 5):** real Paystack **live** run + a public webhook
(ngrok in dev), replace the dummy shipping rates with approved figures,
production env / HTTPS / DB backups, formal mobile QA, SEO metadata.

---

## Appendix A — product setup via the API (scripted / bulk)

The web UI (§2) is the normal path. For bulk or scripted setup, the API works too:

1. `POST /api/v1/admin/auth/login` `{email,password}` → copy `access_token`; in
   Swagger (`http://localhost:8000/docs`) click **Authorize** and paste it.
2. `POST /api/v1/admin/products` with `{name, description, price_ngn,
   category_id?, availability, is_published, images: [{url, public_id, alt_text,
   is_primary}]}` → **201**. Slug auto-generates from the name (`-2` on collision).
3. `PATCH /api/v1/admin/products/{id}` — partial; a truthy `slug` re-slugs, omit it
   to keep the URL stable. `PUT /api/v1/admin/products/{id}/images` — a bare JSON
   array, replaces the whole set, index = sort order.
4. `POST /api/v1/admin/media/upload` — multipart `file`; **503** without Cloudinary
   keys (use image URLs directly instead).

---

## 12. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `connection refused ... port 5433` | Postgres isn't up. `docker compose up -d` (or the podman variant in §0.1). |
| Admin API returns `401` (or `/admin/*` bounces to login) | Token missing/expired in `localStorage` (`nankara.admin.token`); tokens last 8 h — log in again. |
| Image **upload** button missing / upload fails 503 | Cloudinary keys aren't set — the image manager falls back to "add by URL". |
| A URL-added image doesn't render on `/shop` | `next/image` only allows `res.cloudinary.com`, `images.pexels.com`, `assets.mixkit.co` — use one of those hosts. |
| Payment init returns `503` | `PAYSTACK_SECRET_KEY` not set — expected; use §6.3. |
| Payment init returns `502` | The key is set but invalid / Paystack unreachable. |
| Webhook returns `401` with a "correct" signature | The `SECRET` you signed with must match the server's `PAYSTACK_SECRET_KEY` env value exactly. |
| New product not on `/shop` | It's a Draft — Publish it (button on the edit page), then refresh `/shop`. |
| Cart shows a product as unavailable after you republished it | `useCartProducts` caches product data per page load — hard-refresh the storefront. |
| `/admin/*` keeps redirecting to login | Token missing/expired in `localStorage` (`nankara.admin.token`); log in again. |
