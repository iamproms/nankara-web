# Nankara — Deployment

Backend (FastAPI) on **Render**, frontend (Next.js) on **Vercel**, Postgres
managed by Render (or Neon). This is a monorepo: the Next app is at the repo
root, the API is in `backend/`.

---

## 1. Accounts to create

| Service | What it's for | Notes |
| --- | --- | --- |
| **GitHub** — `nankara` org + `nankara-web` repo | Source of truth for both deploys | Grant the deploying user push access; connect the repo to Render and Vercel. |
| **Render** | Backend web service **+** managed PostgreSQL | Free tier works to start (the web service cold-starts after 15 min idle — upgrade to a paid instance before launch). |
| **Vercel** | Frontend hosting | Hobby tier is fine for launch. Connect the same GitHub repo; root directory = repo root. |
| **Cloudinary** | Product image storage/CDN (spec §7) | Free tier is plenty. You need the **Cloud name**, **API key**, **API secret** from the dashboard. |
| **Paystack** | Payments (spec §13) | Requires **business verification** for **live** mode. You need the live **Secret key** and **Public key**, and you'll set a **webhook URL** (below). Test keys work immediately for staging. |
| **Resend** | Transactional email — account verification + password reset (order emails later) | Free tier ≈ 3k emails/mo. You must **verify a sending domain** (add the DNS records Resend gives you) before `RESEND_FROM` can be `orders@nankara.com`; until then use `onboarding@resend.dev`. |
| **Domain registrar** (nankara.com) | The public site + the email sending domain | If you don't already own it. Needed for a proper `RESEND_FROM`, and recommended for the site + API (see §6). |

Optional: **Neon** or **Supabase** if you'd rather not use Render's Postgres
(both have generous free tiers; the app just needs a connection string).

---

## 2. Architecture & the one thing to get right

```
browser ──► www.nankara.com (Vercel, Next.js)
                │  next.config.mjs rewrites /api/v1/*  ──►  Render (FastAPI)
                │                                            └─► Render Postgres
Paystack ───────────────────────────────────────────────►  Render  (webhook, direct)
```

The browser only ever talks to the Vercel origin. `/api/v1/*` is **proxied**
server-side by Vercel's rewrite to the Render service, so from the browser's
point of view the API is **same-origin** — which is what makes the `HttpOnly`
session cookies work.

**Verify this first after deploying:** log into `/admin` on the live site, open
DevTools → Application → Cookies, and confirm `nk_admin` is set on the Vercel
domain. If it isn't (some proxy setups strip `Set-Cookie`), use the custom-domain
setup in §6 with `COOKIE_DOMAIN`.

---

## 3. Backend on Render

**Create → Web Service → connect the repo.**

| Setting | Value |
| --- | --- |
| Root Directory | `backend` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Pre-Deploy Command | `alembic upgrade head` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips '*'` |
| Instance type | Starter or better for launch (Free cold-starts) |

- `--proxy-headers --forwarded-allow-ips '*'` so the app sees the real client IP
  behind Render's proxy (the rate limiter keys on it) and treats the connection
  as HTTPS (so `Secure` cookies are set).
- Set **`PYTHON_VERSION`** = `3.12.7` (the pinned deps have no 3.14 wheels).
- Add a Render **PostgreSQL** instance in the same region. Render's dashboard
  gives an "Internal Database URL" like `postgres://user:pass@host/db` — the app
  needs the **`postgresql+psycopg://`** scheme, so set `DATABASE_URL` manually:
  `postgresql+psycopg://user:pass@host:5432/db`.

### Backend environment variables

| Key | Value | Required |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | ✅ (enables the startup safety guard, disables `/docs`) |
| `DATABASE_URL` | `postgresql+psycopg://…` (from the Render PG instance, scheme swapped) | ✅ |
| `SECRET_KEY` | 32+ random chars — `openssl rand -hex 32` | ✅ (app refuses to start on the default / short) |
| `CORS_ORIGINS` | `https://www.nankara.com` (comma-separated; **no localhost** in prod) | ✅ |
| `FRONTEND_ORIGIN` | `https://www.nankara.com` (Paystack callback + email links) | ✅ |
| `PAYSTACK_SECRET_KEY` | `sk_live_…` (or `sk_test_…` on staging) | ✅ for payments |
| `PAYSTACK_PUBLIC_KEY` | `pk_live_…` | recommended |
| `PAYSTACK_BASE_URL` | `https://api.paystack.co` | default is fine |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary | ✅ for image upload |
| `CLOUDINARY_UPLOAD_FOLDER` | `nankara/products` | default is fine |
| `RESEND_API_KEY` | `re_…` | ✅ for verify / reset emails (flows still work without it, just don't send) |
| `RESEND_FROM` | `Nankara <orders@nankara.com>` (domain must be verified in Resend) | default `onboarding@resend.dev` works until then |
| `ADMIN_TOKEN_TTL_MINUTES` | `720` | optional (default) |
| `CUSTOMER_TOKEN_TTL_MINUTES` | `43200` | optional (default) |
| `COOKIE_DOMAIN` | *blank* (set only for the §6 subdomain setup) | optional |

### First-run: schema + seed

`alembic upgrade head` runs on every deploy (pre-deploy hook). Then, once, from
the Render **Shell**:

```bash
python -m app.cli create-admin --email you@nankara.com --password '<strong>'
python -m app.cli seed-categories
python -m app.cli seed-shipping-zones     # DUMMY rates — replace in /admin/shipping before real orders
# do NOT run seed-demo-products / seed-demo-orders in production
```

Password reset for the admin, if ever needed:
`python -m app.cli reset-admin-password --email you@nankara.com`.

---

## 4. Frontend on Vercel

**New Project → import the repo.**

| Setting | Value |
| --- | --- |
| Root Directory | *(repo root — leave default)* |
| Framework Preset | Next.js (auto-detected) |
| Build Command | `npm run build` (default) |
| Output | default |

### Frontend environment variables

| Key | Value | Notes |
| --- | --- | --- |
| `BACKEND_ORIGIN` | `https://nankara-api.onrender.com` (your Render service URL) | **Server-side** — used by `next.config.mjs` for the `/api/v1/*` rewrite and by server components. **Not** `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_NGN_PER_USD` | `1600` (or your current rate) | Display-only "Approx. $X USD". |

`next.config.mjs` already does the rewrite and allows `res.cloudinary.com` for
`next/image` — no changes needed.

---

## 5. Third-party wiring

### Paystack

1. Activate the account (business verification) to get **live** keys.
2. Dashboard → Settings → API Keys & Webhooks → **Webhook URL**:
   `https://nankara-api.onrender.com/api/v1/payments/paystack/webhook`
   (point it **directly at Render**, not through the Vercel proxy — the webhook
   is server-to-server and doesn't need the frontend).
3. The webhook signature is verified with `PAYSTACK_SECRET_KEY` — the same key
   the app calls the API with. No separate webhook secret.
4. Test the full flow in **test mode** first (test card `4084 0840 8408 4081`,
   OTP `123456`) end-to-end before switching to live keys.

### Resend

1. Add and **verify the sending domain** (`nankara.com`) — Resend gives you SPF /
   DKIM / (optional) DMARC DNS records to add at your registrar.
2. Set `RESEND_FROM=Nankara <orders@nankara.com>` (or `no-reply@…`).
3. Until the domain is verified, leave `RESEND_FROM` as `onboarding@resend.dev`
   or account emails will bounce.

### Cloudinary

Just the three keys + folder in the backend env. The image manager in
`/admin/products` uploads straight to `POST /api/v1/admin/media/upload`.

---

## 6. Custom domains (recommended before launch)

- **Frontend:** add `www.nankara.com` (and `nankara.com` → redirect to `www`) in
  Vercel; point the registrar's records at Vercel.
- **Backend:** add `api.nankara.com` as a custom domain on the Render service
  (CNAME to the Render host).

With the API on a sibling subdomain you have two safe options for cookies:

1. **Keep the Vercel proxy** (`BACKEND_ORIGIN=https://api.nankara.com`) — the
   browser still only sees `www.nankara.com`, cookies stay host-only there,
   `COOKIE_DOMAIN` stays blank. Simplest.
2. **Call the API subdomain directly** from the browser — then set
   `COOKIE_DOMAIN=.nankara.com` on the backend and `CORS_ORIGINS` /
   `FRONTEND_ORIGIN` to `https://www.nankara.com`. The cookie is now sent to both
   subdomains (`SameSite=Lax`, same-site). You'd also change the frontend to call
   `https://api.nankara.com/api/v1/*` with `credentials: 'include'` instead of
   the proxy — a small change, only take this path if option 1's proxy drops
   `Set-Cookie`.

Update `CORS_ORIGINS` and `FRONTEND_ORIGIN` to the final `https://www.nankara.com`
whenever the domain changes (the startup guard rejects `localhost` in prod).

---

## 7. Post-deploy checklist

- [ ] Backend `/health` returns `{"status":"ok"}`; `/docs` returns **404** (prod).
- [ ] `alembic upgrade head` ran (check the deploy log) — migrations `0001`–`0005`.
- [ ] Admin: log in on the live site → `nk_admin` cookie on the site domain,
      **HttpOnly**, `localStorage` empty. Change password → signed out everywhere.
- [ ] Products: add a real product with a Cloudinary image → appears on `/shop`.
- [ ] Replace the dummy shipping rates in `/admin/shipping` (or explicitly
      approve them) — **before** taking real orders.
- [ ] Checkout as a guest → Paystack (test mode) → success page → order in
      `/admin/orders`.
- [ ] Register a customer → verification email arrives (real Resend key) →
      `/account`, add an address, save measurements.
- [ ] Guest order → "create an account" prompt on the success page → order shows
      in `/account/orders`.
- [ ] `CORS_ORIGINS` / `FRONTEND_ORIGIN` are the real `https://www.nankara.com`.
- [ ] Switch Paystack to **live** keys; re-test one small real transaction.
- [ ] Set up a DB backup schedule (Render paid plans do daily automatically;
      otherwise `pg_dump` on a cron).

---

## 8. Operational notes

- The rate limiter (`slowapi`) is **in-memory** — it resets on each deploy and is
  per-instance. Fine for a single Render instance; point it at Redis
  (`storage_uri` in `app/core/ratelimit.py`) if you scale horizontally.
- No background worker — account emails are sent inline, best-effort (a failed
  send logs a warning, never fails the request).
- `SECRET_KEY` rotation logs out **every** admin and customer immediately
  (tokens are signed with it). Rotate deliberately.
- Render free instances sleep; the first request after idle takes ~30 s. The
  Paystack webhook has retries, so a cold start won't lose a payment, but move to
  a paid instance before launch.
