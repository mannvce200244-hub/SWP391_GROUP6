# Product pricing and shipping core review — 2026-10-10

## Approved boundary

Implementation follows [PRICING_CONTRACT.md](PRICING_CONTRACT.md) and the user-delegated calculation decisions. This review covers ProductPromotion/ShippingSettings management and calculation, Product shipping attributes and public catalogue integration. The commerce owner implements Order/POS/cart/voucher usage and transaction snapshots; root owns the related UI.

## Implemented backend contract

- Admin/Super Admin only: paginated `GET /api/v1/admin/product-promotions` with optional `productId` and `isActive`, plus POST, PUT `{id}` and DELETE `{id}?expectedVersion=…`.
- Program fields: existing active Product ID, trimmed name ≤150, discountRate 0–1 with at most 4 decimal places, active flag, optional period, expected edit version. Existing archived associations remain editable. End must be after start; eligibility uses `[validFrom, validUntil)`.
- Admin/Super Admin only: `GET/PUT /api/v1/admin/shipping-settings`. Singleton configuration includes enabled, ratePerKg, freeShippingEnabled, optional threshold and expected edit version. It initializes atomically as disabled with zero rate and no implicit threshold.
- Product Create/Update accepts optional positive billableWeightKg (7 integer/3 fractional digits) and nonnegative integral bulkySurcharge (13 digits, default zero). Admin detail returns both. Listed price remains positive NUMERIC(14,2), max 12 integer/2 fractional digits; invalid precision is rejected.
- Public catalogue `price` is the charged price; additionally returns originalPrice, productDiscountAmount per unit and productPromotionId. Admin `price` stays the editable listed price. Price filtering/sorting runs in PostgreSQL against the charged-price expression.

## Calculation and persistence

- ProductPricingService resolves applicable programs for the product batch in one repository query, selects the highest positive percentage and lowest ID on a tie, and returns ProductPrice snapshots. Inactive, expired, future and zero-rate programs do not reduce prices.
- A positive discount uses `min(originalPrice, HALF_UP(originalPrice × (1 − rate)))`. The cap prevents a fractional listed price from increasing after rounding. No program/zero rate preserves the original fractional amount; 100% may legitimately yield a zero charged price.
- ShippingService receives server-owned Product/quantity lines and subtotal. Disabled shipping produces zero fees without requiring a weight. Enabled shipping requires weight for every line, calculates `(weight × rate + bulky surcharge) × quantity`, totals all lines and rounds once to VND. The configured threshold then waives the whole fee.
- Rounded base shipping fees use the shared calculated-money limit `999999999999.99`, including quotes whose threshold would subsequently waive the fee. This prevents transaction snapshots from exceeding NUMERIC(14,2).
- A SHIPPING voucher is applied by the commerce boundary after this quote, only when it actually reduces a positive fee. POS does not call online shipping calculation.
- Optimistic versions plus expected-version checks prevent stale config/program changes. Deleted programs do not modify scalar historical transaction snapshots.
- Shipping calculation is read-only: absent settings produce the disabled default quote without an INSERT in a checkout preview transaction. Admin settings reads/updates perform the atomic default-row initialization.
- [20261010_product_pricing_shipping.sql](migrations/20261010_product_pricing_shipping.sql) creates configuration/program tables, product fields, indexes and constraints. Old zero listed prices are reported for explicit Admin correction; the migration never substitutes an invented price.

## Architecture and security review

- Controllers perform only validation, service delegation and response/status selection. New services use interfaces, constructor injection and service-owned transactions.
- Bound JPQL handles optional eligibility dates and stable program precedence; the native SQL contains only constants and exists specifically for race-safe singleton `INSERT … ON CONFLICT DO NOTHING` initialization.
- No dependency, carrier integration, region tariff or purchasing-cost field was introduced. Backend configuration and current prices own the calculation.
- New validation errors are Vietnamese and safe; invalid IDs, ranges, precision, dates and edit versions do not expose database details. Promotion pagination rejects offsets above the PostgreSQL/JPA integer limit with a safe 400 response.
- Large file detected: `ProductServiceImpl.java` (559 lines; pre-audit snapshot 489). Existing product CRUD/media responsibilities remain; new pricing calculations were placed in their separate service. This integration adds one dependency/batch mapping and validated shipping fields without a broad unrelated reorganization.

## Verification status

- ProductPricingShippingIntegrationTest contains 12 cases for strongest/tied/current programs, fractional rounding cap/zero/free pricing, database charged-price filtering/sorting, program/config version integrity, disabled shipping, missing weights, per-unit surcharge/single rounding, free threshold, shipping money overflow, pagination overflow, permissions and transport precision/range errors.
- Existing ProductServiceTest receives the real pricing implementation with a mocked program repository; ProductGalleryIntegrationTest now verifies the approved positive listed-price/precision contract and preserves its existing gallery/inventory checks.
- Coordinated targeted Maven run passed **134/134** tests, zero failures/errors/skips. Surefire reports verify ProductPricingShippingIntegrationTest 12/12, ProductGalleryIntegrationTest 5/5, ProductServiceTest 15/15, DiscoveryPaginationIntegrationTest 4/4, InvoicePdfServiceTest 2/2, ArtisanServiceTest 4/4, CraftVillageServiceTest 8/8, CartServiceTest 3/3, OrderServiceTest 26/26, PosServiceTest 10/10, VoucherServiceTest 18/18, CrossChannelInventoryIntegrationTest 2/2, PaymentIntegrationTest 16/16, ReviewServiceTest 5/5 and ReviewPaginationIntegrationTest 4/4. Charged-price filtering and ascending/descending sorting were verified on PostgreSQL.
- The first launch identified old Product constructor fixtures, which were updated. A subsequent launcher-only datasource placeholder issue was resolved by extracting the original local test credential silently; the passing run used the actual PostgreSQL connection.
- After that run's compilation, added explicit positive-rate defense, strengthened the zero-rate fractional regression to `100.40` including database filtering, and made absent-config shipping calculation read-only. New PricingCalculationTest has two focused regressions for zero-rate preservation and absence of configuration writes. Final results including these cases are recorded in [audit-completion.md](audit-completion.md).
- Root owns whole-suite/frontend/build/browser gates once all feature owners freeze.
- Focused ProductPromotionEditor UI review fixed preservation of unchanged original ISO date instants (including fractional seconds), second-level datetime controls, invalid-date recovery, dirty-close confirmation and stale search responses after unmount. Targeted ESLint for the editor passes; root owns the final frontend lint/build/browser gates.
