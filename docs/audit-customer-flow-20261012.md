# Customer-flow implementation and verification — 2026-10-12

This extends the earlier audit; its results apply to the current Gmail/GHN/MoMo,
partial-cart and product-upload source. No provider credentials are available.
The user's approval for `spring-boot-starter-mail` is recorded in
[`CUSTOMER_FLOW_PLAN.md`](CUSTOMER_FLOW_PLAN.md).

## Implemented

| Requirement | Implementation / meaningful checks |
| --- | --- |
| Registration email OTP | Gmail SMTP, PostgreSQL challenge/BCrypt hash, expiration/attempt limits, serialized single consumption, nested registration HTTP contract. Flat/no-proof registration rejected. |
| Reset email OTP | Generic acceptance, purpose binding, one-time reset, legacy-token invalidation and session revocation. No OTP/password stored in browser storage. |
| Shipping and address | GHN current province/ward data + street details; backend hierarchy validation and fee preview, selected-product package data, canonical address IDs/text persisted. |
| Fee changes | New quote at Place Order; 409 on changed net fee, cart/order/voucher rollback. Freeship before shipping voucher; neither can produce a negative fee. |
| Official payments | Existing VNPay + MoMo sandbox official redirect; signed create/IPN, bound HTTPS query/refund, committed pending state, idempotency, reconciliation and verified full refund. No bank/wallet credentials collected. |
| Selected checkout | Explicit maintained-frontend selection, ownership/duplicate/stale validation, selected totals only, remaining items retained and inventory unchanged at placement. |
| Product creation/images | Fixed generated-code length for long category codes; multipart Admin create/update; bounded JPEG/PNG decoding, PNG reencoding, UUID storage, safe public delivery and rollback cleanup. New products visible with stock 0. |

Additional review repairs: stale checkout submission checks include selection and
shipping inputs; changing province clears ward data; shipping previews are debounced;
unconfigured OTP errors remain actionable; refund/charge history is consistent;
overflowing MoMo transaction IDs rejected; missing GHN preview body produces
validation rather than 500; missing multipart parts return 400, oversize files
return 413; edited auth surfaces use white/cool gray. Admin shipping copy now
distinguishes its local rate/toggle from the carrier base fee; freeship applies
to either configured fee source.

## Final gates

| Gate | Actual result / evidence |
| --- | --- |
| Backend `mvnw.cmd clean verify`, Java 21 | PASS: **370 tests / 58 suites**, zero failures/errors/skips, packaged JAR; [`Maven log`](audit-assets/verification/20261012-full-maven-verify.log), [`independent XML totals`](audit-assets/verification/20261012-backend-summary.json) |
| Frontend `npm run lint` | PASS; [`log`](audit-assets/verification/20261012-frontend-lint.log) |
| Frontend `npm run build` | PASS, 2063 modules, initial JS 325.24 kB /94.78 kB gzip; [`log`](audit-assets/verification/20261012-frontend-build.log) |
| Native frontend `node --test tests/*.test.mjs` | PASS: **18 tests**, zero failures/skips; [`log`](audit-assets/verification/20261012-frontend-tests.log) |
| Three new SQL scripts | PASS on dedicated PostgreSQL test schema; existing order count/total and inventory quantity unchanged by application; [`log`](audit-assets/verification/20261012-migrations.log). Existing columns/table were already created by test JPA update; this is a repeat-application check, not a fresh historical production upgrade. |
| Final packaged JAR, seeding disabled, `ddl-auto=validate` | PASS on PostgreSQL 18.4, own port 18082; [`startup log`](audit-assets/verification/20261012-packaged-startup.log) |
| Packaged localhost HTTP smoke | PASS **17 checks**, including Customer/Admin sessions, auth/authorization, selected-cart validation and honest unconfigured-provider states; [`sanitized results`](audit-assets/verification/20261012-api-smoke.json), [`reproducible script`](audit-assets/verification/20261012-api-smoke.ps1) |
| Rendered UI / live external providers | **Not verified**: browser control blocked by Windows URL policy; no Gmail/GHN/MoMo/VNPay credentials. No real email/SMS/shipment/payment/refund performed. |

Tests ran against `m4n_customer_flow_test_20261012`, not the user's normal
`m4n_db`. The verification server was started on a separate port and stopped
after checking. Normal frontend/backend processes were not restarted. Dedicated
test data is retained for review; repeated tests may add fixtures there.

## Security and architecture review

Controllers remain transport-only and depend on service interfaces. OTP
verification and mutation are transactional, including persisted failed guesses.
Provider hosts are fixed, redirects restricted, signatures compared in constant
time, and order amounts/ownership remain backend-owned. Uploads ignore supplied
paths, reject nonimages and do not serve arbitrary files. New services have
specific responsibilities; no dependency beyond approved Spring Boot Mail was
introduced. Native frontend tests use existing Node tooling, not a new framework.

Large-file triggers reviewed:

```text
Large file detected: m4n-frontend/src/pages/CheckoutPage.jsx
Large file detected: m4n-frontend/src/components/admin/ProductFormModal.jsx
Large file detected: m4n-frontend/src/features/auth/RegisterPage.jsx
Large file detected: m4n-frontend/src/features/orders/AdminOrderDetailDialog.jsx
Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/OrderServiceImpl.java
Large file detected: m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/ProductServiceImpl.java
Large file detected: m4n-backend/src/main/java/com/m4n/backend/exception/GlobalExceptionHandler.java
```

The existing checkout/form/order files remain large (788/981/849 lines), and
retain architectural debt. Carrier-address rendering was extracted to its own
feature component; OTP, carrier, upload and MoMo orchestration live in focused
services. Further decomposition of the existing form, order lifecycle and
checkout coordination is a separate review item; this feature pass did not
rewrite their established workflows. Registration at 316 lines still represents
one two-stage form, and the Admin dialog/global error handler retain their
existing resource/error boundaries. No newly introduced service exceeds the
400-line review trigger.

## UI acceptance evidence

Scope, business rules, DTO/form constraints and configuration decisions are
documented in the authoritative routed docs. Static review checked native
labels/input types, OTP paste/autofill, disabled/pending states, error/retry paths,
cleanup of asynchronous requests, white/cool-gray surfaces, responsive classes,
selection/fee staleness and preservation of input after errors. Shared primitives
and the single auth/API/service/router boundaries are retained; React/Vite
guidance was used without Next.js patterns or new UI dependencies.

**Remaining browser acceptance:** live keyboard/focus trap/restoration, mobile/
tablet/desktop overflow/touch checks, contrast rendering and password-manager
behavior. These cannot be marked passed using lint/build/static inspection.
Existing historical screenshots do not verify the new OTP/address/upload flows.

## Deployment / remaining external work

1. Follow [`CUSTOMER_FLOW_INTEGRATIONS.md`](CUSTOMER_FLOW_INTEGRATIONS.md) and
   [`m4n-backend/.env.example`](../m4n-backend/.env.example) for Gmail app password,
   GHN token/shop pickup address, MoMo sandbox/VNPay keys and public HTTPS URLs.
2. Review/apply migrations with a backup, set persistent product-image directory
   and externally reachable media URL, validate packaged startup on that schema.
3. Complete authorized live email delivery, GHN fee/address and provider sandbox
   redirect/IPN/query/refund checks once credentials exist. SMS awaits an actual
   SMS provider; Google app passwords provide email access only.
4. Complete the rendered UI acceptance checks when browser access is restored.

No code or configuration claims an unavailable provider delivered an OTP,
calculated a carrier quote, charged or refunded money. No deployment performed.

## Source handoff for the final reviewer

The workspace has no Git metadata. The prior local source snapshot is retained
at `C:/Users/tdinh/AppData/Local/Temp/m4n-recheck-20261012-source/` for comparison.
[`Current change manifest`](audit-assets/verification/20261012-source-changes.json)
lists 34 added/20 modified backend source/test/resource paths and 2 added/18
modified frontend source paths. No source paths removed. It excludes docs,
`.env.example`, Maven configuration and frontend native-test changes; review
those directly as well. Earlier audit reports describe earlier snapshots.

The final reviewer should focus on OTP transaction/race behavior, selection
ownership, fee-change rollback, provider result binding/refund cancellation,
multipart authorization/storage, and remaining live UI/provider checks.
