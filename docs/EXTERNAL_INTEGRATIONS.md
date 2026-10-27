# External integrations and initial administration

Approved implementation decision: 2026-10-10. This project uses existing Spring
Web, JDK HTTP and cryptography support; no dependency or provider SDK is added.
The providers are optional. There are no provider accounts or keys in this
workspace, and local verification uses synthetic responses without live calls.

## Configuration

Export environment variables before starting Java. Spring does not load
`m4n-backend/.env.example` automatically. Store credentials outside source control
and logs. Disabled integrations default to unavailable.

| Variable | Purpose |
| --- | --- |
| `RESET_EMAIL_ENABLED` | Explicitly enable Resend password-reset delivery; default `false` |
| `RESEND_API_KEY` | Private Resend API key |
| `RESET_EMAIL_FROM` | Plain sender email address from a domain verified in Resend |
| `FRONTEND_URL` | Frontend base URL for `/reset-password`; HTTPS required outside HTTP loopback development |
| `PASSWORD_RESET_EXPIRATION_MINUTES` | Reset-token lifetime; default approved value `15` |
| `INITIAL_ADMIN_ENABLED` | Explicit one-time SUPER_ADMIN creation; default `false` |
| `INITIAL_ADMIN_EMAIL`, `INITIAL_ADMIN_FULL_NAME`, `INITIAL_ADMIN_PASSWORD` | Initial administrator identity and private password |
| `VNPAY_ENABLED` | Enable the VNPay 2.1 sandbox integration; default `false` |
| `VNPAY_TMN_CODE` | Eight-character sandbox merchant code |
| `VNPAY_HASH_SECRET` | Private merchant signing secret |
| `VNPAY_RETURN_URL` | Public HTTPS frontend return page, without query/fragment; maximum 226 characters, leaving room for the order ID |
| `VNPAY_IPN_URL` | Public HTTPS backend `/api/v1/payments/vnpay/ipn` registered with VNPay; without query/fragment |
| `VNPAY_SERVER_IP` | Literal IPv4/IPv6 server address for query/refund requests; hostnames rejected |

Enabled but incomplete/invalid provider configuration fails startup. Fixed
provider endpoints prevent configurable outbound hosts or redirect following.
Resend uses five-second connection and ten-second response timeouts; VNPay uses
five-second connection and fifteen-second response timeouts.

Apply `migrations/20261010_user_session_version.sql` and
`migrations/20261010_payment_attempts.sql` before deploying the new authentication
and payment persistence. Existing paid orders without a persisted verified
provider transaction cannot be refunded by inventing a transaction reference.
Production migration tooling remains a separate project decision.

## Password reset with Resend

The server sends a plain-text email through `https://api.resend.com/emails`.
It includes a time-limited link and a token-based idempotency key. Only a token
hash is persisted; neither the raw token, reset URL nor provider body is logged.

- Unconfigured delivery returns the same unavailable `503` before looking up
  an account, avoiding account disclosure and a false delivery-success claim.
- Configured requests return an account-independent acceptance message.
  Missing/inactive accounts do not send email. Provider failure is logged without
  address/body/token data and receives the same acceptance message.
- Token creation and invalidation of older reset tokens share one transaction.
  A failed provider request rolls both changes back, preserving an existing
  valid reset link. A provider timeout can leave an email delivered externally
  while its new token is rolled back; the message explicitly permits retry and
  does not guarantee delivery.
- Successful reset remains single-use, checks expiry and revokes all existing
  sessions under the existing authentication rules.

Resend must verify the sender domain before deployment. No delivery claim is
made until the provider is configured and an authorized live check succeeds.

## Initial SUPER_ADMIN

Role seeding runs before the optional provisioning runner. Provisioning locks
the SUPER_ADMIN role and creates an active account only if no SUPER_ADMIN exists,
including inactive accounts. It never promotes, overwrites or reactivates an
existing email, and it does not install a default privileged password.

The supplied password must satisfy the existing 8–72 character and 72 UTF-8 byte
limits and is persisted using BCrypt. After the first successful startup, set
`INITIAL_ADMIN_ENABLED=false` and remove the bootstrap credentials from the
runtime environment. Subsequent administration follows the existing privilege
matrix and last-active-SUPER_ADMIN invariant.

## VNPay 2.1 sandbox

The payment page is fixed to
`https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`; query/refund calls are fixed
to `https://sandbox.vnpayment.vn/merchant_webapi/api/transaction`. Production
provider switching is not implemented or implied.

The backend signs requests with HMAC-SHA512 and verifies IPN/query/refund
signatures before changing persisted state. Amounts come from the persisted
order, use VND and are multiplied by 100 for VNPay. Supported amounts are whole
dong from 5,000 through 9,999,999,999; fractional or unsupported totals are
rejected with a COD alternative without rounding the approved product price.
Provider timestamps use GMT+7.

Payment status and fulfillment status remain separate. Verified successful
payment marks `isPaid=true` and never confirms an order, allocates/deducts stock,
ships goods or completes revenue. Browser return flags do not authorize any
payment change: the return page reads the order's owned backend status.

### HTTP contract

| Endpoint | Access / result |
| --- | --- |
| `GET /api/v1/payments/options` | Public; `{vnpayAvailable}` |
| `POST /api/v1/payments/orders/{id}/vnpay` | Owning active CUSTOMER, unpaid VNPAY order in `PENDING_CONFIRMATION`; `{paymentUrl,transactionReference}` |
| `GET /api/v1/payments/orders/{id}` | Owner or active ONLINE_STAFF/ADMIN/SUPER_ADMIN; payment status DTO below |
| `POST /api/v1/payments/orders/{id}/reconcile` | Same read authorization; verifies signed server query result |
| `GET /api/v1/payments/vnpay/ipn` | Public provider callback; signature, merchant, reference, amount and status checked; `{RspCode,Message}` |
| `POST /api/v1/admin/orders/{id}/refund` | Active ADMIN/SUPER_ADMIN; JSON `{reason}` with nonblank maximum 500 characters |
| `POST /api/v1/admin/orders/{id}/refund/reconcile` | Active ADMIN/SUPER_ADMIN; verifies signed full-refund query result |

Payment status DTO:
`{orderId,paymentMethod,isPaid,status,refundStatus,canRefund,canPay,paymentExpiresAt,message}`.
`status` is `NONE`, `PENDING`, `SUCCEEDED` or `FAILED`. `refundStatus` is
`NONE`, `PENDING`, `SUCCEEDED` or `FAILED`. `canPay` and `canRefund` include
current backend authorization and lifecycle checks.

Each order mutation locks the order before reading/changing a payment attempt.
Concurrent creation reuses the existing unexpired pending attempt. After a
pending attempt expires, reconcile it before requesting another attempt; an
unknown provider result must not create a second possible charge. Duplicate
verified callbacks are idempotent. A late verified payment after cancellation
is recorded as paid, keeps the order cancelled and exposes the administrative
refund operation.

### Full refund and cancellation

Refund is an explicit administrative operation. It is eligible only for a
verified successful VNPAY payment on `PENDING_CONFIRMATION`, `CONFIRMED`,
`OUT_OF_STOCK_WAITING` or `CANCELLED`. `SHIPPING`, `DELIVERED` and `COMPLETED`
require their approved delivery/return workflow.

Before calling the provider, commit a pending refund record. Concurrent/repeated
requests cannot send another refund while that record is pending. A timeout or
invalid/mismatched response leaves it pending and requires reconciliation;
there is no blind retry or manually asserted success.

VNPay response code `00` can mean request acceptance. Refund statuses `05` and
`06` remain pending. Only a verified response with full-refund type `02`,
transaction status `00`, successful response code, exact amount, merchant,
reference and valid provider identifiers persists `SUCCEEDED`. Reconciliation
uses the same signed verification. Definitive provider rejection may persist
`FAILED`; the administrative user may then start a new explicit request.

An old provider response cannot overwrite a replacement refund request. Query
results about the original charge cannot declare an unknown refund rejected.
Current role and ownership are checked again after an external query response.

`isPaid` remains the historical charged state; verified refund state is stored
separately. A paid order cannot be cancelled before its full refund is verified.
The subsequent normal cancellation operation restores confirmed inventory and
releases voucher usage exactly once under the existing rules. Refund itself
does not change inventory or order status. Refunded/pending-refund orders cannot
continue fulfillment. Unpaid orders with unknown pending payments must first
be reconciled before cancellation.

## Verification and deployment checks

Local tests cover signed request/response verification, mismatch rejection,
provider-failure sanitization, reset transaction rollback, backend-owned amount,
ownership, idempotent/concurrent callbacks, pending refund persistence before
outbound requests, prevention of concurrent resubmission, and bootstrap guards.
The final audit report records actual test counts and command results.

Before enabling delivery/payment in deployment, configure private provider
accounts, verify the sender domain, register reachable HTTPS return/IPN URLs,
apply migrations and authorize separate sandbox end-to-end verification. No real
email, payment or refund was sent by these local synthetic tests.

## Official provider references

- [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email)
- [Resend API authentication](https://resend.com/docs/api-reference/introduction)
- [Resend sender domain verification](https://resend.com/docs/dashboard/domains/introduction)
- [Resend idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [VNPay 2.1 payment/IPN integration](https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html)
- [VNPay transaction query and refunds](https://sandbox.vnpayment.vn/apis/docs/truy-van-hoan-tien/querydr&refund.html)
- [VNPay sandbox FAQ and amount constraints](https://sandbox.vnpayment.vn/apis/docs/faqs/)
