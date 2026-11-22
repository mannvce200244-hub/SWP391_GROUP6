# Product families, promotions and inventory verification — 2026-11-22

## Scope and decisions

- One persisted logical product (`ProductFamily`) owns a one-to-many list of SKU variants. Each SKU retains its price, barcode and stock. Existing transaction identities are preserved.
- Catalog, Admin products and stock balances group before database pagination. Equal display names alone never establish membership.
- Remove the manual variant-group field. New variants attach by parent ID and start with zero stock.
- Product promotions select multiple parents and apply to all their current/future variants. Legacy single-SKU promotions keep their original scope until explicitly edited.
- User delegated the date rule: an optional end is at least one hour after both original creation and optional start. Editing retains the original creation baseline.
- Optional billable weight accepts positive decimals; database precision no longer rounds tiny values to zero. Carrier quote limits still apply.

## Automated verification

- Backend: `mvnw.cmd clean verify` — 630 tests, zero failures/errors/skips; packaged JAR built. Repeated after the final POS parent-name search correction.
- Frontend: `npm test` — 114 tests passed.
- Frontend: `npm run lint` and `npm run build` — passed, repeated after the final accessible card-name correction.
- `git diff --check` — passed.
- Migration applied and reapplied successfully only to loopback PostgreSQL `m4n_test`. No production database was changed.
- The post-browser rerun exposed an old test fixture scanning unrelated promotions and assuming every promotion had a single SKU. It now deactivates its own saved promotion directly; pricing/snapshot assertions remain unchanged.

Backend coverage includes grouped pagination/counts, duplicate labels, separate parents with equal names, positive tiny weights, inactive variants, family promotions/new SKUs, legacy promotion scope, exact-hour validation, original creation baseline, parent rename/search, per-SKU QC and family history, and public/Admin HTTP authorization boundaries.

## Browser verification

Temporary frontend: `127.0.0.1:5183`; backend: `127.0.0.1:8083`; datasource: loopback `m4n_test`. External mail/payment providers and runtime seeds were disabled.

1. Created “Tiêu tre kiểm tra 22/11” with C/D/F variants. Weight 0 was blocked; 0.0001 was accepted.
2. Duplicate D was rejected. Added G: Admin still showed one parent row with four variants.
3. Stock balance showed one row. Receipt picker showed each tone with its own price. Switching tone cleared entered quantity/cost.
4. Receipt #196 requested five D at 400,000 VND each; QC rejected one. Confirming added four only to D and calculated 1,600,000 VND. Parent history included this D movement and rejected quantity.
5. Created one 10% program for two parents using separate searches. Both selections persisted after save/reopen.
6. Start 23/11/2026 09:00 with end 09:59 was rejected. End 10:00 was accepted. Clearing start activated the program immediately.
7. Catalog search showed exactly one parent card. C/D/F/G prices were 612,000 / 648,000 / 675,000 / 702,000 VND. Selecting D changed the detail to D, price 648,000 and stock four. Back navigation restored the base card title.
8. At 390×844, detail and promotion dialog had no horizontal overflow. Viewport override reset; temporary tab closed.
9. Temporary FE/BE stopped. Ports 5173, 5183, 8080 and 8083 were confirmed free.

Screenshots in this directory: `admin-one-product.jpg`, `receive-select-tone.jpg`, `inventory-grouped-stock.jpg`, `promotion-two-products.jpg`, `promotion-date-validation.jpg`, `promotion-mobile.jpg`, `catalog-one-product.jpg`, `catalog-tone-price-stock.jpg`, `catalog-tone-mobile.jpg`.

## Final review

- `m4n-backend/src/main/java/com/m4n/backend/entity/ProductFamily.java:22`: persisted one-to-many membership; no destructive cascade into historic SKU transactions.
- `m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ProductServiceImpl.java:156`: grouping is in the query before pagination, with page-batched stock totals.
- `m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ProductPromotionServiceImpl.java:77`: target/date validation remains server-side; transaction and optimistic version behavior retained.
- `m4n-frontend/src/features/pricing/ProductPromotionProducts.jsx:25`: labeled checkbox selection, persistent selections, keyboard search, loading/error states and paging.
- `m4n-frontend/src/features/catalog/ProductCard.jsx:28`: accessible card name now matches the visible parent name.
- New query inputs remain parameterized. Existing Admin authorization, authoritative server pricing, QC stock updates and transaction ownership remain in service boundaries. No secrets, debug code or new dependencies added.
- POS search includes the persisted parent name, so renaming one parent remains searchable even if the edited SKU is inactive; regression assertion covers this case.
- Existing large ProductService/Admin product files were reviewed in place; no unrelated structural refactor performed.

Large file detected: `m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ProductServiceImpl.java` (704 lines).
Large file detected: `m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/PosServiceImpl.java` (582 lines).
Large file detected: `m4n-frontend/src/components/admin/ProductFormModal.jsx` (985 lines).
Large file detected: `m4n-frontend/src/pages/admin/AdminInstrumentsPage.jsx` (769 lines).
Large file detected: `m4n-frontend/src/pages/admin/AdminProductDetailPage.jsx` (519 lines).

Focused technical debt: product reads/creation and form media management have natural boundaries for a future extraction. This change retains current service transaction ownership and existing form behavior, while placing the new multi-product selector in its own cohesive component. A broad ProductService/POS/form decomposition would enlarge this bug fix substantially and is left out of scope.

## Rollout still required

Code remains local and uncommitted; no push, merge or deploy was performed. Before deploying this version, back up the database and apply `docs/migrations/20261122-product-families.sql`, then deploy backend and frontend. Existing explicit legacy groups migrate together; unrelated ungrouped SKUs remain distinct.
