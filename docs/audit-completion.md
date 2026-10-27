# M4N completion and verification — phase 2

This report supersedes the remaining-gap section from phase 1. The user requested
implementation and delegated routine choices. Provider accounts/keys are not
available; no dependency or version was added. The original local source snapshot
is retained for the final reviewer because the workspace has no Git metadata.

## Work completed

| Area | Implementation and source of truth |
| --- | --- |
| Stock | Draft receipts/issues, explicit confirmation, inbound accepted/rejected quantities and immutable movement snapshots; `STOCK_CONTRACT.md` |
| Cultural content | Admin draft/publication and public Article/Guide discovery/detail/related content; `CONTENT_CONTRACT.md`, `audit-cultural-content.md` |
| Lists | Database discovery, voucher and review paging/filtering, stable sorting and safe range validation; `DISCOVERY_CONTRACT.md`, `REVIEW_CONTRACT.md`, `PRICING_CONTRACT.md` |
| Email/payment | Opt-in Resend reset delivery, signed VNPay sandbox payment/query/full refund, backend status return page and Admin refund confirmation; `EXTERNAL_INTEGRATIONS.md` |
| Bootstrap/chat | External initial SUPER_ADMIN credentials, no overwrite; release OPEN assignments when staff is disabled/demoted |
| Pricing | Highest applicable product rate; additive bounded price/order discounts; configured shipping, freeship, separate SHIPPING voucher; immutable order/POS item and total snapshots; `PRICING_CONTRACT.md`, `audit-product-pricing-shipping.md` |
| UI | Product weight/surcharge and program forms, Admin shipping settings, ship voucher and fee breakdown, truthful stock-draft/email feedback, payment unavailable/error/reconcile states |
| PDF/deployment | Unicode font embedding and explicit failure when unavailable, product savings breakdown, reviewable schema upgrades and rollout order; `migrations/README.md` |

## Review findings repaired before final gates

- Zero product rate preserves fractional listed prices; a positive discount never
  increases the original price after rounding.
- A shipping preview with absent configuration returns the default disabled quote
  without inserting within a read-only transaction; Admin get/update initializes
  persistent configuration.
- Pending or unknown VNPay results require reconciliation before cancellation;
  successful payment does not confirm, deduct inventory or complete an order.
- Voucher type is immutable after any historical use, including a cancelled order
  whose usage was released. Invalid ship vouchers with positive fees reject
  placement without side effects; zero/freeship consumes no ship voucher.
- Calculated money is checked before persistence, preventing overflow in original
  subtotals, shipping snapshots, POS received/change and final totals.
- Empty Admin voucher searches retain string typing in Hibernate/PostgreSQL;
  unsupported HTTP methods return 405 with Allow instead of an internal error.
  Unsupported request/response media types retain 415/406 with safe JSON errors.
- Checkout preview validates both voucher-code lengths and returns field errors
  before service execution; its optional absent JSON body remains supported.
- Cart removal uses managed collection orphan removal without redundant explicit
  item deletes or merging a cleared cart. Place/cancel in one transaction now
  retains historical prices and releases vouchers without detached-entity errors.
- Article query parameters and zero edit versions are explicitly serialized by
  the frontend service; native regressions cover filters, paging and picker text.
- Original-schema rollout includes order promotion fields, product low-stock
  thresholds and role/status checks. Startup no longer runs ALTER TABLE.

## Verification

All results below refer to the final phase 2 source, checked on 2026-10-11.

| Gate | Command/check | Result |
| --- | --- | --- |
| Backend | `mvnw.cmd clean verify`, Java 21, configured local PostgreSQL | PASS: **338 tests / 52 suites**, zero failures/errors/skips; executable JAR packaged at 18:07:39 +07:00 |
| Frontend lint | `npm run lint` | PASS, no errors |
| Frontend production build | `npm run build` | PASS, 2061 modules; initial JS approximately 323.68 kB / 94.33 kB gzip |
| Native frontend regressions | `node --test tests/*.test.mjs` | PASS: **16 tests**, covering HTTP recovery/query contracts, chat merging and payment service URLs |
| Local schema rollout | Backup followed by all 10 scripts in `migrations/README.md` | PASS: historical order/invoice counts and subtotal/discount/final sums, inventory count/quantity sums unchanged |
| Packaged startup | Final JAR, seeding disabled, `spring.jpa.hibernate.ddl-auto=validate` | PASS against PostgreSQL 18.4; no startup constraint DDL |
| Final localhost API smoke | Sample Admin/Online Staff/POS/Customer sessions | PASS: **48 checks**, including four successful logins/logouts, public/admin paging, stock/content lists, role/ownership denial, absent payment order, disabled VNPay 503, preview field errors and 405/406/415 behavior |
| Rendered UI | Available browser-control tools | Phase 1 representative checks retained; **phase 2 rendered UI not verified** because browser-control tools became unavailable |

Surefire XML totals independently agree with Maven's summary. The final run
includes product/SQL price equivalence, overlapping promotions, shipping caps,
voucher consumption and races, historical snapshots, cart/order flush behavior,
stock confirmation/QC, inventory concurrency, content publication, auth/session
integrity, payment/refund reconciliation, role/ownership and transport errors.
No test was disabled to obtain these results. Earlier failing final attempts
exposed detached cart collections, empty voucher-query typing and a stale User
test fixture; fixes retained their behavioral assertions and the full gate passed.

Sanitized evidence:

- [Maven final summary](audit-assets/verification/maven-summary-20261011.txt)
  and [independent XML totals](audit-assets/verification/backend-tests-20261011.json).
- [API smoke matrix](audit-assets/verification/api-smoke-20261011.json).
- [Migration integrity](audit-assets/verification/migration-integrity-20261011.txt)
  and [schema-validation startup](audit-assets/verification/startup-validate-20261011.txt).
- [Phase 1 UI matrix and screenshots](audit-operational-ui.md), explicitly scoped
  to the earlier UI. They do not prove the later pricing/content/payment screens.

The local migration ran on the existing development database after prior schema
work; this is not evidence of a fresh installation or a production rollout.
No real provider operation, completed sale, stock confirmation, content
publication or new order was performed during the final API smoke.

## Operational limits

- The user has no provider accounts/keys. Live Resend email and VNPay transactions
  are unverified; VNPay is unavailable until configured. Only sandbox endpoints
  are selected. A production provider rollout is a separate environment change.
- Upgrade an existing database using `migrations/README.md`; configure external
  credentials and a licensed Vietnamese Unicode font, then verify startup with
  schema validation. No migration engine or automatic production rollout was added.
- Physical camera success, a full screen-reader session and every browser/zoom
  combination remain unverified. Source review and representative browser checks
  do not establish an entirely bug-free production system.
- Phase 2 Admin pricing/settings/ship vouchers, stock QC/content publication,
  checkout fee display and payment-return screens were reviewed in source and
  compiled, but their final rendered interaction checks remain unperformed.

## Cleanup and review

- Final API sessions were logged out. Task-started localhost servers are stopped
  after verification; the retained JAR can be started with external configuration.
- Original source snapshots and the local database backup remain outside the
  repository for recovery/review. Tokens and database credentials are excluded
  from the committed-style evidence under `docs/audit-assets/verification/`.
- [Source manifest](audit-source-manifest.md) was refreshed after the last source
  edits: 336 changed source paths plus four added native frontend test files.
  The original snapshot lacks package/POM copies, so it cannot independently
  prove dependency-file equivalence; no dependency/version was added during work.
- Final scans found no controller Repository/EntityManager/transaction access,
  production TODO/debug printing, frontend debug statements or ignored `params`
  options. Existing oversized files and their natural boundaries remain explicit
  review targets in the module audits; line counts are not compliance proof.
- Browser tabs could not be cleaned through the unavailable control tool. The
  fresh phase 2 tab was unauthenticated; the old blocked tab was not bypassed.

## Suggested Claude review order

1. Read project/module instructions, `BUSINESS_RULES.md`, the feature contracts and
   refreshed `audit-source-manifest.md`.
2. Review auth/user/chat lock ordering, order/payment/refund reconciliation,
   inventory all-or-nothing updates and voucher locking/usage rollback.
3. Check product/SQL charged-price equivalence, decimal bounds/rounding, shipping
   order, zero-price cases and historical snapshot preservation.
4. Compare DTOs with frontend services/forms and inspect async guards, failure
   feedback, pagination, responsive dialogs and access restrictions.
5. Review migrations/configuration and distinguish synthetic provider tests from
   live verification. Read exact gate/browser evidence below.
