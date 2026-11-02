# Customer flow completion — 2026-10-12

## Approved decisions

The user approved email OTP for registration/password reset, GHN address/fee
integration, MoMo sandbox alongside VNPay, selected-item checkout, product
creation and image upload. Gmail SMTP with Google app passwords is selected;
`spring-boot-starter-mail` is explicitly approved. SMS awaits an actual SMS
provider; Google two-step verification/app passwords enable email, not SMS.

## Sequence and verification

1. Persist email OTP challenges; verify before creating an account or resetting
   a password. Codes expire after 10 minutes, allow five attempts and resend
   after 60 seconds. Store only a password-encoded code, serialize attempts,
   invalidate previous codes and consume successful challenges atomically.
   Reset responses do not disclose account existence. Revoke sessions on reset.
2. Validate selected cart items and prevent stale checkout previews. Purchase
   removes only selected items, with ownership and transaction tests.
3. Inspect product creation, repair actual failures and add bounded image
   upload/storage with safe public delivery and no client-controlled paths.
4. Proxy GHN address data and fee requests through the backend. Validate the
   selected address hierarchy; recalculate fees at order creation. Provider
   failures never become zero-fee quotes. Preserve configured local pricing.
5. Add official MoMo redirects and verified server notifications/query results.
   Preserve payment/fulfillment separation, idempotency and refund rules.
6. Run Maven tests/build, native frontend tests, lint and build. Record unavailable
   live-provider and browser checks honestly; update rollout/configuration docs.

## Configuration and limits

No live provider accounts/keys have been supplied. Credentials are environment
variables only. Missing configuration produces explicit unavailable states.
Neither this site nor its APIs collect bank/MoMo login credentials. Existing
inventory, cancellation, refund, pricing and completed-revenue rules remain.
