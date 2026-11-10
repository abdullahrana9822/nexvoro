# Owner-only Super Admin activation

## Access details

- Setup: https://nexvoro-neon.vercel.app/admin-setup
- Login: https://nexvoro-neon.vercel.app/login?next=/admin
- Account email: **admin@nexvoro.com**
- Role created: **SUPER_ADMIN** (inherits all ADMIN/STAFF permissions).
- Password: chosen privately by the owner on the HTTPS setup page; never sent in
  chat, generated as a public default, committed, or printed by the application.

## Activate securely (one owner action is required)

There is no dedicated secret-delivery channel in this conversation. Therefore
we use the requested password-setup alternative, NOT a password in chat.

1. On your OWN computer, in an up-to-date checkout of this branch, run:

   ```sh
   node scripts/create-admin-setup.mjs
   ```

   This creates `.admin-setup.json` with owner-only file permissions. It refuses
   to overwrite an existing file. The TOKEN is only in that ignored file; the
   terminal prints only its SHA-256 digest and a one-hour expiry. Do not send
   the token/file/password to this chat or commit them.

2. In **Vercel → existing nexvoro project → Settings → Environment Variables**,
   configure the printed `ADMIN_SETUP_TOKEN_SHA256` and
   `ADMIN_SETUP_EXPIRES_AT` for **Production only**. Do not use NEXT_PUBLIC names.
   Redeploy the current application commit using those variables. The window is
   one hour from generation; regenerate if it expires before setup.

3. Open the HTTPS setup URL above. Read the `token` from the private file on
   your own machine and enter it in the owner-token field. Choose and confirm a
   unique password of at least 20 characters containing uppercase, lowercase,
   number and symbol; save it in your password manager. Submit.

4. A successful 201 response confirms the real database transaction committed
   both the SUPER_ADMIN user and its audit record. Then follow the sign-in link
   and log in with admin@nexvoro.com and YOUR chosen password. The normal session
   system—not a frontend bypass—grants dashboard access.

5. After verifying dashboard access, delete the private token file, remove both
   setup environment variables from Vercel, and redeploy. Removing setup config
   does not remove the account; the user persists in PostgreSQL across deploys.
   Subsequent setup attempts are refused when a SUPER_ADMIN already exists.

## Failure handling

- **403**: setup disabled/expired/token invalid. Check both server-only variables,
  Production target, new deployment, and expiry. Do not put the token in a URL.
- **409 / already complete**: sign in normally; setup never resets an existing
  Super Admin password. Use authorized recovery if needed.
- **409 / admin email exists**: an authorized database owner must review that
  account. This flow deliberately does not promote an arbitrary existing user
  or overwrite an existing password.
- Never use the demo seed to create this account. No truncation or seed is
  required, and the setup flow never modifies catalogue/orders.

## Actual verification

TypeScript, ESLint, build passed; 78 tests passed. Tested against a dedicated
LOCAL PostgreSQL database (not production): first bootstrap 201, invalid token
403, repeated bootstrap 409, one stored account with SUPER_ADMIN, is_active=true,
verified bcrypt hash, real login 200 reporting SUPER_ADMIN, logout 200, and
successful authenticated page reads for dashboard/products/categories/inventory/
orders/customers/coupons/banners/homepage/settings/roles. The initial test used an
incorrect /admin/content URL; corrected to the actual /admin/homepage route.

Production account creation and live authenticated login are NOT confirmed:
the owner must first configure the digest/expiry and choose the password. No
production password or bootstrap token was generated or exposed in this session.
This account flow does not establish that image uploads or every admin mutation
has been tested; those remain separate feature acceptance checks.

## Deployment record

Application commit: `f2a4c77`. Latest test commit: `a5fb0f5`. Production deployment
submitted: `dpl_ZyKthbzYDPdgMHBvawnTKMXwMXAS`. Last observed BUILDING.
The owner-token environment variables have intentionally NOT been generated on
this shared machine or configured with a value visible to this conversation.
The production account is pending owner activation; no live login success is
claimed. After activation, `/api/auth/session` can be inspected in your own
authenticated browser to confirm the stored role without exposing the password.

Final status: deployment `dpl_ZyKthbzYDPdgMHBvawnTKMXwMXAS` is READY/PROMOTED.
Public `/admin-setup` was fetched successfully and displays the protected owner
password form. The owner explicitly chose “I'll activate it later”, so setup
remains disabled until they privately configure the digest/expiry and submit.
No production Super Admin account or live authenticated login is claimed.
