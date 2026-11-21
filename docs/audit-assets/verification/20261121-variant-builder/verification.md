# Variant creation, receiving and customer selection

Verified on 2026-11-21. Browser fixtures and integration tests used loopback
PostgreSQL `m4n_test`, never the configured Neon application database.

## Validation

- `mvnw.cmd clean verify`: 618 tests passed, zero failures/errors/skips; JAR built.
- `npm test`: 103 passed, zero failures/skips.
- `npm run lint` and `npm run build`: passed.
- Added backend checks for independent batch prices/identifiers/zero stock,
  complete rollback, shared uploaded images and rollback cleanup, nested request
  validation, Admin authorization, inactive SKU selection and per-variant QC.
- QC case: receive 5, reject 2, accept 3 on Tone Re only; the other SKU's stock and
  the selected SKU's listed price remain unchanged. Cost uses accepted quantity.
- Native frontend tests cover construction of per-row requests, equal/different
  prices, optional generated identifiers and duplicate/invalid field feedback.

## Browser acceptance

- Admin created three variants in one submission: Tone Do 650,000 VND, Tone Re
  720,000 VND, Tone Mi 650,000 VND. Each received an independent generated SKU,
  barcode and zero balance. A duplicate tone ignoring case was rejected before
  sending the batch. See `admin-variant-rows.jpg`.
- From Do's Inventory row, Admin opened a receipt and switched to Re. Previous
  quantity/unit cost were cleared. A new draft for 5 Re units at 420,000 VND was
  confirmed with 2 rejected: Re stock became 3, with actual cost 1,260,000 VND;
  Do/Mi stock stayed 0. See `stock-variant-selection.jpg`.
- Admin used Create more variants inside the receipt dialog to create Tone Fa
  at 790,000 VND. The parent dialog resumed with Fa's new SKU selected, zero stock
  and empty quantity/unit cost. No receipt is created by creating a variant.
- Customer chose Re from Do's product page. Selected price immediately changed
  to 720,000 VND while details were pending; purchase stayed disabled until those
  details arrived. Scroll remained at the purchase section (about 195px desktop),
  rather than resetting to the top. See `customer-selected-tone-price.jpg`.
- Switching to out-of-stock Mi displayed 650,000 VND and disabled purchase.
  Back navigation and rapid Fa -> Re selection ended on Re, quantity 1.
- Adding Re to the cart added its own product ID; Buy now opened
  `/checkout?productId=1556&quantity=1` and showed Re, not another tone.
- At 390x844, customer selection and Admin additional-row fields stayed within
  viewport width. See `customer-mobile-variants.jpg` and `admin-mobile-rows.jpg`.
- Sessions were logged out, temporary tab closed, viewport reset and isolated
  QA backend/frontend stopped. Normal localhost 8080/5173 services remain running.

## Review

- No dependency or migration added. Batch creation uses existing product, price,
  code/barcode, media and zero-stock rules. Controllers only delegate DTOs.
- Admin endpoints require Admin/Super Admin; public variants remain active-only.
  Stock receiving still creates one SKU receipt and follows the original QC flow.
- Only trusted backend responses supply displayed sale prices/stock. Checkout
  and inventory confirmation retain their authoritative checks. Stale selection
  responses are discarded. Customer variant URLs stay within central routing.
- All fields have labels, row errors, visible focus and touch-sized controls.
  Dialogs retain keyboard containment and neutral white/cool-gray surfaces.
- Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ProductServiceImpl.java
- Large file detected: m4n-frontend/src/components/admin/ProductFormModal.jsx
- Large file detected: m4n-frontend/src/pages/admin/AdminInstrumentsPage.jsx
- Large file detected: m4n-frontend/src/pages/admin/AdminProductDetailPage.jsx

These files were already large. The additional-row editor is a separate focused
component and its validation/request construction is covered by native tests.
Unrelated product/POS refactoring was kept out of this change.

## Rollout

The existing variant schema is sufficient. Deploy backend before frontend for
the new Admin batch/list endpoints. No production product, receipt or stock was
created by this task; the normal local backend was restarted with the new JAR.

## Recheck on 2026-11-21

- Fixed clicking the already selected receipt tone clearing quantity/unit cost.
  Browser: enter 12 at 400,000 VND on Do, click Do again: both values remain;
  switch to Re: both clear.
- Fixed retry after creating a variant inside receiving loading the original
  product instead of the new SKU. An isolated HTTP proxy injected one 503 on
  the new SKU detail request. Submission remained disabled; Retry loaded
  M4N-HOI-1559, Tone Sol (G) recheck, at 810,000 VND with empty quantity/cost.
  The unresolved new SKU no longer displays the original SKU as its heading.
  See `recheck-retry-selected-sku.jpg`.
- Fixed the gallery retaining another tone's selected thumbnail. Starting on
  Do's second photo and selecting Re now shows Re's primary photo, 720,000 VND,
  stock 3 and quantity 1. See `recheck-customer-gallery.jpg`.
- Browser quantity regression: entering 15 when Re stock is 3 immediately
  clamps to 3, displays the stock message and disables increment.
- Re-ran all 103 frontend tests, lint and production build successfully. Backend
  source is unchanged in this recheck; the 618-test clean verify above remains
  the backend validation for this PR.
- Recheck used isolated ports 8083/8084/5183 and loopback `m4n_test` only.
  No receipt/order/payment was submitted. The additional test SKU and gallery
  references exist only in the test database. Sessions were logged out and the
  temporary browser tab closed. QA services were stopped; normal 8080/5173
  services remain running.
