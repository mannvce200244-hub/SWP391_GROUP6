# Google login verification — 2026-10-26

## Approved change

- User approved official Spring OAuth2 Client and automatic CUSTOMER linking
  through verified authoritative Google email; staff/Admin keep password login.
- BR-AUTH-09, scope, API, database/form rules and hosting guide are updated.
- New backend boundaries: `GoogleLoginService` / `GoogleLoginServiceImpl` own
  account policy and transactions; `GoogleLoginHandler` adapts verified OIDC to
  existing refresh cookies; controller exposes availability only.
- Frontend reuses Button, shared auth service/API client and AuthContext.
  No extra frontend dependency or separate session/token store was introduced.

## Commands and results

| Check | Result |
| --- | --- |
| `mvnw.cmd -q verify` | PASS: 528 tests, zero failures/errors/skips in this run |
| Google-specific tests | PASS: 23 across service, integration, handler, security, legacy callback and properties suites |
| `node --test tests/*.test.mjs` | PASS: 72 tests |
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Local additive SQL upgrade | PASS on local `m4n_db`; no historical identity linking |
| Packaged backend startup | PASS: localhost8080 health UP, options available=true |
| Credential scan | PASS: configured secret absent from source, frontend dist, docs and logs; backend `.env` ignored |

Full backend verification used the separate `m4n_google_test_20261026`
PostgreSQL database, never the application database. One old hosted-smoke XML
was excluded from the test count. Logs: `logs/google-login-verify.log` and
Surefire reports under `m4n-backend/target/surefire-reports/`.

## Browser acceptance

- Google availability transitioned error → retry → available during backend
  startup; retry retained the password form and restored the Google button.
- Keyboard Enter opened the real Google account chooser for M4N with the
  registered localhost8080 callback and PKCE S256.
- User completed Google account/consent and reported successful login. Browser
  confirmed an authenticated customer header at localhost5173 and after reload.
- Responsive checks at 390px and 768px: document width equals viewport width;
  desktop 1280px also reviewed. Temporary viewport override reset.
- Kept the authenticated result tab; original user tab preserved. Temporary
  verification helper removed. No passwords, provider tokens or secrets in images.
- Images: [mobile button](audit-assets/google-login-mobile-20261026.png),
  [authenticated result](audit-assets/google-login-success-20261026.png).

## Security and UI review

- Reject missing/mismatched state, callback replay, invalid token signature,
  nonce, issuer, audience or expiry. Mock provider signs real OIDC RSA tokens;
  no production bypass or fake login endpoint is present.
- OAuth sessions cannot authenticate JWT APIs. Session/provider tokens are
  discarded on completion. Fixed frontend redirects carry outcome only; refresh
  cookie follows the existing contract. `prod` sets both cookies Secure.
- Existing disabled/privileged customers, duplicate/conflicting identities and
  unverified provider email do not receive sessions. Verified existing customer
  profile/password preserved; unverified signup password invalidated on claim.
- [Current Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)
  fetched and applied. No blocking findings in `GoogleLoginButton.jsx:38` or
  `LoginPage.jsx:33`: native action, keyboard operation, visible focus, live
  feedback, decorative icon hidden, responsive neutral surfaces and recovery.
- Relevant UI Acceptance Checklist items passed. No local Google credential
  fields, modal, media, list/pagination or new animation: related items N/A.
  Provider cancellation and unavailable states covered by automated backend/
  frontend service checks; real Google denial was not submitted during this run.
- Source sizes reviewed: LoginPage 233 lines, Google service 80; no new file
  exceeds its architecture review threshold. Workspace has no Git metadata;
  review used the affected source files directly.

## Remaining deployment acceptance

Replace the secret disclosed in chat before deployment. Set permanent same-origin
HTTPS callback and trusted Google frontend on Railway, register the exact Vercel
callback in Google Cloud, apply the SQL migration, then test on the hosted
domain. Local success is not evidence of Vercel/Railway deployment acceptance.
See [setup](GOOGLE_LOGIN_PLAN.md) and [hosting](VERCEL_RAILWAY_DEPLOYMENT.md).
