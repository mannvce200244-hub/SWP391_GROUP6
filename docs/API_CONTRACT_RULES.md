# M4N API Contract Rules

This document governs the contract between `m4n-frontend/` and
`m4n-backend/`. It records only repository evidence and approved boundaries;
it does not define a new endpoint, DTO, field, wrapper, or workflow.

## Contract status

| Contract area | Current decision | Status |
| --- | --- | --- |
| Concrete endpoint paths and HTTP methods | No business endpoint exists in the inspected scaffold | TBD |
| Request DTO shapes | No concrete request DTO exists | TBD |
| Response DTO shapes | No concrete response DTO exists | TBD |
| Response envelope | No wrapper convention exists | TBD |
| Error payload and field-error mapping | No schema exists | TBD |
| Pagination, sorting, and filter parameter names | No schema exists | TBD |
| Authentication transport and session/token lifecycle | Not selected | TBD |
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
- A global response wrapper is TBD. Do not introduce `ApiResponse<T>` or migrate
  responses to another envelope without team approval.

## Error contract

- The error payload shape, stable error code vocabulary, field-path format, and
  localization ownership are TBD.
- When the implemented backend contract supports them, distinguish validation,
  authentication, permission, missing-resource, conflict, network, and server
  failures. Do not invent status handling unsupported by the endpoint.
- Backend messages exposed to users must be safe. The frontend maps approved
  field errors near controls and displays safe business/global errors at form
  level; it never dumps raw payloads or internals.
- A failed mutation must not be presented as success. Preserve entered data when
  safe and provide an approved recovery path.

## Pagination, sorting, and filtering

- Large database-backed lists require backend pagination, but parameter names,
  indexes (zero- or one-based), defaults, limits, response metadata, and cursor
  versus offset strategy are TBD.
- Sort keys and directions must be an explicit allowlist in the approved
  contract; do not expose arbitrary persistence property names.
- Approved product filter concepts are Category/instrument group, Artist/Artisan,
  Craft Village, and price range. Their parameter names and encodings are TBD.
- The frontend must not fetch an unbounded dataset and claim client-side slicing
  is database pagination.

## Enum and status handling

- Send and display only values explicitly defined by the approved contract.
- Known business-rule values include `PENDING_CONFIRMATION`, `CONFIRMED`, and
  `COMPLETED`. They are business concepts, not a complete enum definition.
- The machine status for out-of-stock/waiting-for-restock is TBD. Do not invent
  it or guess cancellation/payment status vocabularies.
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
  precision, and rounding remain TBD.
- Centralize display formatting after the team approves locale/currency/timezone.

## Authentication and authorization responsibilities

| Responsibility | Frontend | Backend |
| --- | --- | --- |
| Collect approved credentials | Yes, with safe form handling | Validate authoritatively |
| Store/transport session or token | Follow the approved mechanism; currently TBD | Define and enforce the mechanism; currently TBD |
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
| `POST` | `/api/v1/auth/forgot-password` | Public | None | `email` | `200 OK` (`MessageResponse` - generic) | `400` |
| `POST` | `/api/v1/auth/reset-password` | Public | None | `token`, `newPassword`, `confirmPassword` | `200 OK` (`MessageResponse`) | `400`, `401` |
| `GET` | `/api/v1/profile` | Bearer JWT | None | None | `200 OK` (`UserResponse`) | `401`, `403` |
| `PUT` / `PATCH` | `/api/v1/profile` | Bearer JWT | None | `fullName`, `phone`, `address` | `200 OK` (`UserResponse`) | `400`, `401`, `403` |


## Approved business invariants across the API boundary

- Online Place Order creates `PENDING_CONFIRMATION` and does not reserve or
  deduct inventory (`BR-ORDER-01`).
- Online confirmation rechecks and deducts stock atomically; stock never becomes
  negative (`BR-INVENTORY-01`, `BR-INVENTORY-02`, `BR-INVENTORY-03`).
- Customer self-cancellation is available only while the order is
  `PENDING_CONFIRMATION` (`BR-ORDER-02`).
- Review eligibility requires the Customer's matching Product in a
  `COMPLETED` Order (`BR-REVIEW-01`).
- Successful POS confirmation creates the invoice and deducts stock in one
  protected operation (`BR-POS-01`).
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
