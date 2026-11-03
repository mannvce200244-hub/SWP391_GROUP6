# POS customer attribution — 2026-10-22

## Approved behavior and implementation

User explicitly approved phone-based showroom profiles without login rights.
BR-POS-01 and scope now record this decision. Names search existing CUSTOMER
accounts and showroom profiles; the cashier selects the intended record. Names
alone never merge people or create a User. With an unselected phone, the backend
links exactly one matching CUSTOMER account or reuses/creates a phone-unique
showroom profile. Ambiguous account phones require selection. Empty fields are
guest sales. Existing customer details and historical invoices are not rewritten.

Input → validate customer selection/phone and authoritative bill → successful
CASH or verified MOMO settlement → invoice transaction attaches customer and
creates a profile if needed → return invoice IDs and immutable name/phone snapshots.
New profiles have no credentials, email verification or login permissions.
MoMo creation validates before allocating an intent, and never creates a profile.
Persisted legacy name-only MoMo bills remain guest snapshots when settled.

### Files and boundaries

- Backend: new PosCustomer entity/repository, customer search response records,
  PosCustomerService interface/implementation; selected IDs on sale request and
  response, customer relations on Invoice; integration into PosServiceImpl and
  PosMomoPaymentServiceImpl; thin GET /pos/customers transport in PosController.
- Frontend: PosCustomerFields owns debounced search/results and cleanup;
  PosDashboardPage owns selection and payment payloads. posService carries search
  and cash-sale selection. Editing customer fields clears selected IDs. Resetting
  the bill hides old search results. Known preallocation 400/404 responses remove
  the unused MoMo ID; unknown outcomes still require reconciliation.
- PostgreSQL: additive 20261022_pos_customers.sql with unique phone, valid phone
  check, foreign keys, exclusive customer links, customer invoice indexes. Atomic
  parameterized INSERT ON CONFLICT is limited to concurrent profile creation.
- Source-of-truth updates: PROJECT_SCOPE, BUSINESS_RULES, DATABASE_GUIDE,
  FORM_VALIDATION_RULES, API_CONTRACT_RULES and migration README.
- Tests: PosCustomerIntegrationTest; expanded PosMomoPaymentIntegrationTest;
  constructor fixtures in PosServiceTest/CrossChannelInventoryIntegrationTest;
  native frontend posCustomerService.test.mjs. No dependencies added.

Large file detected: m4n-frontend/src/pages/PosDashboardPage.jsx (831 lines).

Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/PosServiceImpl.java (580 lines).

Both files were already oversized. Search UI/state is extracted into the focused
PosCustomerFields component; customer resolution/persistence into its own service.
Existing payment, pricing and inventory orchestration stays in place. Further
unrelated decomposition remains technical debt.

## Verification

- npm run lint: passed after temporary harness removal.
- npm run build: passed.
- node --test tests/*.test.mjs: 68 passed; no failures/skips.
- Maven full suite: 502 passed; no failures/errors/skips. The first verify reached
  packaging but the old running Java process held the JAR on Windows. After
  terminating that specific process, mvnw -DskipTests verify packaged successfully.
  No dependency/build configuration changed. Restricted Maven network execution
  initially failed; permitted network execution used existing declared versions.
- 8 customer integration tests additionally passed with Hibernate ddl-auto=validate
  after repeat migration execution. This confirms the upgraded schema works with
  validation instead of relying on Hibernate update.
- Integration tests used only disposable m4n_pos_customer_test_20261022, explicitly
  selected through DB_URL. No tests ran against m4n_db.
- Covered new/reused profile without User creation, exact account phone, ambiguous
  phones and explicit choice, name-only rejection, selected account without phone,
  guest sale, mismatched phone/both IDs, staff selection rejection, stock rejection,
  concurrent sales, protected bounded search and absence of email/password exposure.
- MoMo tests cover no profile on creation/failure, one profile on idempotent verified
  completion, invalid customer rejection before gateway call, and completion of
  legacy name-only intents without losing the payment. Existing refund/cancellation,
  stock concurrency and email receipt tests remain passing.

## Browser and UI acceptance

Actual PosDashboardPage, PosCustomerFields, ToastProvider and receipt UI were
rendered in a temporary local harness with synthetic auth and all fetch calls
intercepted. No real sale or provider charge was created through the browser.

- Search by name and phone, choose a result, canonical fields and selected feedback.
- Cash sale sends customerId=12; success receipt and new-sale reset verified.
- MoMo nested sale sends the selected ID. Synthetic backend400 leaves inputs
  editable and does not lock the bill to a nonexistent payment intent.
- Editing phone clears the previous ID. Name-only submission focuses the phone and
  displays its associated inline error. Enter activates a search result.
- White/cool-gray surfaces; existing design tokens and shared Input primitive.
  Visible labels, semantic result buttons, native keyboard interaction, explicit
  focus styles, aria-live search feedback, bounded results, loading/empty/error/retry
  states, disabled parent fieldset and existing submission guard preserved.
- Desktop screenshot inspected. Responsive checks at390 and768 CSS pixels showed
  document scrollWidth375 and753 respectively, no horizontal overflow. Input grid
  stacks on mobile; selection wraps. Viewport override reset afterward.
- New search effect debounces250ms, ignores stale responses and cleans timers;
  no memoization, dependency or cross-feature context added. Backend controls
  customer identity, permissions, stock and invoice transactions.
- UI/UX and React skills applied. Final accessibility review used current
  https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
  and resolved labels/names, focus/error association and long-name wrapping.
  No new animations/media/tables/navigation were introduced; those checklist items
  are N/A. Existing POS layout and receipt dialog were not redesigned.
- Evidence: customer-selected.png, customer-mobile.png, cash-payload.json,
  momo-payload.json. User tabs were preserved; temporary harness/tab removed.

## Local rollout and cleanup

Development DB was backed up before the additive migration, with application
writes stopped. Backup retained in ignored logs/m4n-before-pos-customers-20261022.dump.
Migration applied successfully. Updated backend PID7012 started on port8080;
frontend stays on5173. Unauthenticated GET /api/v1/pos/customers returned401.
The disposable test database and temporary test launcher were removed afterward.
No live customer sale data was added by verification. Deployments must apply the
new ordered migration before starting this version; no automatic migrator added.
