# PostgreSQL rollout — 2026-10-10

The ordered upgrade scripts below update an existing M4N schema. Apply them to
the same schema used by the backend after a
database backup and before starting the new application version. Stop application
writes during migration. Run with a database client that stops on SQL errors.
Each script supplies its own transaction.

## New empty database

For a new installation only, apply `20261012_initial_schema.sql` first, then
all ordered upgrades below. The baseline contains the 28 current mapped tables,
sequences, keys and indexes without development accounts or transaction data.
It rejects a nonempty public schema and must never be used as an upgrade.
Normal startup initializes roles; first SUPER_ADMIN provisioning remains opt-in.
PostgreSQL 18.4 is the verified version; PostgreSQL 14+ compatibility has not
been exercised in this environment. No migration engine is introduced.

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
11. `20261012_email_otp.sql`
12. `20261012_delivery_address.sql`
13. `20261012_momo_payments.sql`
14. `20261012_inventory_integrity.sql`
15. `20261012_schema_checks.sql`
16. `20261015_saved_delivery_addresses.sql`
17. `20261016_pending_registration.sql`
18. `20261016_unique_account_email.sql`
19. `20261016_pos_momo_payments.sql`
20. `20261016_pos_momo_cancellation.sql`
21. `20261016_pos_invoice_email.sql`

The POS invoice-email upgrade adds durable delivery timestamps and a pending
index. It does not enqueue historical invoices. New verified MoMo settlements
queue their PDF receipt atomically with invoice creation. Apply before starting
the updated backend with schema validation.

The POS cancellation upgrade adds a default-false durable cancellation flag
without changing historical transactions. A database constraint rejects an
invoice on a cancelled intent; charge/refund history remains preserved.

The POS MoMo upgrade adds durable cashier-owned sandbox payment intents, their
immutable bill, verified charge/refund status and optional completed invoice.
Apply after invoice/user schemas; no historical invoice/payment is changed.
Only verified settlement creates an invoice and deducts inventory. An automatic
refund after settlement rejection is persisted independently of completed sales.

The unique-account-email upgrade enforces uniqueness on `LOWER(BTRIM(email))`
for all users, including unverified and inactive accounts. Existing conflicting
rows cause migration failure; inspect them and obtain an approved correction
before retrying. No accounts are merged or deleted automatically. This expression
index is maintained by explicit migration, not Hibernate schema update.

The pending-registration upgrade adds `users.email_verified`, backfilling historical
accounts to true. New public registrations explicitly write false and cannot obtain
a session before OTP verification. Apply this script before a validated deployment.
The abandoned local draft challenge profile columns are no longer mapped; the
upgrade does not delete any historical columns or data.

The address-book upgrade adds owned, versioned recipient entries and an index for
paging, including checks/FK when Hibernate already created the development table.
It does not copy profile fields automatically or change order snapshots.

The inventory integrity upgrade validates the existing nonnegative-stock rule.
If historical negative stock exists, it stops without changing quantities.
Investigate and approve an inventory correction before retrying.

The schema-check upgrade restores existing article, promotion, shipping and OTP
checks even when Hibernate previously created those tables. Earlier guarded
table-creation scripts alone did not add these checks to existing tables.
Invalid historical rows stop validation without being changed.

The 2026-10-12 scripts add hashed OTP challenges, canonical address IDs and MoMo
attempt URLs/provider identifier widths. Apply payment-attempt creation before
the MoMo extension. Historical order amounts, payment/refund states and address
text are preserved. Uploads use persistent filesystem storage and require no
additional database migration. Back up image storage alongside the database.

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
