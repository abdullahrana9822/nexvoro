# NEXVORO

Premium electronics storefront and back office — Next.js 16 (App Router), React 19, TypeScript,
Tailwind CSS v4, Framer Motion, PostgreSQL via Drizzle ORM.

45 page routes, 30 API route handlers, 8 themes, real database, real auth, and an order lifecycle
that advances automatically to 99% and stops there until a human confirms delivery.

---

## Quick start

```bash
# 1. Requirements: Node 20.9+, PostgreSQL 14+
node --version

# 2. Install (skips the optional embedded-postgres download)
npm ci

# 3. Configure
cp .env.example .env.local
openssl rand -base64 48      # paste into AUTH_SECRET
openssl rand -hex 32         # paste into CRON_SECRET
# point DATABASE_URL at your database, and set seed passwords

# 4. Create the schema and load the demo catalogue
npm run db:migrate
npm run db:seed

# 5. Run
npm run dev                  # http://localhost:3000
```

### Seeded accounts

| Role        | Email                  | Password              |
| ----------- | ---------------------- | --------------------- |
| Super admin | `admin@nexvoro.com`    | `SEED_ADMIN_PASSWORD`  |
| Staff       | `ops@nexvoro.com`      | `SEED_STAFF_PASSWORD`  |
| Customer    | `customer@nexvoro.com` | `SEED_DEMO_PASSWORD`   |

The seed script refuses to run with empty passwords and never stores plaintext — hashes are
bcrypt with cost 12. Seed passwords are yours to set in `.env.local`; nothing is hard-coded.

---

## Scripts

| Command                 | What it does                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| `npm run dev`           | Dev server on `0.0.0.0:3000`                                        |
| `npm run build`         | Production build (fails on type or lint errors)                     |
| `npm start`             | Serve the production build                                          |
| `npm run lint`          | ESLint (flat config, Next 16 core-web-vitals + TS rules)            |
| `npm run typecheck`     | `tsc --noEmit`                                                      |
| `npm test`              | Vitest — unit + database integration suites                         |
| `npm run test:watch`    | Vitest in watch mode                                                |
| `npm run db:migrate`    | Apply pending SQL migrations (transactional, idempotent)            |
| `npm run db:deploy`     | Same runner, used by CI/release                                     |
| `npm run db:seed`       | Truncate transactional data and reload the demo dataset             |
| `npm run db:generate`   | Generate a new migration from `src/db/schema.ts`                    |
| `npm run db:studio`     | Drizzle Studio against `DATABASE_URL`                               |
| `npm run worker`        | One pass of the order-lifecycle worker (cron/CLI)                   |

---

## Architecture

```
src/
  app/
    (store)/      storefront — home, shop, product, cart, checkout, account, content pages
    (auth)/       split-screen login + register
    (admin)/      /admin dashboard and 20 management screens (role-gated in layout)
    api/          30 route handlers (auth, cart, checkout, orders, reviews, admin, worker)
  components/     ui primitives, layout shell, marketing, store, admin
  db/             Drizzle schema, pooled client, migrations
  lib/            pricing, cart, orders, catalog, auth, settings, validation, env
drizzle/          SQL migrations + drizzle metadata
scripts/          migrate, seed, worker, image generation
tests/            vitest suites (pure logic + live database checks)
```

### Data model

`users`, `addresses`, `sessions`, `categories`, `brands`, `products`, `product_variants`,
`shipping_plans`, `carts`, `cart_items`, `coupons`, `orders`, `order_items`, `order_events`,
`payments`, `reviews`, `wishlist_items`, `notifications`, `audit_logs`, `settings`,
`newsletter_subscribers`, `contact_messages`.

Money is stored as `numeric(12,2)` and formatted server-side in PKR. Every price shown is
re-read from the database at checkout — the client is never trusted for amounts.

### Order lifecycle

`PENDING → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → AWAITING_CONFIRMATION (99%)`

- The worker advances one stage per shipping plan `stage_interval_hours`.
- **The worker can never set `DELIVERED`.** Progress is capped at 99 by construction.
- The customer confirms in their account (`POST /api/orders/confirm`) → 100%, or disputes
  (`POST /api/orders/dispute`) → `DISPUTED` and an admin alert.
- If the expected date passes without confirmation, the order is escalated to admins — never
  auto-delivered.
- Admins can override a status manually; the override is written to `audit_logs`.

Trigger the worker three ways:

1. Vercel Cron — `vercel.json` calls `GET /api/worker` daily at 03:00 UTC with
   `Authorization: Bearer $CRON_SECRET` (Hobby plans only allow daily crons; Pro can use
   `0 * * * *`). The worker catches up by elapsed time, so a daily scheduler still advances an
   order several stages at the cadence its shipping plan promises — it never skips to delivered.
2. Admin UI — “Run order worker” on **/admin/shipping** (audited, ADMIN+).
3. CLI/cron host — `npm run worker`.

### Auth

Stateless HTTP-only session cookies signed with `jose` (HS256, 7-day expiry), httpOnly + SameSite
Lax + Secure in production. Passwords are bcrypt. Roles: `CUSTOMER < STAFF < ADMIN < SUPER_ADMIN`,
enforced server-side by `withRole()` on every admin API route — hiding a button is never the only
protection. All mutating routes verify same-origin.

---

## Admin

`/admin` is gated in the layout: anonymous → `/login?next=/admin`, below STAFF → `/account`.

Dashboard · Orders (+ detail) · Products (+ create/edit) · Categories · Inventory · Customers ·
Reviews · Coupons · Shipping plans · Messages · Notifications · Theme & fonts · Homepage ·
Navigation · Settings · Roles · Audit log · Database · Backups.

---

## Themes

Eight complete themes (light, dark, glass, frosted, futuristic, luxury, minimal, neon) and six
self-hosted variable fonts (Outfit, Inter, DM Sans, Manrope, Sora, Playfair Display). Preferences
are stored in a first-party cookie, applied server-side on first paint (no flash), and there is an
OS-driven dark fallback. Admins set the default in **/admin/appearance**.

---

## Deployment (Vercel + managed Postgres)

1. Create a Postgres database (Neon, Supabase, RDS or Vercel Postgres) and copy its connection
   string with `sslmode=require`.
2. Import the repository in Vercel. Framework preset: **Next.js** — no overrides needed.
3. Add environment variables (Production + Preview): `DATABASE_URL`, `AUTH_SECRET`,
   `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`. Optional: `PAYMENT_GATEWAY_PROVIDER`,
   `PAYMENT_GATEWAY_SECRET`, `EMAIL_SERVICE_KEY`.
4. Run the migration once against production:
   ```bash
   DATABASE_URL="postgres://…" npm run db:deploy
   ```
   (Optionally seed demo data: `DATABASE_URL="…" npm run db:seed`.)
5. Deploy. `vercel.json` registers the daily cron for `/api/worker` (03:00 UTC).
6. Verify: `/api/health` returns `{"ok":true}`, `/admin` redirects to `/login`, and an order
   placed with COD appears in `/admin/orders`.

### Backup & recovery

- **Logical export:** **/admin/backup → Download JSON** (`GET /api/admin/backup`, SUPER_ADMIN).
  Excludes password hashes and session tokens.
- **Physical / PITR:** enable automated daily backups and point-in-time recovery on the managed
  Postgres provider; retain ≥ 7 days; test a restore into staging quarterly.
- Dumps are git-ignored — never commit them.

---

## Security

- Same-origin checks on every mutating API route.
- Zod validation on every input; failures return field-level errors, never stack traces.
- bcrypt cost 12, password strength rules enforced server-side.
- HTTP-only signed sessions, no tokens in localStorage.
- Security headers in `next.config.ts` (HSTS, nosniff, frame options, referrer policy,
  permissions policy).
- No secrets in the bundle; nothing sensitive under `NEXT_PUBLIC_`.
- Admin actions recorded in `audit_logs` with actor, entity, metadata and IP.
- `/api/worker` requires a constant-time compared bearer `CRON_SECRET`.

---

## Testing

```bash
npm test                  # 49 tests: utils, pricing, validation, lifecycle, live DB
npm run test:integration  # database-only suite (needs DATABASE_URL)
```

Integration tests are read-only against your database — except a worker run that asserts the
number of `DELIVERED` orders does not change, which is exactly the guarantee the product needs.

---

## Notes

- `@prisma/client` is not used; the schema layer is Drizzle (`npm run db:generate` →
  `drizzle/000N_*.sql` → `npm run db:migrate`).
- Product imagery is local SVG (`public/products/*.svg`) so there is no external CDN dependency
  and no broken images offline. Remote images from Unsplash/Cloudinary/Vercel Blob are allowed
  via `next.config.ts` if you replace them.
- Online payments are intentionally gated: until a gateway is configured, card/wallet options
  are hidden and checkout offers COD and bank transfer only.
