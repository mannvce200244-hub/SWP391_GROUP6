# Direct purchase cart isolation — 2026-10-15

## Requirement and repair

The user reported Buy now increasing the cart badge. CartContext previously added
the product or overwrote its existing cart quantity before navigating to checkout.
Buy now now navigates with product ID and quantity without calling cart mutations.
Checkout supports an explicit direct source, including quantity edits and reloads.
The backend validates that source, reuses current pricing, voucher, shipping and
stock checks, and never attaches its temporary line to a persisted cart.

Input → positive product/quantity and exclusive source validation → server pricing,
shipping and stock checks → order and item snapshots → checkout/order response.
Direct purchase does not change the cart or deduct inventory. Selected-cart checkout
still consumes only the purchased rows. Malformed direct links block checkout.

## Files and boundaries

- Frontend: CartContext.jsx, cartSelection.js, ProductDetailInfo.jsx,
  CheckoutPage.jsx, orderService.js, directPurchase.js, useDirectPurchase.js.
- Backend: DirectPurchaseRequest, CheckoutPreviewRequest, PlaceOrderRequest,
  OrderServiceImpl. No controller, database schema or dependency change.
- Regression coverage: cartSelection.test.mjs, directPurchase.test.mjs,
  OrderServiceTest, CartCheckoutConcurrencyIntegrationTest,
  RbacSecurityAuthorizationIntegrationTest.
- Updated PROJECT_SCOPE, BUSINESS_RULES, API_CONTRACT_RULES,
  CUSTOMER_FLOW_INTEGRATIONS and FORM_VALIDATION_RULES for the explicit correction.

## Verification

- `npm run lint`, `npm run build`: passed.
- `node --test tests/*.test.mjs`: 30 passed, zero failures/skips.
- `mvnw.cmd -o test`: 410 passed, zero failures/errors/skips, isolated PostgreSQL
  database `m4n_checkout_fix_20261015_2`, external delivery disabled.
- `mvnw.cmd -o -DskipTests package`: passed after the full test run.
- Persistence tests cover direct preview repeated without cart writes, direct order
  with the same product quantity 3 retained while buying quantity 2, unrelated cart
  row preservation, direct order without creating a cart, inventory unchanged,
  mixed sources, inactive products, insufficient stock and nested DTO validation.
- Browser tested against isolated backend 8081/frontend 5174 and synthetic seeded
  customer: cart quantity 3; direct checkout quantity 2; increase/decrease; reload;
  cart drawer still quantity 3; normal cart checkout quantity 3; different product
  direct purchase and repeated Buy now keep the badge at 3; malformed quantity
  displays recovery error and no order button; trailing slash retains direct intent.
- Mobile viewport requested at 390 pixels: actual content width and scroll width
  both 375; no horizontal overflow; no browser console errors recorded.
- Screenshots: `20261015-direct-checkout.png` (cart 3, checkout 2) and
  `20261015-direct-checkout-mobile.png`.
- Main backend rebuilt and restarted as PID 4732 with schema validation and
  development seeding disabled. Health 200; live OpenAPI exposes directPurchase
  on both preview and order requests. No orders created in the user's main DB.
- After a later process exit, restored the same packaged backend as PID 31484;
  port 8080 started successfully. Payment options correctly report MoMo unavailable
  because its enable flag is false and merchant/callback settings are absent.
- Closed the temporary tab, reset viewport, stopped isolated frontend/backend,
  and dropped both temporary databases after verification.

## Review and limits

Large file detected: m4n-frontend/src/pages/CheckoutPage.jsx

Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/OrderServiceImpl.java

Both were already over project review thresholds. Direct state/subscription and
product loading were extracted to a focused checkout hook. Existing backend
calculation and transaction ownership were reused to avoid parallel order logic.
Broad refactoring of the existing form and fulfillment service is outside this fix.
Applicable scope, validation, state, keyboard operation, error recovery, responsive
and backend-authority acceptance checks passed. No new dialogs, typography,
animations or visual redesign were introduced. Live GHN/payment-provider completion
was not part of this cart regression; existing provider tests remain green.

## Follow-up recheck — 2026-10-15

- Re-inspected Buy now, direct checkout URL parsing, quantity changes, preview,
  order creation and cart refresh in the current source. No further defect found
  in the cart-isolation paths; no production code changes were necessary.
- Fresh targeted backend run:
  `mvnw.cmd -o -Dtest=CartCheckoutConcurrencyIntegrationTest#directPurchase*,OrderServiceTest test`:
  34 passed with zero failures/errors/skips, using isolated PostgreSQL database
  `m4n_direct_recheck_20261015`. Database dropped afterward.
- Fresh frontend native tests: 30 passed.
- Headless Chrome with intercepted API fixtures verified cart quantity 3 versus
  direct quantity 2, increase/decrease, reload, direct order payload, unchanged
  badge after order, a different product, removing direct intent, normal selected
  cart checkout, malformed direct URL and direct checkout during a cart GET failure.
  No cart POST/PUT/DELETE requests and no browser errors in the successful run.
  The browser order was mocked; real database behavior is covered separately by
  the targeted backend tests. No orders were created in the user's database.
- Live backend OpenAPI exposes `directPurchase` for both preview and place order;
  public catalog probe returned HTTP 200. Existing backend PID 33960 and frontend
  PID 26116 remained running; no restart was needed.
- Screenshot: [direct checkout recheck](20261015-direct-recheck.png).
  Temporary browser script/debug image removed and browser closed.
