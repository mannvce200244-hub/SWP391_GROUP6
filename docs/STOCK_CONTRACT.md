# Approved stock documents and movement history

Approved by the coordinating agent after the user's instruction to complete the
remaining stock-management scope. Applies to Admin and Super Admin only.

## Lifecycle and balances

- Each document contains one Product, a positive Java integer quantity, and type
  `RECEIPT` or historical `ISSUE`. Status is `DRAFT` then `CONFIRMED` only.
  User-approved update (2026-10-29): each receipt represents one inbound batch of
  a Product, with its immutable purchase unit cost. New UI exposes receipt creation
  and confirmation only; manual decrease/issue controls are removed. Historical issues remain
  readable and the legacy service/API contract is retained for compatibility.
  No supplier CRUD, payment settlement, draft edit/delete/cancel, or return settlement flow.
- Creation records the document and authenticated creator; inventory is unchanged.
- Confirmation locks document, Product, then Inventory. A confirmed document
  rejects another confirmation with safe 409. Every balance/movement/document
  update commits together, otherwise the document remains draft.
- Receipt confirmation supplies rejected quantity in `0..quantity` (omission
  means zero) and a rejection reason if any item is rejected. Accepted quantity
  is `quantity - rejectedQuantity`. Only accepted quantity increases sellable
  stock; fully rejected receipts are valid and record zero accepted quantity.
  Rejection means rejected/returned inbound goods; it does not create a sellable
  stock deduction or external supplier settlement.
- New receipts require `unitCost`, an integer VND amount in `0..9999999999`.
  Estimated batch cost = requested quantity × unit cost; actual received cost =
  accepted quantity × unit cost. The user explicitly chose actual accepted quantity
  as the cost basis (50 requested, 48 accepted → recorded batch cost for 48).
  Actual cost remains null before confirmation. Legacy receipts have unknown cost
  (null), never an invented zero. Backend uses BigDecimal; the three new money
  response fields are decimal strings so large values retain precision in JSON.
- Product creation initializes stock at zero. Product screens link to Inventory;
  receiving goods is a separate draft and QC confirmation workflow.
- Issue confirmation accepts no rejected quantity/reason, checks current balance
  and deducts the full quantity. Insufficient stock leaves the draft unchanged.
- Quantity addition cannot overflow; deductions cannot make stock negative.
  Confirmation never auto-retries or confirms online orders.

## Request fields

Existing `POST /api/v1/inventory/{productId}/import` accepts `quantity` (required
integer `1..2147483647`), `unitCost` (required integer VND), and `notes` (optional string up to 500 characters), and
now creates a RECEIPT draft. Existing `/issue` accepts the same positive quantity
and `reason` (required trimmed nonblank string up to 500), creating an ISSUE
draft. Both return `StockDocumentResponse`, not a changed stock balance.

`POST /api/v1/inventory/documents/{id}/confirm` accepts an object:
`{rejectedQuantity?, rejectionReason?}`. Rejected quantity is a nonnegative Java
integer bounded by the receipt quantity; rejection reason is trimmed and up to
500 characters. Issue requests omit these fields (zero/blank also allowed).

## Responses and lists

`StockDocumentResponse`: `id`, `productId`, `productCode`, `productName`, `type`,
`status`, `quantity`, `reason`, `createdBy`, `createdAt`, `confirmedBy`,
`confirmedAt`, `acceptedQuantity`, `rejectedQuantity`, `rejectionReason`,
`quantityBefore`, `quantityAfter`, `unitCost`, `estimatedAmount`, `receivedAmount`.
The last three fields are nullable decimal strings. Confirmation fields are null while draft;
Product code/name are immutable document snapshots.

`GET /api/v1/inventory/documents` returns Spring `Page`; optional `productId`,
`type`, `status`. Default page size 10, sort `createdAt DESC,id DESC`; allowed sort
keys `id`, `createdAt`, `confirmedAt`, directions ASC/DESC. Blank filters omitted.

`GET /api/v1/inventory/movements` returns Spring `Page`; optional `productId`,
`type`. Default size 10, `createdAt DESC,id DESC`; allowed keys `id`,`createdAt`.
Response: `id`, `productId`, `productCode`, `productName`, `type`, `quantity`,
`quantityBefore`, `quantityAfter`, `rejectedQuantity`, `rejectionReason`, `reason`, `actorEmail`,
`createdAt`, `sourceType`, `sourceId`. Existing historical rows without snapshot
or source fields use current Product code/name, source null, rejected quantity0.

New movement types: `RECEIPT`, `ISSUE`, `ORDER_CONFIRMATION`, `POS_SALE`,
`ORDER_CANCELLATION`. Legacy `IMPORT` remains readable/filterable. Source types
are `STOCK_DOCUMENT`, `ORDER`, `INVOICE`; source ID is the persisted originating
record ID. Each confirmed document creates one movement, including fully rejected
receipts. Online confirmation, finalized POS and confirmed-order restoration
also append movements in their existing transactions, without lifecycle changes.

## UX and verification

Existing stock actions say **Nhập kho / Nhập thêm hàng** and show draft creation success,
never claim the balance changed. The Inventory page has current balance, paged
documents and paged history views. Draft confirmation displays authoritative
document quantity; receipt QC shows accepted/rejected calculation and reason;
issue confirmation states its stock effect. Busy/field/global errors preserve
inputs; stale confirmations reload state; keyboard/focus and neutral surfaces
follow existing shared UI rules. All backend mutations and pages remain Admin/
SuperAdmin authorized.

Verify create-no-effect, partial/all rejection, insufficient issue rollback,
overflow rollback, duplicate/concurrent confirmation, concurrent POS/issue stock,
history origin/balances, pagination/filter/sort, role denial, and UI draft/confirm
feedback using existing dependencies only. The feature SQL migration is reviewed
separately and applied to existing PostgreSQL schemas before deployment.
