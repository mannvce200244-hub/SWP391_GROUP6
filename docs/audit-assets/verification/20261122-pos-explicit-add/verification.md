# Explicit POS add buttons — 2026-11-22

User correction: clicking a product or tone only inspects it. Only a separate
plus button adds a SKU to the current invoice. Barcode/scanner entry retains its
existing explicit SKU flow.

## Change

- Catalog tiles now contain sibling view and add controls, never nested buttons.
  Plain products have a real 44×44 add button; family tiles open their choices.
- The invoice preview supports plain products as well as families. Clicking a
  plain card no longer calls add-to-bill. Its preview has its own explicit plus.
- In the POS mode of ProductVariantPicker, clicking a tone only changes the
  locally inspected option. The separate plus invokes `onAdd` for that exact SKU.
  Zero-stock choices can be inspected but their plus is disabled.
- Non-POS variant selection in product detail, Admin and stock receiving retains
  its existing `onSelect` behavior. Pending sale/success disabling still applies.
- Selection copy and current approved contract documentation were updated.

## Verification

- Frontend `npm test`: 115 passed, zero failures/skips.
- `npm run lint`, `npm run build`, `git diff --check`: passed.
- Actual browser, POS role, running local demo:
  - Clicking the BAU-001 body opened information with zero bill items.
  - Clicking Sáo Trúc then the Rê body selected its preview without adding a bill
    line. Its plus added exactly one Rê line at 550,000 VND.
  - Clicking the Đô body left the bill unchanged. Its plus added one Đô line at
    617,500 VND.
  - Returning to the BAU-001 body did not add a line. Its preview plus added one;
    the independent catalog plus incremented the same SKU to quantity two.
  - The resulting three SKU lines were priced by the existing backend preview;
    no invoice was finalized and no payment was submitted.
  - At 390×844 the document did not overflow horizontally; tone plus buttons
    measured 44×44 pixels. Viewport override reset afterward.
  - Tiêu Tre F remained inspectable while its zero-stock add button was disabled.
- Temporary browser tab closed; user-requested FE/BE remain running.
- No backend/data changes, new dependency, commit, push or deployment.

## Review

All product/variant names remain escaped React text. The new controls have
specific accessible names, visible focus and native button keyboard behavior.
The existing authoritative stock/price/add/preview/payment paths were preserved.
Large file detected: `src/pages/PosDashboardPage.jsx`; the existing page owner
retains the small preview composition and existing bill state. Broad bill/payment
decomposition remains outside this focused interaction correction.

Evidence: `view-tone-without-adding.jpg`, `mobile-separate-add.jpg`.
