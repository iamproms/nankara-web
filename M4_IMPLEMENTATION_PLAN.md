# Milestone 4 — Payment + Orders

## Context

The Nankara commerce MVP (`NANKARA_SHOP_MVP.md`) is built in milestones on branch
`feat/shop-backend-milestone-1`. M1 (admin auth, product/category models, Cloudinary,
public read endpoints), M2 (storefront + guest cart), and M3 (real `/checkout`, shipping
quote, server-calculated `PENDING_PAYMENT` order, `/admin/login` + `/admin/shipping`) are
done and committed (M3 = commit `6deac1c`).

**M4 makes the order payable and gives the admin a way to work it.** Per spec §12–15, §17,
§19, §20, §22, §28, §29:

> **Done when:** a customer can pay and the verified paid order appears in admin.

Today the checkout flow dead-ends at `OrderPlacedSummary` with a disabled
"Pay with Paystack — opening soon" button (`src/components/OrderPlacedSummary/OrderPlacedSummary.js:48`).
There is no `payments` table, no Paystack code anywhere (`grep -rn paystack backend` → nothing),
and the only admin pages are login + shipping (no nav, no dashboard, no orders view).

M4 must honour the money rule (§13, §24): **the amount charged and the PAID transition are
decided by the backend from its own data and a verified Paystack event — never from the
browser or a success-URL visit.**

---

## Decisions

1. **Paystack = server-initialize + browser redirect** (user's call). The pay button calls
   `POST /api/v1/payments/paystack/initialize {reference}`; the backend calls Paystack
   `/transaction/initialize` and returns `authorization_url`; the browser does
   `window.location.href = authorization_url`. Paystack's hosted page redirects back to
   `/order/[reference]/success`. The **webhook** (`charge.success`) is what marks the order
   `PAID`. No `@paystack/inline-js`, no public key in the browser — consistent with the
   existing same-origin-proxy / no-secrets-in-client design of `api.js` + `adminApi.js`.

2. **Separate `payments` table** (user's call), migration `0003_payments`. Keeps provider
   code isolated (§13, §31) so Stripe can be added later without touching `orders`.

3. **Amount unit = kobo.** Paystack transacts in the currency's smallest unit.
   `payments.amount` is stored in **kobo** (`order.total * 100`); `orders.*` stays whole
   Naira. The single conversion point is `start_payment()`; the webhook re-checks
   `event.data.amount == payment.amount` in kobo.

4. **Idempotent, signature-gated webhook.** `POST /payments/paystack/webhook` verifies the
   `x-paystack-signature` HMAC-SHA512 over the **raw** body with the Paystack secret key
   (401 on mismatch), then applies `charge.success` at-most-once keyed on
   `payments.provider_reference`. A duplicate event is a 200 no-op. Any other event is ignored.

5. **On-demand `/verify` fallback.** Local dev has no public webhook URL, so
   `POST /payments/paystack/verify {reference}` calls Paystack `/transaction/verify` and runs
   the *same* idempotent transition. The success page calls it once on load before reading
   the confirmation. In production the webhook is still the primary path.

6. **Admin = orders pages + shared shell** (user's call): `/admin` (dashboard, consumes an
   extended `/admin/overview`), `/admin/orders` (list), `/admin/orders/[id]` (detail +
   fulfilment status), and a shared `<AdminNav>` (Overview · Orders · Shipping · Log out)
   added to every admin page including the existing `/admin/shipping`.

7. **No Paystack test credentials yet** (user's call). Backend tests **monkeypatch** the two
   `paystack_client` functions (no new dependency — matches M3's "no new dep" preference) and
   forge a signed webhook body. A real Paystack **test-mode** run (test card → live webhook
   via ngrok) is added to the M5 checklist, not done here.

8. **Fulfilment transitions are a whitelist.** Admin can only move an order forward
   (`PAID→IN_PRODUCTION→READY→SHIPPED→DELIVERED`) or to `CANCELLED`; it can never set
   `PENDING_PAYMENT` or `PAID` by hand (`PAID` comes only from a verified charge). Illegal
   jumps → `409`.

9. **Cart is cleared on the success page only**, once the confirmation shows a non-`PENDING_PAYMENT`
   status. An abandoned or failed payment keeps the bag (§28).

---

## Backend

### New enum + model

`backend/app/models/enums.py` — add:

```python
class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"      # transaction initialised, awaiting Paystack
    SUCCESS = "SUCCESS"      # verified charge
    FAILED  = "FAILED"       # Paystack reported failure / amount mismatch
    ABANDONED = "ABANDONED"  # customer left the hosted page (optional, from charge.failed / verify)
```

`backend/app/models/payment.py` (new) — `Payment(Base, TimestampMixin)`:

| Column | Type | Notes |
| --- | --- | --- |
| `id` | int PK | explicit (no id mixin) |
| `order_id` | FK `orders.id` `ondelete=CASCADE`, indexed, not null | |
| `provider` | `String(20)`, default `"paystack"`, `server_default="paystack"` | |
| `provider_reference` | `String(64)`, unique, indexed, not null | what we send to Paystack as `reference` |
| `access_code` | `String(64)`, nullable | from init response |
| `authorization_url` | `String(500)`, nullable | from init response |
| `amount` | int, not null | **kobo** |
| `currency` | `String(3)`, default `"NGN"`, `server_default="NGN"` | |
| `status` | `SAEnum(PaymentStatus, name="payment_status", create_type=False, values_callable=…)` | default `PENDING`, `server_default="PENDING"` — mirror `Order.status` (order.py:74) |
| `raw_event` | `postgresql.JSONB`, nullable | last webhook/verify payload |
| `verified_at` | `DateTime(timezone=True)`, nullable | set when marked `SUCCESS` |

`CheckConstraint("amount >= 0", name="ck_payments_amount_non_negative")`.

`backend/app/models/order.py` — add relationship:
```python
payments: Mapped[list["Payment"]] = relationship(
    back_populates="order", cascade="all, delete-orphan", order_by="Payment.id"
)
```
(list, not scalar — a failed attempt then a retry = two rows; "current" = last.)

`backend/app/models/__init__.py` — import + `__all__` `Payment`, `PaymentStatus`
(alembic `env.py` does `import app.models`, so this registers it on the metadata).

### Migration — `backend/alembic/versions/0003_payments.py`

- `revision = "0003_payments"`, `down_revision = "0002_orders_shipping"`.
- `PAYMENT_STATUS = ("PENDING", "SUCCESS", "FAILED", "ABANDONED")` at module top.
- `payment_status = postgresql.ENUM(*PAYMENT_STATUS, name="payment_status", create_type=False)`
  then `payment_status.create(op.get_bind(), checkfirst=True)` — exactly the `0002` pattern
  (`0002_orders_shipping.py:59-61`).
- `op.create_table("payments", …)` with columns above; `raw_event` as
  `postgresql.JSONB(astext_type=sa.Text())` nullable; explicit `created_at`/`updated_at`
  (`server_default=sa.func.now()`), the check constraint.
- `op.create_index("ix_payments_provider_reference", "payments", ["provider_reference"], unique=True)`
- `op.create_index("ix_payments_order_id", "payments", ["order_id"])`
- `downgrade()`: drop the two indexes, `op.drop_table("payments")`,
  `sa.Enum(name="payment_status").drop(op.get_bind(), checkfirst=True)`.
- Verify: `alembic upgrade head` → `alembic check` clean → full `downgrade 0002` / `upgrade head`
  round-trip. Tests build schema via `Base.metadata.create_all` (conftest.py:47), so the
  model and the migration must independently agree.

### `app/payments/` (new package)

| File | Responsibility |
| --- | --- |
| `paystack_client.py` | Thin sync `httpx` wrapper, mirrors `app/media/cloudinary_client.py`. `_ensure_configured()` → `503` if `not settings.paystack_configured`. `initialize_transaction(*, email, amount_kobo, reference, callback_url) -> dict` → `POST {base_url}/transaction/initialize`; returns `data` (`authorization_url`, `access_code`, `reference`). `verify_transaction(reference) -> dict` → `GET {base_url}/transaction/verify/{reference}`; returns `data` (`status`, `amount`, `currency`, …). Both use `httpx.Client(base_url=settings.paystack_base_url, headers={"Authorization": f"Bearer {settings.paystack_secret_key}"}, timeout=20)`; non-2xx or transport error → `HTTPException(502, "Paystack …")`. |
| `signature.py` | `verify_signature(raw_body: bytes, signature_header: str | None) -> bool` — `hmac.new(secret.encode(), raw_body, hashlib.sha512).hexdigest()` compared with `hmac.compare_digest`. `False` if header missing or secret unset. |
| `service.py` | Exceptions `OrderNotPayable`. Functions below. |
| `router.py` | `POST /paystack/initialize`, `POST /paystack/webhook` (`async def`), `POST /paystack/verify`. Mounted at `/api/v1/payments` (public — no admin guard; the webhook is signature-gated, init/verify are keyed on the unguessable `reference`). |

`service.py` functions:

- `start_payment(db, order: Order) -> Payment`
  - `if order.status != OrderStatus.PENDING_PAYMENT: raise OrderNotPayable`
  - `reference = _payment_reference(db, order)` — first attempt uses `order.reference`;
    on retry (a prior non-`PENDING` payment exists) append `-2`, `-3`, … so
    `provider_reference` stays unique.
  - Create `Payment(order_id=order.id, provider_reference=reference, amount=order.total*100,
    currency=order.currency, status=PENDING)`, `db.add`, `db.flush`.
  - `callback_url = f"{settings.frontend_origin}/order/{order.reference}/success"`
  - `data = paystack_client.initialize_transaction(email=order.customer_email,
    amount_kobo=payment.amount, reference=reference, callback_url=callback_url)`
  - store `payment.access_code`, `payment.authorization_url = data["authorization_url"]`;
    `db.commit()`, `db.refresh(payment)`; return.

- `apply_successful_charge(db, *, reference: str, event_amount: int, event_currency: str, raw: dict) -> bool`
  — the single idempotent transition, shared by webhook and verify.
  - `payment = db.scalar(select(Payment).where(Payment.provider_reference == reference))`
  - `if payment is None: return False` (unknown ref — nothing to do)
  - `if payment.status == PaymentStatus.SUCCESS: return True` (idempotent no-op)
  - `if event_amount != payment.amount or event_currency.upper() != payment.currency.upper():`
    `payment.status = FAILED; payment.raw_event = raw; db.commit(); return False`
  - `payment.status = SUCCESS; payment.verified_at = now(); payment.raw_event = raw`
  - `order = db.get(Order, payment.order_id)`;
    `if order.status == OrderStatus.PENDING_PAYMENT: order.status = OrderStatus.PAID`
  - `db.commit(); return True`

- `handle_webhook(db, event: dict) -> None`
  - `if event.get("event") != "charge.success": return`
  - `data = event["data"]`;
    `apply_successful_charge(db, reference=data["reference"], event_amount=data["amount"],
    event_currency=data.get("currency", "NGN"), raw=event)`

- `verify_and_apply(db, reference: str) -> Payment | None`
  - `payment = db.scalar(select(Payment).where(Payment.provider_reference == reference))`;
    `if payment is None: return None`
  - `data = paystack_client.verify_transaction(reference)`
  - `if data.get("status") == "success": apply_successful_charge(db, reference=reference,
    event_amount=data["amount"], event_currency=data.get("currency","NGN"), raw=data)`
  - `else if payment.status == PENDING: payment.status = ABANDONED/FAILED; db.commit()`
  - `db.refresh(payment); return payment`

`router.py`:

| Method | Path | Body / auth | Behaviour |
| --- | --- | --- | --- |
| POST | `/api/v1/payments/paystack/initialize` | `PaymentInitIn{reference}` — public | Load `Order` by `reference` (`404` unknown). `start_payment` → `409` `OrderNotPayable` (`detail` says the order is already paid / cancelled). `503` if Paystack unconfigured. `200` `PaymentInitOut{authorization_url, reference}`. |
| POST | `/api/v1/payments/paystack/webhook` | raw body — public, `async def` | `raw = await request.body()`; `verify_signature(raw, request.headers.get("x-paystack-signature"))` → `401` on failure. `event = json.loads(raw)`. `handle_webhook(db, event)`. Always `200 {"status": "ok"}` on a valid signature (even for ignored / duplicate events) so Paystack stops retrying. |
| POST | `/api/v1/payments/paystack/verify` | `PaymentVerifyIn{reference}` — public | `verify_and_apply(db, reference)` → `404` if no such payment. Returns `OrderConfirmationOut` via the existing `_to_confirmation` (import from `app.orders.router`, or move that helper to `app/orders/service.py` and import from both). |

### `app/orders/admin_router.py` (new)

`router = APIRouter(dependencies=[Depends(get_current_admin)])` — the M3 pattern
(`shipping/admin_router.py:10`). Mounted `/api/v1/admin/orders`.

| Method | Path | Behaviour |
| --- | --- | --- |
| GET | `""` | `select(Order).options(selectinload(Order.items), selectinload(Order.payments)).order_by(Order.created_at.desc())`. Optional query params `status: OrderStatus | None`, `payment: PaymentStatus | None`, `limit: int = 100`. → `list[AdminOrderListItem]`. |
| GET | `"/{order_id}"` | Load with items + payments; `404`. → `AdminOrderDetailOut` (full — phone, full address, payment block). |
| PATCH | `"/{order_id}/status"` | `AdminOrderStatusUpdate{status}`. `_assert_transition(order.status, new)` → `409` `{detail: "Cannot move a PAID order to SHIPPED"}` on an illegal jump. Set + `db.commit()` + `db.refresh`. → `AdminOrderDetailOut`. |

`_ALLOWED_TRANSITIONS` (module const in the router or `app/orders/service.py`):
```python
{
  PENDING_PAYMENT: {CANCELLED},
  PAID:            {IN_PRODUCTION, CANCELLED},
  IN_PRODUCTION:   {READY, CANCELLED},
  READY:           {SHIPPED, CANCELLED},
  SHIPPED:         {DELIVERED},
  DELIVERED:       set(),
  CANCELLED:       set(),
}
```

### `app/admin/router.py` + `OverviewOut` (extend)

Add order counts to `GET /api/v1/admin/overview` (spec §17: "New/paid orders, Orders in
production, Orders awaiting shipment"). New `OverviewOut` fields:
`pending_payment_orders`, `paid_orders`, `in_production_orders`, `awaiting_shipment_orders`
(status `READY`). Same `select(func.count())…where(Order.status == …)` idiom already in
`admin/router.py:14-30`.

### Schemas

- `app/schemas/payment.py` (new): `PaymentInitIn{reference: str}`,
  `PaymentInitOut{authorization_url: str, reference: str}`, `PaymentVerifyIn{reference: str}`.
- `app/schemas/admin_order.py` (new):
  - `AdminPaymentOut` (`from_attributes`): `provider`, `provider_reference`, `amount` (kobo),
    `currency`, `status`, `verified_at`.
  - `AdminOrderListItem`: `id`, `reference`, `customer_name` (`f"{first} {last}"`),
    `customer_email`, `total`, `currency`, `status`, `payment_status`
    (latest payment's status or `None`), `delivery_city`, `delivery_country`, `created_at`.
  - `AdminOrderDetailOut`: `id`, `reference`, `status`, `created_at`, `updated_at`,
    `customer{first_name,last_name,email,phone}`, `delivery{country,address_1,address_2,
    city,state_region,postal_code,notes}`, `shipping{zone_name,amount}`, `subtotal`, `total`,
    `currency`, `items: list[OrderItemOut]`, `payment: AdminPaymentOut | None`.
  - `AdminOrderStatusUpdate{status: OrderStatus}`.
- `app/schemas/admin.py`: extend `OverviewOut` with the 4 new int fields.

### Wiring — `app/main.py`

```python
from app.payments.router import router as payments_router
from app.orders.admin_router import router as admin_orders_router
...
app.include_router(payments_router, prefix=f"{API_V1}/payments", tags=["payments"])
app.include_router(admin_orders_router, prefix=f"{API_V1}/admin/orders", tags=["admin: orders"])
```

### Config — `app/core/config.py`

Add to `Settings`:
```python
paystack_secret_key: str | None = None
paystack_public_key: str | None = None          # kept for symmetry / a future inline flow
paystack_base_url: str = "https://api.paystack.co"
frontend_origin: str = "http://localhost:3000"  # builds the Paystack callback_url

@property
def paystack_configured(self) -> bool:
    return bool(self.paystack_secret_key)
```
`backend/.env.example` — replace the commented `# PAYSTACK_*` lines under "Reserved for
later milestones" with real entries: `PAYSTACK_SECRET_KEY=`, `PAYSTACK_PUBLIC_KEY=`,
`PAYSTACK_BASE_URL=https://api.paystack.co`, `FRONTEND_ORIGIN=http://localhost:3000`.

### Dependencies

`backend/requirements.txt` — add `httpx==0.28.1` (currently only a transitive dev dep via
Starlette's `TestClient`; the app now imports it directly). Drop the now-redundant
`httpx==0.28.1` line from `requirements-dev.txt` (leave `pytest`).

### CLI — `app/cli.py` (optional but recommended)

`seed-demo-orders` — create ~4 orders across statuses (`PENDING_PAYMENT`, `PAID` with a
`SUCCESS` payment row, `IN_PRODUCTION`, `SHIPPED`) so the admin orders UI has content
during QA. Idempotent by a sentinel customer email. Dev-only, mirrors `seed_demo_products`.

### Backend tests — `backend/tests/`

`conftest.py` additions:
- `make_order` factory — `create_order(db, OrderCreate(...))` with a `make_product` line and
  `seeded_zones`, returns the `Order`.
- `fake_paystack` fixture — `monkeypatch.setattr` on
  `app.payments.paystack_client.initialize_transaction` / `verify_transaction` returning
  canned dicts; a knob to flip `verify` between `success` / `failed`.
- `paystack_secret` fixture — `monkeypatch.setattr(settings, "paystack_secret_key", "test-secret")`.
- `signed_webhook(body: dict) -> tuple[bytes, dict]` helper — returns raw JSON bytes + a
  `{"x-paystack-signature": hmac_sha512(...)}` header dict.

| File | Cases |
| --- | --- |
| `test_payments_init.py` | init returns `authorization_url` + creates a `Payment` `PENDING` with `amount == order.total*100` (client mocked); `404` unknown reference; `409` when the order is already `PAID`; `503` when `paystack_secret_key` unset. |
| `test_payments_webhook.py` | missing / wrong signature → `401`; valid `charge.success` → order `PAID`, payment `SUCCESS`, `verified_at` set, `raw_event` stored; **duplicate** delivery → `200`, still one effect; **amount mismatch** → order stays `PENDING_PAYMENT`, payment `FAILED`; unknown reference → `200` no-op; non-`charge.success` event → `200` no-op. |
| `test_payments_verify.py` | `verify` with mocked `verify_transaction` → `success` marks order `PAID`; `failed` leaves it `PENDING_PAYMENT`; `404` for an unknown reference. |
| `test_admin_orders.py` | list → `401/403` without bearer; list newest-first + `?status=` filter; detail exposes `phone` + full address + `payment` block; detail `404`; `PATCH .../status` `PAID→IN_PRODUCTION` ok; `PAID→SHIPPED` → `409`; `→PAID` rejected → `409`. |
| `test_admin_overview.py` | `OverviewOut` includes the 4 order counts, correct against seeded orders. |

Mock approach: **monkeypatch** (no new dep). `respx` noted as the alternative if HTTP-layer
fidelity is wanted later.

---

## Frontend

### `src/lib/` (new + edit)

| File | Change |
| --- | --- |
| `payment.js` (new) | Pure helpers, unit-tested: `isPaid(order)` (`order.status !== 'PENDING_PAYMENT'`); `readCallbackReference(searchParams)` (Paystack appends `?trxref=…&reference=…` — return `reference ?? trxref ?? null`); `orderStatusLabel(status)` / `paymentStatusLabel(status)` (human strings); `nextFulfilmentStatuses(status)` (mirror of the backend whitelist, for the admin `<select>`). |
| `api.js` (edit) | `initializePaystack(reference)` → `apiPost('/payments/paystack/initialize', { reference })`; `verifyPayment(reference)` → `apiPost('/payments/paystack/verify', { reference })`. |
| `adminApi.js` (edit) | `getOverview()`; `getAdminOrders({ status } = {})` (builds `?status=`); `getAdminOrder(id)`; `updateAdminOrderStatus(id, status)` → `adminFetch('/admin/orders/${id}/status', { method: 'PATCH', body: { status } })`. |

### `src/hooks/` (new)

`useAdminGuard.js` — extracts the repeated pattern from `admin/shipping/page.js:77-96`:
on mount, no token → `router.replace('/admin/login')`; returns `{ authReady, onAuthError(err) }`
where `onAuthError` clears the token + redirects on `401`. Reused by all three new admin pages
and retrofitted into `shipping/page.js`.

### `src/components/` (new + edit)

| Component | Responsibility |
| --- | --- |
| `AdminNav/` (new) | `'use client'`. Links: Overview (`/admin`) · Orders (`/admin/orders`) · Shipping (`/admin/shipping`), active-state via `usePathname()`; a "Log out" button (`clearAdminToken()` + `router.replace('/admin/login')`). Utilitarian, styled from `admin.module.css`. Rendered at the top of every `/admin/*` page. |
| `OrderStatusBadge/` (new, small) | `'use client'` or plain. `{ status, kind='order' }` → a coloured pill (`admin.module.css` `.badge` + modifier). Used in the orders list + detail. |
| `OrderPlacedSummary/` (edit) | Replace the disabled button (`OrderPlacedSummary.js:48-50`) with an active one: local `paying` / `payError` state; on click `initializePaystack(order.reference)` → `window.location.href = res.authorization_url`; on throw show "We couldn't start payment — please try again." Keep all existing copy/layout; button label "Pay with Paystack". `id="order-pay"` retained. |

### Routes — `src/app/`

| File | Change |
| --- | --- |
| `order/[reference]/layout.js` (new) | Server layout — `export const metadata = { title: 'Order | Nankara', robots: { index: false } }` (the `cart/layout.js` pattern). |
| `order/[reference]/success/page.js` (new) | `'use client'`. `Navbar` + `main` + `Footer`. Read `params.reference`. On mount: `await verifyPayment(reference).catch(() => {})` (best-effort — webhook may have already done it), then `getOrderConfirmation(reference)`; if `status === 'PENDING_PAYMENT'`, poll the confirmation every 2 s up to 5× (webhook race). **Paid** (`isPaid`): render the §14 block — heading *"Your Nankara piece is being prepared for your story."*, `Reference`, `customer.email`, item list + `<Price>`, `Total` paid, delivery summary, the made-to-measure message, a link to `/shop` (and `/contact` if wired); call `clearCart()` once. **Still pending** after polls: *"Your payment is still being confirmed — we'll email you as soon as it's done."* + reference; do **not** clear the cart. **404 / error**: generic "we couldn't find that order" + link to `/`. |
| `payment/failed/layout.js` (new) | Server layout — metadata `robots: { index: false }`, `title: 'Payment | Nankara'`. |
| `payment/failed/page.js` (new) | `'use client'`. §28 — *"Your payment wasn't completed."* Explains the order is saved and the bag is intact. Buttons: "Return to checkout" (`/checkout`) and "View bag" (`/cart`). Reads optional `?reference=` to show it. Cart untouched. |
| `admin/page.js` (new) | `'use client'`. `useAdminGuard`, `<AdminNav/>`. `getOverview()` → count cards: Products (total / published / draft / out of stock), Orders (pending payment / paid / in production / awaiting shipment). Plain grid from `admin.module.css`. |
| `admin/orders/page.js` (new) | `'use client'`. Guard + `<AdminNav/>`. `getAdminOrders({ status })` with a status `<select>` filter. Table: Reference · Customer · Total (`formatNgn`) · Payment (`<OrderStatusBadge kind="payment">`) · Status (`<OrderStatusBadge>`) · Destination (`city, country`) · Date. Row → `/admin/orders/${id}`. Loading / empty / error states like `shipping/page.js`. |
| `admin/orders/[id]/page.js` (new) | `'use client'`. Guard + `<AdminNav/>`. `getAdminOrder(id)`. Sections (`admin.module.css` `.section`): **Customer** (name, email, phone), **Delivery** (full address, state/region, zone name, shipping amount), **Items** (table: product, qty, unit price, subtotal), **Payment** (provider, Paystack reference, amount `amount/100` NGN, status, verified at — or "No payment yet"), **Fulfilment** (`<select>` of `nextFulfilmentStatuses(order.status)` + current, Save → `updateAdminOrderStatus`; "Saved" feedback; re-render badge). `404` → "Order not found" + back link. |
| `admin/shipping/page.js` (edit) | Add `<AdminNav/>` at the top; remove the bespoke `#admin-logout` button (now in the nav). Switch its auth boilerplate to `useAdminGuard`. |

### `src/app/admin/admin.module.css` (edit)

Add: `.nav` / `.navLink` / `.navLinkActive` (simple top bar); `.badge` + `.badgePaid` /
`.badgePending` / `.badgeProduction` / `.badgeShipped` / `.badgeCancelled` (muted pills);
`.orderTable` (or reuse `.table`); `.section` / `.sectionTitle` / `.detailGrid` (label/value
rows) for the detail page; `.cards` / `.card` / `.cardNumber` / `.cardLabel` for the dashboard.
Still deliberately plain — not the editorial system.

### Not changed

- `next.config.mjs` — the `/api/v1/:path*` rewrite already covers `/payments/*` and
  `/admin/orders/*`.
- `.env.local.example` — **no new frontend env var.** The redirect flow keeps the Paystack
  key server-side; the backend builds `callback_url` from its own `FRONTEND_ORIGIN`.
- `package.json` — no new dependency.
- `src/lib/currency.js`, `<Price>` — reused as-is on the success page.

### Frontend tests — `vitest` (pure logic, matches M2/M3)

`src/lib/payment.test.js` — `isPaid` across every `OrderStatus`; `readCallbackReference`
(`reference`, `trxref`-only, neither); `nextFulfilmentStatuses` whitelist; the label maps.

---

## Docs / housekeeping

- `M4_IMPLEMENTATION_PLAN.md` (this plan — matches `M2/M3_IMPLEMENTATION_PLAN.md`).
- `M4_TESTING_GUIDE.md` (matches `M3_TESTING_GUIDE.md`) — manual QA: setting a Paystack
  **test** secret, forging a signed webhook with
  `openssl dgst -sha512 -hmac "$PAYSTACK_SECRET_KEY"`, the `/verify` fallback, the admin
  order-status walkthrough, ngrok note for a real webhook, acceptance criteria §30 #16–21.
- `backend/README.md` — new endpoints table (payments + admin orders), `payments` table +
  `payment_status` enum, `httpx` dependency, `PAYSTACK_*` / `FRONTEND_ORIGIN` env, the
  fulfilment transition whitelist, `seed-demo-orders`.
- `SESSION_4_REPORT.md` (git-ignored per root `.gitignore`).
- Memory `project_shop_backend.md` — bump status to "M1–4 done", note the payments table,
  the webhook/verify split, `httpx` dep, and `PAYSTACK_*` env.

---

## Verification (end-to-end)

### Run both services
```bash
cd backend && source .venv/bin/activate && docker compose up -d
alembic upgrade head
python -m app.cli seed-categories && python -m app.cli seed-demo-products && python -m app.cli seed-shipping-zones
python -m app.cli create-admin --email you@nankara.example --password 'devpass12'
# .env: PAYSTACK_SECRET_KEY=sk_test_...  FRONTEND_ORIGIN=http://localhost:3000
uvicorn app.main:app --reload --port 8000
# repo root
npm run dev
```

### Backend
- `cd backend && pytest` green (existing 33 + ~20 new).
- `alembic check` clean; full `downgrade 0002` / `upgrade head` round-trip.
- `POST /api/v1/payments/paystack/initialize {"reference":"NK-…"}` (mocked or real test key)
  → `200 {authorization_url}`; a `payments` row `PENDING`, `amount == order.total*100`.
- Re-`initialize` a `PENDING_PAYMENT` order → new attempt row with a `-2` reference.
- `initialize` a `PAID` order → `409`.
- Forge a `charge.success` webhook:
  ```bash
  BODY='{"event":"charge.success","data":{"reference":"NK-…","amount":<kobo>,"currency":"NGN","status":"success"}}'
  SIG=$(printf '%s' "$BODY" | openssl dgst -sha512 -hmac "$PAYSTACK_SECRET_KEY" | sed 's/^.* //')
  curl -s -X POST localhost:8000/api/v1/payments/paystack/webhook \
    -H "x-paystack-signature: $SIG" -H content-type:application/json -d "$BODY"
  ```
  → `200`; order `PAID`, payment `SUCCESS`, `verified_at` set. Re-send → `200`, no change.
  Wrong `SIG` → `401`. Wrong `amount` → order stays `PENDING_PAYMENT`, payment `FAILED`.
- `GET /api/v1/admin/orders` (bearer) lists it; `PATCH /api/v1/admin/orders/{id}/status
  {"status":"IN_PRODUCTION"}` ok; `{"status":"SHIPPED"}` from `PAID` → `409`.

### Frontend (acceptance criteria §30 #16–21)
1. `/checkout` → place a valid order → `OrderPlacedSummary` now shows an **active**
   "Pay with Paystack" button (#16).
2. Click it → redirected to `paystack.com` hosted checkout (test mode). Complete with a
   Paystack test card.
3. Paystack redirects to `/order/NK-…/success`. The page calls `/verify`, then shows the
   §14 confirmation — reference, email, items, **amount paid**, delivery summary, the
   measurements message (#17, #18, #19). Bag is now cleared (Navbar badge 0).
4. Locally (no public webhook): after the forged webhook above, load
   `/order/NK-…/success` directly → same paid confirmation; cart clears.
5. Abandon payment on the hosted page / hit `/payment/failed` → "payment wasn't completed",
   bag still populated, "Return to checkout" works (#28).
6. `/admin` → login → dashboard shows the order counts. `/admin/orders` lists the paid
   order (customer, total, payment + status badges, destination, date) (#20).
7. `/admin/orders/[id]` → customer phone + full address + Paystack reference + amount
   visible; move status `PAID → IN_PRODUCTION → READY → SHIPPED → DELIVERED`, each Save
   reflected in the list (#21). Illegal jump is not offered in the `<select>` and is
   rejected `409` if forced.
8. `<AdminNav>` present on every admin page; "Log out" returns to `/admin/login` and
   revisiting any `/admin/*` route bounces to login.
9. Mobile 375 px (§27): success page and `/payment/failed` single-column, no horizontal
   scroll; admin is laptop-first (not a launch blocker).
10. `npm test` green (new `payment.test.js`); `npm run lint` + `npm run build` clean
    (new routes: `/order/[reference]/success`, `/payment/failed`, `/admin`, `/admin/orders`,
    `/admin/orders/[id]`).

---

## Riskiest parts

1. **Webhook idempotency + the money check.** `apply_successful_charge` must be exactly-once
   on `provider_reference`, must compare `amount` in **kobo**, and must only flip
   `PENDING_PAYMENT → PAID` (never re-open a later status). Fully covered by
   `test_payments_webhook.py`.
2. **Raw body for the signature.** `POST /webhook` must `await request.body()` *before* any
   parsing and HMAC the exact bytes — a re-serialised dict will not match. `async def` route
   (precedent: `app/media/router.py:13`).
3. **`payment_status` enum migration.** Same `create_type=False` + explicit
   `.create(checkfirst=True)` + `downgrade` drop as `product_availability` (0001) and
   `order_status` (0002). Verify `alembic check` + a round-trip; model and migration must
   agree independently (tests use `create_all`).
4. **No public webhook URL in local dev.** The `/verify` fallback on the success page is the
   safety net; document ngrok for exercising the real webhook. In production the webhook is
   primary and `/verify` is belt-and-braces.
5. **Kobo vs Naira.** One conversion point (`order.total * 100` in `start_payment`), stored
   in `payments.amount`, re-checked in the webhook. The admin detail page divides back by
   100 for display.
6. **Payment retry uniqueness.** A second `initialize` on the same order needs a fresh
   `provider_reference` (`-2`, `-3`) — Paystack rejects a reused reference and the DB unique
   index would clash.
7. **Fulfilment transition whitelist** — must live in one place conceptually but is
   duplicated (backend `_ALLOWED_TRANSITIONS`, frontend `nextFulfilmentStatuses`); keep them
   in sync, backend is authoritative (`409`).
8. **Cart-clear timing.** Only on `/order/[reference]/success` once `isPaid`, so an
   abandoned Paystack session leaves the bag intact for a retry (§28).
9. **No Paystack test credentials yet.** The real test-mode payment (card → live webhook) is
   an **M5** checklist item; M4 ships mocked backend coverage + a forged-webhook runbook, so
   #16 is proven by construction but not yet by a real transaction.
10. **First async route in a sync codebase.** Only the webhook is `async def`; it reads the
    raw body, verifies, then hands a plain dict to the sync `handle_webhook(db, event)` — no
    async DB, no bleed into the rest of `app/`.
