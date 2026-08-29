# Nankara Shop API

FastAPI + PostgreSQL backend for the Nankara commerce MVP. Lives alongside the
Next.js frontend in this monorepo. Spec: [`../NANKARA_SHOP_MVP.md`](../NANKARA_SHOP_MVP.md).

## Status — Milestone 1 (data + product administration)

Implemented:

- Admin authentication (JWT bearer tokens, bcrypt password hashing)
- `admins`, `categories`, `products`, `product_images` tables + Alembic migration
- Admin category CRUD
- Admin product CRUD (create / list / read / update, publish + availability)
- Product image management via Cloudinary (upload endpoint + ordered replace)
- Public read endpoints for the storefront (published products only)
- Admin overview counts

Not yet built (later milestones): cart, checkout, shipping, orders, payments.

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

# create the first admin + starter categories
python -m app.cli create-admin --email you@nankara.com --password 'a-strong-password'
python -m app.cli seed-categories

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

### Typical "add a product" sequence

1. For each photo: `POST /api/v1/admin/media/upload` → keep `{ url, public_id }`.
2. `POST /api/v1/admin/products` with the fields (optionally an `images` array).
3. Or set images later: `PUT /api/v1/admin/products/{id}/images` with
   `[{ url, public_id, alt_text, is_primary }]` — array order becomes display
   order; images dropped from the list are removed from Cloudinary.

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
