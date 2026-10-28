# Official MoMo sample sandbox check — 2026-10-16

## Request and configuration

The user selected the official MoMo sandbox for the demo and supplied the public
Node.js example from MoMo's GitHub repository. Compared it against
[the official source](https://github.com/momo-wallet/payment/blob/master/nodejs/MoMo.js).
Saved the matching sample partner/access/secret configuration into the ignored
backend `.env`; no keys were added to source, frontend, documentation or examples.
These are shared demo credentials, not a private merchant account.

## Live evidence

- A single signed create request over verified HTTPS to the fixed official
  sandbox endpoint returned HTTP 200, `resultCode=0`, matching partner, request,
  order reference and amount, and a URL on `test-payment.momo.vn`.
- That response did not contain `signature`. The existing gateway rejected such
  responses, preventing checkout even though MoMo created the payment session.
- After the fix, invoked the actual compiled `MomoGatewayImpl` against sandbox
  using a unique reference and VND 50,000. It successfully returned an HTTPS URL
  on `/v2/gateway/pay`. No payment was submitted, no M4N order was created, and
  no cart, inventory or user's database data was changed by these live probes.
- Local HTTPS callback placeholders were used only for the uncompleted probes;
  they were not saved as deployment configuration or claimed to be reachable.

## Smallest compatibility fix

`MomoGatewayImpl.create` permits a missing signature only for a successful create
response obtained from the fixed TLS-verified sandbox endpoint, after matching
the partner/request/order/amount and validating the official payment URL. When
a signature is present, it must verify. Unsigned rejections still cannot mark an
attempt failed or authorize a retry. IPNs still require their signed fields and
HMAC. Payment-success reconciliation remains backend-owned. Creating a URL
does not change the order's paid, fulfillment or inventory state.

Updated gateway regression tests and the provider integration guide. No API,
schema, dependency, controller, fulfillment or pricing changes were introduced.

## Checks

- `mvnw.cmd -o -Dtest=MomoGatewayTest test`: 10 passed, no failures/errors/skips;
  includes unsigned sandbox creation, invalid signatures, foreign identities,
  wrong amounts, unsafe URLs, unsigned rejections and missing IPN signature.
- The actual compiled gateway live probe passed; its temporary Java source was
  removed after execution.
- `mvnw.cmd -o -Dtest=MomoGatewayTest,MomoPaymentIntegrationTest,PlaceOrderPaymentAuthorityTest,PaymentIntegrationTest test`:
  41 passed, no failures/errors/skips, using isolated PostgreSQL database
  `m4n_momo_sample_20261016`. Covers pending unpaid URL creation, reuse of one
  attempt, invalid callbacks, backend payment authority, concurrent verified
  callbacks, reconciliation and refunds, including existing VNPay regressions.
  The isolated database was dropped after the successful run.
  No frontend source changed, so frontend lint/build were not rerun. The full
  backend suite was not rerun; these four relevant payment suites and compilation
  passed.

## Remaining setup

Superseded by the completed HTTPS tunnel setup recorded in
[the follow-up verification](20261016-momo-tunnel.md). The text below records
the configuration state before the user authorized tunnel startup.

`MOMO_ENABLED` remains false; `MOMO_REDIRECT_URL` and `MOMO_IPN_URL` remain empty.
The user was asked for public HTTPS frontend/backend URLs. They must point to
M4N `/payment-return` and `/api/v1/payments/momo/ipn` before enabling checkout.
The MoMo Test app/wallet is required for completion, per
[MoMo's test instructions](https://developers.momo.vn/v3/docs/payment/onboarding/test-instructions/).
Successful wallet payment, reachable callback and browser return have not yet
been verified. At inspection, port 8080 belonged to an unrelated Docker app;
that application was left running.
