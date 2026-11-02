# Production and flow recheck — 2026-10-12

## Release conclusion

**The full requested system is not yet approved for public production use.**
This pass repaired source/configuration/schema gaps and verified the packaged
application locally. Actual Gmail/GHN/provider/browser acceptance and the
hosting environment remain unverified. No live deployment was performed.
The release procedure is [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).

## Findings repaired in this pass

| Finding | Repair and evidence |
| --- | --- |
| Default production build could target localhost; local `.env` also explicitly selected localhost | Production API fallback and `.env.production` use `/api/v1`. Final built JS was scanned: no `localhost:8080/api/v1`. Explicit process API override remains supported. |
| No production profile; development schema update and insecure-cookie defaults could be reused | Added `application-prod.properties` and startup configuration validation before datasource/JPA/data runners. Schema validation, Secure cookies, no demo seeding, Swagger disabled, HTTPS origins/media and persistent image directory required. Unsafe DDL override was rejected before datasource initialization. |
| Refresh/logout relied on automatic cookies without a non-simple browser request requirement | Shared client supplies `X-Requested-With: M4N`; security filter enforces it and an exact Origin allowlist for those two cookie endpoints. Simple, opaque/sibling/untrusted-origin requests are rejected without mutating cookies/sessions. Signed callbacks and Bearer APIs retain their contracts. |
| No initial schema for a new empty production PostgreSQL database | Added a schema-only baseline for the current 28 tables, identity sequences, keys and indexes. It rejects populated schemas and inserts no test records. All 15 ordered upgrades were applied successfully afterward. |
| Nonnegative stock was enforced by service code but lacked a DB check | Added the entity CHECK and an explicit validated inventory migration. Invalid historical data stops the migration without changing quantity. PostgreSQL rejects a direct negative-stock insert. |
| Guarded CREATE TABLE migrations did not install their checks when Hibernate had created tables first | New schema-check upgrade restores the existing article, product-promotion, shipping and OTP invariants; repeat application passed. Negative counters/rates, invalid OTP purpose, freeship without threshold, rate above 100% and publication without date were rejected. |
| OTP normalized email with Locale.ROOT while password login/registration/account management depended on the server locale | Matching email paths now use Locale.ROOT. A Turkish-locale regression test verifies registration uses the same canonical email. |
| Setup/test documentation described an older baseline | Updated schema rollout, production procedure, API cookie header contract, Node version requirement and existing native test commands. |

Production startup rejects enabling the existing sandbox-only payment gateways.
This prevents presenting test charges as real payments; live gateway support was
not silently introduced. COD and existing configured local shipping remain
available. Enabling GHN in prod requires its production mode and complete
configuration. Registration/reset require Gmail OTP configuration; configuration
presence does not prove actual email delivery.

## Checks actually performed

| Gate | Result | Evidence |
| --- | --- | --- |
| Final Java 21 `mvnw.cmd clean verify` | PASS: **384 tests / 60 suites**, 0 failures/errors/skips, packaged JAR | [`log`](audit-assets/verification/20261012-production-final-maven.log), [`XML totals`](audit-assets/verification/20261012-production-backend-summary.json) |
| Frontend lint | PASS | [`log`](audit-assets/verification/20261012-production-frontend-lint.log) |
| Production frontend build | PASS; 2063 modules, initial JS 325.24 kB / 94.78 kB gzip; no development API URL in built JS | [`log`](audit-assets/verification/20261012-production-frontend-build.log) |
| Native frontend tests | PASS: **20 tests**, 0 failures/skips | [`log`](audit-assets/verification/20261012-production-frontend-tests.log) |
| New empty PostgreSQL 18.4 schema plus all 15 ordered upgrades | PASS: 28 tables, initially 0 users/orders/invoices; baseline replay correctly rejected | [`migration log`](audit-assets/verification/20261012-production-migrations.log), [`rejection log`](audit-assets/verification/20261012-production-baseline-rejection.log) |
| Database integrity checks | PASS: **7 invalid-data checks**, all test records rolled back | [`SQL`](audit-assets/verification/20261012-production-integrity.sql), [`log`](audit-assets/verification/20261012-production-integrity.log) |
| Packaged prod-profile startup on migrated schema with seeding disabled | PASS with `ddl-auto=validate`, own port 18083; opt-in dedicated SUPER_ADMIN bootstrap | [`startup`](audit-assets/verification/20261012-production-startup.log) |
| Prod-profile localhost HTTP checks | PASS: **21 checks**, health/catalog/permissions/cookie attributes/trusted refresh/rejected requests/logout/proof-required registration/disabled Swagger and sandbox payment flags | [`script`](audit-assets/verification/20261012-production-smoke.ps1), [`sanitized results`](audit-assets/verification/20261012-production-smoke.json) |
| Unsafe prod DDL override | PASS: rejected before Hikari/datasource/JPA startup | [`log`](audit-assets/verification/20261012-production-unsafe-startup.log) |
| npm runtime dependency audit | 0 reported vulnerabilities | [`JSON`](audit-assets/verification/20261012-production-npm-audit.json) |
| npm full dependency audit | Initial pass: **2 high findings** in development tooling. Approved dependency follow-up: **0 vulnerabilities**. | [`initial JSON`](audit-assets/verification/20261012-production-npm-full-audit.json), [`current JSON`](audit-assets/verification/20261012-dependency-npm-audit.json) |
| Rendered browser acceptance | **Not completed**: browser returned an unreachable/blank localhost state, then tool URL policy blocked navigation. No bypass used. | No rendered UI pass claimed |

The final suite includes account/session lifecycle and concurrency, OTP,
selected-cart checkout, carrier quote/fee-change rollback, pricing/vouchers,
payments/refunds, inventory cross-channel concurrency, order lifecycle,
product upload/gallery, RBAC, chat, notifications, stock documents, reviews,
invoice export and dashboards. Tests with synthetic provider responses are not
live provider acceptance tests.

The prod HTTP test uses synthetic Gmail configuration only to verify deployment
configuration and auth transport. It sends no OTP/email or payment/shipping
requests. Requests are made over localhost HTTP while checking the emitted
Secure cookie attributes explicitly; browser HTTPS cookie behavior must still
be exercised on the actual deployment.

## Remaining release work / approvals

1. **Gmail:** sending-account address is still pending; exposed app password
   must be revoked/replaced outside chat. Verify real registration/reset emails.
2. **GHN:** production merchant/shop/pickup configuration, product package data
   and live address/fee acceptance are pending. Missing quotes must block checkout.
3. **Online payments:** current VNPay/MoMo target sandbox exclusively. No live
   merchant contract/credentials or real charge/IPN/query/refund acceptance.
4. **Google login:** not implemented; OAuth2 Client dependency and existing-email
   linking decision are pending. Exposed OAuth secret requires rotation. See
   [`GOOGLE_LOGIN_PLAN.md`](GOOGLE_LOGIN_PLAN.md).
5. **SMS:** no SMS provider selected; Gmail app passwords do not implement SMS.
6. **Dependency compatibility — resolved:** after explicit approval, upgraded
   springdoc from 2.8.5 to Boot 4-compatible 3.1.1. OpenAPI generation and
   Swagger HTML/bundle/configuration regression tests pass. See the follow-up
   verification below.
7. **Build dependency advisories — resolved:** after explicit approval,
   `brace-expansion` 5.0.9 → 5.0.12 and `source-map-js` 1.2.1 → 1.2.2.
   Full npm audit now reports zero vulnerabilities. No other frontend package
   entries or direct dependency declarations changed.
8. **Rendered UI:** keyboard/dialog focus, responsive layouts, errors/retries,
   actual OTP/address/upload screens and provider redirects still need browser
   acceptance. This pass made no visual-layout changes.
9. **Hosting:** public HTTPS, same-site API/cookies, persistent image volume,
   DB runtime permissions, backups/restore, edge rate limits, resource limits,
   Vietnamese invoice font and monitoring have no deployment-host evidence.
   Password login and OTP across distinct recipients need configured edge
   abuse limits; per-email OTP throttling does not replace that gate.

Official references:

- [Spring Security CSRF](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html)
- [Vite environment precedence](https://vite.dev/guide/env-and-mode)
- [springdoc compatibility matrix](https://springdoc.org/#what-is-the-compatibility-matrix-of-springdoc-openapi-with-spring-boot)

## Review and cleanup

No dependencies, provider secrets, new payment business states or unapproved
account-linking behavior were added. Controller boundaries remain unchanged;
new security code is HTTP filtering and configuration validation. New schema
checks implement documented existing rules; invalid data is rejected rather
than rewritten. Applied shared SQL migrations were not edited.

Source snapshot: `C:/Users/tdinh/AppData/Local/Temp/m4n-production-audit-20261012/`.
[`Source change manifest`](audit-assets/verification/20261012-production-source-changes.json)
lists 5 added and 9 modified source/test/resource paths. Configuration templates,
production frontend env, docs and three new SQL scripts are reviewed separately.
Existing large UI/order services were not broadly rewritten; the prior audit's
large-file debt remains. New production config/filter files are 94/46 lines.

Normal port 8080 services and normal `m4n_db` were not changed/restarted. Own
packaged verification processes were stopped. The dedicated integration DB and
`m4n_production_audit_20261012_1739` are retained for review; the latter contains
only the opt-in audit admin/roles/auth test sessions and default shipping settings,
with no products/orders/invoices. No public deployment was performed.

## Approved dependency follow-up — 2026-10-12

User approval covers the springdoc compatibility upgrade and the two npm
security patches. The earlier audit results above remain historical evidence;
this follow-up resolves dependency findings 6 and 7 without changing business
rules or the remaining public-release gates.

| Gate | Result | Evidence |
| --- | --- | --- |
| Dependency scope review | POM changes only springdoc 2.8.5 → 3.1.1; frontend manifest unchanged; lockfile changes exactly the two approved package entries | [`lock changes`](audit-assets/verification/20261012-dependency-lock-changes.json) |
| OpenAPI regression tests | PASS: generated application paths, login request schema, bearer security, anonymous Swagger HTML/bundle and specification configuration | [`test source`](../m4n-backend/src/test/java/com/m4n/backend/config/OpenApiIntegrationTest.java), [`log`](audit-assets/verification/20261012-dependency-openapi-test.log) |
| Java 21 `mvnw.cmd clean verify` | PASS: **386 tests / 61 suites**, zero failures/errors/skips; packaged JAR | [`log`](audit-assets/verification/20261012-dependency-maven-verify.log), [`XML totals`](audit-assets/verification/20261012-dependency-backend-summary.json) |
| Packaged JAR HTTP checks | PASS: **12 checks** on own port 18084; development spec/Swagger assets/configuration work; prod spec/Swagger/configuration return 404; both profiles use `ddl-auto=validate` on the dedicated migrated audit DB | [`script`](audit-assets/verification/20261012-dependency-swagger-smoke.ps1), [`results`](audit-assets/verification/20261012-dependency-swagger-smoke.json) |
| Clean lockfile installation | PASS: `npm ci --ignore-scripts` | [`log`](audit-assets/verification/20261012-dependency-npm-ci.log) |
| Native frontend tests | PASS: **20 tests**, zero failures/skips | [`log`](audit-assets/verification/20261012-dependency-frontend-tests.log) |
| Frontend lint / production build | PASS; 2063 modules, initial JS 325.24 kB / 94.78 kB gzip; no localhost API URL in built JS | [`lint`](audit-assets/verification/20261012-dependency-frontend-lint.log), [`build`](audit-assets/verification/20261012-dependency-frontend-build.log) |
| Full npm audit | **0 reported vulnerabilities**, including development dependencies | [`JSON`](audit-assets/verification/20261012-dependency-npm-audit.json) |

Dependency baselines were retained at
`C:/Users/tdinh/AppData/Local/Temp/m4n-dependency-followup-20261012/`.
No production provider calls or public deployment were performed.
The packaged verification used synthetic SMTP settings without sending mail,
kept seeding/bootstrap disabled, and stopped its own processes. Port 18084 was
confirmed free afterward. Normal port 8080 and `m4n_db` were not changed.

## Subsequent MoMo recheck

The subsequent [MoMo recheck](audit-momo-recheck-20261012.md) repairs return-ID
collision, optional IPN metadata handling, verified final create-failure recovery
and login-return context. Its final gates pass 393 backend tests, 22 frontend
tests and lint/build. Earlier counts above describe their respective audit runs.
Real merchant/provider/browser/hosting release gates remain open.
