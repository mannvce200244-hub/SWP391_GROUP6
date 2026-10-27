# Project Scope

This file is the source of truth for approved M4N scope. Implementation must not expand it without an explicit team update.

## In Scope

### System and actors

- One system with Customer Website, Admin/Back Office, and POS areas.
- One shared backend and PostgreSQL database in a single frontend/backend repository.
- Actors: Customer, Online Staff, POS Staff, Admin, and Super Admin.
- Customer Website supports online shopping; Admin/Back Office manages products, inventory, staff, user accounts, vouchers, orders, dashboards, and reports; POS supports showroom sales.

### Authentication and accounts

- Customer registration (creates CUSTOMER accounts only), login, logout, role-based authorization, and account/profile management.
- JWT Access Token (short-lived) and PostgreSQL-backed Refresh Token sessions with automatic rotation and reuse detection.
- Refresh token revocation on logout (current session), logout all sessions, account disable, and role changes.
- Account security: Change Password, Forgot Password, and single-use Reset Password token.
- Inactive account enforcement across all authentication mechanisms. Database is current role authority.
- Roles: CUSTOMER, ONLINE_STAFF, POS_STAFF, ADMIN, and SUPER_ADMIN.
- SUPER_ADMIN manages privileged accounts while regular ADMIN cannot modify ADMIN or SUPER_ADMIN roles/status.
- Concurrency: JPA `@Version` optimistic locking protects concurrent user modifications against lost updates (returns HTTP 409 Conflict).
- System invariant: Always guarantees at least one active SUPER_ADMIN.

### Master data

- Traditional musical instrument and accessory Product, Category, Artist/Artisan, Craft Village, Inventory, User/Role (including staff management), Voucher, Promotion, Order, POS Invoice, Stock Receipt/Issue, and cultural Article/Guide content.

### Customer shopping

- Browse, search, and filter traditional musical instruments and accessories by instrument group (string, wind, percussion), artisan, craft village, and price range.
- Product details: images, video, material, dimensions, vocal/audio range information, craft-village/artisan provenance, price, inventory availability, and related usage guidance.
- Browse cultural articles and videos about traditional instruments, artisans, craft villages, origins, care, and usage guidance.
- Add to cart, update quantity, remove cart item, checkout, apply the approved discounts, place an order, and track its fulfillment timeline.
- Pay by COD or through a real, verified online-payment provider integration (for example VNPay or MoMo) selected and configured for the deployment. A simulated, client-declared, or otherwise unverified payment-success flow is never in scope.
- VNPay 2.1 is selected for the configured online integration. Checkout offers COD and enables VNPay only when its required external configuration is complete; no provider credentials are currently available. Verified payment/refund behavior follows `EXTERNAL_INTEGRATIONS.md` and `COMPLETION_PLAN.md`.

### Online order processing

- Online Staff can view, accept/confirm, and update orders.
- Recheck inventory when an order is confirmed.
- Move an online order through the controlled lifecycle `PENDING_CONFIRMATION → CONFIRMED → SHIPPING → DELIVERED → COMPLETED`, with `CANCELLED` and `OUT_OF_STOCK_WAITING` as controlled exception states.
- Let the owning Customer self-cancel only while the order is `PENDING_CONFIRMATION`. From `CONFIRMED` onward, cancellation or return handling requires authorized Staff/Admin action; no separate cancellation-request queue is required.
- When confirmation finds insufficient stock, move the whole order to `OUT_OF_STOCK_WAITING` without a partial deduction and notify the Customer.
- After stock import, authorized Staff/Admin may explicitly retry an `OUT_OF_STOCK_WAITING` order. Retry uses the same locked, all-or-nothing inventory check as initial confirmation. Stock import alone must not confirm, charge, or complete an order; there is no automatic batch reprocessing. The first order successfully confirmed receives available stock first.
- Let the owning Customer confirm receipt of a `DELIVERED` online order; that confirmation completes the order.

### POS

- Open POS; enter a product code; scan a barcode with a web camera; search products.
- Add products to a bill, update quantity, remove items, calculate totals, and apply the approved manual voucher and automatic order-value promotion rules.
- Confirm payment, create an invoice, export/reprint a PDF invoice, update inventory, and let POS Staff view only their own transaction history.

### Product and inventory management

- CRUD traditional musical-instrument/accessory Product and Category.
- Manage Artist/Artisan, Craft Village, listed price, images/video, barcode/product code, physical attributes, and product information.
- Manage cultural Article/Guide content associated with instruments, artisans, craft villages, origins, care, and usage.
- Create and confirm stock receipts/issues, view movement history, and maintain one shared inventory balance for online and POS sales.
- A stock receipt increases sellable inventory only after authorized confirmation. Items rejected during inbound quality inspection are recorded as rejected/returned to the supplier or artisan and do not increase sellable inventory.
- Inventory is reduced only by an approved online-order confirmation, a completed POS sale, or another explicitly approved stock issue. Every stock-reducing operation must prevent negative inventory.
- Configure a low-stock threshold per Product and show low-stock and out-of-stock alerts.

### Promotions and vouchers

- Approved promotions include a manually entered price voucher, an automatic percentage discount when an order or POS bill reaches its configured minimum value/quantity, product percentage programs, configurable shipping/freeship and a separate fixed-amount shipping voucher. The user-approved extension and exact calculation order are in `PRICING_CONTRACT.md`.
- Admin can manage the active period, eligibility threshold, percentage, and lifecycle of these approved promotions.
- The current Admin voucher list and Create/Edit modal expose the business fields needed for detail review. A separate voucher detail route is not required.
- The manual voucher and eligible automatic order-value discount may be combined. All eligibility checks, discount calculations, rounding, maximum-discount constraints, and final totals are backend-owned and follow [`BUSINESS_RULES.md`](BUSINESS_RULES.md).
- Inventory-age and loyalty-tier discounts remain outside the approved scope.

### Engagement

- Product rating, review, and comment for eligible completed purchases, including the displayed average rating; no arbitrary hard-delete lifecycle.
- Customer ↔ Online Staff chat.
- Event-driven notification from approved business events; no manual broadcast composer.
- The legacy notification use case is a system delivery function triggered by those events, not an Admin notification CRUD screen.

### Dashboard and reporting

- Revenue from completed online orders and POS invoices by day, week, month, and quarter, excluding cancelled transactions.
- Best-selling products, number of orders, completed orders, cancelled orders, and shared inventory status including low-stock/out-of-stock items.
- These dashboard views satisfy the current report scope. Separate report pages, custom date ranges, and report export are not currently approved.

## Deferred / Future

No future feature has been formally approved in the supplied requirements. Any feature not listed under **In Scope** is **Not approved for implementation** until the team explicitly updates this document. Do not turn possible future ideas into a mandatory backlog.

## Out of Scope

The following must not be implemented unless the team later approves and documents them:

- Microservices or independently deployed Customer, Admin, and POS services.
- Message queues, event buses, event sourcing, or other distributed architecture.
- Native mobile applications.
- AI recommendation systems.
- External shipping integration.
- Any unlisted feature, integration, or business workflow.

These items are not required backlog work.
