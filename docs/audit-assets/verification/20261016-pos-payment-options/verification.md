# POS payment selector — 2026-10-16

- User requested removal of the separate bank-transfer payment choice in POS.
- `PosDashboardPage.jsx`: removed the bank-transfer button and its unused QR
  icon; selector now has cash and MoMo only, one column on mobile and two at
  the existing small breakpoint. Cash exposes pressed state and visible focus.
- Recorded the approved UI change in `PROJECT_SCOPE.md` and `POS_MOMO.md`.
- Existing bank-transfer invoice history/API compatibility is unchanged.
- `npm run lint`, `npm run build`: passed. Existing `node --test
  tests/*.test.mjs`: 54 passed, zero failures.
- Browser verification used the real POS page component with an isolated
  synthetic AuthContext and mocked read-only API responses. The live `/pos`
  redirected to login because the test browser has no cashier session.
- Confirmed only Tiền mặt and MoMo · Thẻ are rendered. Selecting MoMo shows
  customer email and card-payment action; selecting cash restores cash received
  and change fields. No payment, invoice or inventory mutation was attempted.
- `payment-options.png` captures the two remaining choices with MoMo selected.
- Temporary fixture removed and temporary test tab closed after verification.
- Changed controls use native buttons, visible labels, pressed state, keyboard
  focus and neutral white/cool-gray surfaces. No new dependency, API or state.
- Existing oversized POS page was reduced; broader restructuring is outside
  this option-removal request. Responsive column behavior was reviewed in code;
  browser interactions were verified at its existing desktop viewport.
