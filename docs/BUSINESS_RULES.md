# Business Rules

This file is the source of truth for M4N business behavior. Rule identifiers organize supplied requirements; they do not introduce new behavior. Machine-level status names beyond those explicitly stated remain TBD.

## BR-ORDER-01 — Place order does not deduct inventory

- **Description:** Online checkout creates an order awaiting confirmation without reserving or deducting stock.
- **Preconditions:** A Customer completes Place Order for an online purchase.
- **Rule:** Do not reduce inventory at Place Order time. The initial order status is `PENDING_CONFIRMATION`.
- **Result:** The order exists and awaits staff confirmation; inventory is unchanged.
- **Invalid cases:** Deducting or reserving stock during checkout; treating checkout-time availability as guaranteed stock.
- **Related actors:** Customer, Online Staff, Admin.
- **Related entities:** Order, Order Item, Product, Inventory.

## BR-CART-01 — Checkout only selected cart items

- **Description:** A Customer may buy part of the current cart without removing the remaining products.
- **Preconditions:** The authenticated Customer selects one or more cart items and opens checkout.
- **Rule:** Checkout preview and Place Order use only the selected cart-item IDs. The backend verifies every selected ID belongs to the authenticated Customer's current cart, recalculates authoritative prices, discounts and shipping from that subset, and rejects an empty, duplicate, invalid or stale selection. After successful order creation, remove only the purchased cart items; unselected items remain in the cart unchanged.
- **Result:** The order contains exactly the selected products and the Customer can continue shopping with the unselected products.
- **Invalid cases:** Using client product IDs/quantities to override selected cart rows or trusting client totals; accepting another Customer's cart item; clearing the whole cart after a partial checkout.
- **Related actors:** Customer.
- **Related entities:** Cart, Cart Item, Order, Order Item, Product.

## BR-INVENTORY-01 — Confirmation reserves stock by deduction

- **Description:** Stock is committed only when Online Staff or Admin confirms an online order.
- **Preconditions:** An online order awaits confirmation, and an authorized Online Staff member or Admin attempts confirmation.
- **Rule:** Recheck current inventory at confirmation time. If sufficient, confirm the order and calculate `NewInventory = CurrentInventory - ConfirmedQuantity`. If any item is insufficient, deduct nothing and move the order to `OUT_OF_STOCK_WAITING`. Authorized Staff/Admin may explicitly retry that waiting order after stock import; retry uses the same locked, all-or-nothing confirmation operation. Stock import never auto-confirms waiting orders.
- **Result:** Sufficient stock is deducted and the order is confirmed; insufficient stock is not deducted below zero and the order is routed for staff handling.
- **Invalid cases:** Confirming without a current stock check; deducting before confirmation; allowing negative inventory; silently cancelling an insufficient-stock order without the defined staff workflow.
- **Related actors:** Online Staff, Admin.
- **Related entities:** Order, Order Item, Product, Inventory.

## BR-INVENTORY-02 — First confirmed, first served

- **Description:** Concurrent online orders compete for stock at confirmation, not at checkout.
- **Preconditions:** Multiple Customers have placed orders containing the same Product.
- **Rule:** Place Order does not reserve inventory. The order confirmed first receives stock first. Every later confirmation must recheck inventory at that exact time.
- **Result:** Confirmation order determines allocation; a later order may require out-of-stock handling.
- **Invalid cases:** Allocating by checkout time; relying on a stale stock check; assuming stock was reserved when an order was placed.
- **Related actors:** Customer, Online Staff, Admin.
- **Related entities:** Order, Order Item, Product, Inventory.

## BR-ORDER-02 — Customer cancellation

- **Description:** A Customer's normal self-service cancellation right depends on order status.
- **Preconditions:** A Customer requests cancellation of their online order.
- **Rule:** The Customer may self-cancel only when `Order.status = PENDING_CONFIRMATION`. From `CONFIRMED` onward, cancellation must go through Staff/Admin under the approved workflow.
- **Result:** A pending order can be self-cancelled; a confirmed-or-later order is referred to Staff/Admin.
- **User-approved MoMo extension (2026-10-16):** The owning Customer may confirm cancellation of a paid MoMo order while it is `PENDING_CONFIRMATION`. The backend persists an idempotent full-refund request, calls MoMo outside the database transaction and cancels only when the provider verifies successful full refund. Pending/unknown or failed refunds leave the order unchanged; pending refund retries reuse the persisted request identifier. Verified completion also finishes the requested cancellation when an Admin reconciles the same customer-initiated refund. Confirmation/shipping remains blocked while refund is pending or successful. This customer action does not authorize arbitrary refunds or cancellation after confirmation.
- **Invalid cases:** Customer self-cancellation through the normal function after confirmation; bypassing ownership or authorization checks.
- **Related actors:** Customer, Online Staff, Admin.
- **Related entities:** Order.

## BR-ORDER-03 — Staff cancellation and inventory restoration

- **Description:** Staff cancellation is a controlled state transition, not a separate cancellation-request module.
- **Preconditions:** Authorized Online Staff/Admin cancels an online order.
- **Rule:** `PENDING_CONFIRMATION` and `OUT_OF_STOCK_WAITING` may be cancelled without restoring stock because neither state deducted it. Cancelling `CONFIRMED` locks every referenced Inventory row and restores every Order Item quantity exactly once in the same transaction. Normal cancellation is blocked for `SHIPPING`, `DELIVERED`, `COMPLETED`, and `CANCELLED`; shipped-or-later orders require the applicable delivery/return handling instead of immediately increasing sellable stock.
- **Result:** The order becomes `CANCELLED`; inventory is restored only when a confirmed deduction previously occurred.
- **Invalid cases:** Customer self-cancelling a confirmed order; restoring waiting/pending stock; double restoration; cancelling or immediately restocking an order that has already started delivery.
- **Related actors:** Online Staff, Admin, Super Admin.
- **Related entities:** Order, Order Item, Inventory, Return Request.

## BR-ORDER-04 — Delivery and customer receipt confirmation

- **Description:** Online fulfillment distinguishes shipment, delivery, and final customer acceptance.
- **Preconditions:** Inventory has been deducted and the order is `CONFIRMED`.
- **Rule:** Authorized Staff/Admin moves `CONFIRMED → SHIPPING → DELIVERED`. Only the owning Customer may confirm receipt of a `DELIVERED` order, which moves it to `COMPLETED`. COD remains unpaid before completion and is marked paid by this legitimate completion.
- **Result:** The customer sees a clear delivery timeline and receives the `Đã nhận được hàng` action only at `DELIVERED`.
- **Invalid cases:** Skipping a lifecycle step; customer confirming another customer's order; confirming before `DELIVERED`; completing or charging COD twice.
- **Related entities:** Order, User, Payment, Notification.

## BR-PAYMENT-01 — Backend-owned online order payment state

- **Description:** Payment status and order processing status are separate backend-owned concerns.
- **Preconditions:** A Customer places an online order or Staff completes it.
- **Rule:** The client never supplies authoritative `isPaid`, payment success, discount, or final amount. COD orders are created unpaid and remain unpaid through confirmation; legitimate COD completion marks them paid. Configured VNPay 2.1 and MoMo sandbox accept only provider results verified by the backend (`EXTERNAL_INTEGRATIONS.md`, `CUSTOMER_FLOW_INTEGRATIONS.md`). Payment never confirms/deducts inventory/completes an order. A paid order may be cancelled only after a verified full refund; pending/unknown payment attempts must first be reconciled (`COMPLETION_PLAN.md`). A full refund has its own persisted status and does not erase the historical charged flag.
- **Result:** COD follows a safe lifecycle, and no fake online payment success path exists.
- **Invalid cases:** Treating `CONFIRMED` as paid; trusting client payment flags/totals; accepting an unverified provider result.
- **Related actors:** Customer, Online Staff, Admin.
- **Related entities:** Order, Payment, Inventory.

## BR-REVIEW-01 — Review eligibility

- **Description:** Product reviews require a completed purchase of that Product.
- **Preconditions:** A Customer attempts to review a Product.
- **Rule:** Permit the review only if an order belonging to that Customer contains the Product and has `Order.status = COMPLETED`.
- **Result:** Eligible Customers may submit a Product review; all others are rejected.
- **Invalid cases:** Reviewing without a matching order; reviewing from a non-completed order; using another Customer's order.
- **Related actors:** Customer.
- **Related entities:** Review, Product, Order, Order Item.

Review deletion is not an approved lifecycle action. Customer-owned review update may be introduced only through a separately approved contract; Admin arbitrary hard deletion is not part of the current scope.

## BR-CHAT-02 — Release conversations when an assigned staff member becomes unavailable

The user requested completion of the remaining audit gaps. When account administration
disables an ONLINE_STAFF account or changes its role away from ONLINE_STAFF, release
its OPEN chat assignments to the existing unassigned queue in the same transaction.
Keep messages and closed conversation history. Do not assign another staff member
automatically. Assignment/message authorization must recheck current account/role;
concurrent assignment and account changes must not leave a disabled/demoted staff
member owning an open conversation.

## BR-POS-01 — POS completes and deducts immediately

- **User-approved receipt email (2026-10-16):** queue a PDF receipt for the persisted MoMo customer email in the same transaction that issues the invoice. Deliver only after commit, independently of the browser return or cashier session. Failed/cancelled/refunded payments without an invoice never queue receipts. SMTP failure leaves the sale intact and the delivery pending for retry. Provider callbacks and reconciliation must not enqueue additional receipts for an existing invoice.
- **User-approved pending-bill cancellation (2026-10-16):** The owning active POS Staff may explicitly cancel a MoMo bill before invoice issuance. Persist `cancel_requested` while locking the same intent used for settlement; cancelled intents cannot create an invoice or consume stock/vouchers. If money was already recorded or a later verified IPN/query reports a charge, allocate and request a full refund using the existing durable refund lifecycle. Provider timeouts do not undo cancellation or falsely establish refund success. The cashier may open a fresh bill after the server accepts cancellation; unresolved payment/refund state remains available for reconciliation. If settlement already issued an invoice, reject this pending-bill cancellation instead of silently undoing the sale.

- **User-approved MoMo extension (2026-10-16):** MoMo sandbox card checkout uses a durable, immutable POS bill intent owned by its cashier, with customer email required by the provider. No invoice, stock deduction or voucher consumption occurs when the intent is created. Verify signed IPN or server-to-server reconciliation, then create exactly one invoice and deduct stock/consume voucher usage atomically. Recheck stock, current pricing and discounts; if the charged amount cannot produce a valid invoice, roll back the entire sale and automatically request a full refund. Persist a pending refund before external I/O; retries of unknown outcomes reuse its identifier. A provider-confirmed failed refund can be retried with a new refund identifier. Pending/failed refunds never produce an invoice or a successful-sale message. Only the owning active POS Staff may open/reconcile this intent. Browser return parameters cannot establish payment success. Persisted charged state is historical and is not erased by refunds.

- **Description:** A POS transaction is distinct from the online order-confirmation workflow.
- **Preconditions:** POS Staff confirms a successful showroom payment.
- **Rule:** Create the invoice and deduct inventory immediately. Do not create an online-style order waiting for staff confirmation.
- **Result:** A paid POS invoice is created and stock is reduced in the same protected business operation.
- **Invalid cases:** Creating `PENDING_CONFIRMATION` for a completed POS sale; deducting before successful payment confirmation; completing the sale while allowing negative inventory.
- **Related actors:** POS Staff.
- **Related entities:** POS Transaction, Invoice, Product, Inventory, Voucher.

## BR-INVENTORY-03 — Inventory never becomes negative

- **Description:** Non-negative stock is an invariant for all stock-reducing operations.
- **Preconditions:** Any online confirmation, POS sale, or other approved operation attempts to reduce stock.
- **Rule:** Recheck sufficient stock and perform the deduction in an appropriate transaction. Inventory must never be below zero.
- **Result:** The deduction succeeds atomically when stock is sufficient; otherwise it fails without a negative balance.
- **Invalid cases:** Unprotected read-then-write logic; stale checks; partial updates; any negative stock value.
- **Related actors:** Online Staff, POS Staff, Admin.
- **Related entities:** Inventory, Product, Order, Invoice.

## BR-VOUCHER-01 — Minimum value and discount calculation

- **Description:** A voucher is applicable only when the order meets its minimum value and uses the approved percentage formula.
- **Preconditions:** A voucher is submitted for an online order or POS bill with known `OrderAmount`, `MinimumOrderValue`, and `DiscountRate`.
- **Rule:** The basic eligibility condition is `OrderAmount >= MinimumOrderValue`. When eligible, calculate `Discount = OrderAmount × DiscountRate` and `FinalAmount = OrderAmount - Discount`.
- **Result:** An eligible voucher reduces the final amount by the calculated discount; an ineligible voucher is not applied.
- **Invalid cases:** Applying below the minimum; trusting client-supplied totals or discount results; using a different formula without an approved rule change.
- **Related actors:** Customer, POS Staff, Online Staff, Admin.
- **Related entities:** Voucher, Order, POS bill/Invoice.

### Approved calculation decision — 2026-10-10

The user delegated the Stage 1 calculation decision during the project audit.

- Currency is VND. `OrderAmount = Σ(current backend unit price × quantity)` for both online orders and POS; shipping is not included in this base.
- A manual percentage voucher and an automatic order promotion may be combined. Each discount uses the same `OrderAmount`, with `DiscountRate` represented as a decimal from 0 through 1 (0–100% in Admin).
- Round each calculated discount to one dong using `HALF_UP`. Clamp their combined discount to `OrderAmount`; the final payable amount cannot be negative.
- Apply at most one manually entered price voucher. If multiple automatic promotions qualify, select the one with the highest calculated discount; ties select the lowest persisted identifier. The subsequent approved product/shipping extension is defined in `PRICING_CONTRACT.md` and applies before/after these order discounts as specified there.
- Each configured threshold must be met: `OrderAmount >= MinimumOrderValue`, and total item quantity must meet `MinimumQuantity` when supplied. A value-only rule omits the quantity threshold; a quantity-only rule sets minimum value to zero.
- Admin configures percentage, thresholds, active period and usage limit. Eligibility and usage consumption are rechecked by the backend in the actual order/POS transaction; preview does not consume usage. Cancelled online orders release the usage consumed by both mechanisms exactly once.
- Persist the separate applied manual and automatic discount amounts and automatic promotion code with the transaction. The applied amounts must sum to the persisted total discount, including when the combined ceiling is reached.

## BR-REVENUE-01 — Completed revenue only

- **Description:** Revenue includes only valid completed orders or transactions.
- **Preconditions:** Revenue is calculated for a requested reporting period.
- **Rule:** `Revenue = Σ FinalAmount` for completed valid orders/invoices. Cancelled orders are excluded.
- **Result:** Dashboard revenue reflects completed business only.
- **Invalid cases:** Including pending, confirmed-but-not-completed, invalid, or cancelled orders/transactions; trusting a frontend-calculated revenue total as authoritative.
- **Related actors:** Admin.
- **Related entities:** Order, POS Transaction, Invoice, Payment, Dashboard/Report.

## BR-AUTH-01 — Refresh token rotation and reuse detection

- **Description:** Every successful refresh rotates tokens, and presenting a revoked token invalidates the entire session family.
- **Preconditions:** Client sends an HttpOnly refresh cookie to `POST /api/v1/auth/refresh`.
- **Rule:** The presented refresh token is hashed (SHA-256) and verified. If valid and not revoked, the old token is marked revoked, a new refresh token is issued via HttpOnly cookie, and a short-lived access token is returned. If an already revoked token is presented, reuse is detected: all active refresh tokens for that user are immediately revoked, returning HTTP 401.
- **Result:** Rotating refresh tokens prevents token theft replay; reuse detection neutralizes compromised session trees.
- **Invalid cases:** Reusing an old refresh token; storing raw refresh tokens in the database; issuing long-lived access tokens.
- **Related actors:** Customer, Online Staff, POS Staff, Admin.
- **Related entities:** User, RefreshToken.

## BR-AUTH-02 — Password change revokes all active sessions

- **Description:** Changing a user's password invalidates all active login sessions across devices.
- **Preconditions:** An authenticated user successfully submits current password and valid new password to `POST /api/v1/auth/change-password`.
- **Rule:** Verify current password using BCrypt. If valid, encode the new password and update user. Revoke all active refresh tokens for this user and clear the client's refresh cookie.
- **Result:** Password is changed securely and all active sessions on other devices are terminated immediately.
- **Invalid cases:** Retaining active sessions after password change; permitting incorrect current password.
- **Related actors:** Customer, Online Staff, POS Staff, Admin.
- **Related entities:** User, RefreshToken.

## BR-AUTH-03 — Password reset single-use token and session revocation

- **Description:** Forgot password generates a single-use time-limited token, and resetting invalidates all sessions.
- **Preconditions:** A user requests password reset via `POST /api/v1/auth/forgot-password` or completes reset via `POST /api/v1/auth/reset-password`.
- **Rule:** Forgot password always returns a generic success message without disclosing account existence. If the email exists, generate a cryptographically secure random token, hash it with SHA-256, and store with a 15-minute expiry. On reset submission, verify unused status and expiry, encode the new password, mark token as used, and revoke all active refresh sessions for that user.
- **Result:** Reset token cannot be reused; existing sessions on any device are terminated.
- **Invalid cases:** Disclosing whether an email exists; reusing a reset token; leaving active sessions open after reset.
- **Related actors:** Customer, Online Staff, POS Staff, Admin.
- **Related entities:** User, PasswordResetToken, RefreshToken.

## BR-AUTH-09 — Email OTP registration and password reset

- Account email uniqueness (user clarification 2026-10-16): one account per email across all roles, including unverified and inactive users. Trim surrounding whitespace and compare case-insensitively; persist new emails in lowercase. Backend pre-checks and a PostgreSQL unique expression index enforce this invariant, including concurrent requests. Duplicate registration returns HTTP 409 `EMAIL_ALREADY_EXISTS`.

- Registration continuation (user approval 2026-10-16): registration details create a CUSTOMER in `users` with a BCrypt password hash and `email_verified=false`, atomically with accepted OTP delivery. The UI then shows only OTP entry. This unverified account receives no access/refresh token and cannot access protected endpoints. A later login with matching email/password returns `REGISTRATION_VERIFICATION_REQUIRED` and OTP metadata; a wrong password stays a generic authentication failure. Expired/locked OTP requires resend. Verification changes the same User to `email_verified=true` atomically with OTP consumption. Repeated signup cannot overwrite existing credentials/profile. Historical verified accounts keep their current login behavior; `is_active` remains the independent administrative status.

- **Approved extension:** 2026-10-12, Gmail SMTP with a Google app password. Google account two-step verification enables app-password access; it does not deliver application OTP or SMS by itself.
- User clarification (2026-10-16): password recovery shows only the OTP field first. Backend verification consumes the OTP and issues a single-use reset credential, hashed at rest and expiring at the original challenge deadline. Only after verification does the form show new/confirm password. Resending invalidates previously issued reset credentials. The credential stays in browser memory; reload requires a new OTP if the prior OTP was already consumed. Final reset retains password validation and revokes existing sessions.
- Public registration creates an unverified CUSTOMER; a valid email OTP is required before granting account access. Challenges are bound to normalized email and purpose (`REGISTER` or `RESET_PASSWORD`), last 10 minutes, permit at most five guesses, and are consumed once in the same transaction as account verification (or legacy verified registration), combined reset, or issuance of a reset credential after verification. Only a BCrypt code hash is stored.
- Resend replaces the previous challenge, with a 60-second cooldown and at most ten sends per email/purpose per hour. Invalid guesses persist even when verification fails. Concurrent attempts cannot consume a challenge twice.
- User clarification (2026-10-15): show the server's resend countdown beside the OTP input. Resending keeps the OTP screen and stored account profile; successful resend clears the entered code and replaces the challenge. A newly generated code differs from the previous code, and only the newest challenge/code pair can verify. Registration delivery failure preserves the previously delivered challenge.
- Password reset has account-independent responses and sends only to active accounts. Reset revokes existing sessions and invalidates legacy reset links. The approved legacy reset-link API remains usable for already issued links/configured Resend delivery.
- Unconfigured OTP delivery is unavailable for every email; delivery failure never creates an account or falsely confirms password reset. No development endpoint returns an OTP.
- SMS is deferred until an actual SMS provider is selected and configured.

## BR-SHIPPING-02 — Carrier quote and administrative address

- **Approved extension:** 2026-10-12, GHN. When enabled, checkout requires current province/ward IDs and street details. The backend verifies the hierarchy from GHN, constructs the canonical address and quotes the selected products only.
- The backend recalculates the quote at Place Order. `expectedShippingFee` acknowledges the preview after freeship/shipping voucher; it is never an authoritative fee. A changed or missing acknowledgment rejects the operation with 409, preserving cart and voucher usage.
- Apply existing freeship and shipping voucher rules to the returned carrier fee. A carrier error/missing configuration blocks quoting and never becomes free shipping or an implicit local fallback. When GHN is disabled, explicitly configured local shipping rules remain available.
- Product billable weight and package dimensions must meet the carrier contract. The current parcel model and limits are documented in `CUSTOMER_FLOW_INTEGRATIONS.md`; it must not silently estimate missing measurements. Carrier quoting does not create a shipment or advance fulfillment.

## BR-AUTH-04 — Inactive account access blocking

- **Description:** Inactive (`isActive = false`) user accounts are blocked from login, refresh, and protected endpoints.
- **Preconditions:** An account is marked inactive in PostgreSQL.
- **Rule:** Login fails with HTTP 403 ("Tài khoản đã bị vô hiệu hóa."). Token refresh fails with HTTP 401/403. Protected requests re-validate current database status in `JwtAuthenticationFilter` and block inactive accounts immediately.
- **Result:** Account deactivation takes effect immediately without waiting for token expiration.
- **Invalid cases:** Allowing inactive accounts to log in, refresh tokens, or execute protected operations.
- **Related actors:** Customer, Online Staff, POS Staff, Admin, Super Admin.
- **Related entities:** User, Role, RefreshToken.

## BR-AUTH-05 — Five-Role Model & Actor-Target RBAC Matrix

- **Description:** M4N enforces a strict five-role model with backend-enforced actor-target privilege constraints.
- **Preconditions:** Any user registration, staff creation, or role change request.
- **Rule:** 
  1. Public registration creates `CUSTOMER` accounts only. Any client-provided role is rejected or ignored.
  2. The system role set is strictly: `CUSTOMER`, `ONLINE_STAFF`, `POS_STAFF`, `ADMIN`, `SUPER_ADMIN`.
  3. Regular `ADMIN` can create and manage `ONLINE_STAFF` and `POS_STAFF`, and manage `CUSTOMER`.
  4. Regular `ADMIN` CANNOT create, promote, demote, disable, or modify `ADMIN` or `SUPER_ADMIN` accounts.
  5. Only `SUPER_ADMIN` can create `ADMIN` or manage privileged `ADMIN` accounts.
- **Result:** Privilege escalation is prevented at the service layer regardless of frontend state.
- **Invalid cases:** Regular Admin creating or editing an Admin/Super Admin; Customer registering as Staff or Admin.
- **Related actors:** Admin, Super Admin.
- **Related entities:** User, Role.

## BR-AUTH-06 — Last Active SUPER_ADMIN Invariant & Self-Protection

- **Description:** System guarantees at least one active Super Admin and prevents self-disable lockouts.
- **Preconditions:** An operator attempts to demote or disable a `SUPER_ADMIN`, or an operator attempts to disable their own account.
- **Rule:**
  1. Transactionally enforce that the number of active Super Admins never reaches 0. If `countByRole_NameAndIsActiveTrue(SUPER_ADMIN) <= 1`, demoting or disabling that account throws `IllegalStateException` / HTTP 409.
  2. No user may disable their own authenticated account via User Management.
- **Result:** The system is protected against permanent administrative lockout, even under concurrent requests.
- **Invalid cases:** Disabling or demoting the last Super Admin; an Admin or Super Admin self-disabling their current account.
- **Related actors:** Super Admin.
- **Related entities:** User, Role.

## BR-AUTH-07 — Role and Status Transition Session Revocation

- **Description:** Changing an account's role or status immediately invalidates long-lived refresh sessions.
- **Preconditions:** An operator changes a target user's role or sets `isActive = false`.
- **Rule:** Atomically persist the change and call `refreshTokenService.revokeAllUserSessions(targetUser.getId())`. The next request or refresh attempt by the target user immediately checks current database status and rejects unauthorized access.
- **Result:** Stale JWT role claims cannot preserve old privileges; disabled users cannot refresh tokens.
- **Invalid cases:** Permitting disabled or demoted users to keep active refresh sessions.
- **Related actors:** Admin, Super Admin.
- **Related entities:** User, RefreshToken.

## BR-AUTH-08 — Lost-Update Protection via Optimistic Locking

- **Description:** Concurrent edits by multiple administrators on the same user are detected and prevented.
- **Preconditions:** Two operators view and attempt to update the same user account concurrently.
- **Rule:** The `users` table includes a JPA `@Version` column (`version`). Management requests supply `expectedVersion`. If the version has changed since the user was loaded, the mutation is rejected with `StaleVersionException` / HTTP 409 Conflict (`USER_MODIFIED_BY_ANOTHER_OPERATOR`).
- **Result:** Admin A cannot silently overwrite Admin B's newer updates; the client is prompted to reload the latest data.
- **Invalid cases:** Blindly updating user records without version checking; overwriting newer changes.
- **Related actors:** Admin, Super Admin.
- **Related entities:** User.

## BR-ADDRESS-01 — Saved delivery addresses (approved 2026-10-15)

- Active Customers may create, page through, update and delete multiple recipient addresses belonging to their authenticated account. Other users' entries are never exposed; foreign IDs return 404.
- Each entry contains name, Vietnamese mobile, notification email, delivery address and optional order notes. Existing checkout field limits apply. When GHN is enabled, province/ward hierarchy is verified and the full address is canonicalized by the backend.
- Update/delete require the loaded version; stale edits return 409. Customer identity is never supplied by the client.
- Selecting an entry copies its fields into the current checkout. Per-order edits do not modify the saved entry. Saving, changing or deleting an address does not rewrite an existing order's recipient snapshot.
- Buy now uses a separate direct-purchase input containing the chosen product ID and positive integer quantity. Preview and Place Order must revalidate sellability, stock, prices, vouchers and shipping on the backend. Opening, editing and completing direct checkout must never add, update or remove cart rows, including an existing row for the same product (user correction, 2026-10-15). Mixing direct purchase with cart-item IDs is rejected. Existing selected-item checkout remains available.

## BR-SUPPORT-01 — Customer ↔ Online Staff Support Chat & In-App Notifications

- **Description:** Support chat is strictly Customer ↔ Online Staff, with database persistence, sender authentication, and ownership guards.
- **Preconditions:** A user attempts to access chat or notifications.
- **Rule:**
  1. A Customer may only access their own support conversation (`customer.id = authenticatedUser.id`).
  2. Online Staff access the support conversation queue and can respond to customers. POS Staff are denied access to the support chat queue.
  3. Sender identity is always derived from the authenticated `SecurityContext`, never client-supplied fields.
  4. Messages are plain text and persisted in PostgreSQL.
  5. In-app notifications are owned by the recipient (`user.id = authenticatedUser.id`). Marking as read is idempotent and updates the database unread counter.
  6. Notifications originate from approved business events. A manual Admin broadcast/composer is not part of the current scope.
- **Result:** IDOR vulnerabilities in chat and notifications are strictly blocked.
- **Invalid cases:** Customer viewing another customer's conversation; client spoofing sender ID or role; accessing another user's notifications.
- **Related actors:** Customer, Online Staff, Admin.
- **Related entities:** Conversation, ChatMessage, Notification, User.
