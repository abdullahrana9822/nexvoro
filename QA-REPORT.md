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

### Final production confirmation

- Deployment `dpl_6LnqUWxXgsQLuAc319A46GTybiM6` is now **READY / PROMOTED**,
  with aliases assigned. Its application commit is `378ffc7`.
- Public homepage fetched again with `?qa=378ffc7`: contains the new
  "Extraordinary tech. Everyday possibility." hero and all four editorial
  collections. No SSO gate on these public requests.
- Public health rechecked with the same query: `ok:true`, database connected via
  POSTGRES_URL (89ms), Supabase and auth configured; email and online payments
  remain disabled. Production build logs skip all four migrations, confirming
  migration ledger is current remotely.
- `npm audit --omit=dev` additionally reports **3 high, 0 critical** findings
  through Drizzle's installed optional Prisma peer chain (`prisma` →
  `@prisma/config` → `deepmerge-ts`). Advisory: GHSA-ggr8-5vv4-36mx. The app uses
  pg/Drizzle, not Prisma. No forced dependency upgrade or audit suppression was
  applied; remediation remains open. Remote npm installation separately reported
  11 moderate findings in its full install; audit contexts/timestamps differ.
- Port 3000 remains the active development preview. Temporary production QA
  server on port 3001 was stopped after tests.

## Premium expansion — 2026-11-09

Application SHA: `457d9bc9129c456a6a8bc77e53a2a892ab7d8739`, pushed to `arena/251054a2-nexvoro`.

- TypeScript, ESLint and production build: passed.
- Vitest: 85 tests / 12 files passed, including appearance configuration, editorial safety, flagship registry and bounded recently-viewed UUID requests.
- Production-build Chromium checks: `/`, `/blog`, `/blog/choose-your-next-laptop`, `/news`, `/support`, `/recently-viewed` at 1440, 768 and 390 px: all 18 requests HTTP 200, no horizontal overflow, no page errors.
- All five flagship preference cookies persisted into server-rendered `data-theme` correctly (dark, minimal, futuristic, glass, titanium).
- Measured local navigation-to-network-idle intervals approximately 0.57–1.59 seconds in the initial run. These are harness timings, NOT Lighthouse scores, Core Web Vitals or production performance claims.
- Added database-backed journal editor, safe original evergreen guides, support hub, recent browsing history, database default theme/font/customer enablement and optional validated color overrides. Brand button foreground chosen for contrast.
- Added authenticated, same-origin, rate-limited multipart upload endpoint with sharp decoding, pixel and size limits, EXIF removal/WebP conversion and Supabase Storage output; no service credentials exposed to the browser. Supabase public image optimization allowed in Next config.
- No database migrations, production seed/reset, owner activation, production checkout mutation or storage object writes performed in this expansion. Existing commerce retained, not represented as freshly re-tested end-to-end.
- Storage bucket/policy configuration and a successful authenticated production upload remain unverified. Category/brand/banner/customer attachment upload interfaces are not part of this increment. Journal editor uses validated JSON, not a rich-text editor. Technology page is explicitly evergreen explanation, not fabricated live news.
- Vercel production deployment requested for exact application SHA: `dpl_CAGpdD2cwZRCqShVLqtWp8cLe7vy`; latest connector state at handoff: **QUEUED**, not READY. Inspector: https://vercel.com/abdullahrana9822-5855/nexvoro/CAGpdD2cwZRCqShVLqtWp8cLe7vy . Until READY and public checks succeed, this increment must not be described as live.
- Owner account activation remains deferred by the owner; follow ADMIN-ACCESS.md privately when ready. Do not use demo credentials in production.

## Interactive Theme Studio — 2026-11-09

Application commit `f4ff5e3733c30bf43e1acc0fc98c281e3c05ac80` implements `/themes`, a shared large native-dialog palette showcase, centralized configuration, token-driven mini websites, actual same-origin homepage iframe preview, comparison table, temporary preview/Apply/Cancel, personal customization and admin collection management. Five flagship themes lead the collection; four legacy choices remain for compatibility. Titanium now uses charcoal metallic surfaces.

Final checks:
- TypeScript, ESLint (no warnings), production build and `git diff --check` passed.
- 91 Vitest tests / 13 files passed. New tests cover configuration validation, disabled and duplicate themes, featured theme constraints, WCAG AA contrast, cookie parsing and token generation.
- Automated Chromium interaction checks against the final production build: preview each of five flagship themes without changing the saved theme cookie; cancel restores original; Apply plus refresh persists all five; custom primary color saves and survives refresh; invalid text contrast is blocked.
- `/themes` and palette modal tested at 1440/768/390px: no document horizontal overflow; modal opens, Escape closes. Native dialog provides focus containment and focus returns to trigger on close.
- Saved Titanium theme present across homepage, shop, cart, checkout, account, blog and contact (HTTP 200 each). No page exceptions/hydration errors observed by pageerror listener. This is not a full five-themes-by-every-route visual matrix or fresh purchase/account regression.
- Desktop screenshot inspected: editorial typography, fanned miniature theme worlds, distinct full-size live-token cards and header navigation render correctly.
- No schema migrations or production data mutations. Admin persists through existing PostgreSQL settings/audit endpoint with ADMIN authorization and same-origin validation. Production authenticated admin saves were NOT executed because owner activation remains deferred. Per-theme advanced token configuration uses a validated JSON editor; collection names/descriptions/availability/featured theme have dedicated controls.
- Customization exposes primary/accent/background/surface/text, radius, button treatment, self-hosted font and motion. Background/surface text contrast enforced at 4.5:1, button foreground derived from luminance. Reduced-motion system preference overrides studio animation. Personal settings do not write global DB configuration.
- Production release requested for exact application SHA: `dpl_GSVpPUGp656MAaCLxkp9njq7sHDH`. Latest verified Vercel state **QUEUED**, not READY. Do not claim this build is live until READY plus public `/themes` verification. Inspector: https://vercel.com/abdullahrana9822-5855/nexvoro/GSVpPUGp656MAaCLxkp9njq7sHDH .

## Complete-store upgrade increment — verified local checks

Application commits: `430780a` animated worlds/auth/catalogue; `e3dc8ed` mobile dashboard fix; `ef29bf5` private production provisioning support.

- TypeScript, ESLint (no warnings), production build and diff whitespace checks passed. Vitest: **96 tests / 14 files passed**.
- Additive migration 0004 tested against isolated local PostgreSQL databases. No production reset/drop/delete operations.
- Isolated local production-build HTTP/browser test passed: username login, required password-change redirect, admin API 403 before change, password replacement, admin dashboard access, import 30 drafts/10 categories, second import creates zero duplicates, no fabricated reviews, one LOCAL QA product published, cart add, wishlist, COD checkout 201, stock decrement 5→4, logout, old password rejected, new password accepted.
- 1440/768/390px checks: homepage, experiences, smartphone collection and logged-in admin dashboard all HTTP 200 without horizontal overflow. Browser observed zero page errors. Floating transforms changed over time; emulated reduced motion disabled floating animation.
- Additional local navigation audit: 31 internal homepage links HTTP 200 (following expected auth redirects); ten authenticated admin pages at 390px HTTP 200 without horizontal overflow: dashboard/products/categories/inventory/orders/customers/coupons/banners/homepage/appearance. This is NOT a claim that every interactive control or all integrations were retested.
- A real mobile dashboard grid overflow exposed by order data was fixed at the grid-track level; tables retain their own horizontal scrolling.
- Production public `/experiences` and `/admin/login` fetched successfully without a protection challenge. Public health reports database connected (POSTGRES_URL), onlinePayments=false and email=false.
- Temporary sensitive production-only provisioning configuration was supplied through Vercel, not committed to the repository. A production build is explicitly authorized to inspect counts/conflicts, create one owner without replacing existing credentials, import only unpublished review drafts, verify actual login/mandatory-change guard/logout/session revocation, and emit status-only evidence. Creation and production smoke results must be checked in that build's logs before claiming success; variables must then be removed.
- Thirty catalogue entries are merchant-review candidates, not verified sellable inventory. No invented prices, stock counts or reviews are published. Original category illustrations are clearly identified as illustrations, not photographs of the named products. Supplier/variant verification, approved price/stock/warranty and licensed exact-product photography remain outstanding before publication.
