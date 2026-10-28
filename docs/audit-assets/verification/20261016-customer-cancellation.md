# Customer cancellation eligibility — 2026-10-16

## Defect and change

The customer order list offered cancellation based only on pending fulfillment
status. Its confirmation dialog ignored payment/refund eligibility, leading to
a predictable backend rejection for paid orders without a verified full refund.

- `CustomerOrdersPage.jsx`: opens a dedicated cancellation dialog; paid list
  entries label the action “Thông tin hủy”.
- `CustomerOrderDetailDialog.jsx`: exposes cancellation information for pending
  orders even when cancellation itself is unavailable.
- `CustomerOrderCancelDialog.jsx`: reads fresh detail before offering a reason
  field and cancellation confirmation. Loading/errors cannot submit; a rejected
  cancellation requires a fresh eligibility read before retrying. Requests in
  progress cannot be submitted twice or dismissed through the dialog controls.
- `orderPresentation.js`: consumes the authoritative `canCustomerCancel` flag;
  provides refund/support or payment-reconciliation guidance when blocked.
- `customerCancellation.test.mjs`: covers paid/unrefunded, verified refunded
  with historical `isPaid=true`, unpaid, missing permission, and changed status.

No backend contract, payment, inventory or cancellation business rule changed.
BR-ORDER-02 and BR-PAYMENT-01 remain enforced by the backend. No real order was
cancelled/refunded, including order 440.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 38 passed, 0 failed.
- Browser: actual dialog component with an isolated temporary Vite fixture and
  a substituted order service, without backend access. Checked paid guidance
  with no submit/reason field; verified refunded order cancellation; unpaid
  eligible order; pending payment link; failed read and retry; rejection after
  payment changed, followed by fresh eligibility; Tab containment, Escape and
  focus restoration.
- Mobile at 390×844: document width 390, dialog within viewport, long order code
  wraps. Screenshot: `20261016-customer-cancellation-mobile.png` (fixture data).
- Dialog uses existing Button/focus primitives, labelled reason input with the
  existing 500-character limit, error alert and live status, neutral surfaces,
  and a bounded scrollable panel. Reviewed against project UI acceptance rules
  and the current official Web Interface Guidelines.
- Temporary fixture/tab removed, temporary viewport reset. Existing frontend
  and backend processes retained. No dependencies added.

## Limits and size review

No external refund or live cancellation was performed. Backend was unchanged;
the backend tests were not rerun for this frontend-only correction.

Large file detected: `CustomerOrdersPage.jsx`. Extracted the cancellation
workflow at its natural responsibility boundary; the page still exceeds the
300-line review threshold. Other order list/receipt rendering was left outside
this focused fix.
