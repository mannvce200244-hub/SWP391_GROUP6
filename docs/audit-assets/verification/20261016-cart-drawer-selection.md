# Cart drawer product selection — 2026-10-16

## Scope and implementation

- [x] Approved selected-cart-item checkout now works from the header drawer.
- [x] Existing CartContext owns selection shared by drawer, cart page and checkout.
- [x] Each item has a labelled native checkbox; select-all shows a mixed state for partial selection.
- [x] Selected-item subtotal uses the existing VND formatter. Empty selection disables checkout and explains the next step.
- [x] Checkout navigation passes through the existing selected-item flow. No API, backend rule, dependency or cart persistence changed.
- [x] CartDrawerItem extracts the existing item row and its controls as a focused component; the drawer is now below the 250-line review trigger.

## Verification and UI acceptance

- [x] `npm run lint`, `npm run build`: passed.
- [x] `node --test tests/*.test.mjs`: 30 passed, including cart selection reconciliation and direct purchase isolation.
- [x] Edge on the running HTTPS demo: two existing cart entries; deselect all blocks checkout; select one updates subtotal; checkout preview sends only that item's ID.
- [x] Selection remains synchronized when navigating between drawer, checkout and the cart page.
- [x] Select-all, partial/mixed selection and empty selection verified.
- [x] Native checkbox keyboard Space operation verified. Escape closes the drawer and restores focus to its opener. Global visible focus styles apply.
- [x] Reviewed screenshots at 1440, 768, 390 and 320px. No drawer or item-row horizontal overflow. Checkbox targets are at least 44px; quantity/remove controls remain operable.
- [x] Accessible labels, live selected count/subtotal, fixed thumbnail dimensions and neutral surfaces reviewed against the project design rules and applicable Web Interface Guidelines.
- [x] Existing authentication, loading, retry/error and empty-cart branches retained; selection controls disable during cart updates, and checkout also disables on cart errors.
- [x] No cart quantity changes, deletions, order submissions or payments were performed during browser verification. No page JavaScript errors were observed.
- [x] No new form validation, network/security boundary or backend change: backend suites are N/A for this frontend-only change. Order completion remains outside this visual/selection verification.

Evidence: [desktop](20261016-cart-drawer-selection.png),
[tablet](20261016-cart-drawer-768.png),
[mobile](20261016-cart-drawer-390.png),
[narrow mobile](20261016-cart-drawer-320.png).

Changed UI audit: `CartDrawer.jsx` and `CartDrawerItem.jsx` passed applicable
selection, labels, focus, numeric formatting and responsive checks. No unresolved
requirement or dependency decision remains for this change.
