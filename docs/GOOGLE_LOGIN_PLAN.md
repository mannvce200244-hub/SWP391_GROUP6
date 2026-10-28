# Google login integration plan

Status: inspected and proposed; Google login is not implemented or enabled yet.

## Requested integration

The user supplied a Google OAuth web-client configuration on 2026-10-12 for
project `m4n-swp`. The registered backend callback is
`http://localhost:8080/login/oauth2/code/google`; frontend JavaScript origins
include `http://localhost:5173` and `http://localhost:3000`.

The client secret disclosed in chat must be rotated in Google Cloud. Do not
copy it into repository files, frontend variables, tests, documentation or logs.
The replacement secret belongs exclusively in backend process configuration.
Google login is independent of Gmail SMTP email OTP delivery.

## Decisions awaiting user response

1. Dependency approval: `spring-boot-starter-oauth2-client`. The existing
   Security starter and M4N JWT implementation do not implement Google's
   authorization-code/OIDC login. Use the official Spring Security integration
   for state, nonce and ID-token verification rather than custom protocol code.
   Root AGENTS.md and CODE_QUALITY_RULES.md require approval before adding it.
2. Existing-email linking: the proposed default requires authentication to the
   existing M4N account before linking Google. Automatic linking of a Customer
   with a verified Google email is the alternative presented to the user; its
   precise identity guarantees must be recorded before implementation.

Neither pending decision is an approved business rule. Do not silently merge
accounts, enable privileged Google login or add the dependency.

## Minimum implementation after approval

1. Record the chosen account creation/linking behavior in PROJECT_SCOPE.md and
   BUSINESS_RULES.md, and the HTTP contract in API_CONTRACT_RULES.md.
2. Add the approved OAuth2 Client starter, backend-only configuration and an
   OAuth filter chain for `/oauth2/**` and `/login/oauth2/**`. Keep the JWT API
   filter chain stateless. Bind OAuth state/nonce to a short-lived browser
   session; discard that session on completion/failure. Enable PKCE S256.
3. Validate the Google OIDC identity through Spring Security: signature,
   issuer, client audience, expiry and nonce; require a verified email. Use the
   stable Google subject (`sub`) for persisted identity, with a unique database
   constraint and an explicit PostgreSQL upgrade script.
4. Put account lookup, creation/linking, inactive-account enforcement and
   session issuance in a Service implementation. Controllers and OAuth handlers
   remain HTTP adapters. New accounts receive CUSTOMER only. Recheck database
   role/status and session generation when issuing the existing refresh session.
5. On success, set the existing HttpOnly refresh cookie and redirect only to the
   configured frontend. AuthContext then obtains the existing M4N access token
   through `/auth/refresh`. Never send provider or M4N tokens in redirect URLs.
6. Add the login action using existing frontend UI/auth boundaries, with
   loading, cancellation, unavailable-provider and recoverable-error states.
   Expose availability only when required backend configuration is complete.
7. Add authenticated account-linking UI only if that workflow is selected.
   Preserve existing password login and email OTP flows.

## Proposed configuration contract

These keys are a proposal, not currently supported environment variables:

| Backend variable | Purpose |
| --- | --- |
| `GOOGLE_LOGIN_ENABLED` | Explicit opt-in; default false |
| `GOOGLE_CLIENT_ID` | Public web-client identifier |
| `GOOGLE_CLIENT_SECRET` | Rotated secret, backend only |
| `GOOGLE_REDIRECT_URI` | Exact registered backend callback |
| `GOOGLE_FRONTEND_URL` | Trusted frontend redirect destination |

Request only `openid`, `email` and `profile`. Do not request Gmail access or
offline access, or persist Google access/refresh tokens for this login feature.

## Verification required

- Reject missing/mismatched state, replay, invalid nonce, audience, issuer,
  expiry and signature; cancellation must not create an M4N session.
- Test new Customer creation, existing-email conflicts, duplicate subject,
  inactive accounts, account-role guards and concurrent creation/linking.
- Confirm OAuth browser sessions cannot authenticate protected JWT APIs.
- Confirm the success response uses the existing secure cookie contract and
  trusted redirects; error messages must not expose secrets/provider tokens.
- Run applicable backend tests and Maven verify against a dedicated test DB;
  frontend tests, lint and build; SQL upgrade and schema-validation checks.
- Actual Google consent/callback testing needs a rotated secret configured
  outside chat and a provider consent screen available to the test account.
  A configured callback is not evidence of successful live login.

## Official references

- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Spring Security OAuth2 Login](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/core.html)

Project rules and the user's approved decisions remain authoritative.
