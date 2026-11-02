# Recheck issues 1–4 — 2026-10-22

## Scope and result

Rechecked the four approved fixes. Two residual frontend cases were corrected;
no additional backend implementation change was needed in this pass.

| Issue | Result |
| --- | --- |
| 1. Cart drawer after catalog scroll | Existing body portal keeps the dialog within the viewport. Header/footer remain visible while the list scrolls; background scrolling is locked. Escape restores trigger focus and the original page scroll. |
| 2. Checkout only ticked rows | URL, preview and order payload contain only selected IDs. Unselected rows remain in the cart. Added feedback and disabled checkout for selections above the existing 100-row API limit, avoiding an uncaught navigation error. |
| 3. Voucher minimum duration | Creation input minimum now rounds upward to a whole minute, avoiding a suggested time a few seconds short of the required hour. A failed period check refreshes the creation baseline. Existing edit timestamp precision remains preserved. |
| 4. POS customer attribution | Existing customer/profile selection and new phone-based showroom profiles passed the checks. Strengthened concurrency, search and verified MoMo customer-association tests. New bill clears the selected customer. |

## Changed files in this pass

- Frontend implementation: `src/features/cart/cartSelection.js`,
  `src/features/cart/CartDrawer.jsx`, `src/pages/CartPage.jsx`,
  `src/pages/admin/AdminVouchersPage.jsx`.
- Frontend tests: `tests/cartSelection.test.mjs` (100/101 boundary and recovery).
- Backend tests: `PosCustomerIntegrationTest.java`,
  `PosMomoPaymentIntegrationTest.java`.
- Documentation: `docs/FORM_VALIDATION_RULES.md` and this verification record.

Large file detected: `m4n-frontend/src/pages/admin/AdminVouchersPage.jsx`
(417 lines).

Large file detected:
`m4n-backend/src/test/java/com/m4n/backend/service/PosMomoPaymentIntegrationTest.java`
(420 lines).

Both files were already broad before this focused recheck. Voucher changes remain
within the existing form/date behavior, and the new integration cases use the
existing payment fixtures. No unrelated page/test restructuring or dependency
change was introduced. Further decomposition remains technical debt.

## Verification commands

- `npm run lint`: passed after temporary browser harness removal.
- `npm run build`: passed after temporary browser harness removal.
- `node --test tests/*.test.mjs`: 69 passed, zero failures/skips.
- `mvnw.cmd test`: 505 passed, zero failures/errors/skips. This also compiled the
  backend sources/tests; no backend production code changed in this pass.
- Backend tests used explicit environment overrides pointing to the disposable
  PostgreSQL database `m4n_four_errors_test_20261022`. No test ran against the
  application database. The disposable database had zero active connections and
  was dropped after successful verification.

## Browser checks and limitations

Actual application components were mounted in a temporary local harness with
synthetic authentication and intercepted API responses. No real order, voucher,
customer or payment was created through this browser verification. Backend
integration tests exercised real persistence on the isolated database; payment
gateway responses were mocked, so this pass does not prove a live MoMo transaction.

- Scrolled catalog to `scrollY=392`, opened the actual SiteHeader drawer: dialog
  top 0, height 720, same as viewport. Scrolled the list to approximately 861;
  checkout stayed within y=654–696. Body scrolling locked; Escape restored focus.
- With two rows, unticked row 12 and entered checkout. URL, preview and synthetic
  COD order contained only `[11]`; the synthetic cart retained row 12 afterward.
  URL persistence is covered by native parser tests; this pass did not perform a
  full browser reload with a live authenticated checkout session.
- With 101 rows selected, drawer and cart page disabled checkout and explained
  how to recover. Unticking one row enabled checkout. At 375×667, document width
  remained 375 and the drawer checkout footer remained visible (bottom 603).
- Voucher start `2027-01-01T10:00`, end `10:59` failed native range validation
  with `min=11:00`, `rangeUnderflow=true`; no create request was made. End `11:00`
  was accepted and submitted as `2027-01-01T04:00:00.000Z`, one hour after the
  UTC start. The browser's date fields required keyboard input to commit native
  change events; saved request evidence reflects committed values.
- Editing only the description retained the original boundary timestamp
  `2026-10-22T04:00:30Z`, even though the minute-resolution control displayed 11:00.
- POS customer search selection via Enter worked; opening a new bill cleared
  the selected ID, fields and old search result.

## Backend cases strengthened

- Two concurrent cash sales use different products/inventory locks and the same
  new phone. Both invoices share one profile and each inventory decreases once.
- Search returns at most 10 account matches, treats SQL wildcards literally and
  rejects queries above the existing limit.
- Verified MoMo callbacks associate the explicitly selected online customer or
  showroom profile. Duplicate callback does not duplicate stock deduction or
  create a redundant profile.

## Review and cleanup

- Existing API maximum remains authoritative; neither URL nor UI silently
  truncates selections. Backend ownership, price and inventory checks remain.
- Voucher validation still uses server creation time and the full one-hour rule;
  no client timestamp gains authority and no historical dates were rewritten.
- No new business rule, API endpoint, dependency, database migration or production
  backend change was introduced in this pass.
- UI changes use existing neutral surfaces, native controls and status feedback.
  Screenshots were inspected on desktop and for the drawer on mobile. Focus,
  disabled/loading behavior and recovery text were reviewed.
- Temporary `four-errors-check.html` / `src/four-errors-check.jsx` and the
  agent-created browser tab were removed. User tabs and the running application
  were preserved; no viewport override remains.

## Evidence

- [Scrolled drawer](cart-scroll.png)
- [Only selected product at checkout](selected-checkout.png)
- [Selected checkout API payload](partial-checkout-payload.json)
- [Cart selection limit](cart-limit.png), [mobile drawer](cart-limit-mobile.png)
- [Voucher under one hour rejected](voucher-hour.png)
- [Accepted voucher creation payload](voucher-create-payload.json)
- [Voucher edit preserves seconds](voucher-edit-payload.json)
