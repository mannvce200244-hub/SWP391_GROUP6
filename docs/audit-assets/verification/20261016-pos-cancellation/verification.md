# POS MoMo cancellation and status refresh — 2026-10-16

## Findings and approved decision

- User-supplied intent `pos-a02bd4cfdebb4a65b9c30934b106064b` was already
  `FAILED`, response code `1006`, refund `NONE`, no invoice. The UI originally
  read status once and retained stale pending state after the provider callback.
- User approved cancelling an unissued bill and automatically refunding any
  recorded or later verified charge. Existing invoice cancellation is excluded.

## Changes and review

- Status panel polls the persisted backend result every five seconds, with
  cleanup and shared request exclusion. Provider query/refund still uses the
  existing explicit reconciliation boundary.
- Added owned `POST /pos/payments/momo/{id}/cancel` and response
  `cancelRequested`. Controllers remain transport-only.
- Cancellation commits under the settlement lock before external provider
  queries. It suppresses the payment URL and invoice issuance. Known/late
  verified charges allocate a durable full refund; unknown outcomes retain
  their refund request ID. Completed invoices reject this cancellation.
- POS confirmation clears the active bill only after server acceptance, opening
  a new empty bill. Pending/failed refund history remains accessible. If the
  cancellation response is lost, polling can recover the saved flag and show
  the new-bill action.
- Updated approved scope, BR-POS-01, HTTP contract, POS guide and migration order.
- New migration adds default-false `cancel_requested` and an integrity check
  excluding invoices on cancelled intents. Backed up the local POS payment
  table and applied the migration successfully; old transaction values remain.
- Security review: owner and active verified POS role are checked; the caller
  never declares payment success, refund success or amount. Charge/refund
  history is preserved. No provider network call holds the intent transaction.
- Existing large POS page/service remain large; focused logic stays in the
  existing payment feature/service. No dependency or unrelated refactor added.

## Verification

- Focused backend: 28 tests passed.
- Full Maven `verify`: **471 passed**, zero failures/errors/skips.
- Deployment smoke with `prod`, migrated disposable schema and validation:
  **1 passed**. The API schema exposes cancel route and boolean response flag.
- Frontend: lint/build passed; **55 native Node tests passed**.
- Backend integration tests cover cancellation before late IPN, already
  recorded charge, unknown query/refund outcomes, idempotent refund recovery,
  ownership/role rejection, completed invoice rejection and concurrent
  settlement versus cancellation. No invoice or stock deduction survives a
  cancelled bill.
- Real page component rendered with isolated synthetic auth/read-only API
  fixtures: pending-to-failed automatic refresh, cancellation confirmation,
  fresh enabled bill, retained recovery record and lost-response recovery passed.
- Existing dialog focus trap/restoration reused. Mobile 375 and tablet 768
  showed no horizontal overflow; desktop confirmed the same flow. Screenshots
  are `confirm.png`, `confirm-mobile.png`, `confirm-dialog.png`, `new-bill.png`.
- Temporary fixture removed, viewport reset and test tab closed.
- Disposable PostgreSQL `m4n_pos_cancel_20261016` removed after verification.
- Updated executable jar runs on Java 21 at port 8080, PID 5996,
  `ddl-auto=validate`, development seeding disabled; health HTTP 200.
- Logs are under `m4n-backend/target/pos-cancellation-*`; future clean builds
  replace generated logs. No real card charge/refund was performed for this
  verification; provider behavior was tested through existing mocked gateway
  integration tests.
