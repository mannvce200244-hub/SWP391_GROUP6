# Payment return and customer MoMo refund cancellation — 2026-10-16

## Approved requirement

The user approved: owning customer confirms cancellation of a paid pending
MoMo order → request a full MoMo refund → cancel only after verified success.
This supersedes the paid-MoMo guidance in `20261016-customer-cancellation.md`.
Scope, BR-ORDER-02, completion plan and API contract now record that decision.
Standalone refunds and cancellation after confirmation retain their existing
authorization rules.

## Changed boundaries

- `PaymentReturnPage.jsx` and `paymentPresentation.js`: concise result card,
  authoritative amount/order code, payment method and navigation. Refund state
  precedes historical charge success. URL result flags never declare success.
- `CustomerOrderCancelDialog.jsx`, `orderPresentation.js`,
  `CustomerOrdersPage.jsx`: fresh eligibility/payment reads, explicit refund
  confirmation, pending/failed recovery and success only for returned CANCELLED.
- `OrderServiceImpl`, Payment/MoMo service interfaces and implementations:
  authenticated owner/role/status validation; persisted full-refund intent;
  provider I/O outside order-lock transactions; same refund ID on pending retry;
  verified refund and cancellation committed together. Admin reconciliation of
  a customer cancellation also completes that cancellation.
- `PendingOrderCancellationService` and implementation: shared transactional
  completion releases vouchers and sends notification once; no stock change.
- Tests updated for service wiring and added for refund cancellation behavior.
  No dependencies or schema changes.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 42 passed, zero failures.
- Java 21, `mvnw.cmd -o test`: 430 passed, zero failures/errors/skips.
  Full log: `m4n-backend/target/customer-cancel-full-tests.log`.
  Tests used the dedicated PostgreSQL database
  `m4n_refund_cancel_20261016`; it was removed after completion.
- Backend cases include verified success, unchanged historical paid flag,
  repeated cancellation, timeout/pending with the same refund ID, Admin
  reconciliation, final failure/retry, malformed result, authorization/status
  denial, concurrent requests and unchanged COD cancellation behavior.
- Browser: actual return/dialog components with isolated service fixtures;
  success, pending, failure, unavailable result/retry, pay-start error,
  refunded/cancelled, cancel confirmation and pending refund recovery.
  Desktop and 390×844 verified; mobile document width 390, no horizontal overflow.
  Screenshots: `20261016-payment-return-desktop.png` and
  `20261016-payment-return-mobile.png` (fixture data).
- UI audit: neutral white/cool-gray surfaces, labelled controls, visible focus,
  existing dialog focus containment, status/error announcements, bounded dialog
  scrolling and buttons disabled during submission.
- Security review: owner and current active actor checks; bounded reason input;
  no client amount/payment authority; fixed HTTPS MoMo gateway with request
  signing and response identity/amount checks; row locks and provider idempotency
  prevent duplicate cancellation/voucher release. Unknown provider results never
  permit cancellation.
- `mvnw.cmd -o -DskipTests package`: passed after the full test suite.
  Packaged backend restarted on 8080, PID 26972; health UP, authenticated own-order
  list/detail read passed. `/payments/options` reports MoMo available.
- Smoke script initially used nonexistent `/payments/methods` (404); corrected
  to the existing `/payments/options`. Cookie logout without the required
  X-Requested-With header was rejected (403), as designed. These were smoke
  script errors; no authentication configuration changed.
- Temporary browser fixture/tab/script removed and viewport reset. Existing
  frontend and tunnel processes retained.

## Limits and size review

No live provider refund or real customer cancellation was initiated. Orders
440/441 were not cancelled or refunded. Gateway refund outcomes in integration
tests are controlled fixtures; live sandbox refund success remains dependent
on MoMo accepting the merchant/transaction. Unknown results remain pending and
can be checked again with the persisted request ID.

Large file detected: `OrderServiceImpl.java` (876 lines). Pending cancellation
completion was extracted at a real reuse/transaction boundary. Reorganizing
unrelated pricing, confirmation and inventory flows is outside this request.

Large file detected: `CustomerOrdersPage.jsx` (existing route over 300 lines).
Only the cancellation action label changed; cancellation state lives in the
existing separate dialog. Unrelated list/receipt rendering remains outside scope.

MoMo service remains one provider orchestration boundary (330 lines). No new
generic layer, controller business logic, dependency or database field was added.
