# Milestone 4 — Testing Guide (Payment + Orders)

Manual QA script for the M4 work: Paystack payment (server-initialise + redirect),
signature-verified idempotent webhook, on-site confirmation, and the admin order
dashboard / list / detail / fulfilment.

Milestone 5 is where a *real* Paystack test-mode card payment is run end-to-end;
here the payment result is exercised with a **forged signed webhook** and the
`/payments/paystack/verify` fallback.

---

## 1. Start the servers

```bash
# backend  (terminal 1)
cd backend
source .venv/bin/activate
docker compose up -d                       # Postgres on host port 5433
alembic upgrade head
python -m app.cli seed-categories
python -m app.cli seed-shipping-zones
python -m app.cli seed-demo-products
python -m app.cli seed-demo-orders         # 4 orders across statuses (for /admin/orders)
python -m app.cli create-admin --email you@nankara.example --password 'devpass12'

# .env — for the payment endpoints to respond (a test key is enough to see the
# 502 from Paystack; a real test key from the Paystack dashboard runs the full flow)
#   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxx
#   FRONTEND_ORIGIN=http://localhost:3000
uvicorn app.main:app --reload --port 8000

# frontend  (terminal 2, repo root)
npm run dev
```

| Service | URL |
| --- | --- |
| Storefront | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |

**Admin login:** `you@nankara.example` / `devpass12`

---

## 2. Automated tests

```bash
cd backend && source .venv/bin/activate
pytest                     # 57 tests (needs Postgres up)
alembic check              # clean
alembic downgrade 0002_orders_shipping && alembic upgrade head   # round-trip

# repo root
npm test                   # 51 Vitest unit tests
npm run lint               # clean
npm run build              # clean — 18 routes
```

---

## 3. Payment — storefront

### 3.1 Reach the pay step

1. `/shop` → open a product → **Add to Bag** → drawer → **Checkout**.
2. Fill a valid Nigerian address (e.g. Lagos) → **Place order**.
3. The page switches to **"Your bag is reserved."** with an **active**
   "Pay with Paystack" button (no longer "opening soon"). Copy the `NK-…` reference.

### 3.2 With no / a fake Paystack key

Click **Pay with Paystack** → the button shows "Opening Paystack…" then an inline
error:

- no key → *"Payments aren't available right now."* (`503`)
- fake key → *"We couldn't start payment. Please try again."* (`502` from Paystack)

The bag stays populated; the order stays `PENDING_PAYMENT`.

### 3.3 With a real Paystack **test** key

Click **Pay with Paystack** → redirected to `checkout.paystack.com`. Pay with a
Paystack test card (e.g. `4084 0840 8408 4081`, any future expiry, any CVV, OTP
`123456`). Paystack redirects to `/order/NK-…/success`.

- The success page shows a spinner ("Confirming your payment…"), then
  **"Your Nankara piece is being prepared for your story."**
- Order reference, confirmation email, delivery summary, item list, **Amount paid**.
- The bag is now **cleared** (Navbar badge → 0).

---

## 4. Payment — webhook + verify (no real key needed)

### 4.1 Forge a signed `charge.success`

First start a payment so a `PENDING` row exists (or insert one). The webhook
`amount` is in **kobo** = order total × 100.

```bash
SECRET='sk_test_xxxxxxxx'          # must match the running server's PAYSTACK_SECRET_KEY
REF='NK-XXXXXXXX'                  # the payment's provider_reference (= order ref on the first attempt)
KOBO=30000000                      # e.g. ₦300,000 → 30000000

BODY="{\"event\":\"charge.success\",\"data\":{\"reference\":\"$REF\",\"amount\":$KOBO,\"currency\":\"NGN\",\"status\":\"success\"}}"
SIG=$(printf '%s' "$BODY" | openssl dgst -sha512 -hmac "$SECRET" | sed 's/^.* //')

curl -s -X POST localhost:8000/api/v1/payments/paystack/webhook \
  -H "x-paystack-signature: $SIG" -H content-type:application/json -d "$BODY"
# → {"status":"ok"}   (200)
```

| Check | Expected |
| --- | --- |
| `GET /api/v1/orders/$REF/confirmation` → `status` | `PAID` |
| Re-send the exact same request | `200`, order still `PAID`, still one payment row |
| Tamper `SIG` (change a char) | `401 Invalid signature` |
| Send with `amount` off by 100 | `200`, but order stays `PENDING_PAYMENT`, payment `FAILED` |
| Unknown `reference` | `200` no-op |
| `event: "charge.failed"` | `200` no-op |

### 4.2 Verify fallback

```bash
curl -s -X POST localhost:8000/api/v1/payments/paystack/verify \
  -H content-type:application/json -d "{\"reference\":\"$REF\"}"
```

With a real test key and a genuinely-paid transaction this flips the order to
`PAID` even if the webhook never arrived. The storefront success page calls this
automatically on load.

### 4.3 `/payment/failed`

Visit `http://localhost:3000/payment/failed?reference=NK-XXXX` →
*"Your payment wasn't completed."*, shows the reference, "Return to checkout" /
"View bag" links. The bag is untouched.

---

## 5. Admin — orders

`http://localhost:3000/admin/login` → `you@nankara.example` / `devpass12`.

| # | Action | Expected |
| --- | --- | --- |
| 5.1 | Land on **/admin** | Overview cards: Orders (pending payment / paid / in production / awaiting shipment) + Catalogue counts. Shared nav: Overview · Orders · Shipping · Log out |
| 5.2 | **Orders** | Table: Reference, Customer, Total, Payment badge, Status badge, Destination, Date. The 4 demo orders + any you placed |
| 5.3 | Status filter → **Paid** | Only `PAID` orders |
| 5.4 | Click a row | `/admin/orders/{id}` — Customer (incl. **phone**), Delivery (full address, zone, shipping charged), Items table with totals, Payment (provider, Paystack reference, amount ₦, status, verified at), Fulfilment |
| 5.5 | On a **PAID** order: Fulfilment → "Move to…" | Only `IN_PRODUCTION` and `CANCELLED` offered (never `PAID`/`PENDING_PAYMENT`/`SHIPPED`) |
| 5.6 | Pick **In production** → Save | "Saved"; badge updates; the list reflects it |
| 5.7 | Walk it forward | `IN_PRODUCTION → READY → SHIPPED → DELIVERED`; `DELIVERED` offers no further moves |
| 5.8 | Force an illegal jump via API (`PATCH .../status {"status":"SHIPPED"}` on a `PAID` order) | `409` |
| 5.9 | **Log out** (nav) | Back to `/admin/login`; revisiting `/admin/orders` bounces to login |
| 5.10 | `GET /api/v1/admin/orders` with no bearer | `401` / `403` |

---

## 6. Mobile (spec §27)

DevTools device toolbar → 375 px:

- `/order/[reference]/success` and `/payment/failed` are single-column, no horizontal scroll
- Admin is laptop-first — not a launch blocker, but the nav wraps cleanly

---

## 7. Acceptance criteria covered (spec §30)

| # | Criterion | Where |
| --- | --- | --- |
| 16 | Customer can pay through Paystack | §3.1, §3.3 |
| 17 | Successful payment is verified server-side | §4.1 (signature), §4.2 (verify) |
| 18 | Verified payment marks the correct order `PAID` | §4.1 |
| 19 | On-site confirmation explaining the measurements follow-up | §3.3 |
| 20 | Admin sees the paid order + customer contact details | §5.2, §5.4 |
| 21 | Admin moves the order through production/shipping statuses | §5.5–5.7 |

Criteria 1–15, 22–23 are covered by M1–M3. Criterion 24 (full mobile flow) and a
real Paystack test/live transaction are finished in Milestone 5.
