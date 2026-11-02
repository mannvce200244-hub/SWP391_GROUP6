# Selected cart checkout and voucher validity — 2026-10-22

## Changes

- Cart page and drawer pass the ticked cart row IDs in the checkout URL. Checkout reads this explicit selection rather than the CartProvider's initial select-all state. Missing, malformed, duplicate or stale selections block checkout and offer a cart recovery action. Direct purchase rejects mixed sources and retains its existing separate behavior.
- Checkout item removal updates the URL selection. Preview, voucher requests and Place Order use the same selected IDs. Existing backend ownership, repricing and removal of only purchased rows remain authoritative; no backend checkout API change was needed.
- Per the user's delegated decision, a configured voucher expiration must be at least one hour after both server creation time and the configured start. Exact equality is allowed, expiration remains optional, and edits use original creation time. Frontend and service validation agree. Existing voucher data is not rewritten; invalid historical dates must be corrected on update.
- Unchanged backend timestamps retain their exact precision during edit serialization, avoiding truncation at the one-hour boundary.
- Updated BR-VOUCHER-01 and the form validation matrix. No dependencies or database migrations added.

## Files and boundaries

- Frontend cart: `src/features/cart/cartSelection.js`, `CartDrawer.jsx`, `src/pages/CartPage.jsx`.
- Frontend checkout: `src/pages/CheckoutPage.jsx`, `src/features/checkout/directPurchase.js`, `useDirectPurchase.js`, shared `useCheckoutSearch.js`.
- Frontend voucher: `src/pages/admin/AdminVouchersPage.jsx`, `src/features/admin/voucherPeriod.js`, `src/services/voucherService.js`.
- Backend: `VoucherServiceImpl.java`; tests: `VoucherServiceTest.java`. Validation stays in ServiceImpl; no controller business logic added.
- Native Node tests: cart selection, direct purchase, voucher period and voucher service serialization.

Large file detected: `m4n-frontend/src/pages/CheckoutPage.jsx` (784 lines).

Large file detected: `m4n-frontend/src/pages/admin/AdminVouchersPage.jsx` (416 lines).

Both pages were already oversized. This change keeps the existing form and checkout orchestration, extracts the reusable checkout URL subscription and independently testable voucher validation, and avoids a broad restructuring of payment, delivery and order submission during this focused fix. Further decomposition of the existing pages remains technical debt. `VoucherServiceImpl.java` is 358 lines, below the backend's 400-line review trigger.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 67 passed, zero failures/skips.
- Maven focused `-Dtest=VoucherServiceTest test`: 22 passed.
- Maven `verify`: 492 passed, zero failures/errors/skips; packaged backend successfully.
- All backend integration tests ran against a newly created, isolated PostgreSQL database via explicit process environment overrides. The temporary database was dropped afterward. Tests did not run against the application's database.
- Maven initially failed in restricted offline execution because the declared parent was not available there. Retried with permitted network access and the existing dependency versions; verification succeeded. No build configuration/version changes.
- Started the rebuilt backend; startup completed on port 8080. Frontend remains running on 5173. A read-only unauthenticated HTTP probe returned 401, consistent with the protected endpoint; no live checkout mutation was performed.

## Browser and UI acceptance

Used actual CartProvider, CartPage, CheckoutPage, ToastProvider and AdminVouchersPage with synthetic auth and mocked fetch responses in a temporary local harness. Every request was intercepted; no real order, payment or voucher was created through the browser.

- Deselected cart row 12 and opened checkout: URL and preview contained only row 11, with one product and its correct total.
- Remounted CartProvider and CheckoutPage, clearing in-memory selection as a reload would: preview still requested only row 11. URL parsing/reload persistence also has native Node coverage. This was a component remount test, not a full browser reload with a live authenticated session.
- Submitted the synthetic COD order: payload `[11]`; returned cart retained `[12]`. The same persistence behavior is covered by the real backend partial-checkout integration test.
- Missing selection and stale row 999 displayed recovery messages and no order form/preview request.
- Voucher start 2027-01-01 10:00 and end 10:59 failed native range validation (`min=11:00`, `rangeUnderflow=true`); 11:00 was accepted and serialized to the expected UTC hour. Optional expiration also remained accepted.
- Editing an existing voucher at its exact one-hour boundary retained its original timestamp seconds. Automated serialization coverage additionally preserves submillisecond precision.
- Existing labels, date controls, dialog focus restoration, loading/pending guards and error recovery retained. Period errors are associated with the end field and focus it. Existing responsive grid/modal layout was retained; no new layout, breakpoint, animation or design system introduced. Desktop screenshots inspected; a new mobile layout audit was not required for these data/validation changes.
- React review: selection parsing has stable dependencies; checkout query subscriptions clean up; no render-time clock reads added; no new waterfall or client authority over price/inventory.
- Security review: URL contains only row IDs; the backend continues to enforce authenticated cart ownership and authoritative totals. Server creation time is never accepted from the client.
- UI/UX and React skills were applied to the focused form/state behavior. A significant redesign/accessibility audit was not in scope, so no external design checklist fetch was needed. Existing white/cool-gray surfaces retained.

Screenshots: [Selected checkout](selected-checkout.png), [Voucher period hint](voucher-period.png). Synthetic request payloads: [Browser API evidence](browser-api-evidence.json).

Temporary HTML harness and agent tab removed. User tabs were preserved. No viewport override was left behind.
