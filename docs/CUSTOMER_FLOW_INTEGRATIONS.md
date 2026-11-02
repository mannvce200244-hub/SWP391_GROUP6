# Customer flows and provider configuration — 2026-10-12

The user approved Gmail SMTP email OTP, GHN address/fee quotes, MoMo sandbox,
selected-item checkout and product image upload. This extends the existing
VNPay/local shipping/Resend implementation. No provider credentials were supplied.
`spring-boot-starter-mail` is the only dependency added for this extension, with
explicit approval. SMS remains deferred until an SMS provider is selected.

## Gmail OTP

Export `OTP_EMAIL_ENABLED=true`, `GMAIL_USERNAME` and `GMAIL_APP_PASSWORD` into
the backend process. Enable Google two-step verification and create an app
password for the sending account. Do not use the Google account password or
put any credential in the frontend, repository, chat or logs. Some Google
accounts do not allow app passwords; confirm availability in that account.

SMTP uses `smtp.gmail.com:587`, authenticated required STARTTLS, hostname
verification and bounded connection/read/write timeouts. Missing configuration
returns a uniform 503. The site generates its own random six-digit codes; Google
two-step verification is a prerequisite for SMTP access, not an OTP/SMS API.

Public JSON contracts (all paths below are relative to `/api/v1`):

| Endpoint | Request / result |
| --- | --- |
| `POST /auth/email-otp` | `{email,purpose:"REGISTER"\|"RESET_PASSWORD"}` → `{challengeId,expiresAt,resendAt,message}` |
| `POST /auth/register` | `{registration:{fullName,email,password,phone?,address?},challengeId,code}` → CUSTOMER profile, 201 |
| `POST /auth/register/start` | `{fullName,email,password,phone?,address?}` → OTP metadata; creates CUSTOMER in `users`, BCrypt password, `email_verified=false` |
| `POST /auth/register/verify` | `{email,challengeId,code}` → CUSTOMER profile, 201; sets the same User to `email_verified=true` |
| `POST /auth/reset-password-otp` | `{email,challengeId,code,newPassword,confirmPassword}` → success message |
| `POST /auth/verify-reset-otp` | `{email,challengeId,code}` → `{token,expiresAt}`; consumes OTP, `Cache-Control: no-store` |

Password recovery UI verifies the OTP before mounting password inputs. It keeps
the issued reset credential only in memory, then submits it with new/confirm
password to the existing `POST /auth/reset-password` endpoint. Both steps retain
the original OTP expiry; resending revokes earlier reset credentials. A reload
after OTP verification requires requesting and verifying a new code. The older
combined OTP reset endpoint remains compatible with existing clients.

Registration UI stores only OTP metadata/email in the current tab, hides profile
and password fields after `/register/start`, and clears plaintext passwords from
component memory. If the user leaves, login with the original email/password
returns HTTP 409 `REGISTRATION_VERIFICATION_REQUIRED`, `email` and `challenge`
in the standard error payload, with `Cache-Control: no-store` and no auth tokens
or refresh cookie. The UI resumes OTP entry; resend preserves the stored profile.
Wrong passwords reveal no pending metadata. The CUSTOMER already exists after accepted registration and email delivery, with
`email_verified=false`. OTP verifies the same User ID. Login, refresh and protected
requests reject unverified accounts. Historical accounts are backfilled as verified.

Codes expire after ten minutes, allow five guesses, are bound to email/purpose
and cannot be reused. Resend replaces the prior code, at least 60 seconds apart,
with at most ten sends per email/purpose per hour. The backend persists only a
BCrypt hash and serializes consumption/guess counting in PostgreSQL. Verification
and registration/reset-credential issuance share a transaction. Reset revokes all old sessions and
invalidates legacy reset tokens. Flat registration without email proof is rejected.

Password-reset acceptance does not reveal whether an active account exists or
guarantee email delivery. The frontend stores challenge metadata (no password or
code) in the current tab's session storage and offers a new-code action. Legacy
Resend reset-link endpoints are retained for configured deployments/existing links.

## GHN address and fee

Export `GHN_ENABLED=true`, `GHN_TOKEN` and a positive `GHN_SHOP_ID`. Staging is
the default; use `GHN_PRODUCTION=true` only for an approved production setup.
The GHN shop must have its pickup address configured. Token/shop ID stay on the
backend. Only GHN's fixed official staging/production hosts are used, without
following HTTP redirects.

| Authenticated endpoint | Result |
| --- | --- |
| `GET /shipping/options` | `{carrierEnabled,carrierAvailable,addressModel:"PROVINCE_WARD"}` |
| `GET /shipping/provinces` | `[{id,name}]` using GHN's current two-level administrative data |
| `GET /shipping/provinces/{provinceId}/wards` | `[{id,name}]` belonging to that province |

Current address data uses province → ward, rather than inventing the old district
level. The form also requires street/house details. The backend resolves the
canonical names and stores them with province/ward IDs on the order.

`POST /checkout/preview` accepts:
`{voucherCode?,shippingVoucherCode?,cartItemIds,deliveryAddress:{provinceId,wardId,streetAddress},recipientName,recipientPhone}`.
`POST /orders` keeps its recipient/payment fields and adds `deliveryAddress`
and `expectedShippingFee`. Cart checkout sends selected `cartItemIds`.
Buy now sends `directPurchase:{productId,quantity}` instead and never adds,
updates or consumes cart rows, including the same product already in the cart
(user correction, 2026-10-15). Both sources together are rejected. Missing IDs
without direct purchase remain compatible with older clients and mean all
cart entries; empty/duplicate/stale/foreign selections fail. Both sources use
the same backend pricing, carrier preview and shipping-fee acknowledgment.

GHN quoting calls `/v2/shipping-order/preview`, which does not create a shipment.
Returned `total_fee` is validated, then existing automatic freeship and shipping
voucher rules apply. The preview includes base fee, shipping discount, net fee
and authoritative final amount. Place Order quotes again and requires the net
fee to match `expectedShippingFee`; a mismatch returns 409 and rolls back the
order, cart consumption and voucher usage. The customer must review and resubmit.
The acknowledgment cannot override the backend fee.

### Product parcel measurements

Admin must set positive `billableWeightKg` and use `dimensions` as the packaged
size in the form `115 x 25 x 15 cm`. Each dimension is 1–200 cm. Weight converts
to grams rounded upward. The current single-parcel model stacks items: maximum
length/width and summed height × quantities, summed billable weight. The parcel
must fit 50 kg and 200 cm height. Under 20 kg uses GHN light service; otherwise
heavy service. Actual packaging must match these stored measurements; separate
parcels/oversized logistics are outside this implementation and fail explicitly.
No shipment booking, COD collection or shipping webhook lifecycle is added by
this fee integration. Quote excludes optional insurance/COD service charges.

Provider/configuration failures never become free shipping or silently fall back
to local fees. If GHN is explicitly disabled, the existing Admin-configured local
shipping rules apply. A deployment requiring carrier quotes should enable GHN;
incomplete configuration then blocks checkout instead of charging an estimate.

## MoMo sandbox

For the approved Vercel + Railway hosted demo, follow
[VERCEL_RAILWAY_DEPLOYMENT.md](VERCEL_RAILWAY_DEPLOYMENT.md). With `prod`,
`MOMO_SANDBOX_DEPLOYMENT_ENABLED=true` explicitly permits the sandbox alongside
the existing secure deployment checks; all required credentials and permanent
HTTPS callback paths are validated at startup. Browser API traffic is forwarded
through the frontend origin to preserve refresh cookies on payment return.

Export `MOMO_ENABLED=true`, `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`,
`MOMO_SECRET_KEY`, `MOMO_REDIRECT_URL` and `MOMO_IPN_URL`. Redirect should target
the public HTTPS frontend `/payment-return`; IPN should target the public HTTPS
backend `/api/v1/payments/momo/ipn`. Both configured URLs exclude query/fragment/user info.
For browser creation requests, the backend preserves the exact checkout `Origin`
only if it is in `CORS_ALLOWED_ORIGINS`, retaining the configured return path.
HTTPS origins are supported; HTTP is allowed only for explicitly allowlisted
`localhost` or `127.0.0.1` development origins. This keeps the refresh cookie on
the site where payment began. Missing Origin uses the configured fallback;
foreign or malformed origins are rejected before creating an attempt. The
public HTTPS IPN URL is independent of the browser return URL.
Merchant configuration must be complete before checkout offers MoMo. This
implementation targets `https://test-payment.momo.vn`; production MoMo is not
enabled by these keys. VNPay's existing sandbox configuration remains separate.

For the user-requested demo, the public sample credentials in MoMo's official
[Node.js example](https://github.com/momo-wallet/payment/blob/master/nodejs/MoMo.js)
were tested on 2026-10-16: sandbox returned HTTP 200, code 0 and an official
payment URL. These are shared example credentials, not a private merchant
account. Store them only in the ignored backend `.env`; never in frontend code
or committed configuration. The HTTPS fallback and public IPN configuration are
still required before enabling checkout. The user selected hosted international-card payment
on 2026-10-16: create requests use `requestType=payWithCC` and
`userInfo.email` from the persisted order recipient email. Whole-VND amounts
must be between 1,000 and 10,000,000 inclusive, per the card API contract.
Use the official [sandbox test cards](https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions/)
on MoMo's hosted page. M4N does not collect card numbers or CVC.
A created URL alone does not establish a paid order. Existing pending attempts
retain their original URL to prevent duplicate payment sessions; new attempts
use the card flow.

| Endpoint | Authorization / result |
| --- | --- |
| `GET /payments/options` | Public `{vnpayAvailable,momoAvailable}` |
| `POST /payments/orders/{id}/momo` | Owning active CUSTOMER; `{paymentUrl,transactionReference}` |
| `POST /payments/momo/ipn` | Public provider notification; verifies signature and binding, returns 204 after valid processing |
| `GET /payments/orders/{id}` | Owner or active ONLINE_STAFF/ADMIN/SUPER_ADMIN; existing payment-status DTO |
| `POST /payments/orders/{id}/reconcile` | Same read authorization; queries the order's configured provider |
| `POST /admin/orders/{id}/refund` | ADMIN/SUPER_ADMIN; existing `{reason}` contract |
| `POST /admin/orders/{id}/refund/reconcile` | ADMIN/SUPER_ADMIN; queries VNPay or retries the identical persisted MoMo refund ID |

MoMo's redirect uses `?m4nOrderId=<internal order ID>` so its returned
`orderId` (provider transaction reference) cannot replace the local order ID.
The return page also accepts the existing single `orderId` parameter for
VNPay and internal order-history links; ambiguous/invalid internal IDs are
rejected. Return parameters still authorize no payment-state changes.
If the login session is unavailable on return, the validated internal ID is
retained through Customer login before loading the owned payment status.

IPN binds a dedicated DTO containing the signed fields. Additional provider
metadata such as nullable/nested `promotionInfo` is ignored during transport
binding; every required signed field must be present and the HMAC and persisted
transaction binding remain mandatory. An empty signed `payType` is allowed for
failed payments with no completed payment method.

Amounts are taken from the persisted order and must be whole VND, 1,000 through
50,000,000. Requests use HMAC-SHA256. IPNs require verified signatures. Create
responses with a signature must verify it. The official sandbox was observed on
2026-10-16 to omit the signature on successful creation; only code 0 with matching
partner/request/order/amount over the fixed verified HTTPS endpoint may then
return an allowlisted payment URL. Creation leaves payment pending and never
marks an order paid. Unsigned create failures remain unknown and require
reconciliation. Query/refund APIs do not specify response signatures and use
verified HTTPS plus partner/request/order/amount binding. Redirect URLs are restricted to
the official sandbox host/path in both backend and frontend. Browser return flags
never set payment state. The site does not collect bank/MoMo account passwords.

A pending attempt is committed before outbound I/O. Timeouts remain pending;
another charge cannot be created until a definitive failure is verified. An
unexpired pending payment URL is reused. Verified success is idempotent and only
marks charged state, never fulfillment or inventory. Pending/unknown results
require reconciliation. Full refunds commit a pending record before I/O, reuse
the same request/order ID for unknown outcomes, and succeed only on verified
code 0 and valid provider identifiers. The historical charged flag remains true;
refund state is stored separately. Cancellation remains blocked until verified
full refund, and refunded/pending-refund orders cannot continue fulfillment.

A create response with verified signature/partner/request/order/amount and a
documented final failure code marks only that pending attempt failed, allowing
a new attempt. Nonfinal errors, forged/mismatched responses and timeouts stay
pending for reconciliation. A concurrent verified success is never overwritten
by a later create rejection.

## Product image upload

`POST /admin/products/with-images` and
`PUT /admin/products/{id}/with-images` require ADMIN/SUPER_ADMIN and multipart
parts `product` (JSON with the existing validated product DTO) and `images`
(files). Without files the frontend uses the existing JSON endpoints.

Each submission allows up to ten JPEG/PNG files, each at most 5 MB/16 megapixels.
The backend decodes and reencodes PNG, strips supplied filenames/metadata, uses
random UUID filenames and serves only valid public UUID `.png` files with
`image/png` and `nosniff`. A database rollback removes newly written files.
Initial stock remains zero; approved stock receipt is required to make it sellable.
Generated product codes are bounded to 50 characters even for long category codes.

Set `PRODUCT_IMAGE_DIRECTORY` to persistent writable storage and
`PRODUCT_IMAGE_PUBLIC_BASE_URL` to the externally reachable HTTPS media URL in
deployment. The localhost default is for development only. Back up storage
with the database. Removing gallery references does not delete stored files
(URLs may be shared); orphan retention should be handled through reviewed
storage maintenance. No cloud-storage provider/dependency was introduced.

## Rollout and verification limits

Apply the three 2026-10-12 SQL scripts after earlier migrations as listed in
[`migrations/README.md`](migrations/README.md), before deployment with
`SPRING_JPA_HIBERNATE_DDL_AUTO=validate`. Configuration flags default disabled.
Spring does not load `.env` automatically: export variables to the Java process.
Restart/redeploy only after configuration and schema are ready.

Automated tests use a dedicated PostgreSQL database and mocked provider responses.
No real email/SMS, shipment, charge or refund was sent. Live email/sandbox callback
verification needs provider credentials. Current rendered browser verification
was blocked by the Windows URL policy; static/lint/build and HTTP checks do not
replace a live browser walkthrough. See `audit-customer-flow-20261012.md` for
the actual final gate results and remaining checks.

## Official references

- [Google app passwords](https://support.google.com/accounts/answer/185833?hl=vi)
- [GHN current province data](https://developer.ghn.vn/vi/docs/master-data/get-province-new)
- [GHN current ward data](https://developer.ghn.vn/vi/docs/master-data/get-ward-new)
- [GHN fee preview](https://developer.ghn.vn/vi/docs/order/preview)
- [MoMo one-time international-card payments](https://developers.momo.vn/v3/vi/docs/payment/api/credit/onetime/)
- [MoMo payment query](https://developers.momo.vn/v3/vi/docs/payment/api/payment-api/query/)
- [MoMo refunds](https://developers.momo.vn/v3/vi/docs/payment/api/payment-api/refund/)
- [MoMo result codes](https://developers.momo.vn/v3/vi/docs/payment/api/result-handling/resultcode/)
