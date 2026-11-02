# M4N audit and repair — 2026-10-10

The tables below retain **phase 1** verification (234 backend tests). The user
then requested implementation of the remaining gaps. See
[completion and final verification](audit-completion.md) for phase 2; phase 1
counts are not evidence for the later code.

## Plan

1. Read scope, business rules, engineering, architecture, API, UI and verification rules.
2. Inspect every application source area and compare the frontend with backend contracts.
3. Repair demonstrated defects in small groups: authentication/RBAC; orders/cart/inventory/POS; customer flows; Admin/Staff UI; chat/notifications; shared accessibility and feedback.
4. Add regression coverage for business and security defects using the existing Maven test stack.
5. Run frontend lint/build, backend compile/tests and available browser checks.
6. Review changed files, remove temporary artifacts and record verified fixes and unresolved decisions for the final reviewer.

## Baseline

- The supplied workspace has no Git metadata. Original frontend/backend source copies were saved outside the project in the local temporary directory before implementation for comparison.
- Frontend baseline `npm run lint`: passed.
- Initial backend `mvnw.cmd test`: wrapper failed with `Cannot index into a null array`; the wrapper repair is tracked in the backend security audit.
- No frontend automated test script/framework is configured. No dependency is added by this audit.

## Responsibility and evidence

- [Backend commerce audit](audit-commerce-backend.md): orders, cart, inventory, POS, vouchers, reviews, dashboards and invoice PDF.
- [Backend security and master data audit](audit-security-backend.md): authentication, authorization, user management, support, notifications, catalog/master data and backend configuration.
- [Customer frontend audit](audit-customer-frontend.md): authentication, catalog, cart, checkout, profile and customer order flows.
- [Operational/shared UI audit](audit-operational-ui.md): Admin order/voucher/inventory/invoice views, POS, notifications, dialogs, responsive checks and screenshots.
- [Application source manifest](audit-source-manifest.md): changed/added/removed source paths compared with the original local snapshot, with final line counts.

## Decisions recorded during phase 1

- Resolved with the user's delegated decision: manual/automatic promotions use a shared product subtotal, additive discounts, VND `HALF_UP` rounding and a subtotal ceiling. In phase 2 the supplied product/shipping extension was approved and recorded in `PRICING_CONTRACT.md` and `PROJECT_SCOPE.md`.
- Several architecture/design/form documents retain descriptions of the scaffold that conflict with implemented feature contracts or newer rules. Repairs follow explicit business rules and implemented approved boundaries; this audit does not silently approve new contracts or dependencies.

## Phase 1 verification

| Gate | Command / evidence | Result |
| --- | --- | --- |
| Frontend lint | `npm run lint` | PASS, zero errors/warnings |
| Frontend production build | `npm run build` | PASS, 2,038 modules; initial JavaScript 320.83 kB (93.56 kB gzip) |
| Native frontend regressions | `node --test tests/apiClient.test.mjs tests/chatMessages.test.mjs` | PASS, 12 tests; no failures/skips |
| Final Auth/Chat target | Existing Maven targets described in security audit | PASS, 53 tests; zero failures/errors |
| Final commerce concurrency target | `PosServiceTest,OrderInventoryConcurrencyIntegrationTest` | PASS, 15 tests; zero failures/errors/skips |
| Combined backend test/package | `mvnw.cmd verify` | PASS, 234 tests across 36 suites; zero failures/errors/skips; executable JAR packaged |
| Browser verification | Authorized local sample Admin/POS/Online Staff/Customer accounts; widths 375/768/1440 | Representative flows verified; exact matrix and limitations in operational UI audit |

The combined final run completed at 21:24 on 2026-10-10 (local time), after the
authentication/POS regressions and final validation/history fixes. Surefire XML
totals independently agree with Maven's 234-test summary. The first restricted
run could not access Maven artifacts; the permitted rerun above succeeded with
the existing local Maven cache and PostgreSQL. No dependency/version change or
disabled lint/test rule was introduced.

## Database and deployment notes

- Apply [`20261010_order_notes_text.sql`](migrations/20261010_order_notes_text.sql)
  on existing PostgreSQL databases before deploying the longer order-note
  mapping. The local migration preserved all existing notes.
- Apply [`20261010_user_session_version.sql`](migrations/20261010_user_session_version.sql)
  before deploying authentication session invalidation. Existing JWTs without
  the session-generation claim are rejected. A valid refresh session can obtain
  a new JWT; otherwise the user must log in again. Contact editing does not
  invalidate sessions.
- Supply `DB_PASSWORD` and `JWT_SECRET` externally. Development account/data
  seeding is opt-in and requires its own configured fixture password. See
  [`DEVELOPMENT_GUIDE.md`](DEVELOPMENT_GUIDE.md).
- Regression fixtures are scoped and cleaned by their tests. Exact leaked
  audit fixtures and the temporary browser cart item were removed without a
  wholesale database reset. Saved original source and fixture backups remain
  outside the project for recovery; review artifacts remain under `docs/`.
- The final Customer test session was logged out, temporary viewport override
  reset, and the audit-started Vite/JAR processes stopped after verification.

## Phase 1 gaps and phase 2 resolution

The user authorized completing these gaps. Their current implementation and
verification are tracked in [audit-completion.md](audit-completion.md):

1. Resend email delivery and VNPay sandbox payment/refund are implemented with
   external configuration and synthetic provider tests. Live delivery/payment
   still requires the provider accounts/keys the user does not yet have.
2. Cultural Articles/Guides and stock drafts/confirmation/QC now have approved
   contracts, persistence, API, UI and regression coverage.
3. Public discovery, Admin vouchers and product reviews use database pagination
   and server filtering; existing reference APIs remain compatible.
4. Product promotions, shipping/freeship and separate ship vouchers follow the
   approved pricing contract with immutable transaction snapshots.
5. Opt-in initial SUPER_ADMIN, explicit migration rollout, Unicode font handling,
   price precision/money bounds and unavailable-staff chat release are implemented.
   Production configuration and rollout remain operator actions.

Physical-camera success, every browser/zoom combination, a full screen-reader
session and real external delivery/payment are unverified. No order, account or
completed sale was created through the browser during this audit.

## Suggested final review order for Claude

1. Read the resolved business rules and the source manifest with the module
   instructions. The workspace has no Git diff; compare against the retained
   original snapshot where needed.
2. Inspect authentication lock ordering/session-generation revocation, inventory
   lock ordering/all-or-nothing rollback, online lifecycle, and promotion quota /
   rounding / cap regressions first.
3. Compare frontend service DTOs with backend contracts, then review stale async
   responses, pending guards, notification synchronization and dialog focus.
4. Check the evidence and remaining gaps above. Reports distinguish static,
   mocked, PostgreSQL and browser verification; none proves an entirely bug-free
   production system.
