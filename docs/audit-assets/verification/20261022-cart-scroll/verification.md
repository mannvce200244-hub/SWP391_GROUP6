# Catalog scroll + cart drawer recheck — 2026-10-22

## Finding

The supplied screenshot matches the previously diagnosed sticky-header backdrop-filter containing-block issue. The current `src/features/cart/CartDrawer.jsx` already renders its fixed drawer through a portal directly under `document.body`; it also retains a solid white full-height flex panel, nonshrinking header/footer and independently scrolling body. See the original `20261015-cart-drawer.md` record. No additional application source change was needed or made in this recheck.

The local frontend was stopped and dependencies absent. Restored the locked dependencies with `npm ci --include=optional --no-audit --no-fund`, including the existing Windows native binding, and started Vite on port 5173. No dependency versions, manifests or lockfile changes were requested. Regenerated `dist` with the current source. The backend was not running; real catalog data could not load, so no live authenticated cart mutation was attempted.

## Browser evidence

- Actual `/products`: scrolled the page, opened the real header cart and verified full-height opaque drawer/login content over a full-screen backdrop.
- Isolated temporary harness used the actual SiteHeader, ProductGrid, CartDrawer and context providers with synthetic cart data. No real customer/cart data or authentication tokens were persisted. A stubbed notification response prevented backend calls from the fixture.
- At 1280 × 720, opened the empty cart after scrolling to `scrollY=720`: dialog bounds were top 0, bottom 720, height 720; dialog parent was `document.body`; body overflow was hidden. Empty-state text and action remained within the white panel. Evidence: [Empty desktop cart](empty-desktop.png).
- Closing the drawer retained `scrollY=720`, restored body overflow and returned focus to the cart trigger.
- For eight items, wheeling over the cart scrolled its list (content height 1307, visible height 446, scrollTop approximately 861); the close and checkout buttons remained visible. Escape closed it and restored focus.
- At 375 × 667, the populated drawer occupied the viewport without horizontal document overflow (page width 375). Checkout bounds remained within the viewport, bottom approximately 647. Evidence: [Populated mobile cart](populated-mobile.png).
- Existing named dialog, focus containment, white surfaces and neutral backdrop retained. No new design tokens, UI redesign or business behavior introduced.

## Checks and cleanup

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 60 passed, zero failed/skipped.
- Deleted the temporary HTML fixture, closed the agent-created tab, reset the viewport override and removed the task-local npm download cache. The user tab was preserved. Vite remains running for local review.

The screenshot's exact old runtime/build is unavailable, so this verifies the current source and regenerated build rather than claiming a new source patch or determining which prior build produced the screenshot.
