# Database Guide

PostgreSQL is the approved database and the source of truth for persistent business data. Existing entities and the approved feature contracts define the implemented schema; this guide sets its integrity and rollout constraints.

## Data integrity

- Give persistent records appropriate primary keys and relationships appropriate foreign keys.
- Enforce referential integrity in the database where applicable.
- Keep naming conventions consistent across tables, columns, keys, indexes, and migrations. The exact convention is **TBD — must be decided by the team**.
- Do not create entities or tables outside [`PROJECT_SCOPE.md`](PROJECT_SCOPE.md) unless clearly marked as a proposal and approved before implementation.
- Do not store derived data unless there is an approved need and a defined consistency strategy.

## Money

- Never use binary floating-point types for prices, discounts, final amounts, or revenue.
- Use an appropriate exact decimal representation whose precision, scale, currency handling, and rounding policy are approved before schema implementation.
- Recalculate and validate authoritative monetary values on the backend.

## Transactions and concurrency

- Use transactions for operations that affect inventory, payment, order status, invoices, or coupled records.
- Online Place Order does not deduct or reserve stock.
- Recheck and deduct stock atomically when Online Staff/Admin confirms an order.
- Recheck and deduct stock as part of successful POS payment confirmation.
- Prevent lost updates and enforce the invariant `inventory >= 0`, including under concurrent confirmations.
- Do not finalize a partially applied inventory/payment/order operation.

See [`BUSINESS_RULES.md`](BUSINESS_RULES.md) for authoritative behavior.

## Historical data

- Do not hard-delete an entity referenced by a historical order, invoice, payment, review, or inventory transaction when deletion would destroy or corrupt that history.
- Any archival or soft-delete behavior is **TBD — must be decided by the team**; do not invent it silently.

## Migrations

- Every schema change must use a controlled, reviewable migration. The current rollout uses explicit PostgreSQL scripts in [`migrations/README.md`](migrations/README.md); no migration engine is selected or added.
- Migrations must be deterministic, ordered, and safe for existing data.
- Do not modify an already-applied shared migration without an explicit team-approved recovery plan.
- A packaged migration engine and a complete initial baseline for new production databases remain **TBD**. Current scripts upgrade the existing M4N schema and do not supply an initial schema.

## Implemented decisions and remaining setup

- The local application uses PostgreSQL with external connection credentials; deployment must supply its own configuration.
- Current tables, relationships and indexes follow existing JPA mappings and the approved feature contracts. A complete initial production baseline remains to be selected.
- Monetary precision, VND rounding and calculated limits follow `PRICING_CONTRACT.md`.
- Inventory writes use service transactions and pessimistic locking with consistent ordering; account/configuration updates also use optimistic versions where documented.
- A migration engine remains unselected; explicit upgrade scripts and schema validation are the current rollout path.

New schema requirements outside these contracts must be labelled **Proposal — not approved for implementation**.
