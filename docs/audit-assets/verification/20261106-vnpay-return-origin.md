# VNPay return origin — 2026-11-06

## Reported incident and recovery

An online order returned to localhost after VNPay sandbox payment. Before recovery,
PostgreSQL held a PENDING VNPay attempt and an unpaid PENDING_CONFIRMATION order,
matching the supplied transaction reference and provider amount.

The customer's exact signed return was sent to the existing public VNPay IPN
verification endpoint. It returned HTTP 200, RspCode 00, Confirm success. A separate
database read confirmed payment SUCCEEDED, is_paid=true and fulfillment still
PENDING_CONFIRMATION. No new charge, refund, order or direct SQL update was made.
No raw signature, bank transaction data, credentials or tokens are included here.

## Fix

Online VNPay previously read VNPAY_RETURN_URL directly. An old explicit localhost
value overrode the newer FRONTEND_URL-based default. The controller now forwards
the browser Origin as HTTP metadata; the service selects `/payment-return` on
that exact allowlisted frontend before creating an attempt or signing a URL.
POS reuses the same origin validation with its existing `/pos` path. Requests
without Origin use the configured return site's origin only if allowlisted.
Invalid origins cannot create a payment attempt or a provider URL.

Frontend online checkout also checks the signed link's embedded vnp_ReturnUrl
before navigating: exactly one value, current frontend origin, `/payment-return`,
no credentials/fragment. It rejects stale localhost and cross-site/malformed
returns rather than rewriting a signed URL or sending a customer to the gateway.
MoMo and provider selection/enabled flags are unchanged.

## Deployment

Deploy both backend and frontend changes. On Railway, keep
VNPAY_RETURN_URL=https://swp-391-group-6-acqc.vercel.app/payment-return and the
matching CORS allowlist; the committed public environment template contains it.
Existing gateway links retain their original return and cannot be changed after
signing. The affected order can be viewed on the stable frontend's payment-return page
using its internal order ID; another payment is unnecessary.
VNPay's merchant-side IPN registration must use the public backend IPN URL;
editing the environment variable alone does not register that callback.

## Validation

- Frontend lint and production build passed. Thirteen focused payment and
  presentation tests passed, including wrong return URLs and unchanged MoMo.
- Full frontend suite: 95/98 passed. Three pre-existing posMomoService tests still
  expect MoMo URLs/endpoints from a module that currently implements legacy
  VNPay. These provider-selection assertions were not weakened or changed by
  this online-return fix.
- Backend clean verify passed 566 tests, zero failures/errors/skips, on dedicated
  local PostgreSQL with external integrations disabled. Regression coverage includes the old-localhost config,
  browser-origin selection, missing/malicious origins, no attempt on rejection,
  amount/owner/signature validation and existing POS return behavior.
