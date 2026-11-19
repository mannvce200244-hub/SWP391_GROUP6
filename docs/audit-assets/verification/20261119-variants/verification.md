# Variants, quantity limits, POS layout and chat notifications

Verified 2026-11-19 on loopback PostgreSQL `m4n_test`. No production database,
live payment or real customer message was used for fixtures.

## Checks

- `mvnw.cmd clean verify`: 612 tests passed, zero failures/errors/skips; packaged
  Spring Boot JAR built. The test process used Hikari maximum pool size 5.
- `npm run lint` and `npm run build`: passed.
- `npm test`: 101/101 passed after the recheck. Three stale MoMo service
  expectations were corrected to the existing VNPay controller/checkout contract;
  legacy MoMo invoice labels remain covered. Production payment code was unchanged.
- Added integration coverage proves per-SKU price/stock, paged active siblings,
  accent-insensitive variant search, combined cart quantity limits, no stock
  deduction from cart edits, POS deduction of only the selected SKU, variant
  names in invoices, zero stock for newly created SKUs, paired field validation,
  duplicate rejection and database uniqueness under different casing.
- A 200-character base name plus 100-character label successfully produces a
  303-character invoice snapshot. Deployment migration widens all four snapshot
  name columns without changing historical values.
- Chat tests cover unassigned queue notifications without message text, assigned
  recipients, safe queue metadata access and denied transcript access before
  assignment. Frontend tests cover internal destinations, read notification
  navigation and opening the customer support dialog.
- Applied `20261119-product-variants.sql` twice on the local test schema; both
  executions succeeded, and all four snapshot columns have length 303.

## Browser evidence

- Product detail: input 15 with stock 9 clamps to 9 and disables plus. Selecting
  Tone Rê changes SKU, price from 100,000 to 150,000 VND, stock from 9 to 2 and
  resets quantity to 1. Out-of-stock variants remain inspectable online and are
  disabled for POS purchase.
- `pos-quantity.jpg`: exact variant added through POS picker; entering 15 clamps
  to 9 with an associated explanation.
- `pos-independent-scroll.jpg`: 40 catalog products; checkout stays within the
  1280×720 viewport (button bottom about 682px). The catalog and bill scroll
  independently; no catalog traversal is required to reach payment.
- `pos-mobile.jpg`: 390×844 viewport, long SKU wrapping, full product name,
  editable quantity and accessible payment action after a short page scroll.
  The catalog's scroll width equals its client width after fixing long SKUs.
- `cart-quantity.jpg`: the drawer accepts typed quantities, clamps excess input
  and receives confirmed stock/quantity from the backend.
- `staff-notification-chat.jpg`: a newly received queue alert navigates to the
  exact conversation, requires claiming before messages become accessible, and
  allows the assigned staff to reply.
- `customer-notification-chat.jpg`: clicking a staff-reply alert opens the
  corresponding customer support thread instead of the profile page.
- `admin-created-variant.jpg`: Admin creates a new variant from an existing
  grouped SKU, with its own generated code/barcode, editable price and zero stock.

Browser sessions were signed out, the temporary tab was closed and the viewport
override was reset. Task-specific servers were stopped after verification.

## Additional recheck

- Product detail: type 5 then immediately plus => 6; type 5 then minus => 4.
  Enter commits, Escape restores the previous value, and an empty field restores
  its previous quantity. Typing 15 with stock 9 clamps to 9 and disables plus.
- Cart drawer with asynchronous API updates: type 5 then minus => 4, with the
  confirmed total changing to 400,000 VND. There is no blur/click double update.
- Product detail with 4 already in the cart and stock 9 explains that at most 5
  more can be added; selecting 6 disables Add while Buy now remains usable.
  See `recheck-cart-limit.jpg`.
- POS: type 5 then plus => 6. Simulate stock dropping from 9 to 2 on the local
  database: the next preview blocks checkout and the quantity control explains
  the new limit. Minus brings an existing quantity 8 down to 2. After removing
  the last item and restoring stock to 9, adding the SKU again accepts quantity 9;
  the previous preview's cached stock does not constrain the new bill.
  See `recheck-pos-stock.jpg` (40 catalog entries; payment stays visible).
- A QA-only loopback proxy delayed chat-summary replies by 12 seconds. Switching
  to Closed before the reply arrived remained selected after it completed.
  A simulated 503 on recent notifications showed an error; restoring the connection
  cleared it through polling without closing/reopening the dropdown. Clicking
  the already-read notice then selected conversation 141 in Mine. See
  `recheck-chat-recovery.jpg`.
- On a 390x844 viewport, a 100-character unbroken variant label wraps within the
  product heading and picker. Document scroll width equals client width (375px,
  accounting for the browser scrollbar). See `recheck-variant-mobile.jpg`.
- Temporary stock/label changes were restored. The proxy, backend and frontend
  QA servers were stopped; browser logout, tab cleanup and viewport reset completed.

## Review and UI acceptance

- Controllers remain HTTP-only; services own validation and transactions.
  Variant queries use bound parameters/Criteria. Database uniqueness protects
  duplicate group/label creation; transaction snapshots retain the selected label.
- Customer identity/roles come from authentication. New staff summary access
  never exposes messages before assignment. Existing transcript ownership and
  payment/inventory locks remain in force.
- Shared quantity controls reduce duplicate behavior across product, cart,
  checkout and POS. Stock checking is feedback, never a reservation. Cached
  POS preview stock bounds further edits while the next preview loads.
- Current Web Interface Guidelines and project UI rules reviewed: labelled
  numeric input, visible focus, inline limit explanation, 44px touch targets,
  dialog focus restoration, neutral surfaces, loading/error/retry states and
  responsive overflow handling. No dependencies added.
- Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ProductServiceImpl.java
- Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/OrderServiceImpl.java
- Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/PosServiceImpl.java
- Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ChatServiceImpl.java
- Large file detected: m4n-frontend/src/components/admin/ProductFormModal.jsx
- Large file detected: m4n-frontend/src/features/chat/StaffChatWorkspace.jsx
- Large file detected: m4n-frontend/src/pages/CheckoutPage.jsx
- Large file detected: m4n-frontend/src/pages/PosDashboardPage.jsx
- Large file detected: m4n-frontend/src/pages/admin/AdminProductDetailPage.jsx

These owners were already large. Changes stay within the requested flows;
quantity control, variant picker/dialog and paired Admin variant fields have
explicit components. A broad decomposition of existing checkout/product/POS
workflows was not mixed into this feature and remains architectural debt.

## Deployment

Back up and apply the SQL migration, deploy the backend, then the frontend.
Configure real SKU groups/labels in Admin; do not infer existing products' tones
or duplicate stock automatically. Production migration and deployment are pending.
