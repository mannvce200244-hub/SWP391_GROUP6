# Registration account persistence and OTP verification — 2026-10-16

## Approved behavior

The user's final clarification supersedes the abandoned pending-profile draft:
accepted registration creates a CUSTOMER in `users` with a BCrypt password hash
and `email_verified=false`. User creation and accepted initial OTP delivery share
a transaction; initial delivery failure rolls both account and challenge back.
The OTP screen submits only email, challenge ID and code. A valid OTP changes
that same User ID to verified. It does not create a second account.

Correct credentials for an unverified account return HTTP 409
`REGISTRATION_VERIFICATION_REQUIRED`, email and challenge metadata, no tokens or
refresh cookie. Wrong credentials return generic 401. JWT access and refresh
creation/rotation also enforce current verification state. Repeated registration
cannot replace existing credentials or profile details. Administrative active
status is independent of email verification. Historical accounts remain verified.

## Changed boundaries

- Backend: User verification flag, registration/OTP services and DTO, auth HTTP
  routes, explicit verification-required error contract, principal and refresh
  enforcement, focused integration coverage and constructor fixture.
- Frontend: registration details/OTP/success stages, login continuation, shared
  OTP expiry/countdown, feature service and shared transport auth exclusions.
- Documentation: scope, BR-AUTH-09, API contract, form rules, integration guide,
  ordered SQL upgrade and migration notes.
- No dependency added. Controllers remain HTTP-only. Password reset and payment
  flows retained.

## Verification

| Check | Result |
| --- | --- |
| Focused Maven tests | 29 passed |
| Full `mvnw.cmd -o test` | 449 passed, zero failures/errors/skips |
| `HostedDemoDeploymentSmoke` | 1 passed under secured prod profile, Hibernate schema validation |
| SQL migration applied twice | Passed; repeat did not change existing false verification flags |
| `mvnw.cmd -o -DskipTests package` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `node --test tests/*.test.mjs` | 48 passed |
| Running backend health | UP |
| Running start/verify empty DTO checks | 400 / 400 |
| Running unknown-account login | 401 |

Backend tests ran against disposable PostgreSQL database
`m4n_pending_registration_20261016`, with mocked SMTP delivery. The database was
dropped after verification. They did not create accounts in the user's database
or send additional live mail. The deploy smoke used synthetic provider settings;
no hosted deployment was performed.

Coverage proves account existence before verification, BCrypt password storage,
same ID after verification, invalid/expired/replayed/old OTP rejection, resend
preserving profile, concurrent single-use verification, SMTP rollback, duplicate
signup protection, credential-gated login metadata, and JWT/refresh blocking.

## UI acceptance

Prior browser verification in this task used an isolated temporary fixture with
the real auth components and synthetic service responses. It proved details
hidden after start (only `reg-otp` input), later login resuming verification,
wrong-code recovery, resend remaining on OTP, cleared code after resend and
success with zero inputs. Desktop, 390px mobile and 768px tablet were inspected;
no horizontal overflow. The fixture files and browser tab were removed.

Screens: `otp-desktop.png`, `otp-mobile.png`, `success-mobile.png` in this folder.
These capture the OTP-only layout before the final CTA wording adjustment to
“Xác minh email”; the resulting frontend passed lint, build and tests again.

Labels, error associations, keyboard focus, paste/autofill, timer cleanup,
duplicate-submit prevention and safe failure recovery reviewed. White/cool-gray
surfaces and existing shared inputs/buttons retained. No new design system or
animation dependency. No outstanding UI acceptance failure found.

## Review

AuthServiceImpl is 333 lines, below the 400-line review trigger. Its 11
constructor dependencies were reviewed: the added challenge lookup supports
login continuation and the proof-bound verification operation; a broader auth
refactor is outside this behavior change. RegisterPage is 243 lines after a
focused extraction of the existing profile fields. No temporary fixture/debug
code or abandoned pending-profile entity mappings remain.

Before production rollout, apply `docs/migrations/20261016_pending_registration.sql`
from the ordered migration guide. This adds/backfills the verification flag and
does not delete historical columns/data from the abandoned local draft.

## Continuation audit — final account model

Rechecked after the user's request to continue the earlier progress log. That
log describes the abandoned pending-profile draft. Current implementation and
BR-AUTH-09 instead persist a real unverified CUSTOMER in `users` at accepted
registration; OTP verifies the same User ID. No implementation rollback needed.

Read-only local checks confirmed:
- `users.email_verified` exists, is NOT NULL, historical/default value true;
  public `registerUnverified` explicitly persists false.
- `uq_users_email_normalized` is unique and valid.
- Backend health responds HTTP 200.
- No temporary `*-check.*` verification files at frontend root.
- Both disposable registration/uniqueness databases are removed.
- Screenshots and the original UI verification evidence remain in this folder.

Latest completed regression evidence: 452 backend tests and packaged build
passed (`target/unique-email-verify.log`); 50 frontend tests plus lint/build passed
(`target/order-pagination-*.log`). Secured prod schema-validation smoke passed.
These existing successful checks were inspected, not rerun for this read-only
continuation audit. No code changed and no live account or mail was created.
