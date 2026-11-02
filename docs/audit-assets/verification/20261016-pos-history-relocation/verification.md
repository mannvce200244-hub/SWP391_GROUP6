# Remove reconciliation list from POS sales — 2026-10-16

User correction: remove “Giao dịch MoMo chưa xuất hóa đơn” from `/pos`.

## Changes

- `PosDashboardPage.jsx`: removed the list component import, render and unused
  selection handler. Opening the sales page no longer mounts/fetches that list.
- `PosTransactionHistoryPage.jsx`: reused the existing list beneath invoice
  history at `/pos/history`. Selecting a transaction uses the existing POS return
  parameter and central navigation function to open its reconciliation panel.
- `PosMomoPaymentPanel.jsx`: cancellation guidance now points to transaction history.

This removes the list from sales while retaining cashier reconciliation and
refund retry required by BR-POS-01. No payment records, backend behavior,
authorization, stock rules, API contracts or dependencies changed.

## Verification and UI acceptance

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 60 passed, zero failures/skips.
- Live `/pos` redirected to login in the agent's browser session. Browser
  verification therefore used the actual pages, POS layout and components with
  an isolated test-user context and mocked fetch responses, without backend writes.
- Sales page showed search, catalog and bill entry with no reconciliation list.
- Navigation to history showed the relocated list; expansion displayed a mocked
  failed refund. “Xem giao dịch” opened the correct existing intent URL and retry
  control. “Tạo hóa đơn mới” returned to usable sales with no list.
- Screenshot: [Sales without reconciliation list](pos-sales.png), using test data.
- Existing white/cool-gray surfaces, summary/button semantics, responsive list,
  loading/empty/error and pagination behavior reused. No fields, dialogs or
  layout breakpoints added; no separate responsive redesign audit performed.
- Removed the temporary HTML harness and closed the agent-created tab. No new
  fixture storage was persisted; existing sale-reset callback cleaned the test URL.

Large file detected: `m4n-frontend/src/pages/PosDashboardPage.jsx` (824 lines).
This correction only removes the list and its obsolete handler. Broader
extraction is unrelated to this local change. History remains 276 lines.

No actual MoMo charge/refund was performed.
