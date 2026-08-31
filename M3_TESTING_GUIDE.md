# Milestone 3 — Testing Guide (Checkout + Shipping)

Manual QA script for the M3 work: real `/checkout` form, destination-based shipping,
server-calculated `PENDING_PAYMENT` order, and the first admin UI (`/admin/shipping`).
Paystack is **not** in this milestone — checkout stops at the order summary with a
disabled pay button.

---

## 1. Start the servers

```bash
# backend  (terminal 1)
cd backend
source .venv/bin/activate
docker compose up -d                 # Postgres on host port 5433
alembic upgrade head
python -m app.cli seed-categories
python -m app.cli seed-shipping-zones     # 9 zones, DUMMY rates
python -m app.cli seed-demo-products      # 5 demo pieces (one out of stock)
python -m app.cli create-admin --email you@nankara.example --password 'devpass12'
uvicorn app.main:app --reload --port 8000

# frontend  (terminal 2, repo root)
cp .env.local.example .env.local     # first time only
npm install                          # first time only
npm run dev
```

| Service | URL |
| --- | --- |
| Storefront (Next.js) | **http://localhost:3000** |
| Backend API | http://localhost:8000 |
| API docs (Swagger) | http://localhost:8000/docs |

**Admin login:** `you@nankara.example` / `devpass12`
(the seeded local dev admin is `dev@nankara.example` / `devpass12`).

### If you see `TypeError: ... originalFactory is undefined` (webpack.js)

Stale Next build cache — not a code bug. Stop `npm run dev`, then:

```bash
rm -rf .next
npm run dev
```

Hard-reload the tab (**Ctrl+Shift+R**). If it persists: DevTools → Application →
Service Workers → **Unregister**, then **Clear site data**, reload.

---

## 2. Reference data

### Demo products (`/shop`)

| Slug | Price (NGN) | Availability |
| --- | --- | --- |
| `the-bold-statement-queen` | 295,000 | In stock |
| `the-power-queen` | 245,000 | In stock |
| `the-soft-elegant-queen` | 185,000 | In stock |
| `the-luminous-queen` | 320,000 | In stock |
| `the-quiet-power-queen` | 165,000 | **Out of stock** |

### Shipping zones (dummy rates — editable in `/admin/shipping`)

| Destination | Zone | Rate (NGN) |
| --- | --- | --- |
| Rivers | Rivers | 5,000 |
| Lagos | Lagos | 8,000 |
| Federal Capital Territory | Abuja / FCT | 9,000 |
| Any other Nigerian state | Other Nigeria | 10,000 |
| Ghana, Senegal, Benin, … (ECOWAS) | West Africa | 25,000 |
| Kenya, South Africa, Egypt, … | Rest of Africa | 40,000 |
| United Kingdom | United Kingdom | 55,000 |
| United States, Canada | United States / Canada | 60,000 |
| Japan, Brazil, UAE, … (everywhere else) | Rest of World | 70,000 |

### Approximate USD line

Shown **only to visitors who look international** — browser timezone ≠ `Africa/Lagos`
and language ≠ `en-NG` / `yo` / `ha` / `ig`. Rate: `NEXT_PUBLIC_NGN_PER_USD` (default
**1600**). NGN is always shown; only the extra `Approx. $X USD` line varies.

To force "international": DevTools → ⋮ → More tools → **Sensors** → Location = Berlin (or
any non-Lagos), set the browser language to English (US), reload.
To force "domestic": Sensors → Location = Lagos, language `en-NG`.

---

## 3. Storefront → cart (M2 context — needed to reach checkout)

| # | URL / action | Expected |
| --- | --- | --- |
| 3.1 | http://localhost:3000/shop | 5 product cards. "The Quiet Power Queen" shows an **Out of Stock** chip. Category tabs filter instantly. |
| 3.2 | http://localhost:3000/shop/the-bold-statement-queen | PDP: image gallery, `₦295,000`, "Made for your fit" note, quantity selector, **Add to Bag**. |
| 3.3 | http://localhost:3000/shop/the-quiet-power-queen | OOS PDP: **Add to Bag disabled** ("Out of Stock"), no quantity selector, "currently unavailable" message. |
| 3.4 | On 3.2, set quantity **2** → **Add to Bag** | Cart drawer slides in (no navigation), page scroll locked, Navbar shows **Bag (2)**. |
| 3.5 | Drawer → **Checkout** | Navigates to `/checkout`. |

---

## 4. Checkout — http://localhost:3000/checkout

> Needs items in the bag. Empty bag → "Your bag is empty" + link to `/shop`.

### 4.1 Before entering an address

| Element | Expected |
| --- | --- |
| Order summary | Lists each item (name × qty, line total), Subtotal |
| Shipping row | **"Enter your address"** |
| Total row | **—** |
| "Place order" button | **Disabled**, hint: "Enter your delivery address to see shipping and place your order." |

### 4.2 Fill a Nigerian address

Contact: first name, last name, a valid email, phone.
Delivery: Country **Nigeria** → the State field becomes a **dropdown** → pick **Lagos**,
address line 1, city.

| Element | Expected |
| --- | --- |
| Shipping row (after ~0.5 s) | **₦8,000** |
| Total | Subtotal + ₦8,000 — e.g. 2 × Bold Statement Queen = ₦590,000 → **₦598,000** |
| "Place order" button | **Enabled** |

### 4.3 Change the destination

Switch Country / State and watch the shipping + total re-quote:

| Set to | Shipping row |
| --- | --- |
| State = Rivers | ₦5,000 |
| State = Federal Capital Territory | ₦9,000 |
| State = Kano (or any other) | ₦10,000 |
| Country = Ghana | ₦25,000 |
| Country = Kenya | ₦40,000 |
| Country = United Kingdom | ₦55,000 |
| Country = United States (state = free text, e.g. "California") | ₦60,000 |
| Country = Japan | ₦70,000 |

For non-Nigeria countries the State/Region field is a **free-text input**, not a dropdown.
The country list is the full ISO set (~249 options).

### 4.4 Client-side validation

Clear the email (or type `nope`) and clear a name → **Place order**:

- Inline red errors under the offending fields ("Enter your first name.",
  "Enter a valid email address.")
- No network request, no order created

### 4.5 Place a valid order

Fill everything correctly → **Place order**:

| Element | Expected |
| --- | --- |
| Page | Switches to **"Your bag is reserved."** |
| Reference | `NK-XXXXXXXX` (8 chars, e.g. `NK-7Q2K9F4M`) |
| Amounts | Server-calculated Subtotal / Shipping / **Total** |
| Pay button | **"Pay with Paystack — opening soon"** — **disabled** |
| Bag | **Still full** — Navbar badge unchanged. The order is `PENDING_PAYMENT`, not paid. |

Copy the reference, then open:
`http://localhost:8000/api/v1/orders/NK-XXXXXXXX/confirmation`

Expected JSON: `reference`, `status: "PENDING_PAYMENT"`, `subtotal`, `shipping_amount`,
`total`, `items[]`, `delivery: {city, state_region, country}`, `customer: {first_name, email}`.
**No phone, no street address, no notes.**

### 4.6 Unavailable item blocks checkout

Put "The Quiet Power Queen" (out of stock) in the bag:
DevTools → Console →
`localStorage.setItem('nankara.cart.v1', JSON.stringify({items:[{productId:5,quantity:1}]}))`
→ reload `/checkout`.

| Element | Expected |
| --- | --- |
| Banner | Red: **"Some items in your bag are no longer available. Update your bag before checking out."** + "Go to bag" link |
| "Place order" button | **Disabled** |

### 4.7 Race condition → 409

1. Bag with product 1 **and** 2. Load `/checkout`, fill a valid Nigerian address (don't submit).
2. In another tab / via API, unpublish product 2:
   ```bash
   TOKEN=$(curl -s -X POST localhost:8000/api/v1/admin/auth/login \
     -H content-type:application/json \
     -d '{"email":"you@nankara.example","password":"devpass12"}' \
     | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")
   curl -X PATCH localhost:8000/api/v1/admin/products/2 \
     -H "Authorization: Bearer $TOKEN" -H content-type:application/json \
     -d '{"is_published":false}'
   ```
3. Back on `/checkout`, click **Place order**.

Expected: red banner **"Some items are no longer available and weren't ordered:"** listing
the item, plus a **"Return to bag"** link. No order created.

Re-publish afterward: same `curl` with `{"is_published":true}`.

---

## 5. Admin — http://localhost:3000/admin/shipping

| # | Action | Expected |
| --- | --- | --- |
| 5.1 | Visit `/admin/shipping` while logged out | Redirects to **`/admin/login`** |
| 5.2 | Log in with wrong password | "Invalid email or password." |
| 5.3 | Log in with `you@nankara.example` / `devpass12` | Lands on the shipping table — **9 zones**, each with an editable rate field + Active checkbox |
| 5.4 | Change **Lagos** rate to `15000` → **Save** | Button shows "Saved" |
| 5.5 | Go to `/checkout`, enter a Lagos address | Shipping now shows **₦15,000** (public quote reflects the change) |
| 5.6 | Back in admin, untick **Lagos → Active** → Save; then quote a Lagos address on `/checkout` | Shipping row: **"Unavailable for this address"**, submit disabled |
| 5.7 | Re-set Lagos to `8000` + Active, Save | Restored |
| 5.8 | Click **Log out** | Back to `/admin/login`; revisiting `/admin/shipping` redirects to login |

There's a **"Rates are placeholder figures"** warning banner on the page — the dummy rates
must be replaced or approved before real orders (spec §11, Milestone 5).

---

## 6. Mobile (spec §27)

DevTools device toolbar → 375 px (or a real phone on the LAN):

- `/checkout` form is single-column, all fields reachable
- Country / state selects are the native pickers
- Order summary stacks **above** the form
- No horizontal page scroll
- "Place order" is full-width, ≥ 44 px tall

---

## 7. API-only checks (no browser)

```bash
# shipping quote
curl -X POST localhost:8000/api/v1/shipping/quote \
  -H content-type:application/json \
  -d '{"country_code":"NG","state_region":"Lagos"}'
# → {"zone_code":"lagos","zone_name":"Lagos","amount":8000,"currency":"NGN"}

# create order
curl -X POST localhost:8000/api/v1/orders -H content-type:application/json -d '{
  "contact":{"first_name":"Ada","last_name":"Obi","email":"ada@example.com","phone":"+2348012345678"},
  "delivery":{"country_code":"NG","country_name":"Nigeria","address_1":"12 Aptech Close",
              "city":"Lagos","state_region":"Lagos"},
  "items":[{"product_id":1,"quantity":2}]}'
# → 201: subtotal 590000, shipping_amount 8000, total 598000, status PENDING_PAYMENT

# server ignores browser-supplied prices
curl -X POST localhost:8000/api/v1/orders -H content-type:application/json -d '{
  "contact":{"first_name":"Ada","last_name":"Obi","email":"ada@example.com","phone":"+2348012345678"},
  "delivery":{"country_code":"NG","country_name":"Nigeria","address_1":"x","city":"Lagos","state_region":"Lagos"},
  "items":[{"product_id":1,"quantity":1,"unit_price":1,"subtotal":1}]}'
# → 201: unit_price still 295000

# out-of-stock item → 409
curl -i -X POST localhost:8000/api/v1/orders -H content-type:application/json -d '{
  "contact":{"first_name":"Ada","last_name":"Obi","email":"ada@example.com","phone":"+2348012345678"},
  "delivery":{"country_code":"NG","country_name":"Nigeria","address_1":"x","city":"Lagos","state_region":"Lagos"},
  "items":[{"product_id":5,"quantity":1}]}'
# → HTTP 409, detail.items = [{"product_id":5,"reason":"out_of_stock","product_name":"The Quiet Power Queen"}]

# admin shipping list requires a bearer token
curl -i localhost:8000/api/v1/admin/shipping-zones          # → 403
```

---

## 8. Automated tests

```bash
# backend
cd backend && source .venv/bin/activate
pytest                     # 33 tests (needs Postgres up)

# frontend (repo root)
npm test                   # 39 Vitest unit tests
npm run lint               # clean
npm run build              # clean
```

---

## 9. Acceptance criteria covered (spec §30)

| # | Criterion | Where to verify |
| --- | --- | --- |
| 11 | Checkout without an account | §4 — no login prompt anywhere |
| 12 | Nigerian **or** international delivery address | §4.2 / §4.3 |
| 13 | Backend determines the shipping fee from a configured zone | §4.3, §5, §7 |
| 14 | Backend independently recalculates prices, shipping, total | §4.5, §7 (price-tamper check) |
| 15 | An order is created before payment | §4.5 (`PENDING_PAYMENT`), confirmation endpoint |
| 22 | Out-of-stock products cannot be purchased | §3.3, §4.6 |
| 23 | Payment / admin secrets not exposed to the browser | No payment code yet; admin token is bearer-only |

Criteria 16–21 (Paystack, verified payment, admin order management) are **Milestone 4**.
