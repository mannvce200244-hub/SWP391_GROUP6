# Completion of remaining approved M4N features — 2026-10-10

The user requested implementation of the remaining audit gaps and delegated
routine implementation choices. No external provider account or key is available.
The following decisions are recorded before implementation; they do not change
online stock allocation, customer receipt completion or completed-only revenue.

## Work order and ownership

1. Stock documents and QC: create a single-product draft receipt/issue; only
   authorized confirmation changes inventory. Record rejected inbound quantity
   separately and retain immutable movement history, including online/POS and
   confirmed cancellation restoration. See `STOCK_CONTRACT.md`.
2. Article/Guide: Admin manages draft/published plain-text content associated
   with existing products, artisans and villages. Public pages expose only
   published content. See `CONTENT_CONTRACT.md`.
3. Public discovery: database pagination/filtering and direct artisan detail
   lookup replace full-list discovery downloads. Existing reference-list APIs
   remain for existing editing clients. See `DISCOVERY_CONTRACT.md`.
4. External integrations: Resend email, VNPay 2.1 payment and verified full
   refunds use existing HTTP/crypto libraries and external configuration.
   Disabled or incomplete configuration keeps the feature unavailable. Tests
   use synthetic provider responses; live provider verification awaits accounts.
   See `EXTERNAL_INTEGRATIONS.md`.
5. Bootstrap: explicitly enabled initial SUPER_ADMIN creation from external
   credentials, only when no SUPER_ADMIN exists; no overwrite/reactivation or
   default privileged password.
6. Product/shipping promotions: scope explicitly extended in `PRICING_CONTRACT.md`
   and `PROJECT_SCOPE.md` under the user's supplied formulas/delegated decision.
   Preserve backend monetary authority and additive order discounts. No external
   shipping service is selected.
7. Run existing targeted regressions, combined Maven verify, frontend lint/build
   and native tests; inspect rendered UI and record exact remaining limitations.

## Payment decisions

- A signed successful provider callback marks payment paid, without confirming,
  reserving or deducting inventory and without completing the order.
- An insufficient-stock paid order can wait and be retried by authorized staff.
  A paid order cannot be cancelled before a verified full refund is persisted.
- Refund is a separate Admin/Super Admin operation with explicit confirmation.
- User-approved exception (2026-10-16): an owning Customer may explicitly confirm refund-and-cancel for a paid MoMo order still awaiting confirmation. This requests full refund and cancels only after verified success, following BR-ORDER-02. Standalone and other refunds remain Admin/Super Admin operations.
  It calls the configured provider and validates its signed result; browser
  return parameters and manually asserted success never authorize payment/refund.
- Existing product money is not silently rounded to satisfy provider rules. An
  unsupported fractional VND online amount is rejected with a COD alternative.
- Failed/pending payments never appear as completed revenue. No real payment,
  refund or email is sent during local tests without provider credentials.

## Constraints

No dependencies, roles, procurement settlement, distributed infrastructure or
rich-text editor are added. Source from the preceding audit is preserved. The
feature contracts document limits, error behavior, authorization and migrations.
