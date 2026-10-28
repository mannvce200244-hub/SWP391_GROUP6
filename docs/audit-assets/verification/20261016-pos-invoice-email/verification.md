# POS card payment invoice email — 2026-10-16

User requirement: send the invoice to the customer's email after POS card payment.

## Implementation

- Reused the existing required MoMo customer email; POS labels it “Email nhận hóa đơn”.
- Successful verified MoMo settlement queues receipt delivery atomically with invoice creation. Duplicate callbacks reuse the invoice and do not queue another receipt. Failed, cancelled or refunded intents without invoices do not queue receipts.
- A bounded worker checks committed receipts every 10 seconds. Database locking and a persisted five-minute attempt lease coordinate workers. PDF generation and SMTP run outside the payment and lease transactions.
- Reused the existing PDF service and Gmail SMTP transport. Email includes invoice code, paid amount and a PDF attachment, with UTF-8 plain text and escaped HTML alternatives. SMTP/PDF failure retains the invoice and pending delivery for retry.
- No dependencies or HTTP contracts added. Scope, business rules, database/migration and deployment documentation updated for the approved requirement.
- Delivery is at least once: a crash after SMTP acceptance but before recording success can cause a repeated email. Normal concurrent workers are covered by integration tests; no exactly-once SMTP guarantee is claimed.

## Verification

- `./mvnw.cmd -o test`: 488 tests passed, zero failures/errors/skips, using disposable PostgreSQL `m4n_receipt_email_20261016`.
- Receipt coverage includes MIME/PDF attachment, recipient and HTML escaping, safe transport errors, committed invoice visibility during sending, concurrent workers, repeated callbacks, delivery retry and unchanged stock/invoice after SMTP failure. The initial focused MIME test needed `saveChanges()` before reading its MIME types; the full suite passed after that fixture correction.
- `./mvnw.cmd -o -DskipTests package`: passed after the full test suite.
- Frontend `npm run lint`, `npm run build`, and `node --test tests/*.test.mjs`: passed; 60 tests, zero failures/skips.
- Browser inspection rendered the actual POS page with isolated test auth and mocked API responses. MoMo shows the required email field and PDF delivery guidance. Evidence: [POS email field](pos-receipt-email.png).
- No actual SMTP email, MoMo charge or refund was sent during verification. Inbox delivery still requires a real successful payment and valid runtime Gmail configuration.

## Runtime and cleanup

- Backed up the local live database to `m4n-backend/target/before-pos-invoice-email-20261016.dump` before migration.
- Applied `docs/migrations/20261016_pos_invoice_email.sql` twice on the disposable database and once on the live local database. Confirmed zero historical receipts queued; no historical backfill.
- Restarted the updated backend on port 8080 with schema validation and development account seeding disabled. Health endpoint returned HTTP 200. Startup logs: `m4n-backend/target/pos-receipt-startup.log` and `pos-receipt-startup-error.log`.
- Removed the disposable database and temporary HTML harness; closed the agent-created browser tab. User tab and frontend process preserved.
- Security review: bound JPQL, persisted validated recipient, strict MIME addresses, escaped HTML, sanitized attachment filename, no recipient/provider secrets in failure logs, and no payment/inventory reversal on delivery failure.

Large file detected: `m4n-frontend/src/pages/PosDashboardPage.jsx` (824 lines). Only field/helper copy changed.

Large file detected: `m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/PosServiceImpl.java` (568 lines). Only the queue timestamp was added to the existing successful settlement boundary. Delivery has its own service; unrelated service extraction remains outside this task.

For Railway deployment, apply the migration, keep Gmail SMTP variables configured and provide the existing PDF service a readable Vietnamese Unicode TTF via `INVOICE_PDF_FONT_PATH`, as documented in the deployment guide.
