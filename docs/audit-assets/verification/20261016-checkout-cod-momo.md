# Checkout payment choices — 2026-10-16

- User approved removing VNPay from new checkout; only COD and MoMo remain.
  Recorded in `docs/PROJECT_SCOPE.md`.
- `CheckoutPage.jsx`: removed VNPay radio, availability badge and unavailable
  message; the new-order payment redirect applies to MoMo only.
- Existing VNPay historical order verification/refund behavior is retained;
  no backend contract or payment-state rule changed (BR-PAYMENT-01).
- `npm run lint`, `npm run build`: passed.
- `node --test tests/*.test.mjs`: 38 passed, 0 failed.
- Browser on localhost using the demo customer: exactly COD/MOMO radios,
  enabled MoMo selects correctly, COD reselects correctly, no VNPay text.
  No order or payment submitted; cart contents unchanged. Demo logged out and
  temporary tab closed. Screenshot: `20261016-checkout-cod-momo.png`.
- Applicable UI acceptance: existing labelled radio/disabled/focus/loading/error
  handling retained, no new control/layout, field, dependency, or validation rule.
  No new tests for this small UI removal; existing suite run.
- Large file detected: `CheckoutPage.jsx` remains above its size threshold.
  This change removes an existing option; broader checkout extraction is outside
  this focused task. Backend unchanged; backend tests not rerun.
