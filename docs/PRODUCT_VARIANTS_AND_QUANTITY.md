# Product variants, quantity controls and support notifications

The group-string-only model below is superseded by the user-approved 2026-11-22
parent/SKU relationship in `PRODUCT_FAMILY_UPGRADE.md`. Earlier entries record
compatibility/history; parent references now replace the manual group field.

Approved by the user on 2026-11-19: each variant has its own SKU, barcode,
price and inventory. Customers and POS choose the SKU they want to buy.

## Variants

- Each sellable variant remains a Product row, with optional `variantGroup` and
  `variantLabel` metadata. For example, two SKUs can share group “Sáo trúc 6 lỗ”
  with labels “Tone Đô (C)” and “Tone Rê (D)”. Both metadata fields must be present
  or both absent; each is at most 100 characters. Labels are unique within their
  group, ignoring case. PostgreSQL also enforces this uniqueness against races.
- Each SKU retains its independent existing price, inventory row, stock receipts,
  promotions, barcode and transaction identity. Creating a variant starts at zero
  stock; only confirmed stock receipts add inventory. The shared group holds no
  stock or price of its own.
- Admin can configure the current SKU's group/label in the existing product form,
  then use “Thêm biến thể” on product detail to prefill a new SKU. Price and other
  attributes can be edited independently. Existing products are not assigned
  guessed tones or groups automatically.
- `GET /api/v1/products/{id}/variants?page=0&size=20` lists active siblings from
  the same group, with price, stock and label. The page size is capped at 100;
  pagination uses fixed label/ID order. Ungrouped products return only themselves.
- Product detail lets shoppers switch SKUs. User clarification (2026-11-21): POS
  groups related SKUs into one catalog card and shows tone buttons directly on
  that card, without a selection dialog. One click adds that exact variant to
  the bill. Show effective price/stock per variant, including disabled out-of-stock
  variants. Load the active family even when search matched only one SKU; large
  families retain the existing pagination. Scanning a specific SKU/barcode still
  adds that exact variant directly; ungrouped products keep one-click addition.
- Cart/order/invoice/receipt display names include the variant label. New order,
  invoice and stock-document snapshots retain that label. Historical snapshots
  and product IDs are preserved.

## Admin creation and receiving update — 2026-11-21

- The create form includes an additional-variants editor. Its initial SKU uses
  the name/label/code/barcode/price at the top; each extra row has its own label,
  optional code/barcode and required positive listed price. The common group,
  category, specifications and gallery are copied into each independent SKU.
  Equal prices are allowed; a different tone does not require a different price.
- `POST /api/v1/admin/products/variants` accepts `{variants: CreateProductRequest[]}`.
  All rows must belong to the same nonblank group and satisfy existing product
  validation. It returns the created detail DTOs in input order. The transaction
  creates all SKUs/inventory rows or none. No stock is added during this operation.
- `POST /api/v1/admin/products/variants/with-images` accepts the same request as
  multipart `product` plus existing `images` parts. Validated uploads are stored
  once, with a media reference on each SKU. Rollback removes the uploaded files.
- Admin list/detail offers adding more variants to an existing group. The Admin
  detail shows sibling prices/stock. `GET /api/v1/admin/products/{id}/variants`
  pages siblings, including inactive and zero-stock SKUs for stock receiving;
  it is restricted to Admin/Super Admin. Public selection remains active-only.
- Stock receiving lets Admin select the intended tone, or create additional
  variants from the dialog. Changing SKU clears quantity and purchase unit cost.
  Each receipt still represents one SKU/batch and follows the existing QC flow.
  Accepted units affect only that SKU; purchase unit cost never changes its
  listed sale price. Group/label search is available in Inventory.
- Receiving loads SKU detail and the first variant page in parallel, then
  reveals the form together. Admin selection/receiving display listed prices;
  customer selection still displays effective promotional prices. Reuse loaded
  pages when changing the selected SKU; refresh after creating a new variant.
- When adding to an existing group, the form is titled “Thêm biến thể cho …”
  and submits with “Tạo biến thể”. Shared information is prefilled and editable;
  SKU/barcode/label are new. Editing an existing SKU still uses “Lưu thay đổi”.
- Customer variant selection preserves the purchase section's scroll position,
  updates the visible selected price immediately from the variant response, then
  loads that SKU's current details. Purchase is disabled until the detail succeeds.
  Late responses cannot overwrite the latest selection. URL/back/reload identifies
  the selected SKU; quantity resets to one on a SKU change.
- This extension needs no additional database migration or dependency. Deploy
  backend before frontend for the new Admin endpoints.

### Variant form clarification — 2026-11-22

- Adding to an existing product opens with exactly one new SKU. Optional bulk
  rows are under “Tạo nhiều biến thể cùng lúc”; each added row creates one more
  SKU. The submit count includes the new SKU at the top and all added rows.
  Empty added rows must be completed or removed, never silently discarded.
- Variant mode requires both group and label even for a single new SKU. Prices
  can match an existing variant; labels, SKU and barcode remain unique.
- `CreateProductRequest.isActive` is optional: omitted/null preserves the existing
  active default; false creates an inactive SKU. JSON and uploaded-image creation,
  including batches, honor the form's selling-status checkbox atomically.

## Quantity and POS layout

- Product detail, cart drawer, cart, checkout and POS share editable quantity
  controls. Plus stops at the displayed SKU stock. Typing above that stock clamps
  the field immediately and explains the limit; blur/Enter commits a valid integer.
  Clearing a field and leaving it restores the prior value; Escape cancels editing.
- A plus/minus click while editing uses the typed quantity and submits one update.
  If newer stock is lower than a bill/cart quantity, the control explains the new
  limit; minus brings it down to that limit. Product detail also shows quantities
  already in the cart and prevents adding a combined quantity above stock. Buy-now
  quantities remain independent of the cart.
- Adding to an existing cart row checks its combined quantity against current
  inventory. Updating a row also checks stock. These checks provide early feedback;
  they never reserve or deduct inventory. Online confirmation and POS settlement
  retain their authoritative transaction-time checks.
- On desktop, the catalog and bill body scroll independently. Payment remains
  outside the bill's scrolling body. On smaller screens, the catalog has a bounded
  scroll area so users can reach the bill without traversing every product.
- POS stock remembered from previews is cleared for an empty/new bill and on
  retry, so a previous bill's low stock does not block newly available inventory.

## Support notifications

- Customer messages notify the assigned Online Staff. If no one has claimed the
  open chat, active Online Staff receive a queue notification without message text.
- Staff notification polling checks for new activity every 10 seconds and shows
  a toast for new chat notifications. Initial historical unread notifications do
  not repeatedly produce toasts.
- Clicking notifications marks them read and opens their destination, including
  already-read notifications. Staff chat links select the referenced conversation;
  customer chat notifications open the support dialog and the referenced thread.
- Late notification lookups cannot overwrite a newer manual queue/conversation
  selection. Successful staff polling clears temporary notification-load errors.
- Queue metadata lookup is restricted to active Online Staff. Messages still
  require customer ownership or current staff assignment. Closed chats belonging
  to a different staff member remain inaccessible through this lookup.
- Notification destinations stay within the application; external and disguised
  URLs are rejected.

## Rollout

Back up the database, then apply `migrations/20261119-product-variants.sql` before
deploying the backend. Deploy the frontend after the backend so stock quantities
and variant metadata are available to the new controls. No production database
was changed by this implementation task.

The migration also widens transaction snapshot names to 303 characters so the
existing 200-character product name and 100-character variant label fit in full.
