# POS MoMo verification — 2026-10-16

## Approved behavior

User requested MoMo on POS and approved automatic full refund when a charged
bill cannot settle because stock is unavailable. Scope/rules were updated
explicitly; existing cash/bank transfer and online MoMo behavior are preserved.
The POS intent remains distinct from an online Order and a completed Invoice.
Contract/deployment/recovery details: [POS_MOMO.md](../../../POS_MOMO.md).

## Backend and security

- `mvnw.cmd -o verify`: 465 tests passed, zero failures/errors/skips; jar packaged.
  Log: `m4n-backend/target/pos-momo-verify.log`.
- New PostgreSQL integration tests verify unchanged inventory/invoice count on
  create; immutable repeated IDs; duplicate and concurrent callbacks; two paid
  bills competing for stock; signed result identity/amount validation; forged
  signature rejection; final failure/unknown states; automatic refund; refund
  timeout/retry identifier reuse; explicit retry of final refund failure;
  price-change rollback of voucher usage; creation timeout recovery; expired
  pending results; forbidden client-declared success; role/ownership/origin/input
  validation and own-only recovery listing.
- Gateway test validates exact POS `payWithCC` signature, email and same-origin
  `/pos?m4nPosPaymentId=…` return. Existing online payment regression also passed.
- `mvnw.cmd -o -Dtest=HostedDemoDeploymentSmoke test`: one test passed with
  `prod`, `ddl-auto=validate`, fake external credentials, disabled seeding,
  platform/random port, HTTP 200 health and configured sandbox options.
  Log: `m4n-backend/target/pos-momo-deployment-smoke.log`.
- All integration tests and deployment smoke used disposable PostgreSQL
  `m4n_pos_momo_20261016`; no test orders/invoices were written to `m4n_db`.
- New SQL applied successfully to disposable and actual local development
  schemas. Existing invoice/account/order rows are unchanged. Local log:
  `m4n-backend/target/pos-momo-local-migration.log`.
- Secret values remained external and were not printed. Provider operations run
  outside transactions. Unknown outcomes persist instead of declaring success;
  retries cannot bypass a previously allocated refund to settle after restock.
- Controllers delegate to service interfaces. The internal settlement operation
  loads verified persisted intents and cannot accept browser success flags.

## Frontend/browser acceptance

- `npm run lint`, `npm run build`: passed.
- `node --test tests/*.test.mjs`: 54 tests passed, zero failures/skips.
  Logs: `target/pos-momo-{lint,build,frontend-tests}.log` in backend.
- Temporary fixture rendered real POS components and feature services with fake
  API responses; no provider/backend payment was made during GUI verification.
- Entry: selected product → MoMo; required email shown with provider constraints.
  Empty submit displays associated inline error and focuses email. Entering a
  synthetic `buyer@example.test` opens intent status and locks bill edits.
- Pending: status/amount/reference visible; check action available; bill controls
  disabled; no receipt/success shown from query-string flags.
- Refund pending: explicit refund message and check action, bill disabled and no
  invoice. Screenshot: `refund-desktop.png`, `refund-mobile.png`.
- Paid fixture: invoice receipt identifies “Thẻ quốc tế qua MoMo”; first PDF action
  receives focus; Shift+Tab wraps to final new-sale action in existing focus trap.
  Screenshot: `receipt-mobile.png`.
- Query failure: error visible and retry available; attempted retry preserves
  error and locks bill rather than announcing payment success.
- Failed provider result: explicit no-invoice message and return-to-bill action.
- Recovery list: expanded own intent list, page 1→2 disables next appropriately;
  selecting intent restores status panel. Screenshot: `pending-desktop.png`.
- Responsive: 390×844, 768×1024, 1280×900; no document horizontal overflow at
  mobile/tablet measurements. Viewport reset after tests; agent-created tab closed.
- Shared Input/Button/loading/receipt UI reused, semantic buttons and native
  details, async status/error roles, bounded paged list, visible focus and neutral
  white/cool-gray surfaces. No dependency/font/animation added.
- Project-local UI/UX, React Best Practices and Composition Patterns reviewed
  for forms/state ownership/side effects; current Vercel Web Interface Guidelines
  fetched. New email field has label, name, email type/autocomplete, max length,
  spellcheck disabled and associated error. Existing general POS styles remain.

## Review and limits

Large file detected: `src/pages/PosDashboardPage.jsx` (~840 lines) and
`service/serviceImpl/PosServiceImpl.java` (~564 lines), both already above project
thresholds. New payment status/list components and focused payment service own
the new lifecycle; existing atomic stock/pricing/invoice workflow is reused.
A broad catalog/bill or settlement extraction was excluded as unrelated.
No new dependency, simulated production payment, fake Customer order or pending
invoice was introduced. New intents are stored as a separate payment entity.

This verifies code, transaction/security behavior, rendered states and production
schema startup. It does not claim a real end-to-end card charge/refund, working
temporary tunnel URLs or an already deployed Vercel/Railway merchant flow.
Provider tests use the existing mocked gateway and HTTP contract tests. Permanent
HTTPS callbacks and migration are still required when deploying.

Temporary `pos-momo-check.html`/`.jsx` removed after browser verification.

Final cleanup gate: existing cash-method normalization retained; the 22 focused
POS tests passed again and jar was repackaged (`target/pos-momo-final-verify.log`).
Lint/build passed after fixture removal. Disposable database dropped successfully
(exit 0); local backend health remained HTTP 200. No debug/TODO output found in
the new production payment components/service.
