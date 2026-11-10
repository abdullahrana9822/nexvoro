# NEXVORO launch handoff

## Owner creation — production verified

The application now supports username sign-in at `/admin/login`, dashboard at
`/admin/dashboard`, bcrypt password hashing, and mandatory temporary-password
replacement at `/change-password`. Privileged API guards and the entire admin
layout reject accounts whose mandatory-change flag is still set. Password change
revokes old sessions and rotates the current session.

Production owner creation was executed through a short-lived, explicitly authorized
Vercel production build using sensitive environment fields. The database connection
never left Vercel. Deployment `dpl_9EXyn4BZiHaac8A6XR9vjSxB7q1B` logs confirm
committed creation and real HTTP username login 200 / SUPER_ADMIN role / required
password-change guard 403 / logout 200 / revoked session 401. Username:
`nexvoroforabdullah`; account email: `admin@nexvoro.com` (the previously designated
owner identity). Sign in using the temporary password supplied by the owner, then
choose a new private password. The production password has NOT been changed by
the assistant. All three temporary provisioning variables were deleted afterward.

The following private CLI instructions are for recovery/provisioning in a new
environment only. They refuse to replace an existing owner:

From a trusted private terminal with the securely rotated production connection:

1. Inspect the production host/database and existing users; preserve all data.
2. Run `npm run db:migrate` (0004 adds nullable username, a case-insensitive unique
   index and a mandatory-password-change flag; no rows are deleted).
3. Supply `OWNER_USERNAME`, `OWNER_EMAIL`, `OWNER_TEMP_PASSWORD` through a private
   secret manager/environment, plus `CONFIRM_PRODUCTION_OWNER=CREATE_ONCE`.
4. Run `npm run admin:provision`. It refuses to overwrite an existing Super Admin
   or conflicting username/email. It never logs credentials.
5. Remove the temporary provisioning variables, sign in at `/admin/login`, and
   replace the temporary password immediately. Test dashboard access and logout.

Use the username requested by the owner. An email is also required by the
existing authentication schema; confirm an owner-controlled email rather than
inventing a mailbox. The temporary password shared in conversation is exposed;
prefer a privately generated replacement. No password from the conversation is
stored in Git or source code.

## Catalogue: 30 merchant-review drafts, not live offers

The admin Products page has an additive, idempotent import action for thirty named
products across ten requested categories. It inserts real database records with
DRAFT status, zero stock, zero placeholder price and no invented reviews. Existing
products, prices, inventory and orders are never overwritten. The endpoint needs
an ADMIN-or-higher session, same-origin requests and rate limits.

These are preparation records, not a verified opening inventory. Every candidate
explicitly identifies the original category illustration as an illustration,
not a photograph of the named branded product. Before publishing:

- Verify supplier stock, exact variant, specifications, selling price and warranty.
- Upload licensed photographs of that exact SKU using the existing upload tool.
- Add real shipping/payment policies and confirm refund/support operations.
- Publish only after review. Customer ratings start at zero and come from reviews.

The authorized production deployment imported all 30 records (imported=30, skipped=0). They remain DRAFT: zero of these new products are published for sale.

## Visual worlds and performance

`/experiences` presents ten art-directed collection worlds with functional category
links: future tech, black/silver, cyberpunk, minimal white, gaming, workspace,
smartphones, audio, smart home and metallic showroom. Four are featured on the
homepage; category shop pages use a matching world. The hero now changes real
headline/subtitle content with its carousel, uses scroll-linked photographic
parallax and an animated illustration. Motion includes in-view reveals,
pointer-driven perspective, floating objects, route fades and product-card hover.
System reduced-motion preference disables the decorative motion. Existing
Theme Studio and all commerce flows are retained.

No claim is made that every requested feature, manufacturer photography,
production owner access or live payment integration is complete. Online payment
requires a real gateway adapter, keys and verified callbacks, not just env names.
