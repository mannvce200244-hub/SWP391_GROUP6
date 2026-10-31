# MoMo return origin and reconciliation — 2026-10-16

## Confirmed defect and recovery

The user confirmed that order 440 began at `http://localhost:5173`.
The configured MoMo return URL used the public frontend tunnel, whose hostname
does not receive the localhost host-only refresh cookie. The authenticated
route therefore correctly redirected to login, preserving the order ID.

Order 440 was initially locally pending/unpaid. The existing authenticated
backend reconciliation endpoint queried MoMo and returned `SUCCEEDED`,
`isPaid=true`. No manual database payment change, new order, charge or refund
was made. Recovery link: `http://localhost:5173/payment-return?m4nOrderId=440`.

## Changes

- Thin MoMo controller reads Origin; the service validates it before allocating
  a payment attempt. Only exact configured CORS origins qualify. HTTPS is
  accepted; HTTP is limited to explicitly configured localhost/127.0.0.1.
- Return path stays configured; its origin matches the initiating checkout.
  Missing Origin retains the HTTPS fallback. IPN remains public HTTPS.
- Gateway includes the selected return URL in its HMAC-signed request.
- Return page reads authenticated status and reconciles pending online payments
  through the existing server endpoint, covering delayed/missing IPN delivery.
- Existing provider sessions retain their saved URL; no duplicate payment
  session is allocated merely to change a redirect.

## Verification

- Narrow configuration/gateway gate: 13 tests passed.
- `mvnw.cmd -o -Dtest=MomoGatewayTest,MomoPropertiesTest,MomoPaymentIntegrationTest,PlaceOrderPaymentAuthorityTest,PaymentIntegrationTest test`: 47 passed on an isolated PostgreSQL database; dropped after verification.
- Tests cover local/public Origin, invalid/open-redirect inputs, controller
  metadata forwarding, exact signed return URL, pending-attempt reuse, existing
  ownership/payment/refund safeguards, and order payment authority.
- Frontend lint/build passed; native Node suite: 33 passed. Added checks cover
  pending reconciliation, final/COD status, failure propagation and absence of
  a new charge request from return processing.
- Compiled Java gateway successfully created a real MoMo sandbox card session
  with a localhost return URL and synthetic 50,000 VND request. No local order
  or charge was created by that probe; temporary Java source was removed.
- Package initially encountered the running JAR's Windows file lock. Stopped
  the verified M4N process, packaged successfully and restarted the updated JAR.
- In-app browser: a clean localhost session required login and retained the
  order ID. Customer demo login resumed its owned result page (existing COD
  order 9). Visiting the official MoMo documentation, then navigating back to
  that localhost result restored the cookie session and displayed the result.
  Demo sessions were logged out and the temporary tab closed. This validates
  session restoration; no new full card payment was submitted during testing.

Security review: no token copying between origins, cookie-policy relaxation,
credential exposure or anonymous order access. Provider verification remains
authoritative; query parameters cannot mark an order paid. Controllers remain
transport-only. No dependencies or schema were added. UI layout and controls
were unchanged; verification covers logic, existing login recovery and status
rendering. No remaining decision is required for this fix.
