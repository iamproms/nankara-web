# Nankara Shop API

FastAPI + PostgreSQL backend for the Nankara commerce MVP. Lives alongside the
Next.js frontend in this monorepo. Spec: [`../NANKARA_SHOP_MVP.md`](../NANKARA_SHOP_MVP.md).

## Status — Milestones 1–3

**M1 — data + product administration**

- Admin authentication (JWT bearer tokens, bcrypt password hashing)
- `admins`, `categories`, `products`, `product_images` tables + Alembic migration
- Admin category CRUD
- Admin product CRUD (create / list / read / update, publish + availability)
- Product image management via Cloudinary (upload endpoint + ordered replace)
- Public read endpoints for the storefront (published products only)
- Admin overview counts

**M3 — checkout + shipping**

- `shipping_zones`, `orders`, `order_items` tables + `order_status` enum (migration `0002`)
- `POST /api/v1/shipping/quote` — destination → authoritative flat rate (spec §11)
- `POST /api/v1/orders` — recalculates every price + shipping server-side, creates a
  `PENDING_PAYMENT` order with an item snapshot; `409` (whole order) if any line can't be
  fulfilled, `422` empty cart / unquotable destination (spec §12, §24, §28)
- `GET /api/v1/orders/{reference}/confirmation` — public, unguessable reference, safe fields only
- `GET / PATCH /api/v1/admin/shipping-zones` — admin rate + active-flag editing
- `pytest` suite under `tests/`

Not yet built: payments (Paystack init + webhook + verification), admin order management —
Milestone 4.

## Requirements

- Python 3.11–3.13 (3.14 has no wheels for the pinned deps yet — use `uv`, below,
  which pins 3.12 automatically)
- PostgreSQL 14+ (the bundled `docker-compose.yml` runs one on host port **5433**)
- A Cloudinary account (for image uploads)

## Setup

```bash
cd backend

# with uv (recommended — handles the Python version)
uv venv --python 3.12 .venv
uv pip install -r requirements-dev.txt      # or requirements.txt for prod only
source .venv/bin/activate

# or with stock tooling, if you have Python 3.12/3.13:
#   python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt

cp .env.example .env
# edit .env: set SECRET_KEY (openssl rand -hex 32) and the CLOUDINARY_* values

# start Postgres (or point DATABASE_URL at your own)
docker compose up -d

# create the schema
alembic upgrade head

# create the first admin + starter categories + shipping zones
python -m app.cli create-admin --email you@nankara.com --password 'a-strong-password'
python -m app.cli seed-categories
python -m app.cli seed-shipping-zones      # 9 zones, DUMMY rates — replace before launch (§11)

# optional: a development-only sample catalogue for exercising the storefront
python -m app.cli seed-demo-products

# run
uvicorn app.main:app --reload --port 8000
```

Interactive docs: <http://localhost:8000/docs>

## Auth flow

1. `POST /api/v1/admin/auth/login` with `{ "email", "password" }` → `{ access_token, admin }`.
2. Send `Authorization: Bearer <access_token>` on every `/api/v1/admin/*` request.
3. Tokens are stateless; "logout" is discarding the token client-side.
   `POST /api/v1/admin/auth/logout` exists for symmetry and returns 204.

## API surface

### Public

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/v1/products` | Published products, newest first |
| GET | `/api/v1/products/{slug}` | Published product by slug |
| GET | `/api/v1/categories` | All categories |
| POST | `/api/v1/shipping/quote` | `{ country_code, state_region }` → `{ zone_code, zone_name, amount, currency }`; 422 if unshippable |
| POST | `/api/v1/orders` | Guest checkout — creates a `PENDING_PAYMENT` order (see below) |
| GET | `/api/v1/orders/{reference}/confirmation` | Public-safe order view, keyed on the unguessable reference |
| GET | `/health` | Liveness |

### Admin (bearer token required)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/admin/auth/login` | |
| POST | `/api/v1/admin/auth/logout` | 204 |
| GET | `/api/v1/admin/auth/me` | Current admin |
| GET | `/api/v1/admin/overview` | Dashboard counts |
| GET/POST | `/api/v1/admin/categories` | |
| PATCH/DELETE | `/api/v1/admin/categories/{id}` | Delete nulls the FK on products |
| GET/POST | `/api/v1/admin/products` | List includes drafts |
| GET/PATCH | `/api/v1/admin/products/{id}` | |
| PUT | `/api/v1/admin/products/{id}/images` | Replace full ordered image list |
| POST | `/api/v1/admin/media/upload` | multipart `file` → `{ url, public_id }` |
| GET | `/api/v1/admin/shipping-zones` | All zones + rates |
| PATCH | `/api/v1/admin/shipping-zones/{id}` | `{ rate?, is_active? }` |

### Typical "add a product" sequence

1. For each photo: `POST /api/v1/admin/media/upload` → keep `{ url, public_id }`.
2. `POST /api/v1/admin/products` with the fields (optionally an `images` array).
3. Or set images later: `PUT /api/v1/admin/products/{id}/images` with
   `[{ url, public_id, alt_text, is_primary }]` — array order becomes display
   order; images dropped from the list are removed from Cloudinary.

### `POST /api/v1/orders` body

```jsonc
{
  "contact":  { "first_name": "", "last_name": "", "email": "", "phone": "" },
  "delivery": { "country_code": "NG", "country_name": "Nigeria",
                "address_1": "", "address_2": "", "city": "", "state_region": "",
                "postal_code": "", "notes": "" },
  "items":    [ { "product_id": 1, "quantity": 2 } ]
}
```

The server ignores any price/total sent in the body — `unit_price`, `subtotal`,
`shipping_amount` and `total` are recomputed from `products.price_ngn` and the resolved
`shipping_zones.rate`. Availability is re-checked; if any line fails the **whole** order is
rejected with `409` and `detail.items` lists the offending products.

## Tests

```bash
pytest                       # from backend/, with the venv active
```

Runs against a `<db>_test` database on the same Postgres server (created on first run),
schema built from the models, one transaction rolled back per test. Postgres must be up
(`docker compose up -d`).

## Migrations

```bash
alembic revision --autogenerate -m "describe change"   # after editing models
alembic upgrade head
alembic downgrade -1
alembic check                                          # models vs. migrations in sync?
```

`alembic/env.py` pulls the database URL from `app.core.config`, so there is no
URL in `alembic.ini`.

## Notes / decisions

- **Price** is stored as whole Naira in `products.price_ngn` (integer). USD is a
  display-only conversion, added in a later milestone.
- **Slugs** auto-generate from the name and are only regenerated on update when a
  `slug` is explicitly passed, so shared product URLs stay stable.
- **Multiple admins** are supported by the schema; only one is needed at launch.
- **CORS** is restricted to `CORS_ORIGINS` (comma-separated) from `.env`.
