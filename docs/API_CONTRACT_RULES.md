# M4N API Contract Rules

This document governs the contract between `m4n-frontend/` and
`m4n-backend/`. It records only repository evidence and approved boundaries;
it does not define a new endpoint, DTO, field, wrapper, or workflow.

## Contract status

### Approved feature completion contracts — 2026-10-10

The user's instruction to finish the audit gaps approved these concrete feature
contracts. They supersede earlier scaffold/TBD descriptions for the named fields:

- [`STOCK_CONTRACT.md`](STOCK_CONTRACT.md): draft creation, QC confirmation and movement pages.
- [`CONTENT_CONTRACT.md`](CONTENT_CONTRACT.md): Article/Guide CRUD, publication and association pages.
- [`DISCOVERY_CONTRACT.md`](DISCOVERY_CONTRACT.md): artisan/village database discovery and detail.
- [`EXTERNAL_INTEGRATIONS.md`](EXTERNAL_INTEGRATIONS.md): Resend, VNPay sandbox, verified refunds and initial administrator.
- [`PRICING_CONTRACT.md`](PRICING_CONTRACT.md): effective product prices, shipping/freeship, SHIPPING vouchers and monetary snapshots.
- [`REVIEW_CONTRACT.md`](REVIEW_CONTRACT.md): review pages and whole-product rating aggregates.

VND money is a JSON decimal; price input follows NUMERIC(14,2), while discount and
shipping rounding follow the pricing contract. Timestamps are ISO-8601 UTC instants;
Vietnamese displays use `vi-VN`, operational dates `Asia/Ho_Chi_Minh`. Provider return
parameters never authorize payment or refund state.

| Contract area | Current decision | Status |
| --- | --- | --- |
| Concrete endpoint paths and HTTP methods | Implemented endpoints are defined by Controllers and the feature contracts below | IMPLEMENTED BY FEATURE |
| Request DTO shapes | Intent-specific records/classes under `dto.request` | IMPLEMENTED BY FEATURE |
| Response DTO shapes | Intent-specific records/classes under `dto.response` | IMPLEMENTED BY FEATURE |
| Response envelope | Direct DTO or Spring `Page` result; no global success wrapper | IMPLEMENTED |
| Error payload and field-error mapping | `ApiErrorResponse` from `GlobalExceptionHandler`; validation errors include `fieldErrors` | IMPLEMENTED |
| Pagination, sorting, and filter parameter names | Defined by each implemented Controller; no global contract | IMPLEMENTED BY FEATURE |
| Authentication transport and session/token lifecycle | Bearer access token and HttpOnly refresh cookie; see Auth endpoints below | IMPLEMENTED |
| Currency, locale, timezone, date/time wire format | Not selected | TBD |
| Backend authority over protected business values | Defined by project architecture and business rules | APPROVED |
| Intent-specific DTOs; entities never cross the HTTP boundary | Defined by backend architecture | APPROVED |

`TBD` means the team must decide the contract before implementation depends on
it. An example name in documentation is never an approved API field or path.

## Source priority and change control

1. `PROJECT_SCOPE.md` decides whether the capability exists.
2. `BUSINESS_RULES.md` decides authoritative behavior.
3. `ARCHITECTURE.md` and `BACKEND_ARCHITECTURE.md` decide ownership and layers.
4. This file records the cross-module contract rules.
5. Code becomes evidence only after an approved contract is implemented.

Before changing either client or server, search both modules for the existing
contract. Change request and response sides together. If documentation, client,
and server disagree, stop and report the mismatch; do not silently choose one.

## Request contract

- A request contains only inputs the caller is permitted to provide.
- Use an intent-specific request DTO once the endpoint is approved. Do not send
  a persistence Entity or reuse one oversized DTO for unrelated operations.
- The frontend may validate obvious type, format, requiredness, and range rules
  defined in `FORM_VALIDATION_RULES.md`; the backend must validate them again.
- The backend derives authenticated identity and roles from its approved
  security context. Never accept a client-supplied role as authority.
- Do not trust client-supplied price, inventory, discount, `FinalAmount`, order
  status, payment status, or review eligibility as final business state.
- Idempotency keys, multipart conventions, content types, and retry-safe
  mutation behavior are TBD until a concrete use case is approved.

## Response contract

- Return an intent-specific response DTO containing only approved data.
- Never return a JPA Entity, password, password hash, token secret, database
  credential, internal exception, or stack trace.
- The backend returns authoritative prices, totals, voucher results, inventory,
  permissions/eligibility, and state after recalculation and validation.
- The frontend renders only fields guaranteed by the approved contract; it must
  not infer undocumented fields from examples or database columns.
- Current success responses use direct DTOs or Spring `Page` objects. Do not
  introduce `ApiResponse<T>` or migrate envelopes without team approval.

## Error contract

- The implemented error payload is `ApiErrorResponse` with `timestamp`, `status`,
  `error`, `message`, `path`, and optional `fieldErrors`. A stable domain error
  code vocabulary and localization ownership remain TBD.
- When the implemented backend contract supports them, distinguish validation,
  authentication, permission, missing-resource, conflict, network, and server
  failures. Do not invent status handling unsupported by the endpoint.
- Backend messages exposed to users must be safe. The frontend maps approved
  field errors near controls and displays safe business/global errors at form
  level; it never dumps raw payloads or internals.
- A failed mutation must not be presented as success. Preserve entered data when
  safe and provide an approved recovery path.

## Pagination, sorting, and filtering

- Large database-backed lists require backend pagination. Current list endpoints
  use zero-based Spring `Pageable` query parameters and `Page` results; each
  Controller defines its defaults and supported filters. A global list contract
  remains TBD.
- Sort keys and directions must be an explicit allowlist in the approved
  contract; do not expose arbitrary persistence property names.
- Approved product filter concepts are Category/instrument group, Artist/Artisan,
  Craft Village, and price range. Their parameter names and encodings are TBD.
- The frontend must not fetch an unbounded dataset and claim client-side slicing
  is database pagination.

## Enum and status handling

- Send and display only values explicitly defined by the approved contract.
- The implemented order status values are `PENDING_CONFIRMATION`, `CONFIRMED`,
  `OUT_OF_STOCK_WAITING`, `SHIPPING`, `DELIVERED`, `COMPLETED`, and `CANCELLED`.
  Payment state is separate and backend-owned through `isPaid`.
- Unknown server enum values must fail safely and be reported as a contract
  mismatch; do not silently map them to another business state.

## Date, time, locale, and money

- Wire formats, timezone policy, locale, currency, precision, and rounding are
  TBD. Do not infer them from the user's location, display examples, or a common
  e-commerce convention.
- Use exact backend money types when implemented; JavaScript calculations are
  previews only.
- `BR-VOUCHER-01` approves the relationships
  `OrderAmount >= MinimumOrderValue`,
  `Discount = OrderAmount × DiscountRate`, and
  `FinalAmount = OrderAmount - Discount`; representation, composition, stacking,
  precision, and rounding follow the approved 2026-10-10 Stage 1 decision in `BUSINESS_RULES.md`: VND, `HALF_UP` to one dong, common product subtotal base, additive manual/automatic discounts capped by that subtotal.
- Centralize display formatting after the team approves locale/currency/timezone.

## Authentication and authorization responsibilities

| Responsibility | Frontend | Backend |
| --- | --- | --- |
| Collect approved credentials | Yes, with safe form handling | Validate authoritatively |
| Store/transport session or token | Send bearer access token and HttpOnly refresh cookie through the implemented auth client | Issue, rotate, revoke, and validate them |
| Show/hide available actions | UX aid based on backend-provided state | Remains authoritative |
| Enforce role, ownership, and protected operations | Never sufficient | Required on every protected operation |
| Submit role/identity as authority | Prohibited | Derive from authenticated context |
| Handle `401`/`403` UX | When defined by the endpoint contract | Return safe, correct responses |

### Approved Authentication and Account Endpoints

| Method | Endpoint | Auth | Cookie / Header | Request Body | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | None | `fullName`, `email`, `phone`, `password`, `address` (optional) | `201 Created` (`UserResponse`) | `400`, `409` |
| `POST` | `/api/v1/auth/login` | Public | Sets `m4n_refresh_token` (HttpOnly, SameSite=Lax, Path=/api/v1/auth) | `email`, `password` | `200 OK` (`AuthResponse`: `accessToken`, `tokenType`, `expiresIn`, `user`) | `400`, `401`, `403` |
| `POST` | `/api/v1/auth/refresh` | Public | Reads/rotates `m4n_refresh_token` | None | `200 OK` (`AuthResponse`) | `401`, `403` |
| `POST` | `/api/v1/auth/logout` | Public | Clears `m4n_refresh_token` | None | `204 No Content` | - |
| `POST` | `/api/v1/auth/logout-all` | Bearer JWT | Clears `m4n_refresh_token` | None | `204 No Content` | `401` |
| `GET` | `/api/v1/auth/me` | Bearer JWT | None | None | `200 OK` (`UserResponse`) | `401`, `403` |
| `POST` | `/api/v1/auth/change-password` | Bearer JWT | Clears `m4n_refresh_token` | `currentPassword`, `newPassword`, `confirmPassword` | `200 OK` (`MessageResponse`) | `400`, `401` |
| `POST` | `/api/v1/auth/forgot-password` | Public | None | `email` | `200 OK` (`MessageResponse` - generic) | `400`, `503` |
| `POST` | `/api/v1/auth/reset-password` | Public | None | `token`, `newPassword`, `confirmPassword` | `200 OK` (`MessageResponse`) | `400`, `401` |
| `GET` | `/api/v1/profile` | Bearer JWT | None | None | `200 OK` (`UserResponse`) | `401`, `403` |
| `PUT` / `PATCH` | `/api/v1/profile` | Bearer JWT | None | `fullName`, `phone`, `address` | `200 OK` (`UserResponse`) | `400`, `401`, `403` |

### Authentication lifecycle and unavailable reset delivery

- Login, refresh, password/reset changes and session revocation serialize on
  the account row before locking token rows. A concurrent rotation or old-password
  login cannot create a replacement session after revocation.
- Access JWTs include a dedicated `sessionVersion` matched against the current
  database account. Password change/reset, logout-all, role/status revocation and
  refresh reuse invalidate existing access tokens immediately. Contact edits do
  not increment this authentication generation. Tokens lacking the claim are
  rejected; a valid refresh session can obtain a new JWT, otherwise re-login is
  required.
- Reuse revokes active sessions and commits that revocation even when the
  response is `401`. Password reset tokens are consumed once, including
  simultaneous requests.
- New passwords keep the approved 8–72 character validation and must also fit
  BCrypt's 72-byte UTF-8 input limit. Oversized input returns safe `400`; it is
  never truncated.
- Forgot password returns the same generic `200` for existing and unknown
  accounts only when a delivery notifier is configured. The current development
  notifier is unavailable: both cases return the same `503` before account lookup.
  Raw reset tokens and reset URLs are never printed in application logs.
- Admin contact, role, disable, and reactivate mutations require
  `expectedVersion`; their response contains the committed incremented version.
  `STALE_USER_VERSION` is a reload conflict; other `409` business errors must
  retain their own message.

### Product create/update and gallery

- Existing Admin product create and update requests accept optional
  `lowStockThreshold`, a nonnegative Java integer. Create omission defaults to
  `5`; update omission preserves the current threshold. Product detail responses
  include the threshold. Zero stock is `OUT_OF_STOCK`; positive stock at or below
  the product threshold is `LOW_STOCK`; other positive stock is `IN_STOCK`.
  A threshold of `0` disables only the low-stock warning.
- Existing `PUT /api/v1/admin/products/{id}` accepts optional `media`, a complete
  gallery list of `{id?, mediaType?, url, altText?, sortOrder?}`. Existing IDs must
  belong to that product and may appear once. Items without IDs create media.
  Omitted `media` preserves the gallery; `[]` clears it. Product fields and the
  supplied gallery commit together or roll back together.
- Catalog/Admin thumbnails choose the first image in gallery order, excluding
  videos. Detail galleries preserve all media and their order.

### Paging and sorting for audited catalog/account/support lists

- Catalog and Admin product lists accept only `id`, `code`, `name`, `price`,
  `createdAt`, or `updatedAt` as sort properties.
- Admin user lists accept only `id`, `fullName`, `email`, `isActive`, or
  `createdAt`. Notification lists accept only `id` or `createdAt`.
- Chat messages have fixed `createdAt DESC, id DESC` order: page 0 contains the
  newest messages and later pages contain older messages. Clients display the
  returned page in chronological order. Only incoming messages actually returned
  by a page are marked read. Page sizes are bounded to 200.
- Support queues use their fixed last-activity/closure order. Explicit sort
  overrides on chat messages/queues and unsupported properties on other audited
  lists return safe `400`.
- Public artisan/village endpoints still return lists. Migrating them to `Page`
  with server search and geographical filters requires a feature contract
  decision; frontend slicing is not database pagination.
- Order lists accept `createdAt`, `id`, `orderCode`, `status`, or `finalAmount`;
  invoice lists accept `createdAt`, `id`, `invoiceCode`, or `finalAmount`;
  inventory lists accept `id`, `quantity`, or `updatedAt`. Supported keys may use
  `ASC` or `DESC`; unsupported and nested properties return safe `400`.
- `GET /api/v1/orders/me` returns a `Page` with optional order `status`, default
  size 10 and newest-first order. Ownership and status filters execute in the
  database before paging.

### Approved Online Staff Dashboard Endpoint

| Method | Endpoint | Auth | Request | Success Response | Error Codes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/staff/dashboard` | Bearer JWT, `ONLINE_STAFF` | Optional query: `days` (`7`, `14`, or `30`, default `7`); `status` (approved order status, omitted for all) | `200 OK` (`StaffDashboardSummaryResponse`) | `400`, `401`, `403`, `404` |

`StaffDashboardSummaryResponse` contains:

- `kpi`: `pendingOrders`, `confirmedOrders`, `waitingConversations`, and
  staff-scoped `unreadMessages`, all non-negative integer counts.
- `orderTrend`: `days` points ordered oldest to newest and optionally filtered
  by `status`. Each point contains an ISO `LocalDate` (`date`) interpreted in
  `Asia/Ho_Chi_Minh` and `orderCount`.
- `orderStatusCounts`: `status`, Vietnamese display `label`, and `count` for
  `PENDING_CONFIRMATION`, `CONFIRMED`, `OUT_OF_STOCK_WAITING`, `SHIPPING`,
  `DELIVERED`, `COMPLETED`, and `CANCELLED`.

The endpoint exposes operational counts only. It does not expose revenue,
customer records, conversation content, or another staff member's unread count.


## Approved business invariants across the API boundary

- Online Place Order creates `PENDING_CONFIRMATION` and does not reserve or
  deduct inventory (`BR-ORDER-01`).
- Online confirmation rechecks and deducts stock atomically; stock never becomes
  negative (`BR-INVENTORY-01`, `BR-INVENTORY-02`, `BR-INVENTORY-03`).
- Retry is an explicit `POST /api/v1/admin/orders/{id}/retry-confirmation`
  intent available only for `OUT_OF_STOCK_WAITING`; it uses the same all-or-nothing
  confirmation operation and never runs automatically after stock import.
- Customer self-cancellation is available only while the order is
  `PENDING_CONFIRMATION` (`BR-ORDER-02`).
- Staff cancellation restores inventory exactly once from `CONFIRMED`;
  pending/waiting cancellation restores nothing, while shipping, delivered,
  completed, and cancelled orders reject the normal cancellation operation (`BR-ORDER-03`).
- Staff moves fulfillment through `CONFIRMED → SHIPPING → DELIVERED`. Only the
  owning Customer can confirm receipt from `DELIVERED`, producing `COMPLETED`
  and marking COD paid (`BR-ORDER-04`).
- COD orders start unpaid and become paid only at legitimate completion. VNPay
  sandbox follows `EXTERNAL_INTEGRATIONS.md`; clients cannot submit paid state or totals
  (`BR-PAYMENT-01`).
- Review eligibility requires the Customer's matching Product in a
  `COMPLETED` Order (`BR-REVIEW-01`).
- Successful POS confirmation creates the invoice and deducts stock in one
  protected operation (`BR-POS-01`).
- `GET /api/v1/pos/invoices` is available to `POS_STAFF` but returns only invoices
  owned by the authenticated staff account; Admin/Super Admin retain their
  existing global invoice visibility.
- `GET /api/v1/admin/users/{id}/orders` is paginated and restricted to
  Admin/Super Admin customer management. It is not a Customer self-service API
  and does not grant Online Staff global customer access.
- Voucher results and completed revenue are calculated by the backend
  (`BR-VOUCHER-01`, `BR-REVENUE-01`).

These invariants constrain future contracts; they do not authorize creating the
corresponding endpoints.

## Contract approval checklist

For frontend integration, the feature owner and Frontend Lead complete this
contract before wiring a real request. The owner supplies the approved feature
semantics and DTO behavior; the Frontend Lead connects it through the shared
transport and the feature service without changing the backend contract.

- Do not add a global API client until the base URL environment key, request
  defaults, error shape, and authentication transport are approved.
- After approval, configure the base URL and auth transport once in the shared
  transport. Feature components must not hardcode hosts, construct auth headers,
  or read token storage.
- Feature services own capability-specific request/response adaptation. Do not
  create one `apiService` containing unrelated system operations.
- Central error handling preserves distinctions the backend actually provides;
  feature UI owns safe, contextual recovery copy. Never show raw payloads,
  exceptions, or stack traces.
- `401` starts only the approved re-authentication behavior; `403` is forbidden
  and does not imply logout; `404` may be resource-specific; `409` has no
  business meaning until the endpoint contract defines it.
- Remove obsolete mocks only when their real adapter is integrated and verified.

Checklist:

- [ ] The capability is approved in scope and its business rules are identified.
- [ ] Path, method, authentication, authorization, and ownership are explicit.
- [ ] Request/response DTO fields, requiredness, types, nullability, and enums are explicit.
- [ ] Validation and safe error payloads are explicit.
- [ ] Pagination/filter/sort semantics are explicit when applicable.
- [ ] Money/date/time/locale semantics are explicit when applicable.
- [ ] Frontend and backend changes agree and are tested together.
- [ ] No Entity, secret, raw exception, or client-authoritative business value crosses the boundary.
- [ ] Documentation status changes from TBD only after an explicit team decision.
