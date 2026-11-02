# Audit: authentication, catalog, support, and administration

Date: 2026-10-10. This records the changes owned by the security/catalog audit
agent; commerce and customer-flow findings are recorded in their own audit files.

## Coverage and fixes

| Area inspected | Confirmed defect | Change |
| --- | --- | --- |
| Refresh lifecycle | Reuse revocation rolled back with authentication failure; concurrent refresh could consume the same token or escape password/logout-all revocation | Lock the user before token rows for issuance/rotation/revocation; commit security revocation despite `401`; PostgreSQL cross-operation regressions |
| Password reset | Raw reset URLs/tokens were logged and delivery lacked a provider; concurrent token consumption was unsafe | Optional configured Resend delivery, uniform unavailable `503` before account lookup, generic account-independent acceptance, provider failure rolls back new token/invalidation, and single-use reset locking |
| Password change and staff creation | Wrong current password returned an authentication error; Unicode passwords could exceed BCrypt's byte limit despite passing character validation | Safe validation `400`, preserve the current session on an incorrect password, reject more than 72 UTF-8 bytes without truncation |
| Admin user mutations | Disable/reactivate accepted missing versions; returned versions could be stale; inactive Super Admins were treated as active survivors | Require optimistic version input, flush before mapping, guard only active last Super Admins, and validate operator state/role |
| JWT and configuration | Known signing/database/password fallbacks, broad filter exception swallowing, account identity tied only to email, old access tokens survived global session revocation | Require external secrets; match user ID, role and dedicated authentication generation; reject missing expiry/generation; catch only invalid-authentication exceptions |
| Windows setup | Maven wrapper indexed `.m2` link metadata when `.m2` was an ordinary directory | Guard missing link targets; Windows wrapper version and builds verified |
| Development fixtures | Normal startup inserted sample commerce data; repeated seeding overwrote edited product media/barcodes | Development fixtures opt in, require a configured password, preserve existing products, and never log passwords |
| Startup schema errors | Broad catches hid role/order constraint migration failures | Preserve existing SQL and fail startup immediately if it fails; versioned production migrations remain a team decision |
| Product editing | Product fields and gallery were saved through separate calls, allowing partial success | Save the optional complete gallery in the existing product PUT transaction, enforce ownership/duplicate IDs, and serialize media writes on the product |
| Product display and validation | Videos could become catalog thumbnails; decimal prices were truncated in the form; backend rejected approved zero prices | Choose first image for summaries, preserve decimals, accept nonnegative price, and preserve full detail gallery |
| Low inventory warning | Product-specific approved threshold was absent and UI hardcoded `5` | Optional nonnegative `lowStockThreshold`, create default `5`, preserve omitted updates, use server availability in Admin and customer flows |
| Support messages | Reading one page marked unseen messages read; page 0 stopped showing new messages after a long conversation; concurrency tests altered seeded users' conversations and leaked notices | Newest-first stable paging, older pages retained, mark only returned incoming messages read; isolate test users and delete only tracked fixtures; guards retained |
| Unavailable chat staff | Open assignments remained attached to disabled/demoted staff and stale service reads could claim/message after administration changes | Release only OPEN assignments under BR-CHAT-02 in the same administration transaction; lock active actor before conversation; preserve closed history/messages |
| Optional online payment/refund | VNPay was unavailable and no verified persisted provider/refund lifecycle existed | Sandbox-only signed backend-owned payment attempts, idempotent callbacks, explicit pending/full refund and reconciliation; inventory/fulfillment remain separate |
| Initial administrator | Secure normal startup had no provisioning path | External opt-in SUPER_ADMIN bootstrap serialized on role; never elevate/overwrite/reactivate an existing account |
| Product reviews | Public detail downloaded the full list and lacked database paging/global rating summary | Add bounded stable page API with whole-product aggregate; preserve legacy array, reuse pagination and prevent stale-page/eligibility display |
| Sorting | Arbitrary persistence paths were accepted; notification static ordering overrode explicit sort | Feature-specific sort allowlists with safe `400`; support order is fixed; notification Pageable sorting is respected |
| Artisan/village management | Count queries and village lazy loading ran once per row | Grouped product/artisan count queries and an Artisan village entity graph, preserving the current HTTP contract |
| Admin forms and notices | Stale hidden-modal state, missing focus/Escape handling, duplicate submissions, silent master-data failures, false clipboard success, fractional stock silently truncated | Mount dialogs while open, reuse dialog focus hook, block pending mutations/closing, explicit error/retry, await clipboard, validate integer stock input |
| Admin user UI | Every `409` was treated as a stale version; failed reload closed the recovery dialog; large route mixed all forms/table rendering | Interpret only stale-version codes as reload conflicts, preserve failed reload, confirm account status changes, split staff/detail/table views and secure password generation |
| Standalone categories | Success tried to close through a pending guard, leaving the form open | Close directly after successful save, preserve failures, and align validation with backend fields |

No dependencies were added. Controllers remain HTTP transport boundaries.

Apply `docs/migrations/20261010_user_session_version.sql` before deployment to
backfill the new authentication generation on existing users. Existing JWTs
without that claim are rejected; an active refresh session can obtain a new JWT,
otherwise re-login is required. Editing contact data does not change the
generation. Password changes, resets, logout-all and role/
disable transitions revoke both refresh sessions and previously issued access
tokens. The single-session logout endpoint retains its approved refresh-cookie
revocation behavior.

## Verification evidence

- Windows `mvnw.cmd -version`: PASS, Maven 3.9.16 / Java 21.
- First security/catalog target: 98 tests, zero failures/errors, production and
  test compilation PASS.
- Expanded target: 105 tests. The 90 non-ProductService cases passed, including
  all five ProductGalleryIntegration tests; three existing media unit fixtures
  still mocked the former existence query. Those fixtures were updated for the
  product lock, and the ProductService target rerun passed all 15 tests. The
  parent's final full Maven run is the final combined gate.
- Final authentication/support target after common-user locking and generation
  validation: **53 tests, zero failures/errors, BUILD SUCCESS**. This includes
  15 lifecycle integration cases: rotation held uncommitted while logout-all,
  password change, reset or disable waits on the real PostgreSQL lock; old-
  password login during a password change; old Bearer rejection after password,
  reset, logout-all and management transitions; contact edits preserving login.
  It also includes all seven isolated Chat concurrency cases. Both 224 main and
  36 test sources compiled. A first run exposed a convenience-login interface
  default method bypassing the transaction; that method is now implemented in
  the transactional service and the complete 53-test rerun passed.
- Meaningful added coverage: persisted refresh reuse revocation, simultaneous
  refresh/reset consumption, version usable for the next Admin mutation,
  gallery persistence/order, foreign-gallery rollback of both product and media,
  omitted/empty gallery, zero/negative price, per-product/zero inventory
  threshold, Unicode password byte limit, unsupported catalog sort, paged
  chat read state and latest-message order, malformed request safety.
- Completion target: **126 tests, zero failures/errors, BUILD SUCCESS**. Both
  283 production and 46 test sources compiled. This includes Resend request/
  signature sanitization, reset failure rollback, bootstrap guards, 13 payment
  cases (simultaneous URL creation/IPN, provider mismatch, pending/refund timeout,
  pre-provider pending commit, no duplicate outbound refund), and 10 Chat
  PostgreSQL cases including disable/demotion release and in-flight staff claim
  blocked by the same user lock used for account administration. Stock7,
  Order5, Cart5 and Article8 integration cases also passed in that command.
  Two initial attempts exposed a stale deleted notifier class in incremental
  output and the missing Boot 4 RestClient builder bean. Exact stale output was
  removed; a prototype builder using existing Spring Web was added; rerun passed.
  The subsequent 134-test pricing target passed the expanded 16 payment cases
  and all nine Review unit/pagination cases, including stale refund-response
  replacement protection and unknown-result pending behavior. The final two
  provider-query authorization/type regressions (payment target now18) and
  pending-payment cancellation integration are included in the final evidence
  recorded in [audit-completion.md](audit-completion.md).
- Product review section/form/card/service targeted ESLint: PASS after paging
  integration. Main orchestration is 147 lines, form state owns its 78-line
  component and repeated review presentation owns its 26-line card component.
  Existing pagination, editorial heading, neutral surfaces, named controls,
  fieldset/legend rating group, announced loading/errors and preserved failed
  form input were reviewed. Root supplies rendered browser verification.
- Read-only peer integrity review of product/shipping pricing confirmed bound
  queries, backend calculation, strongest/tie precedence, optimistic versions,
  thin administrative RBAC and entity/migration parity. The owner fixed the
  discovered offset-overflow `500` and first-use shipping quote attempting
  singleton initialization inside a read-only checkout transaction. Shipping
  now treats absent configuration as the approved disabled zero fee without
  writing. The final combined gate includes those regressions.
- ESLint for all ten edited Admin pages/modals: PASS. After extracting the
  account views/password helper, their targeted lint and production build also
  passed. `npm run build` uses the existing Vite configuration.
- Browser checks are performed by the parent agent. Before the final account
  extraction, it verified Admin product create at 375 px without horizontal
  overflow and inspected the nested management failure/retry state. Parent
  verification supplies final browser evidence for nested Escape/focus and
  account workflows; do not infer browser success from lint/build.
- Integration tests used the existing configured local PostgreSQL database;
  new authentication, gallery and Chat tests create isolated records and delete
  their own records. Six matching leaked Chat pagination notifications, six
  messages and three closed test conversations were backed up and removed by
  exact IDs; existing accounts and other data were preserved. Dedicated
  disposable database configuration remains recommended.

## UI/accessibility audit anchors

- `m4n-frontend/src/components/admin/ProductFormModal.jsx:174`: associated field
  labels, inline validation, master-data readiness, stable decimal values,
  threshold validation, pending fieldset and atomic gallery payload.
- `m4n-frontend/src/components/admin/*ManagementModal.jsx`: dialog focus,
  Escape/restore, safe pending state, explicit load failures/retry, field labels,
  and no fabricated empty-state success on fetch failure.
- `m4n-frontend/src/components/admin/AdminStaffCreateModal.jsx:18`: labelled fields,
  pending fieldset, status output, bounded scrollable dialog.
- `m4n-frontend/src/components/admin/AdminUserDetailModal.jsx:21`: labelled fields,
  pending state, accessible role control, responsive status controls.
- `m4n-frontend/src/pages/admin/AdminUsersPage.jsx:194`: stale-version-specific
  recovery, explicit list failure, controlled status confirmation.
- `m4n-frontend/src/pages/admin/AdminInstrumentsPage.jsx:79` and
  `m4n-frontend/src/pages/admin/AdminProductDetailPage.jsx:101`: integer stock handling, focus-managed dialogs,
  server-derived low-stock state, accurate clipboard notice.

## Decisions and remaining gaps

1. Resend and VNPay sandbox provider contracts and secure optional adapters are
   implemented in `EXTERNAL_INTEGRATIONS.md`. The user has no provider accounts/
   credentials, so actual email delivery, sandbox IPN reachability and live
   refund verification remain deployment checks; local tests make no live calls.
2. Root completed approved artisan/village discovery pagination and detail
   contracts in `DISCOVERY_CONTRACT.md`; the final shared gate owns verification.
3. Article/Guide contract and backend/UI are now implemented by the content owner
   in `CONTENT_CONTRACT.md`. All eight Article integration tests passed in the
   126-test completion target.
4. BR-CHAT-02 is approved and implemented: only open assignments are released,
   closed history is retained, and no staff autoassignment is introduced.
5. `PRICING_CONTRACT.md` now explicitly defines product money precision/limits,
   product/shipping promotions and rounding. The pricing/commerce owners own the
   subsequent integration and final regression gate.
6. Initial SUPER_ADMIN external opt-in provisioning is implemented; deployers
   must supply the initial private credentials, then disable and remove them.
7. PostgreSQL/JPA `update` remains development setup. Startup constraint DDL
   was removed; normal startup performs no ALTER TABLE and deployment uses validate.
   Explicit rollout scripts/order and schema validation are documented in
   `migrations/README.md`; a packaged migration engine and initial production
   baseline remain unselected. No migration dependency was added.

## Large-file review

Large file detected: `m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ProductServiceImpl.java` (544 lines).
Catalog queries and Admin media commands have a natural separation; this audit
keeps the existing service contract and repairs correctness without introducing
another service layer during cross-module fixes.

Large file detected: `m4n-backend/src/main/java/com/m4n/backend/config/DataSeeder.java` (853 lines).
Role setup and opt-in fixture datasets can be separated when the deployment
bootstrap/migration decision is made. Production sample seeding and overwriting
existing media are fixed now.

Large file detected: `m4n-frontend/src/pages/admin/AdminUsersPage.jsx` (676 lines).
The former approximately 1,300-line route was split along real form/table/secure
password boundaries. Remaining route state and API orchestration still warrant
review; the split is not a new global form abstraction.

Large file detected: `m4n-frontend/src/pages/admin/AdminInstrumentsPage.jsx` (967 lines).
Its product table and import/issue dialogs are natural future view boundaries.
This audit retains the established Admin workflow while repairing validation,
state lifetime, errors, and accessibility; the size remains explicit technical
debt, not a claim that the route architecture is fully repaired.

Large file detected: `m4n-frontend/src/components/admin/ProductFormModal.jsx` (938 lines),
and the three management modals (461–498 lines). Product gallery and master-data
forms/list panels have natural component boundaries. They remain focused on the
existing editing workflows; no speculative universal modal was introduced.

Large file detected: `m4n-frontend/src/pages/admin/AdminProductDetailPage.jsx` (647 lines),
`AdminCategoriesPage.jsx` (646 lines). Stock-import and category form views are
natural future extraction boundaries; current correctness fixes are verified
without changing the feature contract.
