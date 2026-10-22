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

- Product, Category, Artist/Artisan, Craft Village, Inventory, User/Role (including staff management), Voucher, and Order.

### Customer shopping

- Browse, search, and filter products by instrument group (string, wind, percussion), artisan, craft village, and price range.
- Product details: images, video, material, dimensions, vocal/audio range information, and origin.
- Add to cart, update quantity, remove cart item, checkout, online payment, COD, apply voucher, place order, and track order.

### Online order processing

- Online Staff can view, accept/confirm, and update orders.
- Recheck inventory when an order is confirmed.
- Handle out-of-stock orders and cancellation requests according to defined permissions.

### POS

- Open POS; enter a product code; scan a barcode with a web camera; search products.
- Add products to a bill, update quantity, remove items, calculate totals, and apply a voucher.
- Confirm payment, create an invoice, export a PDF invoice, and update inventory.

### Product and inventory management

- CRUD Product and Category.
- Manage Artist/Artisan, Craft Village, price, images/video, and product information.
- Import stock, update/view inventory, and check out-of-stock or low-stock items.

### Voucher

- Apply the approved minimum-order condition and discount formulas defined in [`BUSINESS_RULES.md`](BUSINESS_RULES.md).

### Engagement

- Product review.
- Customer ↔ Online Staff chat.
- Notification.

### Dashboard and reporting

- Revenue by day, week, month, and quarter.
- Best-selling products, number of orders, completed orders, cancelled orders, and inventory status.

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
