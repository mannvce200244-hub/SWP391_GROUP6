# Project Scope

This file is the source of truth for approved M4N scope. Implementation must not expand it without an explicit team update.

## In Scope

### System and actors

- One system with Customer Website, Admin/Back Office, and POS areas.
- One shared backend and PostgreSQL database in a single frontend/backend repository.
- Actors: Customer, Online Staff, POS Staff, Admin, and Super Admin.
- Customer Website supports online shopping; Admin/Back Office manages products, inventory, staff, user accounts, vouchers, orders, dashboards, and reports; POS supports showroom sales.

### Authentication and accounts

- User-approved extension (2026-10-12): email OTP verification before customer login and email OTP password reset through Gmail SMTP with an app password. SMS is pending selection of an SMS provider.
- User clarification (2026-10-16): create the CUSTOMER in `users` with a BCrypt password hash and `email_verified=false` when registration and OTP delivery are accepted, then show only OTP entry. Unverified accounts cannot obtain login, refresh or protected access; a later login with matching credentials returns to email verification. OTP success verifies the same account without creating another User.

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

- User-approved extension (2026-10-12): GHN administrative address selection and carrier fee calculation, MoMo sandbox official payment redirect with verified server results, selected cart-item checkout and secure product image upload. See `CUSTOMER_FLOW_PLAN.md` for delivery and configuration constraints.
- User-approved MoMo demo mode (2026-10-16): hosted international-card sandbox checkout (`payWithCC`), using the order recipient email and the provider's 1,000–10,000,000 VND transaction range. Card data is entered only on MoMo.
- User-approved hosted demo (2026-10-16): frontend on Vercel, backend on Railway; preserve MoMo sandbox checkout after deployment using permanent HTTPS return/IPN URLs, same-origin browser API forwarding and an explicit sandbox deployment opt-in under the secured `prod` profile. Real-money MoMo remains outside this demo. See `VERCEL_RAILWAY_DEPLOYMENT.md`.
- User-approved MoMo cancellation (2026-10-16): Customers can confirm cancellation of their own paid pending orders; the backend requests a verified full refund and cancels only after success. Pending/failed refunds keep the order unchanged. See BR-ORDER-02. The payment return page shows a concise, backend-verified result, order code, amount and navigation to orders.

- Browse, search, and filter traditional musical instruments and accessories by instrument group (string, wind, percussion), artisan, craft village, and price range.
- Product details: images, video, material, dimensions, vocal/audio range information, craft-village/artisan provenance, price, inventory availability, and related usage guidance.
- Browse cultural articles and videos about traditional instruments, artisans, craft villages, origins, care, and usage guidance.
- Add to cart, update quantity, remove cart item, checkout, apply the approved discounts, place an order, and track its fulfillment timeline.
- Pay by COD or through a real, verified online-payment provider integration (for example VNPay or MoMo) selected and configured for the deployment. A simulated, client-declared, or otherwise unverified payment-success flow is never in scope.
- VNPay 2.1 and MoMo sandbox are selected for the online integrations. User update (2026-10-16): new checkout offers COD and MoMo only; remove the VNPay option and its unavailable notice. MoMo is enabled only when its required external configuration is complete. Existing VNPay order history, verification and refund handling remain supported. Public MoMo sample credentials are configured locally for the approved sandbox demo; they are not a production merchant account. Verified payment/refund behavior follows `EXTERNAL_INTEGRATIONS.md`, `CUSTOMER_FLOW_INTEGRATIONS.md` and `COMPLETION_PLAN.md`.

### Online order processing

- Online Staff can view, accept/confirm, and update orders.
- Recheck inventory when an order is confirmed.
- Move an online order through the controlled lifecycle `PENDING_CONFIRMATION → CONFIRMED → SHIPPING → DELIVERED → COMPLETED`, with `CANCELLED` and `OUT_OF_STOCK_WAITING` as controlled exception states.
- Let the owning Customer self-cancel only while the order is `PENDING_CONFIRMATION`. From `CONFIRMED` onward, cancellation or return handling requires authorized Staff/Admin action; no separate cancellation-request queue is required.
- When confirmation finds insufficient stock, move the whole order to `OUT_OF_STOCK_WAITING` without a partial deduction and notify the Customer.
- After stock import, authorized Staff/Admin may explicitly retry an `OUT_OF_STOCK_WAITING` order. Retry uses the same locked, all-or-nothing inventory check as initial confirmation. Stock import alone must not confirm, charge, or complete an order; there is no automatic batch reprocessing. The first order successfully confirmed receives available stock first.
- Let the owning Customer confirm receipt of a `DELIVERED` online order; that confirmation completes the order.

### POS

- User-approved receipt email (2026-10-16): after verified MoMo card payment produces a committed POS invoice, email that invoice as a PDF to the customer email captured for the payment. Persist pending delivery and retry temporary email failures without changing the successful sale. Failed, cancelled and refunded payments without invoices do not send receipts.
- User-approved extension (2026-10-16): official MoMo sandbox card payment for showroom bills. Persist an owned payment intent before the provider request; create the invoice and deduct inventory atomically only after backend verification. If a charged bill cannot be completed (including insufficient stock or changed pricing), automatically request a full refund without an invoice/deduction. Persist unknown/failed refund outcomes for cashier reconciliation/retry. Cash, bank transfer, receipt/history/PDF and authenticated same-origin return remain supported.
- User-approved POS UI update (2026-10-16): the payment selector offers cash and MoMo only; remove the separate bank-transfer option. Existing bank-transfer invoice history and backend compatibility remain supported.
- User-approved POS cancellation (2026-10-16): the owning cashier may cancel an unissued MoMo bill when the customer stops buying. Persist cancellation before provider checks; never issue an invoice for this intent. Automatically refund an already recorded or later verified charge, retain pending/failed outcomes for reconciliation, and allow a fresh POS bill once cancellation is persisted. Already issued invoices cannot be cancelled through this pending-payment action.

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

### Customer delivery address book — approved 2026-10-15

- Customers can save multiple recipient addresses in their account, edit/delete their own entries, and select one at checkout.
- Each entry contains recipient name, mobile, notification email, delivery address and optional order notes. GHN addresses retain validated province/ward/street details.
- Buy now sends only the chosen product and requested quantity to direct checkout. Opening, editing or completing direct checkout never adds, changes or removes cart items, including an existing row for the same product (user correction, 2026-10-15).

## Deferred / Future

No future feature has been formally approved in the supplied requirements. Any feature not listed under **In Scope** is **Not approved for implementation** until the team explicitly updates this document. Do not turn possible future ideas into a mandatory backlog.

## Out of Scope

The following must not be implemented unless the team later approves and documents them:

- Microservices or independently deployed Customer, Admin, and POS services.
- Message queues, event buses, event sourcing, or other distributed architecture.
- Native mobile applications.
- AI recommendation systems.
- Any unlisted feature, integration, or business workflow.

These items are not required backlog work.
