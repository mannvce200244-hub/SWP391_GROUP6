# Product variants, quantity controls and support notifications

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
- Product detail lets shoppers switch SKUs; POS shows a variant picker for grouped
  products. Scanning a specific SKU/barcode adds that exact variant directly.
- Cart/order/invoice/receipt display names include the variant label. New order,
  invoice and stock-document snapshots retain that label. Historical snapshots
  and product IDs are preserved.

## Quantity and POS layout

- Product detail, cart drawer, cart, checkout and POS share editable quantity
  controls. Plus stops at the displayed SKU stock. Typing above that stock clamps
  the field immediately and explains the limit; blur/Enter commits a valid integer.
  Clearing a field and leaving it restores the prior value; Escape cancels editing.
- Adding to an existing cart row checks its combined quantity against current
  inventory. Updating a row also checks stock. These checks provide early feedback;
  they never reserve or deduct inventory. Online confirmation and POS settlement
  retain their authoritative transaction-time checks.
- On desktop, the catalog and bill body scroll independently. Payment remains
  outside the bill's scrolling body. On smaller screens, the catalog has a bounded
  scroll area so users can reach the bill without traversing every product.

## Support notifications

- Customer messages notify the assigned Online Staff. If no one has claimed the
  open chat, active Online Staff receive a queue notification without message text.
- Staff notification polling checks for new activity every 10 seconds and shows
  a toast for new chat notifications. Initial historical unread notifications do
  not repeatedly produce toasts.
- Clicking notifications marks them read and opens their destination, including
  already-read notifications. Staff chat links select the referenced conversation;
  customer chat notifications open the support dialog and the referenced thread.
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
