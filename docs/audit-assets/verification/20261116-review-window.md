# Seven-day product review window

Approved requirement: Customer reviews are allowed only after receipt, within
7 days. Receipt confirmation is the existing Customer action “Đã nhận được hàng”,
which moves DELIVERED to COMPLETED and records `Order.completedAt`.

The backend enforces the inclusive 168-hour interval in both eligibility lookup
and submission, preserving ownership, purchased-product and duplicate checks.
Missing/future timestamps fail closed. Historical reviews remain visible. No
database migration or production data update is required.

## Verification

- Targeted Maven tests: ReviewServiceTest and ReviewPaginationIntegrationTest,
  17 passed. Covered exact deadline, expiration, missing/future receipt times,
  ownership, purchased products, duplicate submissions and submitting from an
  eligible page after its deadline passes.
- `mvnw.cmd clean verify`: 602 passed, zero failures/errors/skips, packaged JAR
  built. Tests used only loopback PostgreSQL `m4n_test`. Set the test process
  variable `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE=5`; the initial run with
  default pools exhausted local PostgreSQL connections across cached contexts.
  Production configuration was unchanged.
- `npm run lint` and `npm run build`: passed.
- `npm test`: 95 passed, 3 existing failures in `posMomoService.test.mjs`.
  These tests expect MoMo URLs/endpoints, while the existing service uses VNPay.
  That test and its service dependencies have no diff from origin/main.
- Browser: local frontend displayed the 7-day guidance on product detail with
  public catalog/review data. No live order/review was created for verification.
- Security review: identity comes from the authenticated account; the submission
  endpoint rechecks persisted order status/timestamp under the existing order
  lock. Repository parameters are bound. No client timestamp is accepted.
- UI review: the changed guidance retains labelled controls, inline submission
  errors, white/cool-gray surfaces and existing responsive layout.
