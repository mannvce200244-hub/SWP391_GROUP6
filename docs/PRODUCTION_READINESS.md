# Production readiness and release procedure

This is a release contract for the existing monolith, not evidence that a live
deployment or external-provider acceptance test has passed. The 2026-10-12 audit
is recorded in `audit-production-20261012.md`.

## Current release decision

**Not ready for a public production launch of the full requested feature set.**
Automated local tests are necessary, but Gmail/GHN delivery, payment-provider
acceptance, browser acceptance and the actual hosting environment must also be
verified. Google login is proposed and awaits dependency/account-linking
decisions. SMS is not implemented because no SMS provider was selected.

The approved dependency follow-up upgraded springdoc to 3.1.1 and patched
`brace-expansion` / `source-map-js`; full npm audit reports zero vulnerabilities.
After the MoMo recheck, backend verification passes 393 tests and frontend verification passes 22
tests plus lint/build. These checks resolve the dependency findings only; see
[`audit-production-20261012.md`](audit-production-20261012.md) for evidence and
the remaining release gates.
The MoMo redirect/IPN/create-failure and login-return repairs are recorded in
[`audit-momo-recheck-20261012.md`](audit-momo-recheck-20261012.md). Real sandbox
merchant acceptance and live gateway support remain pending.

VNPay and MoMo currently support sandbox hosts only. `prod` rejects enabling
VNPay and rejects MoMo unless `MOMO_SANDBOX_DEPLOYMENT_ENABLED=true` explicitly
opts into the user-approved hosted demo with complete permanent HTTPS callbacks.
See [Vercel + Railway demo setup](VERCEL_RAILWAY_DEPLOYMENT.md). This exception
does not enable real-money payments. COD remains the implemented production payment method. Real online
payment requires merchant approval, an approved live-provider contract and
verified create/callback/query/refund behavior before it can be enabled.

## Backend configuration

1. Set `SPRING_PROFILES_ACTIVE=prod`. Review `application-prod.properties` and
   the startup checks in `ProductionConfiguration.java`.
2. Supply `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, a private random `JWT_SECRET`
   of at least 32 UTF-8 bytes, and positive access/refresh lifetimes.
3. Supply an HTTPS frontend origin without a trailing slash in `FRONTEND_URL`.
   Include that exact origin in `CORS_ALLOWED_ORIGINS`. No wildcards, paths,
   credentials, query strings, insecure origins or localhost production URLs.
4. Supply an absolute persistent `PRODUCT_IMAGE_DIRECTORY` and an HTTPS
   `PRODUCT_IMAGE_PUBLIC_BASE_URL`. Back up images with the database; do not
   use ephemeral build/container storage. Existing media URLs are stored in
   PostgreSQL and are not rewritten automatically when changing domains.
5. Configure `OTP_EMAIL_ENABLED=true`, `GMAIL_USERNAME` and a newly generated
   `GMAIL_APP_PASSWORD` outside chat/source control. Revoke the exposed SMTP
   app password and OAuth client secret. Test registration and reset delivery
   through the actual sender, including failure/retry and spam-folder handling.
   Startup checks validate presence, not provider connectivity/deliverability.
6. If GHN is enabled, use `GHN_PRODUCTION=true`, a valid production token/shop
   and configured pickup address. Validate product weights and package
   dimensions, then check fees for supported receiving addresses. Missing or
   failed GHN quotes block checkout; the backend does not fake a carrier fee.
   With GHN disabled, existing Admin shipping settings govern local fees.
7. Leave `VNPAY_ENABLED=false` and `MOMO_ENABLED=false` for a real-money release.
   The approved hosted sandbox demo may enable MoMo with the explicit opt-in
   and verified configuration above; use a separate demo database and test cards.
8. Keep development seeding disabled. Provision the first SUPER_ADMIN once
   through the existing externally configured bootstrap; remove its password
   and disable `INITIAL_ADMIN_ENABLED` after first successful startup.
9. Install a licensed TTF with Vietnamese glyphs and set
   `INVOICE_PDF_FONT_PATH`; verify a printed/exported POS invoice on the host.

The prod profile validates schema instead of changing it, forces Secure refresh
cookies, disables Swagger/OpenAPI and excludes framework error details.
Configuration checks execute before JPA initialization and data runners, reject
unsafe overrides, and report key names rather than secret values.

## Database rollout

- New empty installation: apply `migrations/20261012_initial_schema.sql`, then
  all ordered upgrades in `migrations/README.md`. The baseline inserts no
  users, products, orders, invoices or test transactions.
- Existing installation: back up, stop writes, apply only the applicable
  ordered upgrades and validate schema. Never run the initial baseline against
  a populated schema. Do not edit an already-applied shared migration.
- Check historical invalid prices/shipping values and negative stock before
  validation. New integrity upgrades stop on violations without inventing
  corrections. Validate any existing `NOT VALID` product checks after approved
  corrections; successful JPA validation alone does not validate such checks.
- Use a separate runtime database role with only required data/sequence rights;
  migration ownership/DDL rights belong to the controlled rollout account.
- Exercise backup restoration of both PostgreSQL and image storage. Retain the
  old application artifact and a documented rollback plan; rolling code back
  does not undo writes or schema changes.

## Frontend and HTTPS edge

- Serve `m4n-frontend/dist` from a production static host after lint/build.
  Do not expose the Vite development or preview server as the public service.
- `.env.production` selects `/api/v1`, overriding the local `.env` localhost
  value for production builds. The production API fallback is also `/api/v1`.
  Route that prefix to the backend on
  the same HTTPS origin. The SPA history fallback applies to frontend routes,
  never API errors or media responses. An explicit `VITE_API_BASE_URL` is a
  build-time override and must match the configured topology/CORS.
- Keep frontend/backend on the same site for SameSite=Lax refresh cookies.
  Unrelated frontend/API domains require a separate reviewed cookie/CSRF
  deployment contract; CORS permission alone does not make such cookies work.
- Terminate HTTPS at a trusted edge, redirect HTTP to HTTPS, and set HSTS there.
  Restrict direct backend/database network access. Forwarded headers are ignored
  by default; do not trust caller-supplied proxy/IP headers.
- Preserve Origin and `X-Requested-With` headers. Refresh/logout require
  `X-Requested-With: M4N`; untrusted Origin or missing header is rejected before
  session mutation. Do not cache auth responses, authenticated APIs or cookies.
- Configure edge rate/request limits for login, OTP/password reset and uploads,
  including limits per source IP across multiple backend instances. OTP already
  has per-email/purpose cooldown/send/guess limits; it does not limit sending
  to many distinct email addresses or brute-force password login globally.
  These edge limits and their behavior still need host-specific verification.
- Match multipart limits: backend accepts files up to 5 MB each and requests up
  to 52 MB, with at most ten images. Set edge concurrency/body/time limits and
  JVM memory appropriate to bounded image decoding and expected traffic.
- Verify error/access logs omit passwords, OTP, reset URLs, auth cookies,
  provider signatures and payment callback query strings. Health checks and
  alerts must detect failures without exposing secret configuration.

## Required acceptance before opening traffic

- Registration email OTP, resend, expiration and failure; login/refresh/logout;
  password reset and session revocation; inactive account and role changes.
- Selected cart checkout, unselected-item retention, accurate preview/requote,
  voucher/freeship rules and address/provider failures.
- Product create/update with upload; image persistence after restart; public
  product display and role restrictions.
- Order confirmation under concurrent stock demand, out-of-stock retry,
  cancellation restoration, delivery/receipt completion and notifications.
- POS stock deduction, invoice export/reprint, reports and Customer reviews.
- Rendered mobile/tablet/desktop UI, keyboard focus/dialog behavior, no overflow,
  feedback/retry paths, and white/cool-gray surfaces.
- Database/volume restore, TLS/cookies/CORS/edge limits, packaged startup and
  host monitoring; provider acceptance for every integration enabled publicly.

Each gate needs actual evidence. No live release was performed by this audit.
