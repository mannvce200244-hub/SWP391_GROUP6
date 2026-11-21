# POS variants directly in the catalog

Verified on 2026-11-21 against loopback PostgreSQL `m4n_test`.

## Approved behavior

The user explicitly selected showing tones directly in the POS catalog without
opening a dialog. Group related SKUs into one product card; show each active
variant's effective price and stock, and add the exact SKU with one action.
Out-of-stock tones stay visible but disabled. Search for one SKU still reveals
its active family through the existing paginated variants endpoint. Ungrouped
products and barcode lookup retain direct addition.

## Changes and review

- Extracted the existing catalog rendering into a focused POS catalog component;
  grouping does not merge SKU prices, balances or transaction identities.
- Removed the old variant dialog, import and state. Variant action buttons have
  explicit add labels and are not represented as selected/toggle controls.
- Reused the existing variant loader/pagination with per-mount request sharing;
  no new endpoints, dependencies, payment or inventory logic.
- Headings follow page/catalog/product hierarchy. Images reserve dimensions,
  have alternatives and an error fallback; surfaces remain white/cool gray.
- Existing server stock/payment checks and immediate bill quantity limits remain.
- Large file detected: m4n-frontend/src/pages/PosDashboardPage.jsx (821 lines).
  This legacy page was already large; the catalog is a real extracted boundary
  and the change reduces it substantially. Unrelated payment refactoring is out
  of scope.
- The UI/UX skill search had no verified variant-specific match. Layout follows
  the project's POS design rules and the current Web Interface Guidelines.

## Verification

- `npm test`: 105 passed. New native tests cover case/NFC family grouping,
  preserving independent SKU values and keeping unrelated same-name SKUs apart.
- `npm run lint` and `npm run build`: passed.
- Browser: searched M4N-HOI-1556 and saw all seven active sibling tones inline in
  one card; zero dialog elements. Re was available at 720,000 VND/stock 3 while
  out-of-stock Do remained visible and disabled. See `desktop.jpg`.
- One Re click produced a Re bill row, quantity 1. Enter and further clicks
  reached 3; another click retained 3 and reported the stock limit. No other
  tone was added. An ungrouped TRN-001 click directly added its own SKU.
- Cleared the unsaved test bill, entered M4N-HOI-1556 in barcode/SKU input and
  verified direct Re addition without a variant dialog.
- A 21-variant test family exposed Tone 21 through its existing second page.
- At 390x844, document scroll/client width both measured 375px, with no horizontal
  overflow. The bounded catalog leaves the bill reachable. See `mobile.jpg`.
- Injected one HTTP 503 on the family query. Failure and Retry appeared inside
  its catalog card; Retry recovered all tones and a Re click added the correct
  SKU. No modal was opened on either path.
- Reused existing test fixtures; no receipt, order, invoice, payment or stock
  mutation was submitted. Logged out, reset viewport and closed the test tab.

## Rollout

Frontend-only change; no database or backend deployment needed. The production
Vercel connection reported missing team access, so deployment status is checked
through the repository's existing GitHub/Vercel integration instead.
