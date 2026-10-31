# MoMo and checkout recheck — 2026-10-12

## Decision

MoMo sandbox integration is implemented, with official payment redirects,
verified IPN, provider query, duplicate/timeout protection and full refunds.
It is **not yet accepted against a real MoMo sandbox merchant or ready for
production charges**. Merchant credentials have not been supplied; this pass
made no external payment/refund calls. The production profile still rejects
enabling the sandbox-only gateway.

## Findings repaired

| Finding | Repair |
| --- | --- |
| Internal `orderId` could collide with the provider's returned `orderId` | MoMo redirect uses `m4nOrderId`. Return parsing keeps VNPay/internal single-ID links working and rejects ambiguous/invalid IDs. URL result flags never mark a payment paid. |
| Valid IPN with optional nested/null provider metadata could fail String-map deserialization or validation | Added a validated signed-field DTO; unknown metadata is ignored. Real HMAC verification, amount/reference/merchant binding and required signed fields remain enforced. Numeric provider fields and failed-payment empty `payType` are covered at the HTTP boundary. |
| Verified final create failure left an attempt pending indefinitely | Distinguish signed, bound rejection from unverified failures; mark only documented final failures FAILED under the order lock. Timeout/nonfinal/forged outcomes stay pending. Verified success cannot be downgraded by a later create rejection. |
| Expired login session discarded payment-return order context | Customer login retains the validated internal order ID and returns to that payment-status page. Other roles keep their existing area destination. Backend ownership checks remain mandatory; no arbitrary redirect URL is accepted. |

Payment success remains separate from order confirmation, inventory deduction
and completion. The website collects no bank/MoMo account password. The payment
return wording was simplified without changing visual layout.

## Verification

| Gate | Result | Evidence |
| --- | --- | --- |
| Java 21 `mvnw.cmd clean verify` on dedicated PostgreSQL test DB | **393 tests / 61 suites**, zero failures/errors/skips; packaged JAR | [log](audit-assets/verification/20261012-momo-recheck-maven.log), [totals](audit-assets/verification/20261012-momo-recheck-backend-summary.json) |
| MoMo gateway and service integration suites in that run | **19 tests**: request signatures, create/query/refund binding, official URL restrictions, signed IPN HTTP handling, forged/missing fields, final/nonfinal failures, concurrent callbacks, retries, refund/cancellation and amount bounds | [gateway tests](../m4n-backend/src/test/java/com/m4n/backend/service/serviceImpl/MomoGatewayTest.java), [integration tests](../m4n-backend/src/test/java/com/m4n/backend/service/MomoPaymentIntegrationTest.java) |
| Native frontend tests | **22 tests**, zero failures/skips; includes MoMo/VNPay return-ID parsing and unsafe redirect rejection | [log](audit-assets/verification/20261012-momo-recheck-frontend-tests.log) |
| Frontend lint and build | PASS | [lint](audit-assets/verification/20261012-momo-recheck-frontend-lint.log), [build](audit-assets/verification/20261012-momo-recheck-frontend-build.log) |
| Real provider / rendered browser acceptance | **Not run**: no MoMo merchant credentials; browser acceptance remains unavailable from the earlier audit | No live-payment or rendered-UI success claimed |

The provider HTTP API tests use synthetic responses; the IPN HTTP tests use the
real HMAC verifier with test-only keys and a real PostgreSQL transaction.
An initial targeted run found a Mockito re-stubbing error in the new test,
which was repaired; the final full gate above includes all final changes.
No dependency, schema, fulfillment or money rule changed in this pass.
Normal port 8080 and `m4n_db` were not restarted/modified.
Source snapshots are retained in
`C:/Users/tdinh/AppData/Local/Temp/m4n-momo-recheck-20261012/`.
[The source manifest](audit-assets/verification/20261012-momo-recheck-source-manifest.json)
records the 12 changed/added source and test paths for review. Controllers remain
transport-only, the DTO maps fields only, and state mutations stay in the service
transaction. This pass changes no dependency manifests or database migration.

## Remaining MoMo acceptance

1. Configure sandbox partner/access/secret keys outside chat/source control,
   plus public HTTPS frontend return and backend IPN URLs. Variables and
   contracts are in [CUSTOMER_FLOW_INTEGRATIONS.md](CUSTOMER_FLOW_INTEGRATIONS.md).
2. Verify an actual MoMo Test payment and rejection, closing the browser before
   returning, delayed/duplicate IPN, querying an unknown outcome, and a full
   refund. Verify the customer can resume after login expiration.
3. Production online payment still needs merchant onboarding, approved live
   gateway configuration and live acceptance. The current fixed sandbox host
   cannot charge production customers. Other release gates remain in
   [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md).

## Official contracts checked

- [One-time wallet payment and signature fields](https://developers.momo.vn/v3/vi/docs/payment/api/wallet/onetime/)
- [Payment notification and redirect parameters](https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/notification/)
- [Query](https://developers.momo.vn/v3/vi/docs/payment/api/payment-api/query/)
- [Refund](https://developers.momo.vn/v3/vi/docs/payment/api/payment-api/refund/)
- [Final and pending result codes](https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/resultcode/)
- [Idempotency](https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/idempotency/)
