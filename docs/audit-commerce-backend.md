# Backend commerce audit — 2026-10-10

## Scope and method

Reviewed the commerce service interfaces/implementations, transport controllers,
request/response DTOs, mappers, entities, repository queries, and existing tests
for Cart, Checkout/Order, Inventory, POS/Invoice, Voucher/Promotion, Review,
Admin/Online Staff Dashboard, and invoice PDF. Product inventory thresholds were
coordinated with the master-data agent; customer and Admin/POS contracts were
coordinated with both frontend owners.

Read the scope, business, code-quality, backend, database, API, testing, and
development rules and the local `java-springboot` and `code-security` skills.
The PDF skill supplied the rendering/visual-verification workflow. No dependency
was added. Controllers remain transport-only. Source comparison uses the original
snapshot saved outside the repository because this workspace has no Git metadata.

## Demonstrated defects and repairs

| Area | Defect/evidence | Repair |
| --- | --- | --- |
| Cart creation/update | Concurrent first additions could race the unique cart row or lose a quantity increment. Checkout could consume the same cart concurrently. | Mutations and checkout acquire the same authenticated User row lock before finding/creating the cart; read endpoints remain normal reads. Regression verifies one cart, both increments, and exactly one successful checkout. |
| Quantity integrity | Duplicate POS lines and stock increments could overflow Java integers; direct service calls could use negative issue quantities. | Validate positive quantities before mutation, consolidate with overflow checks, bound total cart/POS quantity, and use `Math.addExact` for stock import/restoration. No failed operation persists negative inventory. |
| Checkout feedback | Preview skipped inactive products but actual placement rejected them. | Preview and placement both reject unavailable products with a removal/retry message; totals use current persisted product prices. |
| Order pagination | Customer history loaded an unbounded list; status filtering would happen after loading/paging in the client. | `GET /api/v1/orders/me` returns a Spring `Page`; owner and optional status are queried before pagination, default size 10/newest first. Customer frontend was updated in the same audit. |
| Order cancellation | Raw-map cancellation input bypassed the existing request validation. Appending fulfillment/cancellation events to a full 500-character note exceeded the original column. | Use `CancelOrderRequest`; store notes as PostgreSQL `TEXT` while preserving request input limits. Explicit migration below preserves all existing text. |
| Notification consistency | Order mutations swallowed notification failures and could falsely report a complete operation. | Required persisted notification errors propagate and roll back the coupled transaction. |
| Identifiers | Six-digit random order/invoice suffixes had a small collision space with no safe retry. | Use year plus a UUID suffix within existing field lengths. |
| First stock import | Locking a missing inventory row does not prevent two transactions inserting it. | Lock the Product row before checking/creating Inventory; preserve inventory locking and atomic movement creation. |
| POS/cancellation deadlock | Independent review identified POS locking Voucher before Inventory while confirmed-order cancellation locked Inventory before Voucher. A deterministic PostgreSQL test reproduced `40P01: deadlock detected`. | POS locks every Inventory row in ascending Product ID order before consuming discounts/payment validation. Both operations now acquire Inventory before Voucher; no deductions occur until all validation passes. |
| Voucher quota | Admin edits/deletes could race usage consumption and overwrite counters. | Lock the same Voucher row for edits, deletion, consumption, and release. Reject a new quota below already consumed usage and prevent integer overflow. |
| Voucher history | Deletion guards previously knew only manual voucher references. | Protect historical automatic promotion references in both Order and Invoice. |
| Missing approved promotion stage | Existing code supported only one entered voucher. | Implement the approved Stage 1 automatic order promotion in the shared Voucher service, used by online checkout and POS; details below. |
| Review duplicates | Check-then-insert could accept duplicate reviews under simultaneous submissions. Eligibility scanned all completed orders. | Lock the completed purchase before duplicate validation. Use a bounded `EXISTS`/`NOT EXISTS` repository query for the first eligible purchase. |
| Revenue periods | Online revenue used placement time; an order completed in a later month appeared in the earlier month. Inclusive nanosecond endpoints risked timestamp rounding overlaps. | Persist `completedAt` at legitimate completion; use half-open ranges `[start,end)`. Legacy completed orders use `COALESCE(completedAt,updatedAt,createdAt)`. |
| Best sellers | Merging each channel's top 10 can omit the highest combined seller that ranks 11th in each channel. Historical product names could split one SKU. | Aggregate both channels by Product ID with `UNION ALL` before selecting top 5; use canonical product metadata and deterministic ties. The PostgreSQL regression constructs this exact counterexample. |
| Low stock | All products used a hardcoded threshold of 5. | Product-specific nonnegative threshold, default 5; threshold 0 disables the positive-quantity low-stock warning. Inventory filters/counts, POS mapping, and dashboard counts use the same rule. |
| List sorting | Arbitrary property/nested paths reached JPA and could produce internal errors; fixed repository order preceded the requested sort. | Service-local allowlists reject unsupported fields with safe 400; remove conflicting fixed sort clauses and use `Pageable` order. Real query tests verify inventory/order sorting. |
| PDF | Hardcoded unapproved contact details and warm-colored surfaces contradicted project instructions. Item headers did not repeat across pages; notes/promotion breakdown were absent. | Remove invented contact data; neutral white/cool gray surfaces; repeat headers; include persisted notes and both discount amounts. Generated invoice content is checked by extraction and by rendering every page. |

The original PDF already contained invoice metadata and one item table. They were
preserved; missing metadata/table is **not** counted as a baseline defect.

## Approved business decisions implemented

The user delegated unresolved business choices to the coordinating agent. The
coordinator approved the following concrete rules and recorded them in the
authoritative business/contract documentation:

- Promotions have `MANUAL` or `AUTOMATIC_ORDER` type and an optional positive
  `minimumQuantity`. Percentage rates are `0..1`, including a valid 0% manual
  voucher. Configured minimum amount and quantity conditions must both pass.
- Both discounts use the current product subtotal, excluding shipping. Round
  each percentage result to whole VND with `HALF_UP`, add them, and cap total
  discount at subtotal. Preserve the manual contribution first; automatic
  contribution cannot exceed the remaining subtotal.
- Choose the eligible automatic promotion with the highest rounded discount;
  tie goes to lowest ID. Existing active/date/quota guards apply. Automatic
  contribution of zero records no automatic code and consumes no usage.
- Preview can show an invalid entered voucher and still apply an eligible
  automatic promotion. Placement/POS confirmation reject an invalid entered
  voucher. Automatic codes cannot be submitted as manual voucher codes.
- Cancellation releases both recorded usages through existing allowed order
  cancellation transitions. Finalized POS invoices retain consumed usage.
- Recognize completed online revenue at completion time. POS revenue remains
  recognized at the invoice's successful confirmation time.
- Notes retain all customer text and subsequent system/cancellation events in
  `TEXT`; request note/reason limits remain unchanged.

## Cross-module contracts

- `CheckoutPreviewResponse`, `OrderResponse`, `OrderDetailResponse`,
  `PosSalePreviewResponse`, and `PosSaleResponse` append
  `manualDiscountAmount`, `automaticDiscountAmount`, and
  `automaticPromotionCode`. Existing total-discount fields remain total discount;
  entered voucher status/message/code remain manual-voucher fields.
- Legacy rows without an automatic code map their existing total discount to
  manual discount; absent automatic amounts map to zero.
- Voucher create/update/response append `promotionType` and `minimumQuantity`.
- `GET /api/v1/orders/me` uses `{page,size,status?}` and a `Page` response. Omit
  status for all; do not send a fabricated `ALL` enum.
- Order sort properties: `createdAt`, `id`, `orderCode`, `status`, `finalAmount`.
  Invoice sort properties: `createdAt`, `id`, `invoiceCode`, `finalAmount`.
  Inventory sort properties: `id`, `quantity`, `updatedAt`. Directions are
  Spring `ASC`/`DESC`; unsupported/nested properties return safe 400.
- Product threshold DTO/mapping/UI changes belong to the master-data audit;
  the commerce queries and response status calculations consume the same field.

## Controlled schema repair

[`migrations/20261010_order_notes_text.sql`](migrations/20261010_order_notes_text.sql)
must be applied to an existing application's configured PostgreSQL schema before
deploying/testing the note repair. It is a repeatable, data-preserving widening
operation. Hibernate `ddl-auto=update` treated the old `varchar(500)` and requested
`text` mapping as compatible and did not alter this existing column.

Applied this script to the configured local development database during the
audit. A temporary JDBC verification compared every existing Order ID/note pair
before and after: **all 11 existing orders were preserved exactly**, and the
resulting column type is `text`. The temporary harness was removed.

New approved fields use the project's current development JPA schema update.
Production migration tooling/baseline remain an explicit project decision; this
audit adds no Flyway/Liquibase dependency or speculative startup migration layer.

## Initial audit verification

Final targeted command (from `m4n-backend` with configured `DB_PASSWORD`):

```powershell
.\mvnw.cmd '-Dtest=CartServiceTest,OrderServiceTest,InventoryServiceTest,PosServiceTest,VoucherServiceTest,ReviewServiceTest,DashboardServiceTest,StaffDashboardServiceTest,InvoicePdfServiceTest,CrossChannelInventoryIntegrationTest,InventoryStatusIntegrationTest,OrderInventoryConcurrencyIntegrationTest,PromotionIntegrationTest,CartCheckoutConcurrencyIntegrationTest,DashboardAggregationIntegrationTest' test
```

**BUILD SUCCESS — 90 tests, 0 failures, 0 errors, 0 skipped.** Production compile
224 sources and test compile 36 sources also passed. Integration tests used the
configured PostgreSQL instance with rollback fixtures or explicit cleanup; no
dependency or alternate in-memory database was introduced.

| Test class | Cases |
| --- | ---: |
| CartServiceTest | 3 |
| OrderServiceTest | 22 |
| InventoryServiceTest | 10 |
| PosServiceTest | 10 |
| VoucherServiceTest | 18 |
| ReviewServiceTest | 4 |
| DashboardServiceTest | 1 |
| StaffDashboardServiceTest | 3 |
| InvoicePdfServiceTest | 1 |
| CrossChannelInventoryIntegrationTest | 2 |
| InventoryStatusIntegrationTest | 2 |
| OrderInventoryConcurrencyIntegrationTest | 4 |
| PromotionIntegrationTest | 4 |
| CartCheckoutConcurrencyIntegrationTest | 5 |
| DashboardAggregationIntegrationTest | 1 |

Regressions cover first cart creation, simultaneous checkout, shared-stock
online/POS confirmation, cancel/confirm races, restoration exactly once, automatic
last-use concurrency with fallback promotion, amount/quantity boundaries,
rounding/ties/additive cap, invalid automatic-code entry, current-month completion
of an older order, long notes/cancellation text, threshold zero/configuration,
owner/status paging, real requested sorts, and exact cross-channel ranking.

PDF extraction verifies Vietnamese metadata, staff/customer/phone, product
snapshots, payment summary, and absence of duplicate product tables. Rendered
synthetic examples were inspected on all four generated pages (one-page invoice
and three-page invoice); no clipping, missing glyphs, overlapping rows, or broken
totals were observed. Evidence:

- [`invoice-single-page.pdf`](audit-assets/commerce/invoice-single-page.pdf)
- [`invoice-multiple-pages.pdf`](audit-assets/commerce/invoice-multiple-pages.pdf)
- PNG page renders in [`audit-assets/commerce/`](audit-assets/commerce/).

The root audit owns the final complete backend test/build and frontend/browser
verification results.

### Follow-up independent review

The original 90-case targeted run passed before the independent reviewer exposed
the cross-operation lock inversion. Added a deterministic PostgreSQL regression
that holds the cancellation Inventory lock, observes the POS connection waiting
via `pg_locks`, then proceeds with cancellation. It failed before the fix with
SQL state `40P01` while POS waited for Inventory. This is concrete regression
evidence, not a speculative concern. After the fix,
`.\mvnw.cmd '-Dtest=PosServiceTest,OrderInventoryConcurrencyIntegrationTest' test`
passed **15 cases, 0 failures, 0 errors, 0 skipped**, including all five real
PostgreSQL inventory races and all ten POS unit tests. One existing cash-validation
unit fixture was updated to supply its valid stock before checking cash payment.
The final root full-suite verification follows this source freeze.

Final concrete review also removed `saveMovement`'s obsolete null-repository skip:
the repository is a required constructor dependency and both direct test callers
already supply its mock. Moved cascading `@Valid` from List containers to their
element types in POS request/preview and the analogous Product create/update
media requests, retaining all existing constraints. A direct Validator check
confirmed both POS request types still reject nested null product IDs and zero
quantities without `HV000271`. Narrow follow-up
`InventoryServiceTest,CrossChannelInventoryIntegrationTest,PosServiceTest,ProductServiceTest,ProductGalleryIntegrationTest`
passed **42 cases, 0 failures/errors/skips**, including existing inventory movement
and atomic gallery tests. No further source edits remain.

Fixed fixture cleanup in `OrderInventoryConcurrencyIntegrationTest`: track each
generated order code and delete only matching notifications for the fixture
customer before deleting fixture orders/products. Removed **103** previously
leaked notifications using the exact seed-customer email and exact generated
`RACE-ORDER-[0-9A-F]{12}` message formats; other customer data was preserved.
The root browser checkout fixture was also removed only when all known attributes
matched: `customer@m4n.vn`, Product ID `4`, code `SAO-001`, quantity `1`. Exactly
one item matched; other carts/items were preserved. Temporary JDBC cleanup files
were removed.

## Approved completion continuation

The user's subsequent instruction to complete the remaining approved scope
superseded the initial stock-workflow and pricing exclusions. The concrete
lifecycle and formulas are recorded in [STOCK_CONTRACT.md](STOCK_CONTRACT.md)
and [PRICING_CONTRACT.md](PRICING_CONTRACT.md).

### Stock documents and movement history

- Existing import/issue endpoints now create one-product RECEIPT/ISSUE drafts;
  creation never changes inventory. Confirmation locks Document, Product, then
  Inventory and commits status, balance and movement atomically.
- Receipt QC records rejected quantity/reason and adds accepted units only.
  Fully rejected receipts record a zero-accepted movement. Insufficient issues,
  integer overflow and duplicate confirmations leave balances unchanged.
- Paged balance, document and movement views expose filters, immutable product
  snapshots and the originating document/order/invoice. Online confirmation,
  finalized POS and confirmed-order cancellation also append movements within
  their original transactions. The Admin UI consistently reports draft creation
  separately from confirmed inventory changes.
- Removed obsolete immediate-mutation service methods and response DTOs.
  Inventory tests and their fixture cleanup now use the document/movement model.

### Product pricing, shipping and voucher contracts

- Online cart, preview, placement and POS resolve effective product prices in a
  batch through ProductPricingService. Order/Invoice and item snapshots preserve
  original and charged prices, promotion ID and aggregate product savings.
- Online shipping uses ShippingService after the charged-product subtotal.
  Threshold freeship and a distinct fixed-amount SHIPPING voucher reduce the
  shipping fee. POS returns zero shipping and rejects SHIPPING in its price
  voucher field. Disabled/no-fee shipping consumes no shipping voucher.
- Shipping usage is locked after manual and automatic discounts and released
  once through allowed cancellation. Invalid codes with a positive fee reject
  placement; preview returns explicit failure without usage changes.
- Promotion type cannot change after first use or an historical Order/Invoice
  reference, even after cancellation releases its usage. Admin updates hold the
  same Voucher lock before checking usage/history. This closes a concrete race
  between first consumption and type changes.
- Admin voucher search now filters state/type/activity/search before paging.
  The coordinated frontend uses the new Page endpoint; the obsolete unbounded
  admin endpoint and repository/service methods were removed.
- Computed monetary amounts enforce the approved storage boundary
  `0..999999999999.99` with at most two meaningful decimal places. Existing voucher
  end instants stay inclusive; product-promotion periods are `[start,end)`.

### VNPay order lifecycle

VNPay availability and the authoritative final amount are checked before order
creation; payment never deducts inventory. Confirmation and fulfillment require
verified payment without a full/pending refund. Paid cancellation requires a
verified full refund. Both customer/staff cancellation also reject any persisted
PENDING payment attempt until reconciliation resolves it, including an expired
attempt with an unknown provider outcome. Cancellation capabilities use the same
predicates as mutations. COD behavior is unchanged.

### Migration verification and tests

Applied [20261010_stock_documents.sql](migrations/20261010_stock_documents.sql)
and [20261010_commerce_pricing_snapshots.sql](migrations/20261010_commerce_pricing_snapshots.sql)
to the configured local PostgreSQL database. The explicit existing Voucher
promotion-type CHECK now permits SHIPPING. Stock quantity CHECK and legacy
snapshot backfills are also present. Before/after fingerprints confirm existing
Inventory IDs/product IDs/quantities, Order totals/discounts/final amounts/status,
and Invoice subtotal/discount/final amounts are unchanged. Repeating both scripts
preserved these fingerprints and every pricing snapshot; no legacy original
total, shipping fee or item original price remains null.

Verified intermediate commands passed the 51 stock/commerce unit cases and the
coordinated 126-case integration/security run, including seven stock-document
cases and all 15 order/cart inventory races. The later coordinated 134-case run
passed CartServiceTest3, OrderServiceTest26, PosServiceTest10,
VoucherServiceTest18 and CrossChannelInventoryIntegrationTest2 alongside the
other agents' targets. Frontend lint/build passed after the stock UI changes.

The final source adds CommercePricingIntegrationTest8,
ShippingVoucherConcurrencyIntegrationTest2, MoneyValidationTest2 and two extra
OrderServiceTest cases for pending/reconciled VNPay cancellation. These cover
the distinct savings stages, zero-fee nonconsumption, shipping caps/POS rejection,
historical snapshots, cancellation usage release, type immutability, DB paging,
invalid-code rollback, storage limits and real Voucher lock races. Final
full-suite results and browser limitations are recorded in
[audit-completion.md](audit-completion.md).

## Remaining explicit limits and decisions

- Stock documents deliberately use the approved DRAFT-to-CONFIRMED lifecycle;
  supplier settlement, procurement and document editing/cancellation are outside
  that contract. Article/Guide and public Review pagination belong to their
  coordinating owners and are verified in the root completion audit.
- Public Voucher response compatibility is preserved. The coordinated Admin
  search endpoint is paged as described above.
- Legacy completed rows cannot recover an exact historical completion instant
  if it was never recorded. The documented timestamp fallback is the best
  available historical evidence.
- Invoice Unicode rendering currently depends on an installed supported system
  font. The local Windows render passed; font packaging for deployment remains
  an environment decision and no font/dependency was added.
- **Large file detected:** `OrderServiceImpl` and `PosServiceImpl` exceed the
  architecture size guidance. Their existing methods still belong to coherent
  order/POS transactions. The audit extracted only the shared promotion business
  operation in its existing Voucher service; it did not create speculative
  abstractions to satisfy a line count.

## Cleanup/review

Removed the obsolete InvoiceItem repository and obsolete voucher calculation
entry points after migrating their callers. Checked controller boundaries,
locked state transitions, user ownership, historical deletion guards, exact
money calculations, rollback behavior, neutral PDF surfaces, and synchronized
frontend DTO use. Temporary comparison/JDBC/PDF Java harnesses were removed;
reviewable PDF evidence and the migration script remain. No commit was created.
