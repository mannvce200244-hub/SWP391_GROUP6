# Approved product pricing and shipping extension — 2026-10-10

The user supplied the formulas, requested completion of the remaining features
and delegated the logical choice. This extends the earlier Stage 1 exclusion of
product and shipping promotions. Inventory-age and loyalty discounts remain out
of scope. The backend calculates and persists all amounts.

## Calculation order

1. An Admin product promotion applies a percentage in 0–100%, an active flag and
   optional start/end. Each program targets one existing product. If programs
   overlap, use the highest percentage; ties use the lowest ID. Round the
   discounted unit price to VND HALF_UP, capped at the original listed price so
   rounding can never increase the charge. No/zero-rate promotion preserves the
   original price, including existing fractional VND. A 100% program charges zero.
   Persist original/charged unit prices.
2. Subtotal is the sum of charged unit price × quantity. Existing manual price
   voucher and the strongest eligible automatic order promotion both use that
   subtotal; their rounded combined reduction cannot exceed subtotal.
3. Online shipping is total configured product weight in kg × configured rate
   per kg plus fixed configured bulky surcharge per bulky unit. Weight means
   the Admin-entered billable weight (physical or volumetric as appropriate).
   Round the base fee once to VND HALF_UP. A Product has optional positive
   billable weight and a nonnegative surcharge; zero surcharge means nonbulky.
   Missing weight blocks online shipping calculation when charging is enabled,
   with a clear product-specific error. POS never needs weight and has zero fee.
   Approved 2026-10-12 extension: when GHN is explicitly enabled, its validated
   carrier preview replaces this local base-fee formula. Existing freeship and
   shipping voucher order below still applies. Structured address, package
   measurements, recalculation and 409 acknowledgment behavior are defined in
   `CUSTOMER_FLOW_INTEGRATIONS.md` and `BR-SHIPPING-02`.
4. If subtotal meets an enabled Admin freeship threshold, shipping is zero.
   Otherwise one entered SHIPPING voucher reduces the base fee by its fixed VND
   amount, capped at the base fee. It has the same period/value/quantity/usage
   controls as current vouchers. One price voucher and one shipping voucher may
   coexist. Shipping voucher usage is consumed only when it actually reduces
   the fee, and released once on cancellation. POS rejects a shipping voucher.
5. Payable = subtotal − order discounts + shipping after discounts. Product,
   order and shipping savings are presented separately; persisted historical
   amounts never change when configuration/programs/products change.

## Configuration and compatibility

Admin/Super Admin manage product programs and one persisted shipping-settings
record using version/conflict checking. Shipping defaults disabled with no fee;
an existing deployment must configure weights, rate and threshold before enabling
shipping. Sample 15,000đ/kg, 30,000đ and 3,000,000đ are form guidance, never implicit
charges. The minimum enabled rate is zero; free shipping can be enabled with an
explicit nonnegative threshold. Config changes do not alter existing orders.

Keep existing manual/automatic vouchers compatible. SHIPPING uses fixed amount,
not discountRate; request validation rejects mixed meanings. Voucher, product
program and shipping settings fields have explicit numeric limits matching
database precision. Product price keeps NUMERIC(14,2): positive, at most 12 integer
digits and 2 decimals. Invalid precision is rejected, never silently rounded.

Input → validate DTO/ownership/configuration → resolve effective unit prices →
calculate subtotal/order discounts/shipping → lock and recheck limited vouchers
in a stable order → persist amount snapshots → return authoritative breakdown.
Preview uses the same calculation without consuming usages. Creation still does
not deduct stock; POS stock deduction still commits with the paid invoice.

## Wire fields and voucher locking

- Checkout preview and placement optionally accept `shippingVoucherCode` (up to
  50 characters) separately from the price voucher.
- `SHIPPING` voucher creation/update requires `fixedDiscountAmount`: positive
  whole VND with up to 13 integer digits, no `discountRate`. Price vouchers require
  `discountRate`, no fixed amount. All existing eligibility controls also apply.
- Consumption and cancellation acquire voucher locks in manual, automatic,
  shipping order. Promotion type becomes immutable after any historical order or
  invoice reference or first use, including cancelled transactions whose usage
  returned to zero. Updating takes the voucher lock before checking references.
- Existing voucher end instants remain inclusive (`now <= validUntil`); product
  programmes use their separate `[validFrom,validUntil)` period. Neither changes
  a persisted order or invoice.
- Zero shipping, including freeship or disabled charging, does not consume or
  persist an entered shipping voucher; preview explains why no further reduction
  applies. Invalid/expired/exhausted shipping vouchers with a positive fee return
  preview failure and reject placement without side effects.
- Cart/order/checkout/invoice expose `originalTotalAmount` and aggregate
  `productDiscountAmount`; item `originalUnitPrice` and per-unit product savings
  accompany the existing charged unit price. Online snapshots additionally expose
  `baseShippingFee`, `shippingDiscountAmount`, `shippingFee`,
  `shippingVoucherCode`, `freeShippingApplied`. Preview additionally returns
  `shippingVoucherApplied`, `shippingVoucherMessage`; POS `shippingFee` is zero.
- Calculated line totals, subtotals, original totals, shipping, final payments and
  POS received/change amounts must fit `0..999999999999.99` with at most two
  meaningful decimals. Oversized arithmetic returns a safe validation error,
  never database overflow or silent rounding.
- Admin vouchers use `GET /api/v1/admin/vouchers/search` Spring Page, optional
  `search`, `promotionType`, `isActive`, `state`; state is
  `ALL/INACTIVE/UPCOMING/EXPIRED/EXHAUSTED/ACTIVE` (ordered priority). Filtering
  occurs before paging. Sort keys are `id,createdAt,updatedAt,code`; default
  `createdAt DESC,id DESC`, size 10. Unknown state/sort returns 400.
  The former unbounded Admin `GET /admin/vouchers` list is retired; clients and
  authorization regressions use `/search`. CRUD paths retain their existing shape.

No carrier integration, postcode/region tariff, procurement price, payment
reservation, or new dependency is introduced. Integration, concurrency, rounding,
caps, eligibility, cancellation and unchanged historical snapshots require tests.
