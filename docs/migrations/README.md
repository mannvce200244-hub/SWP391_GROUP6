# PostgreSQL rollout — 2026-10-10

These scripts upgrade an existing M4N schema; they do not create the original
application schema. Apply them to the same schema used by the backend after a
database backup and before starting the new application version. Stop application
writes during migration. Run with a database client that stops on SQL errors.
Each script supplies its own transaction.

## Order

1. `20261010_role_order_status_constraints.sql`
2. `20261010_order_notes_text.sql`
3. `20261010_user_session_version.sql`
4. `20261010_articles.sql`
5. `20261010_stock_documents.sql`
6. `20261010_payment_attempts.sql`
7. `20261010_product_low_stock_threshold.sql`
8. `20261010_product_pricing_shipping.sql`
9. `20261010_order_promotions.sql`
10. `20261010_commerce_pricing_snapshots.sql`

Product pricing and order promotions must precede commerce snapshots. Order
promotions adds fields absent from the original schema and classifies existing
percentage vouchers as `MANUAL`. Historical discounts are copied into their
manual component, with zero automatic component; totals are preserved. Historic
completion timestamps remain null because the original schema did not record a
completion event; reporting keeps its existing update/create-time fallback.
The voucher enum constraint
must include `SHIPPING`; Hibernate development schema update does not reliably
replace an existing enum check. Historical transaction amounts are backfilled
from their stored values, never recalculated with today's prices or promotions.

## Checks and configuration

- Review historical nonpositive product prices using the query in the product
  pricing script. An Admin must supply approved corrections before validating
  the added price constraint; no replacement price is assumed.
- Shipping starts disabled. Configure product weights/surcharges and Admin
  shipping settings before enabling charging. Old transactions retain zero
  shipping and their original totals.
- Configure `SPRING_JPA_HIBERNATE_DDL_AUTO=validate` for deployment. `update` is
  for development; successful startup with `validate` verifies entity/schema
  compatibility but does not replace business regression tests.
- Configure external secrets and the invoice Unicode font as documented in
  `../DEVELOPMENT_GUIDE.md` and `../EXTERNAL_INTEGRATIONS.md`. Missing provider
  accounts keep VNPay/email unavailable; migrations never enable them.
- Run the applicable regression suite and a startup smoke check against the
  upgraded schema before restoring traffic. Keep the backup until verified.

The scripts use guarded additions for repeat execution, but `CREATE TABLE IF
NOT EXISTS` does not repair an unrelated or partially defined existing table.
Inspect any SQL error or schema drift instead of assuming a rerun repaired it.
No migration engine or automatic production migration was added.
