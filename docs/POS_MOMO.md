# POS MoMo sandbox

Approved 2026-10-16: extend the existing official card sandbox to showroom POS.
No new merchant credentials, simulated payment or card-data collection is added.

## Flow and boundaries

The POS payment selector offers **Tiền mặt** and **MoMo · Thẻ** only (user
update, 2026-10-16). The separate bank-transfer button is removed; existing
bank-transfer invoice history and backend compatibility remain supported.

Bill + customer email → POS Staff / input / stock / pricing validation → persist
immutable payment intent → official `payWithCC` URL → signed IPN or backend
query → atomic invoice, stock deduction and voucher consumption.

Only the backend-verified charge can settle the bill. Duplicate callbacks and
reconciliation lock the same intent; its invoice link is written in the same
transaction as the sale. Creating the intent neither deducts nor reserves stock.
The original cashier attribution is retained if a callback arrives after logout.

If stock, product availability, pricing or voucher validity changes and settlement
cannot complete, the sale transaction rolls back and a full refund is allocated
before external I/O. Unknown refunds reuse that request ID. Confirmed refund
failure remains visible; an explicit retry allocates a new refund ID. Once a
refund is allocated the intent can never produce an invoice, even after restock.
Unexpected database/service failures retain the charged intent for reconciliation;
they never claim successful invoice creation.

## HTTP contract

All `/pos/payments/momo` endpoints require active, verified `POS_STAFF`, with
ownership enforced by the service. Identity is never taken from request fields.

- `POST /api/v1/pos/payments/momo`: `{id, sale, customerEmail, expectedAmount}`.
  `sale` uses the existing POS sale fields with `paymentMethod=MOMO`. Only a
  previously unused ID creates a provider request; repeating it returns the
  immutable existing intent. Reusing another cashier's ID is forbidden.
- `GET /api/v1/pos/payments/momo/{id}`: read persisted status.
- `POST /api/v1/pos/payments/momo/{id}/reconcile`: query the provider for pending
  payments, resume verified settlement or retry/reconcile an automatic refund.
- `POST /api/v1/pos/payments/momo/{id}/cancel`: owning cashier explicitly stops
  an unissued bill. Persist `cancelRequested` under the settlement lock before
  checking MoMo. Refund known/late verified charges; never issue its invoice.
  A provider timeout preserves cancellation for later reconciliation. Reject
  an already issued invoice. Repeated requests retain the cancellation and
  reuse any unknown refund request.
- `GET /api/v1/pos/payments/momo?page=0`: database-paged own intents without an
  invoice, ten per page. Retains failed/refunded results for recovery/history.
- Existing public `POST /api/v1/payments/momo/ipn`: dispatches `pos-` references
  to the POS service; signature, identity, amount, request/order IDs and orderInfo
  must match. The callback carries no authenticated cashier session.

Response: `{id, amount, status, refundStatus, paymentUrl, expiresAt, invoiceId,
message, cancelRequested}`. A valid unexpired pending URL is resumable only if
the bill has not been cancelled. Timeout/expiration alone
never proves that no money was taken. `SUCCEEDED` records the historical charge;
only `invoiceId` means a completed sale. Refund success has no invoice/revenue.
`POST /pos/sales` continues to accept only cash or bank transfer and cannot be
used to declare MoMo paid.

## Return, deployment and recovery

Uses the existing MoMo properties, server credentials and public HTTPS IPN URL.
Return uses the allowed initiating frontend origin and `/pos?m4nPosPaymentId=…`;
localhost stays localhost and Vercel stays Vercel. If login is required, only the
validated intent ID is preserved and the backend still checks cashier ownership.
Card details are entered only on MoMo's official test host.

Apply `migrations/20261016_pos_momo_payments.sql` before Railway schema validation.
Then apply `migrations/20261016_pos_momo_cancellation.sql` for the cancellation
flag and the database check preventing cancelled intents from having invoices.
Follow `VERCEL_RAILWAY_DEPLOYMENT.md` for sandbox opt-in, origin allowlist and API
proxy configuration. No new public callback route or hosting variable is required.

The browser persists only a cashier-scoped intent ID. A timeout returns to its
status panel, preventing another payment for that bill. Server-paged unfinished
intents are accessible after browser storage is cleared. Verify status before
charging again; deliver goods only after the invoice is available. Receipt,
transaction history and exported PDF identify the MoMo card method.

The open status panel refreshes the persisted backend result every five seconds
until failure, full refund or invoice completion. This picks up an IPN arriving
after the initial check (including customer refusal code 1006). A finished
unsuccessful/refunded payment offers both returning to the existing bill and
creating a fresh empty bill when the customer no longer buys. An unresolved
payment offers explicit bill cancellation with confirmation. After the backend
persists it, POS opens a new empty bill and the old intent remains in recovery.
Cancelled intents hide their payment URL, and late charge notifications refund
instead of settling. Returning to an unresolved result after a request timeout
can also open a new bill once its saved cancellation is confirmed. Closing a
browser tab alone is not cancellation.
