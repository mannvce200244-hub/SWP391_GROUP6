# Product families and multi-product promotions — 2026-11-22

User-approved update: one logical product contains independently sellable variants.
Catalog, product management and inventory balances show one row per logical
product; purchasing and receiving select the intended SKU. No manual group-name
field is required. This supersedes the group-string-only model in BR-PRODUCT-01.

## Persistence and compatibility

- Add a ProductFamily parent with a one-to-many list of existing Product/SKU rows.
  The existing `products.id` values remain transaction/SKU identities so cart,
  order, invoice, review, stock and payment references keep their meaning.
- The parent owns the common display name. Each variant retains its label, SKU,
  barcode, price, weight, active state, media and inventory. Creating variants
  remains atomic and starts their inventory at zero. QC receipts alone add stock.
- Existing explicit groups are migrated together; ungrouped SKUs each get their
  own parent. Do not infer relationships from coincidentally matching names.
- Parent references replace editable group strings. Legacy group fields remain
  readable for old API clients; old group-based creation is supported during
  transition. A frontend Map can collect data but never replaces the persisted
  parent relationship or database grouping before pagination.
- Grouped list requests explicitly request family grouping; legacy per-SKU list
  clients remain compatible. Inventory quantities on grouped rows represent the
  sum of their variants; receipts always target exactly one SKU.
- POS search applies its 40-result limit after grouping; many tones of one
  product do not displace unrelated products. Barcode scans remain SKU-specific.
- User refinement (2026-11-22): POS catalog shows one compact parent card. Clicking
  it opens product/variant information inside the current invoice panel. Clicking
  a product or tone never adds an invoice line: only its explicit + button adds
  that SKU. Plain products have a separate + on the catalog and preview; variants
  have their own + in the bill-side picker. Exact barcode scans keep direct add.
  This supersedes the earlier inline-choices-on-catalog presentation.
- User refinement (2026-11-23): online Add to cart / Buy now and POS product
  inspection use a shared purchase sheet with SKU image, current price, stock,
  variant choices and editable quantity. Mobile uses a bottom sheet; desktop a
  centered dialog. Choosing a SKU never purchases it. Only the explicit action
  adds that SKU/quantity or opens direct checkout. POS's plain-SKU + and exact
  barcode scans retain their one-item shortcut. This supersedes the previous
  bill-side variant preview. Existing single-label variants remain the model;
  no invented attribute combinations, delivery estimates or discount claims.
  Add allowance subtracts the same SKU already in the cart/bill. Buy now uses
  full displayed SKU stock and never mutates the cart. Prices and stock remain
  server-authoritative, with fresh SKU detail checked before confirmation.
- User refinement (2026-11-23): `ProductFamily` may define up to 2 named option
  dimensions (`option1Name`, optional `option2Name`) and each SKU stores its
  corresponding `option1Value` / `option2Value` (automatically formatted into
  `variantLabel = "opt1 · opt2"` or `"opt1"` for backward compatibility across
  cart/order/invoice/PDF snapshots). Admin create generates Cartesian-product SKU
  rows; Storefront, Purchase Sheet, POS, and Admin pickers render attribute
  groups independently and resolve the matching SKU combination. Legacy
  single-label families remain supported.
- Adding a variant keeps the parent's name read-only. The shared name is edited
  through the existing product editor; each variant's price and stock remain independent.

## Promotions and weight

- New/edited product programs can select multiple logical products, applying
  their discount to the variants belonging to each selected parent. Preserve old
  single-SKU programs until explicitly edited; retain existing best-rate/tie,
  rounding, snapshots, authorization and optimistic concurrency behavior.
- Promotion period validation is checked in both UI and backend. The user
  delegated the choice: use the voucher-consistent minimum of one hour after
  both original creation and optional start. No end means no expiry. Existing
  programs are revalidated when edited; editing uses their original creation.
- User refinement (2026-11-25): weight is required when creating or editing a
  product/SKU, including variants. Existing records are not assigned estimated
  weights; Admin supplies a positive weight when saving an edit.
- Required weight accepts a positive decimal without the old 3-decimal/7-integer
  input restriction. PostgreSQL uses unconstrained numeric, with no rounding to
  zero. Shipping-provider and payable-amount bounds remain enforced when quoting.

## Rollout

User refinement (2026-11-25): product create/edit and variant forms add images
through media URLs only. Remove the local file picker and multipart submission
from these frontend flows; existing product media remain usable.

Additive migration and regression checks are required before deploying.
Apply `migrations/20261123-variant-attributes-and-global-threshold.sql` after
the product-family migration and before starting the attribute-aware backend
with schema validation.

Production recovery (2026-11-25, explicitly requested by the user): a deployment
failed validation because all four option columns were missing. After a verified
full database backup, the existing migration was applied transactionally and the
crashed Railway container restarted. The four columns and both checks were
verified; recorded row counts and inventory total were unchanged. Railway health,
catalog through Railway/Vercel and Google options returned HTTP 200. The migration
also normalized six legacy per-SKU alert thresholds to the approved common value
5. No SKU labels or historical transaction snapshots were rewritten.
