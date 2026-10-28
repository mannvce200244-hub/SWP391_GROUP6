# M4N Backend AI Instructions

This file is the source of truth for AI behavior under `m4n-backend/`. It supplements the root [`AGENTS.md`](../AGENTS.md); it does not override project scope or business behavior.

## Mandatory reading

Before changing backend code, read:

1. [`../AGENTS.md`](../AGENTS.md)
2. [`../docs/PROJECT_SCOPE.md`](../docs/PROJECT_SCOPE.md)
3. [`../docs/BUSINESS_RULES.md`](../docs/BUSINESS_RULES.md)
4. [`../docs/CODE_QUALITY_RULES.md`](../docs/CODE_QUALITY_RULES.md)
5. [`../docs/BACKEND_ARCHITECTURE.md`](../docs/BACKEND_ARCHITECTURE.md)
6. [`../docs/API_CONTRACT_RULES.md`](../docs/API_CONTRACT_RULES.md) for any HTTP/API contract work
7. [`../docs/DATABASE_GUIDE.md`](../docs/DATABASE_GUIDE.md) for persistence, money, order, payment, or inventory work
8. [`../docs/TESTING_STRATEGY.md`](../docs/TESTING_STRATEGY.md) for testing work

Inspect the affected code before editing. If documents or code conflict, stop and report the conflict; never choose a rule arbitrarily.

## Inspected baseline

- Package root: `com.m4n.backend`.
- Java 21, Spring Boot 4.1.1, and Maven Wrapper.
- Current dependencies include Spring Security, Spring Web MVC, DevTools, Lombok, and test starters.
- No application layer packages exist yet, so there is no existing `service.impl` convention to preserve.
- Spring Data JPA and the PostgreSQL driver are required by the approved architecture but are not currently present in `pom.xml`. Do not add them unless an implementation/setup request explicitly permits dependency changes.

## Required architecture

Use this dependency direction:

```text
Controller -> Service interface <-implements- ServiceImpl -> Repository -> Spring Data JPA -> PostgreSQL
```

- Controllers depend on service interfaces, never directly on `ServiceImpl` when an interface exists.
- A service interface declares operations; it does not call or contain implementation logic.
- `ServiceImpl` implements its service interface and owns business orchestration.
- Only `ServiceImpl` or an explicitly appropriate persistence/domain component may access repositories.
- Controller, DTO, Entity, Mapper, and utility classes must never access repositories.

The package convention for new backend code is `service` plus `serviceImpl`, because the current scaffold has no conflicting convention. Do not later rename it to `service.impl` without an explicit team decision.

Detailed responsibilities and persistence rules are in [`../docs/BACKEND_ARCHITECTURE.md`](../docs/BACKEND_ARCHITECTURE.md).

## Non-negotiable coding rules

- Keep controllers limited to HTTP transport, request validation, service calls, response mapping, and HTTP status selection.
- Put business logic, business validation, calculations, authorization decisions that depend on business context, orchestration, and transaction boundaries in `ServiceImpl` or an approved domain component.
- Every important domain service must have an interface in `service` and an implementation in `serviceImpl`.
- Use Spring Data JPA before custom queries. Native SQL is an exception and requires a documented reason.
- Never expose or accept a JPA Entity as an API contract. Use intent-specific request/response DTOs and mappers.
- Mappers only transform data. They must not query, authorize, calculate business results, validate vouchers, change order state, or update inventory.
- Prefer constructor injection with `private final` dependencies. Lombok `@RequiredArgsConstructor` is allowed because Lombok already exists. Avoid field injection.
- Use centralized exception handling; do not add repetitive controller `try/catch` blocks or expose internal stack traces.
- Use database pagination/filtering for potentially large lists. Do not load all rows and filter or paginate with Java streams.
- Do not hide business behavior or repository access inside `util`.
- Avoid circular service dependencies. Report one rather than masking it with lazy injection.
- Do not create generic repository/service abstractions over `JpaRepository` without a concrete approved need.

## M4N authority and transactions

- The backend recalculates and validates price, `OrderAmount`, discount, `FinalAmount`, voucher results, inventory, roles, payment status, and order status. Never trust client-controlled values for these fields.
- Customer Place Order does not reserve or deduct inventory.
- Online inventory is rechecked and deducted only when Staff/Admin successfully confirms the order.
- POS inventory is rechecked and deducted when payment is successfully confirmed.
- Inventory must never become negative, including under concurrent requests.
- Put transaction boundaries in `ServiceImpl`, not Controller. Use a transaction for multi-record business operations such as order confirmation, inventory deduction, POS payment plus invoice/inventory updates, and stock import.
- Cancellation-related stock restoration is not yet defined in the business rules. Do not implement it until approved; if approved later, it must be transaction-safe.

## Validation and security

- Use request DTO validation for transport constraints and business validation in `ServiceImpl`.
- Backend authorization must derive identity and roles from the authenticated user/security context, not request fields.
- Never store plaintext passwords or return/log passwords, tokens, database credentials, API keys, or other secrets.
- Use a team-approved strong password encoder; the exact password encoding configuration remains TBD.
- Never concatenate untrusted input into JPQL or SQL. Prefer repository methods and bind parameters in every custom query.
- Do not invent JWT, CSRF, token, session, or other authentication behavior that the team has not approved.

## Feature workflow

For every requested backend feature:

1. Read the mandatory documents above.
2. Inspect the affected module and existing conventions.
3. Confirm the requirement is in project scope and identify applicable business rules.
4. Describe `Input -> Validation -> Business operation -> Persistence -> Response` for a complex Order, Checkout, POS, or Inventory flow.
5. Identify the expected files/change budget and search for equivalent code.
6. Identify existing Entity and request/response DTOs.
7. Identify the Repository and the simplest sufficient Spring Data JPA mechanism.
8. Identify or add the Service interface, then its `ServiceImpl`.
9. Identify or add the Mapper and Controller.
10. Define request validation and business validation separately.
11. Determine transaction, concurrency, authentication, authorization, and ownership requirements.
12. Implement only the smallest approved change.
13. Compile/run relevant tests, remove dead/debug/speculative code, and review the diff against scope, architecture, and business rules.

## Completion checklist

Before declaring backend work complete, verify:

- [ ] Controller does not call a Repository or `EntityManager` directly.
- [ ] Controller contains no business calculation, inventory logic, voucher logic, or order-state decision.
- [ ] Controller depends on the Service interface rather than its implementation.
- [ ] Each important service has an interface, and `ServiceImpl` implements it.
- [ ] Repository uses the simplest sufficient JPA mechanism.
- [ ] Every `@Query` has a reason that built-ins, a readable derived query, or Specification cannot meet.
- [ ] Every native query has a specific justified need that JPQL/JPA cannot reasonably meet.
- [ ] API request/response types are DTOs rather than Entities.
- [ ] Mapper contains transformation only and never accesses a Repository.
- [ ] Large filtering/pagination runs in the database rather than on `findAll()` results.
- [ ] Important multi-record changes have a service-layer transaction boundary.
- [ ] Inventory cannot become negative under concurrent operations.
- [ ] Backend does not trust client price, discount, role, payment status, order status, or inventory.
- [ ] Authorization uses authenticated server-side identity and context.
- [ ] Business behavior matches `BUSINESS_RULES.md`.
- [ ] No feature, dependency, framework, or abstraction was added outside the approved request.
- [ ] No unused/speculative class, method, DTO, Mapper, Repository operation, commented-out implementation, or debug output remains.
- [ ] Any file over the architecture thresholds was reported and reviewed rather than mechanically split.
- [ ] Relevant tests and compilation were run, or omissions were reported.

Fix any violation before considering the task complete.
