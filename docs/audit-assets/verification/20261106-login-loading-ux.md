# Login loading UX — 2026-11-06

The login page showed a fixed, full-screen “Đang chuyển đến khu vực làm việc…”
overlay during initial refresh-cookie hydration, including anonymous visits.
This incorrectly described a redirect and replaced the visible auth layout.

The page now uses an inline login-form skeleton shared with its lazy route
fallback. It preserves the existing auth layout and does not restart an entry
fade between module loading and session checking. Redirect waits for hydration
to finish; existing role/payment destinations and backend session checks remain.
No timers, artificial delays, token caches or dependencies were added to the app.

## Verification and acceptance

- Frontend lint/build passed; five existing Google-login/login-error tests passed.
- Browser at desktop width and 390px: no fixed loading-status overlay, no old
  redirect message and no horizontal overflow.
- Local-only, external-to-repository Vite middleware held an anonymous refresh
  response for 20 seconds, then returned 401. Skeleton remained in the auth card;
  afterward the regular email/password and Google form appeared. This delay is
  absent from application sources and deploy output.
- Screenshots: `20261106-login-skeleton-desktop.png`,
  `20261106-login-skeleton-mobile.png`, `20261106-login-ready-mobile.png`.
- Existing skeleton reduced-motion handling is reused. Busy status is accessible
  and its description is screen-reader-only; placeholders cannot receive focus.
- Scope/security review: AuthProvider, refresh/token/cookie behavior, validation,
  Google login and protected-route checks are unchanged. Authenticated redirects
  were reviewed in code; a real authenticated end-to-end login was not repeated.

## UI audit

- `m4n-frontend/src/components/ui/Skeleton.jsx:70` — pass: inline busy region,
  neutral surfaces, hidden decorative shapes, existing reduced-motion support.
- `m4n-frontend/src/features/auth/LoginPage.jsx:65` — pass: stable loading layout,
  no premature destination claim or full-screen status overlay.
- `m4n-frontend/src/routes/RouteContent.jsx:20` — pass: same login placeholder in
  the lazy route fallback and during session restoration.
