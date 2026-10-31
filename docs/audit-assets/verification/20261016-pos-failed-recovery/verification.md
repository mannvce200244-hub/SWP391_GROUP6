# POS failed MoMo payment recovery — 2026-10-16

## Request and repair

A previously failed 5,800,000 VND MoMo intent was restored from browser storage
and kept the POS payment panel open, disabling bill entry.

Changed only `m4n-frontend/src/features/pos/PosMomoPaymentPanel.jsx`:

- A backend response with `status=FAILED`, `refundStatus=NONE` and no invoice
  now closes the active payment panel through the existing page callback.
- That callback clears the saved intent and payment-return query, re-enables
  bill entry and preserves the current bill for retry.
- A short toast explains that payment failed and offers retry/cash. The failed
  amount, internal identifier and large result panel no longer remain on screen.
- Pending/unknown charges and pending/failed refunds retain reconciliation.
  No stored backend payment record, stock, invoice or refund state is changed.

BR-POS-01 and the existing payment contract remain authoritative. No new API,
dependency, status, business rule or design token was introduced.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 60 passed, zero failures/skips.
- Browser verification mounted the actual `PosDashboardPage`, payment panel and
  toast provider using isolated test-user browser storage and mocked fetch
  responses; no live MoMo or backend writes were performed.

| Browser scenario | Verified result |
| --- | --- |
| Saved failed intent and payment-return URL | Panel removed, saved ID cleared, return query removed, search enabled, short toast |
| Reload after dismissal | No payment panel or repeated failure toast |
| Initial pending intent, reconciliation returns FAILED | Panel closes and saved ID clears |
| Pending intent, background poll returns FAILED | Second status read clears panel and saved ID |
| Pending/unknown payment | Panel and reconciliation remain; bill editing blocked |
| Charged payment, refund FAILED | Refund retry remains; panel not dismissed |
| Reconciliation network failure | Error and retry controls remain; intent not dismissed |

Screenshot: [POS ready for bill entry](pos-ready.png). It shows a mocked empty
catalog, not the live showroom data.

## UI acceptance and cleanup

- Existing UI components, labels, live-region toast and white/cool-gray surfaces
  reused. No new form, focusable control, dialog, layout or breakpoint was added.
- No responsive geometry changed; the same existing panel is removed at every
  width. A separate responsive layout audit was not part of this local fix.
- Effect subscriptions keep their existing cleanup; the dismissal reads the
  latest callback without retriggering provider requests on parent renders.
- Only the small payment-panel component changed; no large-file threshold crossed.
- Removed the temporary test HTML, cleared its dedicated saved intent through
  the verified close callback and closed the test tab. The user's tab was retained.
- Live gateway card charge/refund was not tested for this frontend recovery fix.
