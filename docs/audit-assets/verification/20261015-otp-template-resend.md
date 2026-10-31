# OTP email and resend verification — 2026-10-15

## Scope and behavior

User-approved improvement to BR-AUTH-09: branded OTP email, a resend countdown
at the OTP input, in-place resend, and only the newest code remaining valid.
Existing expiry (10 minutes), resend cooldown (60 seconds), five guesses and
ten sends per email/purpose per hour are preserved. No dependencies or schema
changes were introduced.

- `GmailEmailOtpNotifier` sends UTF-8 HTML and plain-text alternatives with a
  named M4N sender. Inline styles, presentation tables, neutral backgrounds,
  readable OTP, expiry and security guidance work without remote images.
- `EmailOtpField` shares the countdown and input UI between registration and
  password reset. Countdown uses `resendAt` and wall time, with interval cleanup
  and refresh on window focus; seconds are not an ARIA live announcement.
- Resend retains the form and its account/password inputs. Only success replaces
  the challenge and clears the old entered code. Failure preserves the existing
  challenge/code and exposes an error. Verify/resend cannot run together.
- Expired password-reset metadata retains the OTP screen so a fresh code can be
  requested there. The backend always checks expiry and validity.
- Code generation excludes the immediately previous code. Existing row locking,
  hashing, transactional replacement and single-use consumption remain in place.

## Automated checks

- Frontend `npm run lint`: PASS.
- Frontend `npm run build`: PASS.
- Frontend `node --test tests/*.test.mjs`: 30 passed.
- Backend targeted `mvnw.cmd -o -Dtest=EmailOtpIntegrationTest,GmailEmailOtpNotifierTest test`:
  11 passed. Covers old challenge rejection, old code with new challenge rejection,
  newest code success/single use, cooldown, expiry, concurrent consumption,
  reset purpose binding, failed registration delivery rollback, MIME alternatives,
  UTF-8 subject/named sender and safe delivery failure.
- Full backend `mvnw.cmd -o test`: 416 passed, zero failures/errors/skips.
- Packaged backend `mvnw.cmd -o -DskipTests package`: PASS, following the full suite.
- Updated backend restarted on port 8080 with schema validation and development
  seeding disabled; public catalog probe returned HTTP 200. Frontend remains on 5173.

Backend tests use only isolated database `m4n_otp_ui_20261015`; external payment,
shipping and email delivery are disabled or mocked. No OTP or credentials are
included in this report.

## Browser and UI acceptance

Headless Chrome through the preinstalled Playwright runtime, using intercepted
API responses and a controlled browser clock. No real SMTP sends or account
creation during browser checks.

- PASS: cooldown initially disables resend; advancing past the server deadline
  enables it.
- PASS: failed resend retains entered code and password; retry succeeds.
- PASS: successful resend stays on `/register` or `/reset-password`, clears only
  the OTP code, preserves all entered account/password fields and submits the
  replacement challenge on verification.
- PASS: expired reset screen reload still offers in-place resend.
- PASS: desktop and 375px mobile render, no horizontal overflow or browser errors;
  reduced motion enabled. Shared labeled input, native button semantics, OTP
  autocomplete/paste, focus and existing global focus styles retained.
- PASS: HTML email desktop render and 375px overflow check. HTML email was
  previewed locally; Gmail inbox rendering of this updated template was not inspected.

Screenshots: [email](20261015-otp-email-template.png),
[registration](20261015-otp-register.png), [mobile reset](20261015-otp-reset-mobile.png).

Security review: no OTP/password logging or new secret storage, no untrusted HTML
substitution, no auth bypass/testing endpoint. Controllers and API shapes unchanged.
Web Interface Guidelines review: no unresolved findings in the new OTP component;
existing global focus and reduced-motion styles apply. Project design rules remain
authoritative. Temporary browser harness removed; isolated test database dropped.
