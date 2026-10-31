# Saved delivery addresses and Buy now — 2026-10-15

## Scope and implementation review

- User approved multiple saved addresses under Account and selection at checkout.
  Scope, BR-ADDRESS-01, API contracts and field rules record that approval.
- Customer-only endpoints derive the owner from the authenticated database profile.
  All lookups are owner-scoped; foreign IDs return 404. Controllers use the service
  interface, DTO validation and transport mapping only. Repository access and
  transactions remain in the service implementation. Concurrent edits/deletes
  use expected versions plus JPA optimistic locking.
- PostgreSQL migration adds the FK, field/hierarchy checks and paging index,
  including when Hibernate already created a development table. No dependency added.
- Existing recipient fields, shipping fields, Button, Skeleton, ConfirmDialog,
  account layout, transport and pagination are reused. Shared validation serves
  address editing and checkout. List and carrier options load independently.
- Checkout copies name, mobile, email, full/structured address and notes. Manual
  order edits remain local to that order. Loading does not overwrite typed values.
- Buy now sets exactly the requested quantity and selects only that cart row.
  The selection reconciliation records all current rows, preventing refresh from
  selecting existing cart items again. Existing backend checkout remains authoritative.
- Security review: no owner IDs accepted, Entity responses, unsafe query construction,
  token/recipient logging, browser address storage, client-authoritative totals,
  or new inventory mutation. Saved text is rendered through React text nodes.

## UI acceptance evidence

- Browser: isolated PostgreSQL test database, backend 8081 and frontend 5174;
  no real purchase, payment or email sent during browser checks.
- Added two addresses, edited one, then selected each at checkout. All five fields
  and edited notes were verified. Keyboard ArrowDown selects the other address.
- Empty required name shows its inline error, focuses that field and preserves
  the other fields. Save blocks duplicate submission and waits for server success.
- Delete confirmation opens with Cancel focused; Escape cancels and restores
  focus to the originating delete button. Actual deletion/409/404 are covered
  by backend HTTP tests.
- Existing cart: one Sáo Trúc. Buy now: two Đàn Tranh. Checkout showed only two
  Đàn Tranh; cart drawer retained both rows. Repeating Buy now for the existing
  Đàn Tranh with quantity one showed exactly one in checkout.
- Desktop, 390px mobile and 768px tablet inspected; no horizontal overflow.
  Fields/cards wrap, native controls have labels, errors are associated and async
  feedback is announced. Shared focus styles and reduced-motion skeleton rules
  remain active. White/cool-gray surfaces follow the project design system.
- Browser console: no errors in the tested flow. Loading, empty and failure
  recovery paths were reviewed in the components; provider availability remains
  backend-owned.
- Screens: `20261015-saved-address-checkout.png`,
  `20261015-saved-address-mobile.png` (fictional test recipients only).
- Reviewed against current [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md).
  Applicable new controls use native elements, labels, keyboard focus, recovery
  actions and neutral surfaces. React review: local state, stale-request cleanup,
  independent fetches and no new context/dependency or unnecessary memoization.

## Large-file review

Large file detected: `m4n-frontend/src/pages/CheckoutPage.jsx` (773 lines).
The existing page exceeds the exceptional-review threshold. This change extracts
duplicated recipient validation and keeps saved-address fetching/selection UI in
the checkout feature. Remaining order preview, voucher and payment orchestration
was reviewed and retained to keep this defect fix bounded; no speculative split
or business-rule change was introduced.

Large file detected: `m4n-frontend/src/routes/AppRouter.jsx` (319 lines).
The central route registry receives one lazy customer route with the existing
role guard. A second router or routing abstraction would conflict with the
project's integration rules and is not needed for this change.

## Verification commands

- Frontend: `npm run lint`, `npm run build`, `node --test tests/*.test.mjs`.
  All passed; 28 Node tests, zero failures.
- Backend: Java 21 Maven Wrapper `clean verify` on isolated PostgreSQL;
  migration reapplied safely, followed by `verify` with Hibernate `validate`.
  Both gates passed; final run: 64 suites, 405 tests, zero failures/errors/skips.
- Regression coverage includes owner isolation, active CUSTOMER authorization,
  multiple entries, ordering/paging contract, input limits, canonical GHN hierarchy,
  version conflicts, successful update/delete, cart selection and recipient copying.
- The repeat-run check exposed shared fixture assumptions after browser-created
  addresses. Integration tests now create unique transaction-scoped users, avoiding
  dependence on seeded customer addresses.

## OTP configuration

Local Gmail credentials passed SMTP authentication without sending an email.
`OTP_EMAIL_ENABLED` was false; it is enabled in the local backend environment.
The backend is restarted with that setting. End-to-end mailbox delivery has not
been asserted; no secret value is stored in this record.
