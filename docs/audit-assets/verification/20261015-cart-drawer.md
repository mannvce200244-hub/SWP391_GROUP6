# Cart drawer verification — 2026-10-15

## Reported issue and fix

The product-page screenshot showed a clipped cart drawer after adding an item.
The drawer was nested inside the sticky site header. Once the page scrolls, the
header's backdrop filter establishes a containing block for fixed descendants.

Updated `m4n-frontend/src/features/cart/CartDrawer.jsx` to render through a React
portal into `document.body`. The drawer now uses viewport height independently
of the header. Its header and footer retain their height, its item list scrolls,
and its width stays inside narrow viewports, including the close button.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 30 passed, 0 failed.
- Headless Chrome with intercepted API fixtures: passed at 1440×900, 375×667,
  768×900 and 667×375. Drawer height matches the viewport; header/footer and
  horizontal button bounds remain visible; eight items scroll within the body.
- Opening at scroll position 500 with the header blur active preserves the
  position and renders the drawer directly under `document.body`.
- Add-to-cart sends one POST with the chosen product and quantity and increments
  the badge once. A simulated 503 preserves the previous badge and shows the
  existing error message. Quantity updates also update the badge correctly.
- Escape, focus restoration, Tab/Shift+Tab focus wrapping and body scroll unlock
  passed. No uncaught page errors occurred.

Browser API fixtures isolate these checks from the user's actual cart. They
verify frontend behavior and do not establish real database mutation results.
No backend, schema, dependency or business-rule changes were required.

## UI and security review

The existing accessible dialog name, button labels and focus-management hook are
retained. White/cool-gray surfaces are retained. The portal introduces no HTML
injection or new user-input/network processing. Existing API errors are preserved.

## Screenshots

- [Desktop after fix](20261015-cart-drawer-after.png)
- [Mobile after fix](20261015-cart-drawer-mobile.png)
