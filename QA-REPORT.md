# NEXVORO QA follow-up

Application under test: redesign `a1383ef`, fixes `378ffc7`.
Branch: `arena/251054a2-nexvoro`.

## Reproduced defects and fixes

1. **Account SSR authorization exception.** An anonymous GET `/account` logged
   `AuthorizationError: Authentication required` from `requireUser`, even while
   its layout returned a login redirect. Next renders layouts/pages concurrently.
   All five account pages now use `requirePageUser`, which redirects immediately;
   API handlers retain their strict 401/403 behavior. Two behavioral unit tests
   cover guest redirects and authenticated access.
2. **Keyboard-inaccessible desktop mega menu.** Chromium focusing Categories
   yielded `aria-expanded=false`. Added focus/blur capture and Escape handling.
   Post-fix Chromium test verifies expanded=true on focus and false on Escape.
3. **Mobile drawer dismissal.** Drawer depended on pathname changes to close,
   which does not cover category query navigation on `/shop`. Link activation
   closes it explicitly. Global Escape closes transient header menus. Chromium
   verified mobile open/Escape; same-path link dismissal was code-reviewed, not
   separately browser-tested.
4. **Local HMR connection failure.** Chromium logged WebSocket handshake errors;
   server explicitly logged blocked origin `127.0.0.1`. Added localhost and
   127.0.0.1 to the DEV-ONLY allowlist; restarted. Post-fix browser logs are empty.

The cinematic hero, generated image, typography, violet accents, editorial
collections, product cards and carousel controls remain intact.

## Executed checks

- Clean `npm ci` from the committed lockfile completed.
- TypeScript: passed. ESLint: passed with no code warnings.
- Vitest: **70 tests passed, 9 files**, including live PostgreSQL integration.
- Production build: passed, repeated after the clean dependency install.
- Database verification: 24 tables and all four migrations present locally.
- HTTP crawl: all **48 distinct internal homepage link destinations** returned
  200 (following intended auth redirects). This is route validation, not proof
  that every page's UI interactions work.
- Real Chromium against the local production build: 1440, 768, 390px widths;
  zero console/page errors, no document horizontal overflow, no broken loaded
  images at the checked positions. Screenshots captured and mobile reviewed.
- Browser interactions: keyboard mega menu + Escape, mobile menu open + Escape,
  and manual carousel advancement passed. Reduced-motion preference was enabled.
- Repeated the three-width browser load checks on the restarted development
  preview: zero errors, no overflow, no broken loaded images.
- Local HTTP API checks: catalogue and product detail reads, product image URLs,
  search response, cart add/update/remove and persistence, checkout invalid body
  422, customer registration 201, logout/login 200, account order list 200,
  customer rejection from admin mutation 403, admin login/dashboard/product and
  order pages 200, creation of an admin DRAFT product 201.
- Two local COD checkouts returned 201; independent database query confirmed
  two QA orders persisted and stock changed from 24 to 22. Test records were
  kept local; no production order, product, account or inventory was modified.
- The first admin-create harness expected 200 and failed because the correct
  response was 201; corrected the test expectation and reran successfully.
- Only `.env.example` is tracked; no real environment files committed.

## Live production / configuration

- Existing public site: https://nexvoro-neon.vercel.app/
- Public homepage and `/api/health` fetched without Vercel SSO. Health returned
  `ok:true`, `environment:production`, `database.connected:true`, source
  `POSTGRES_URL`, `supabase:true`, `auth:true`, `email:false`, payments disabled.
- `/api/products` returned `items:[]`, `total:0`: production catalogue is empty.
- Inspected Vercel variable metadata: database pooled/direct integration aliases,
  Supabase URL/keys and SESSION_SECRET are configured for production/preview.
  Sensitive metadata hides values; it does NOT establish secret strength,
  password rotation, or that the integration is the owner's intended project.
- SEED_ADMIN_PASSWORD is absent. Owner must set it securely in Vercel if safe
  empty-database initialization is desired. No destructive seed was executed.
- SMTP/email provider configuration is absent; password recovery email delivery
  is not operationally verified. CRON_SECRET and encryption-key values are hidden
  and have not been decrypted or independently validated.
- TLS certificate verification is still relaxed in the existing database client.
  Provider CA setup remains a security-hardening requirement.
- npm installation reports upstream deprecation warnings for ESLint 9 and
  transitive esbuild-kit dependencies; no checks were disabled to hide them.
- Lighthouse and Core Web Vitals are unmeasured.

## Deployment tracking

Fixes pushed and hash verified on GitHub:
`378ffc76c19cf48b55f62932050ced7b280e7664`.
Production deployment submitted to the EXISTING project:
`dpl_6LnqUWxXgsQLuAc319A46GTybiM6`.
Last checked during this report: BUILDING, installing dependencies.
Older production `dpl_EjRDPcQ9aZedC3sWTrs1LkisGAzL` is READY/PROMOTED.
Do not confuse the older public health result with proof the new fixes are live.

## Explicit limits

No claim of complete production acceptance: remote catalogue initialization,
production admin login, production checkout/orders, upload policies and signed
private downloads, password reset email delivery, all filter combinations,
full mobile focus trapping and every individual menu item interaction have not
been verified. No known production data was reset, truncated or deleted.
