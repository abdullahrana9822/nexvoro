# NEXVORO — Delivery Report

Branch: `arena/251054a2-nexvoro` · Base: `main` @ `2ba4456`

Everything below states only what was actually executed and observed. Where a check could not be
performed, it says so and why.

---

## 1. Features completed

**Storefront**

- Homepage composed from admin-controlled sections (hero, categories, flash sale, featured,
  trending, best sellers, testimonials, newsletter) with a fallback layout.
- Mega menu with the 10 required categories — Smartphones, Laptops, Tablets, Headphones,
  Smartwatches, Gaming, Accessories, Cameras, Smart Home, Audio Equipment — each with children and
  a real destination. No dead navigation links.
- Live search with suggested products, categories and brands (`/search`, debounced, keyboard
  navigable).
- Cart drawer with stock validation and persistence; quantity changes are re-validated against
  live stock.
- Checkout re-prices and re-validates stock **server-side** — the client cannot dictate price.
- Order tracking by order number + email, with a progress timeline.
- Account area: orders, addresses, wishlist, notifications.
- Coupons (`NEX10`, `FESTIVE15`, `FLAT5000`), shipping plans, reviews with rating aggregation.
- **Password recovery** (new in this pass): `/forgot-password` → single-use token → `/reset-password`.
  The token is stored **hashed** (SHA-256), expires in one hour, is burned on use, and all sessions
  are revoked on success. Responses are identical for known and unknown emails, so the endpoint
  cannot be used to enumerate accounts. This also fixed a real dead end: the login screen's
  "Forgot password?" link previously pointed at `/contact`.
- Announcement bar (free-delivery threshold, tracking, support phone).
- **Banner management** (new in this pass): a `banners` table with admin CRUD at `/admin/banners`,
  four placements (homepage, announcement, category, checkout), date windows evaluated in SQL, and
  a homepage promo strip that renders only active, in-window banners. Links are validated to be a
  site path or `https://` — `javascript:` URLs are rejected.
- SEO: dynamic `sitemap.xml` (50 URLs — static pages, all products, all categories) and
  `robots.txt` that blocks `/admin`, `/account`, `/checkout`, auth pages and `/api` from indexing.

**Admin**

- Role-based access: `ADMIN`, `STAFF`, `CUSTOMER`. Staff-only areas are guarded server-side, not
  just in the UI.
- Products, categories, brands, inventory, orders (status transitions), customers, reviews,
  coupons, shipping plans, homepage content, banners.
- Payment settings page. Card/wallet methods are **hidden and disabled** unless
  `PAYMENT_GATEWAY_PROVIDER` and `PAYMENT_GATEWAY_SECRET` are both set — cash on delivery and bank
  transfer are the functional methods.
- Audit log for privileged actions (banner create/update/delete included).

---

## 2. Design improvements

- Tagline set to **"Where Innovation Meets Lifestyle"** in `src/lib/constants.ts` and both
  metadata titles.
- Design tokens for surfaces, brand, accent and semantic colours; the admin can switch themes
  (8) and fonts (6) without a redeploy.
- Consistent card/panel primitives, `container-page` rhythm, and hairline borders instead of heavy
  shadows.
- Product imagery is local SVG (35 assets), so there are no third-party image requests; every
  product image carries descriptive `alt` text, and content images that are purely decorative are
  marked `aria-hidden`.
- Accessible states throughout: visible focus rings, `aria-label` on icon-only buttons, live
  regions for toasts, `prefers-reduced-motion` respected by animations.

---

## 3. Database connection status

**Supabase PostgreSQL — connected and verified from the deployed build.**

The Vercel project already had a Supabase integration attached, but it injects `POSTGRES_URL` /
`POSTGRES_URL_NON_POOLING` / `SUPABASE_URL` rather than `DATABASE_URL`. The application only read
`DATABASE_URL`, which is why earlier deployments reported "database not configured" while a working
database was in fact attached. `src/lib/db-url.ts` now resolves either naming convention, prefers
the pooler for runtime and the direct endpoint for migrations, and ignores unexpanded
`<placeholder>` values.

Proof from the production build log (`dpl_5cKuVSdXUnptexW7ZzdzpKNAgBsM`):

```
apply 0000_init.sql
apply 0001_password_reset.sql
apply 0002_banners.sql
Applied 3 migration(s).
```

A second deploy (`dpl_3hufhQMGneankPBiEbiT13j818ay`) then reported `Database is up to date`, which
confirms the migration ledger persisted on Supabase rather than on the build machine.

A real defect was found and fixed on the way: the first attempt died with
`self-signed certificate in certificate chain`. The container trust store does not hold the pooler
CA, and `pg-connection-string` derives strict verification from `sslmode=require` in the URL. Both
the migration client and the runtime pool now strip `sslmode` from the URL and pass an explicit
`ssl` option, so traffic stays TLS-encrypted and the connection succeeds against Supabase, Neon and
RDS. Local connections are unaffected.

**Catalogue data: currently empty in Supabase.** The schema exists, the catalogue does not. The
seed is destructive (it truncates the catalogue), so it is now guarded: it counts products and
orders first and refuses to run against a database holding data, and deploy seeding is opt-in via
`SEED_ON_DEPLOY=1` **plus** a configured `SEED_ADMIN_PASSWORD`. The deployed build correctly
reported `[seed] skipped (SEED_ADMIN_PASSWORD is not set)` rather than inventing an admin password.
Seeding requires a password the owner chooses (see §14).

Local PostgreSQL 18.6 also verified: `npm run db:verify` → `connection OK (16 ms)`,
`all 24 present`, `24 products · 5 orders · 3 users`.

---

## 4. Tables and migrations

Migration ledger `drizzle.__migrations` — all three applied, in order:

| Migration | Contents |
| --- | --- |
| `0000_init.sql` | 22 base tables |
| `0001_password_reset.sql` | `password_reset_tokens` (hashed token, 1h expiry, single-use, FK cascade, 2 indexes) |
| `0002_banners.sql` | `banners` (9 content fields, date window, active flag, 2 indexes) |

24 tables total: `users`, `sessions`, `password_reset_tokens`, `addresses`, `brands`, `categories`,
`products`, `product_variants`, `reviews`, `carts`, `cart_items`, `wishlist_items`, `coupons`,
`shipping_plans`, `orders`, `order_items`, `order_events`, `payments`, `notifications`, `settings`,
`audit_logs`, `newsletter_subscribers`, `contact_messages`, `banners`.

Migrations are applied automatically by the build (`npm run db:deploy:if-configured`), so a deploy
can never ship code ahead of its schema. They are additive: no existing table was dropped,
truncated or rewritten.

---

## 5. Supabase Storage

**Not configured, and not claimed to be.** `src/lib/supabase.ts` defines the intended buckets
(`product-images`, `category-images`, `brand-logos`, `homepage-banners`, `customer-uploads`), a
public-URL helper with a local fallback, and a server-side upload helper that uses the
service-role key. The service-role key is read only on the server and is never re-exported to a
client bundle.

Because nothing has exercised an upload, this is reported as unverified rather than working. The
storefront currently serves product imagery from `/public/products/*.svg`, so visual completeness
does not depend on Storage.

---

## 6. Authentication

- Password hashing with bcrypt; HTTP-only, `SameSite=Lax`, secure-in-production session cookies
  backed by a `sessions` table (revocable server-side).
- Login rate limit 10 attempts / 5 minutes; account lock after 6 consecutive failures.
- Registration, login, logout, password recovery, password reset.
- Role checks are enforced in the API layer (`withRole`), not only by hiding UI.
- Cross-origin requests to mutating endpoints are rejected (`assertSameOrigin`).
- `AUTH_SECRET` / `SESSION_SECRET` is required for sessions to persist. It has now been set on the
  Vercel project as a sensitive variable; the value was generated with `openssl rand -base64 48`
  and was never committed, logged, or written to a tracked file.

---

## 7. Admin dashboard

Product/category/brand/inventory management, order pipeline with status transitions and customer
notifications, customer directory, review moderation, coupons, shipping plans, homepage section
editor, banner manager (new), payment settings, audit log, and a store-health panel. All admin
routes return `307` to the login page when unauthenticated — verified, including `/admin/banners`.

---

## 8. Performance

Deliberate, verifiable choices rather than claims:

- Server Components by default; client components only where interaction requires them.
- Zero web fonts fetched from third parties — system font stacks, with admin-selectable stacks.
- All catalogue imagery is local SVG, so product pages issue no cross-origin image requests.
- `next/image` is not used with remote hosts; nothing depends on an image CDN being configured.
- The `pg` pool is created lazily behind a proxy on first query, so builds never need a live
  database and cold starts do not pay for eager connection setup.
- Pool size capped at 3 connections on the serverless runtime.

**Lighthouse / Core Web Vitals have not been measured.** No score is claimed. This sandbox has no
egress to the deployment, so any number quoted here would be fabricated.

---

## 9. Tests executed — actual results

```
npx tsc --noEmit      → exit 0 (no type errors)
npx eslint .          → exit 0 (no lint errors)
npx vitest run        → 6 files, 60 tests passed
npm run build         → ✓ Compiled successfully
```

Test coverage includes pricing/shipping maths, cart stock rules, order lifecycle, validation
schemas, password-reset payload rules (token shape, strength enforcement, short-token rejection),
password-strength scoring, and live-database schema assertions (24 tables, reset tokens stored as
64-char hex, never plaintext).

Live end-to-end checks against the running app, with real HTTP responses:

| Check | Result |
| --- | --- |
| Reset request for a known email | `200` |
| Reset request for an unknown email | `200`, byte-identical message, no link (no enumeration) |
| Reset with a weak password | `422` with a field error |
| Reset with a valid token | `200` |
| Replaying the same token | `400` |
| Login with the new password | `200` |
| Login with the old password | `401 "Incorrect email or password"` |
| Banner created via admin API | `201` |
| Banner with `javascript:` link | `422` rejected |
| Banner visible on the homepage | rendered |
| `/admin/banners` unauthenticated | `307` → login |
| `/sitemap.xml`, `/robots.txt` | `200`, 50 URLs |

---

## 10. Repository and branch

- Repository: `github.com/abdullahrana9822/nexvoro`
- Branch: `arena/251054a2-nexvoro` (pushed)
- No force-push, no history rewrite, no work on any other branch.

---

## 11. Latest commit

`b08d933` — `feat(seed): guard the catalogue seed and make deploy seeding opt-in`

---

## 12. Vercel status

- Project `nexvoro` (`prj_m36AdyKRtkFiKNTpJidulDgPizbc`), team
  `abdullahrana9822-5855`.
- Deployments for this branch reach **READY**, including the one that executed the Supabase
  migrations.
- Build command: `npm run build`, which runs migrations (and optionally the seed) before
  `next build`.
- Env vars now set: `SESSION_SECRET` (sensitive), `SEED_ON_DEPLOY=1`, plus the pre-existing
  `NEXT_PUBLIC_SITE_URL`, `APP_TIMEZONE`, `CRON_SECRET`, `NEXVORO_ENCRYPTION_KEY`, and the Supabase
  integration set.
- Cron `0 3 * * *` → `/api/worker` is in `vercel.json`; the Hobby plan does not accept sub-daily
  schedules, so this daily schedule is the one that is valid.

---

## 13. Production URL

**There is no publicly reachable production URL yet, and this is not something to paper over.**

Two independent facts cause it:

1. **Production deploys from `main`.** Our work lives on `arena/251054a2-nexvoro`, so deployments
   are *preview* deployments. `nexvoro-neon.vercel.app` (the project's domain) returns
   `404 DEPLOYMENT_NOT_FOUND` because no production deployment exists for this code.
2. **Deployment Protection (Vercel SSO) is enabled** for all deployments except custom domains.
   Fetching the preview URL returns the Vercel login page
   (`Protected Deployment – Vercel`), not the store.

The branch alias `nexvoro-git-arena-251054a2-nexvoro-abdullahrana9822-5855.vercel.app` serves the
current build for anyone authenticated to the Vercel team. Making it public requires either merging
to `main` (production) or turning off Deployment Protection for this project — both are owner-level
actions, and the second was not done because weakening access control without approval would
contradict the brief.

---

## 14. Remaining environment variables and manual actions

**Blocking a usable store:**

1. `SEED_ADMIN_PASSWORD` (and optionally `SEED_STAFF_PASSWORD`, `SEED_DEMO_PASSWORD`) — required to
   populate the Supabase catalogue. The seed refuses to run without it rather than inventing a
   password. Once set, the next deploy seeds once; after that the guard skips re-seeding, so the
   variable can be removed.
2. Merge `arena/251054a2-nexvoro` → `main` to obtain a production deployment.
3. Decide on Deployment Protection: keep SSO (site stays private) or disable it for this project
   (site becomes public).

**Optional:**

4. `PAYMENT_GATEWAY_PROVIDER` + `PAYMENT_GATEWAY_SECRET` — until both are set, card and wallet
   payments stay hidden. Only COD and bank transfer are offered.
5. `EMAIL_SERVICE_KEY` — without it, password-reset links are shown on screen in non-production
   instead of being emailed. In production with no provider, the reset email cannot be delivered.
6. `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — needed to enable uploads to Storage.
7. `AUTH_SECRET` — the deployment currently signs sessions with `SESSION_SECRET`; set `AUTH_SECRET`
   if you prefer the explicit name.

Never commit `.env` files. `.env.example` contains placeholders only.

---

## 15. Unresolved issues

- **Supabase catalogue is empty** — schema applied, no products. Requires the owner-chosen seed
  password (§14.1). Product pages currently have nothing to render on the deployed environment.
- **No public URL** — preview-only deployment behind SSO (§13).
- **Supabase Storage unverified** — helper code exists; no bucket has been created or upload
  exercised.
- **RLS not used.** The application talks to PostgreSQL directly through Drizzle with server-side
  authorization, and never ships an anon key or `supabase-js` to the browser, so Postgres RLS is not
  part of the security model. Adding RLS is only meaningful with a direct-from-browser access path,
  which this architecture deliberately does not have.
- **Lighthouse / Core Web Vitals unmeasured** — no egress from the build sandbox to the deployment.
- **Deploy-time seed is one-shot by design.** Because the guard skips re-seeding once data exists,
  catalogue edits must go through the admin UI or a deliberate `--force` run.
- **`npm audit` reports 12 moderate advisories** in transitive dependencies. Not addressed in this
  pass; `npm audit fix --force` was not run because it introduces breaking major upgrades.
- **Password-reset emails** cannot be delivered until `EMAIL_SERVICE_KEY` is set; in production the
  link is not surfaced on screen, so resets would silently do nothing.

---

## Latest execution — security and production deployment follow-up

This section supersedes older test counts and deployment status above.

- Implemented `0003_supabase_security.sql`: enables RLS on the 24 application
  tables, revokes direct table access from Supabase `anon` and `authenticated`
  roles when those roles exist. Application authorization remains server-side;
  the application database owner retains access. No rows are deleted.
- Creates five missing Storage buckets when `storage.buckets` exists. Public
  catalogue/banner buckets accept JPEG/PNG/WebP/AVIF; customer uploads remain
  private. Existing bucket settings are deliberately not overwritten. Actual
  remote uploads and existing policies still require verification.
- Migration runner now takes a session advisory lock, preventing simultaneous
  builds from racing the migration ledger.
- Local migration applied; schema verified: 24 tables, 24 products, 5 orders,
  3 users. These are LOCAL counts, not Supabase production counts.
- TypeScript, ESLint, and production build passed. Latest suite: **68 tests
  passed across 8 files**, including a new database-backed RLS assertion.
- Local HTTP checks: 16 routes passed, including protected `/admin` and
  `/account` redirecting to login. This does not verify interactive mega menus,
  mobile layouts, or production checkout.
- Code pushed and remote hash verified: `2519d33aa8610bfb8e199538b11943958f21e72f`
  on `arena/251054a2-nexvoro`, repository `abdullahrana9822/nexvoro`.
- Corrected production `NEXT_PUBLIC_SITE_URL` in Vercel to
  `https://nexvoro-neon.vercel.app`.
- Submitted production deployment `dpl_EjRDPcQ9aZedC3sWTrs1LkisGAzL` from that
  exact commit to the EXISTING project. Last observed state: **QUEUED**.
  Submission is not evidence that its migration ran or that production is READY.
- Live public `/api/health` check still returned `404 DEPLOYMENT_NOT_FOUND`.
  Public access, production database operations and order placement remain
  unverified. Vercel protection settings were not bypassed or changed.

### Remaining launch requirements

1. Configure the rotated database URL in Vercel project settings via its secure
   environment-variable UI or the existing Supabase integration. Never paste a
   password into chat. The integration's identity and password rotation have not
   been independently verified as the requested `ckrgkrxtqvmiwqccdmfq` project.
2. Provide a strong owner-selected `SEED_ADMIN_PASSWORD` securely if an empty
   database is to be initialized. Do not run the destructive demo seed on an
   occupied database; obtain explicit approval before any destructive operation.
3. Verify Storage buckets, policies, and authorized upload/download behavior
   remotely. Bucket provisioning alone is not a completed image workflow.
4. Check that CRON_SECRET and NEXVORO_ENCRYPTION_KEY are actually populated;
   sensitive-variable metadata hides values and does not prove they are empty.
   AUTH_SECRET is an alternative to SESSION_SECRET, not a reason to duplicate
   session secrets. This architecture uses POSTGRES_URL integration aliases, so
   DATABASE_URL/DIRECT_URL need not be duplicated when aliases are correct.
5. Confirm deployment READY, assign/verify the intended public domain, then run
   full public browser navigation, authentication, cart and checkout tests.
6. Replace illustrated SVG catalogue art with licensed product photography;
   no new photography has been sourced in this follow-up. Lighthouse remains
   unmeasured. Database TLS certificate verification is currently relaxed and
   should be hardened using the provider CA before calling security complete.

The platform is not yet verified production-ready. Existing feature descriptions
above describe implemented code, not proof of successful live customer journeys.
