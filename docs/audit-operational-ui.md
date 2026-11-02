# Operational and shared UI audit — 2026-10-10

## Coverage

Reviewed Admin order, voucher, inventory, invoice and dashboard pages; POS bill,
scanner, receipt and history; Staff products and notifications; shared layouts,
dialogs, toasts, header/footer and route loading. Customer and Admin account /
catalog work is detailed in the other audit reports.

The authoritative flow remains: input → UX validation → feature service →
backend validation/transaction → response → UI result. Displayed prices, stock,
discounts and lifecycle controls do not authorize a transaction themselves.

## Repaired defects

| Area | Defect and repair |
| --- | --- |
| Admin orders | Outdated list/detail responses, actions racing each other, closed detail reopening after a mutation, missing query errors/retry, and filtered last-page rows stranding pagination. Added request identity, synchronous action guard, current-selection checks, explicit retry and page clamping. |
| Order detail / packing slip | Incorrect payment label, incomplete print fallback and unsupported contact details. Print now loads complete detail, reports failures, shares the payment formatter and shows manual/automatic discount components. Paid COD slips show zero remaining collection. |
| POS preview | Bill formerly calculated locally and missed automatic discounts. Backend preview now owns totals/warnings, with debounce, current-input checks, retry and fresh preview when returning to an earlier bill. |
| POS input | Duplicate barcode/sale actions and a late lookup adding into a new bill. Added pending guards and bill generation checks. Bill controls lock during submission and completed receipt; clearing a bill has a confirmation dialog. |
| POS payment / receipt | Cash shortcuts used stale amounts; transfer UI implied a generated QR. Exact cash waits for a valid backend preview, transfer is labelled manual, and PDF controls fetch the authenticated real PDF with duplicate guards. |
| POS scanner | Unsupported formats/constructor errors, async camera startup after close, repeated detection and stream/timer leaks. Scanner guards startup/detection, releases resources and preserves manual SKU input when automatic scanning is unavailable. |
| Notifications | Failed loads resembled empty results; old polls overwrote read mutations; count updates used stale arithmetic. Added error/retry/loading, mutation revisions, request guards and authoritative refetch. Successful reads notify both the shared bell and Staff page so their counts/list stay synchronized. |
| Staff products | Local slicing of an oversized request, video thumbnails and missing low-stock states. Uses server pages, safe image selection and backend availability states. |
| Inventory / invoices | Missing load/retry states, duplicate imports/downloads, stale modal requests, page bounds and labels. Added recovery, guards and shared dialog focus without changing the stock workflow. |
| Shared dialogs | Keyboard focus escaped overlays; nested Escape and focus restoration were inconsistent. One shared hook traps focus, closes only the top dialog, preserves body scroll lock and restores the trigger. Mobile navigation transitions no longer delay the first focus target. |
| Feedback / layouts | Toast timers outlived their component and logout errors were hidden. Timers clean up; logout failure is visible. Hidden mobile navigation cannot receive focus. |
| Voucher forms | Missing automatic/type/quantity fields, unlabelled filters, duplicate mutations and stale success after reload failure. Existing contract fields and validation are exposed, synchronous guards prevent duplicate writes, and reload errors have retry. Optional dates remain optional. |
| Palette | Remaining tinted card/status/error surfaces violate the root neutral rule. Surface tokens and pastel surface utilities use white/cool gray; text, borders, chart marks and action accents retain semantic meaning. |
| Route loading | Every page was eagerly included in the initial bundle. Existing central router now lazy-loads page modules with a Suspense loading state; no dependency was added. Initial JavaScript decreased from about 923 kB to about 320 kB. |
| Empty inventory chart | An empty inventory incorrectly displayed 100% out of stock. Empty counts now show zero percentages and only the neutral ring; unused legend color fields were removed. |
| Mobile overlay stacking | The closed floating chat launcher covered the filter drawer's result action. The closed launcher now sits below modal drawers while the open chat retains its dialog layer. |

## Natural component boundaries

- `AdminOrderTable`, `AdminOrderDetailDialog`, `OrderPackingSlip` and
  `adminOrderPresentation` separate existing table/detail/print responsibilities
  from `AdminOrdersPage` orchestration.
- `PosScannerDialog`, `PosReceiptDialog` and `usePosSalePreview` isolate resource,
  receipt and authoritative preview lifecycles from the POS page.
- `useDialogFocus` is shared by existing dialog surfaces with the same keyboard
  and scroll behavior; it is not a configurable universal form/dialog.

Large file detected: `src/pages/admin/AdminOrdersPage.jsx` (about 715 lines),
`src/pages/PosDashboardPage.jsx` (about 770 lines) and
`src/components/common/SiteHeader.jsx` (about 545 lines). The former large order
and POS routes were reduced through the concrete boundaries above. Remaining
page orchestration and header navigation/cart/account state are documented
review targets. Do not infer full architectural compliance from line counts.

## Browser evidence

This matrix records phase 1. Later pricing/shipping, content and payment UI
changes require the phase 2 evidence and limits in
[audit-completion.md](audit-completion.md); the screenshots below do not verify
those later flows.

Used explicitly authorized sample accounts on `http://localhost:5173`, with
the real local PostgreSQL backend and no completed financial action in UI.

| Surface | Verification |
| --- | --- |
| Public catalog | Mobile home/catalog; backend-unavailable error and successful Retry; group links; loaded product detail. |
| Authentication | Admin, POS, Online Staff and Customer sample login; Admin reload restores its refresh session; POS and Staff logout return to login. |
| Admin product | At 375 px the create form stays within viewport and exposes low-stock threshold. Nested category modal retries, Escape closes the child, focus returns to parent and body remains locked. |
| Admin navigation | At mobile width opening the menu focuses “Về trang chủ”; desktop navigation is usable. |
| Admin orders | At 375 px order detail focuses its close control. Nested packing slip opens, Escape closes only the slip, and the completed fixture's paid COD collection is zero. |
| Admin users | At 1440 px create-staff dialog has labelled fields, generated-password explanation, bounded layout and initial dialog focus. No account was created. |
| Admin vouchers | Create dialog exposes manual/automatic promotion, optional quantity/date fields, minimum value, rate and limits. No voucher was saved/deleted. |
| POS | SKU `SAO-001` adds one item; backend preview 650,000 VND with `DIENM4N` 5% becomes 617,500 VND. At 768 px no document overflow. Clear confirmation can be cancelled. |
| Scanner | Browser lacking automatic detection shows manual SKU fallback; Escape closes the dialog. A successful physical-camera scan is not verified. |
| POS history | Sample POS account sees its own invoice, opens detail and has a real PDF download action. |
| Staff | Mobile menu focuses first link; dashboard, notification list/read and queue load. Notification bell/count refresh after reads is exercised. No conversation ownership or external message was changed. |
| Customer | Product → cart → checkout preview, same 650,000 → 617,500 VND voucher result; 375 px checkout has no document overflow; customer order filter shows an empty state and detail keeps focus inside the dialog. No order was placed. |
| Customer final recovery | Footer opens the existing chat dialog at 375 px, initial focus stays in the dialog, and close restores footer focus. Account page has one main landmark. With backend intentionally stopped, the mobile filter displays category failure/retry and usable default groups without document overflow; Escape restores its trigger. |
| Packaged backend final smoke | Started the final executable JAR with external local configuration and no seeding. Catalog Retry loads six existing products; fresh Customer login, profile reload/refresh and logout work. Reloaded profile has one main landmark and no horizontal overflow at 375 px. |

Screenshots: [`audit-assets/ui/`](audit-assets/ui/). Test-created cart data was
removed with an exact scoped backend cleanup. Financial/state-transition and
concurrency behavior is covered in backend regression tests rather than by
altering existing records in UI.

The final mobile filter and footer/chat screenshots reflect the last overlay
stacking fixes. Earlier checkout/POS captures document the checked calculation
and layout at that point; minor later surface-token corrections are described
in source and the palette row above.

## Acceptance and limits

- Scope/API/authority: preserved Stage 1 rules and existing HTTP contracts.
- Loading/empty/error/pending: repaired at the affected requests and operations;
  failure/retry and state lifetimes also reviewed in source.
- Keyboard/responsive: mobile 375, tablet 768 and desktop 1440 exercised across
  the representative flows above. Wide operational tables deliberately scroll
  inside their container. Physical camera, every browser/zoom combination and
  a full screen-reader session remain unverified.
- Native labels, semantic controls, focus, neutral surfaces and reduced-motion
  support reviewed against the project checklist and the current official
  [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).
  Advisory rules do not authorize new libraries or features.
- Automated final lint/build/test results are recorded in `audit-overview.md`.
  No dependency, test framework or disabled lint rule was introduced.

