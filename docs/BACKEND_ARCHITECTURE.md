# M4N Backend Architecture

This document is the source of truth for detailed backend architecture. Backend AI behavior is governed by [`../m4n-backend/AGENTS.md`](../m4n-backend/AGENTS.md); business behavior remains governed by [`BUSINESS_RULES.md`](BUSINESS_RULES.md).

## Inspected repository baseline

| Concern | Current repository state |
| --- | --- |
| Package root | `com.m4n.backend` |
| Java | 21 |
| Framework | Spring Boot 4.1.1 |
| Build | Maven with checked-in wrapper |
| Existing source packages | Root package only; application entry point and context-load test |
| Existing dependencies | Spring Security, Spring Web MVC, DevTools, Lombok, and test starters |
| Spring Data JPA | Approved for the backend, but dependency not present yet |
| PostgreSQL | Approved database, but driver/configuration/schema not present yet |

Documentation of Spring Data JPA and PostgreSQL below describes the mandatory target architecture. This documentation task does not authorize adding dependencies or implementing persistence.

## Layered dependency flow

The required direction is:

```text
HTTP
  -> Controller
  -> Service interface
  -> ServiceImpl
  -> Repository
  -> Spring Data JPA
  -> PostgreSQL
```

`ServiceImpl implements Service`; the interface never calls its implementation. Controllers inject the service interface, and Spring dependency injection resolves the implementation.

Example relationship:

```text
ProductController -> ProductService
ProductServiceImpl implements ProductService
ProductServiceImpl -> ProductRepository
ProductRepository extends JpaRepository<Product, Long>
```

Dependencies must point downward through the layers. Repository/JPA persistence code must not depend on Controllers or API DTOs.

## Required package convention

The current code has no layer convention beyond the root package. Therefore, new backend code must use this team-selected structure:

```text
com.m4n.backend
├── config
├── controller
├── dto
│   ├── request
│   └── response
├── entity
├── exception
├── mapper
├── repository
├── service
├── serviceImpl
├── security
├── util
└── validation
```

Create packages only when an approved feature needs them; do not add empty application structure in a documentation task. If the team later changes this convention, update this source of truth before performing a broad move. Do not silently switch to `service.impl`.

If a layer becomes too large, it may use consistent domain subpackages such as `controller.product`, `service.product`, and `serviceImpl.product`. Add them only for current code that needs the grouping, and do not mix conventions arbitrarily between features.

## Controller layer

Controllers are limited to:

- Receiving and parsing HTTP requests.
- Applying transport-level request validation.
- Calling a Service interface.
- Mapping service results to HTTP responses and appropriate status codes.

Controllers must not:

- Contain business logic or calculations.
- Access a Repository, `EntityManager`, JPA, or the database directly.
- Calculate vouchers, totals, or revenue.
- Check/update inventory or decide order status.
- Implement complex authorization business logic.
- Inject `ProductServiceImpl` or another implementation when a service interface exists.

Do not add repetitive controller `try/catch`; use centralized exception handling.

## Service interface

Each important domain service has an interface in `service`, such as `ProductService`, `OrderService`, `InventoryService`, `VoucherService`, or `UserService` when the approved feature requires it.

- Declare business operations and clear input/output contracts only.
- Do not put implementation logic in the interface.
- Use intention-revealing operation names such as `createProduct`, `getProductById`, `searchProducts`, `confirmOrder`, `cancelOrder`, and `applyVoucher`.
- Avoid vague names such as `process`, `handle`, or `doSomething` when a precise business verb exists.

These names are conventions, not authorization to implement the example features outside a requested task.

## ServiceImpl

Implementations live in `serviceImpl` and use names such as `ProductServiceImpl`.

`ServiceImpl` owns:

- Business logic and orchestration.
- Business validation.
- Calls to Repositories and other Services.
- Mapping coordination.
- Appropriate transaction boundaries.
- Enforcement of approved business rules.
- Throwing meaningful business/not-found exceptions.

Keep services stateless where practical. A `ServiceImpl` may call another Service interface for a real business dependency, but dependencies must remain directional. If services start injecting each other, report the circular design instead of hiding it with lazy injection or field lookup.

## Repository and JPA-first rules

Repositories live in `repository` and use Spring Data JPA. Do not create `ProductRepositoryImpl` for ordinary CRUD that `JpaRepository` already provides, and do not add a generic repository wrapper over `JpaRepository` merely for appearance.

Choose the simplest readable option in this order:

1. `JpaRepository` built-in operations such as `findById`, `findAll`, `save`, `saveAll`, `delete`, and existence/count operations.
2. Readable derived query methods.
3. `Pageable` and `Sort`.
4. `JpaSpecificationExecutor` / Specification or Criteria API for complex dynamic filtering.
5. JPQL `@Query` when the previous options do not fit.
6. Native SQL only as a justified last resort.

Soft deletion is not currently an approved universal behavior. Use delete behavior only as defined for the affected entity and preserve historical data according to [`DATABASE_GUIDE.md`](DATABASE_GUIDE.md).

### Derived queries

Prefer clear derived names for simple conditions, for example:

- `findByEmail`
- `existsByEmail`
- `findByStatus`
- `findByCategoryId`
- `findByNameContainingIgnoreCase`
- `findByPriceBetween`
- `findByStatusAndCustomerId`

Do not force many conditions into an unreadable method name. Dynamic combinations of approved filters should use Specification rather than dozens of Repository methods or concatenated query strings.

Product search may combine approved filters such as category/instrument group, artisan, craft village, and price range. A status filter or any other criterion must be approved in project scope before implementation.

### `@Query`

Use `@Query` only when built-ins, a readable derived query, and Specification/Criteria are unsuitable, or when an aggregate/report query or verified performance behavior requires it. Prefer JPQL over native SQL. A reviewer must be able to explain why ordinary JPA mechanisms are insufficient; coding speed alone is not a reason.

Always bind parameters. Never concatenate untrusted input into JPQL or SQL.

### Native SQL

`nativeQuery = true` is exceptional. It requires a concrete reason such as a necessary PostgreSQL-specific feature, an unusual reporting query, verified performance evidence, or logic that JPA/JPQL cannot express reasonably. Do not use native SQL for ordinary CRUD or simple filtering.

## DTO and API contracts

Never use an Entity directly as an HTTP request or response. Separate DTOs by intent where the contracts differ:

```text
dto/request/ProductCreateRequest.java
dto/request/ProductUpdateRequest.java
dto/response/ProductResponse.java
```

- Request DTOs represent permitted client input.
- Response DTOs expose only approved output.
- Create, update, login, checkout, and response shapes should not be combined into one oversized DTO when their requirements differ.
- DTOs contain no Repository access or business orchestration.

## Mapper

Mappers live in `mapper` and handle transformations such as:

- Entity to Response DTO.
- Request DTO to a new Entity when appropriate.
- Entity plus Update Request to field updates when appropriate.

Mappers must not query a database, call a Repository, authorize, validate voucher eligibility, calculate totals, decide inventory, or change order state.

No mapping library is currently configured. Use focused manual mapper classes unless the team explicitly approves a mapping dependency. If MapStruct is later approved and added, use it consistently rather than mixing styles without reason.

## Entity

Entities represent persistence/domain state, not API contracts.

- Use JPA annotations deliberately and make relationships clear.
- Avoid accidental eager loading and broad cascading.
- Create bidirectional relationships only when required.
- Avoid Lombok `@Data` on JPA Entities when generated `equals`, `hashCode`, or `toString` can traverse relationships or expose sensitive fields.
- Never expose password hashes, tokens, or security fields through serialization.

Entity fields and relationships must come from approved requirements/ERD; do not invent schema from the examples in this document.

## Dependency injection and naming

- Use constructor injection for required dependencies and declare them `private final`.
- Lombok `@RequiredArgsConstructor` is allowed because Lombok is already present.
- Avoid field injection such as `@Autowired private ProductService productService`.
- Use names such as `ProductController`, `ProductService`, `ProductServiceImpl`, `ProductRepository`, `ProductMapper`, `Product`, `ProductCreateRequest`, and `ProductResponse`.
- Do not name controllers `*ControllerImpl` or ordinary Spring Data repositories `*RepositoryImpl`.

## Validation and authoritative calculations

Validation has two distinct layers:

1. **Request validation:** structural/transport constraints on request DTOs, using applicable Bean Validation annotations such as `@NotBlank`, `@NotNull`, `@Size`, `@Email`, `@Min`, or `@Positive` once the project has the required validation support.
2. **Business validation:** approved rules enforced in `ServiceImpl`, including inventory availability, allowed order transitions/cancellation, review eligibility, and the documented minimum-order voucher condition.

Voucher expiration is not defined in the current business rules. Do not add it merely because it is a common validation example.

The backend must recalculate and validate all authoritative values. Client fields such as `finalAmount`, `discountAmount`, inventory quantity, role, `paymentStatus`, and `orderStatus` are never trusted as final business state.

## Transactions and M4N inventory

Place transaction boundaries in `ServiceImpl`, never in Controller. Use `@Transactional` where one approved business operation changes related records or must be atomic, especially:

- Confirming an online order and deducting inventory.
- Confirming a POS payment, creating its invoice, and deducting inventory.
- Stock import or another approved inventory update.
- Payment result processing when multiple records change.
- Cancellation with stock restoration only if that restoration behavior is later approved.

Required online flow:

```text
Controller
  -> OrderService
  -> OrderServiceImpl
  -> recheck current inventory
  -> deduct inventory if sufficient
  -> update order status
  -> Repository
```

Customer Place Order does not reserve or deduct inventory. Online stock decreases only after successful Staff/Admin confirmation. POS stock decreases only when the POS transaction/payment is successfully confirmed. Every stock reduction must be concurrency-safe and must preserve `inventory.quantity >= 0`.

The exact locking/concurrency mechanism remains TBD; choose it only in an approved implementation task and document the decision.

## Exception handling and responses

- Centralize exception-to-HTTP mapping with `@RestControllerAdvice` (or the project's consistent equivalent).
- Use focused exceptions such as resource-not-found or business-rule violations when those cases are implemented.
- Do not leak stack traces, secrets, internal class names, or sensitive persistence details to clients.
- Preserve an existing API response convention when one exists.
- No response wrapper exists yet. Do not introduce or migrate everything to a complex `ApiResponse<T>` wrapper based only on preference; the team must approve the API contract.

## Pagination and filtering

- Use `Pageable`, `Page<T>`, `Sort`, and/or Specification for potentially large collections.
- Do not call `findAll()` and then paginate or filter large database results with Java streams when the database can perform the operation.
- Treat products, users, orders, invoices, and other potentially large approved lists consistently.
- Examples in this architecture do not approve a new endpoint or entity.

## Authorization and secrets

- Derive identity and role from the authenticated user/security context; never trust a client-submitted value such as `role = ADMIN`.
- Apply authorization and ownership checks at the backend boundary for every protected operation.
- Never store plaintext passwords. Use a team-approved strong password encoder; the algorithm/configuration is TBD.
- Never return or log passwords, password hashes, tokens, database passwords, API keys, or other secrets.
- Keep secrets outside source control and supply them through an approved external configuration mechanism.
- Do not invent JWT/session/token behavior before the team selects it.

## Utility classes

`util` is only for genuinely generic, stateless helpers. Do not create `VoucherBusinessUtil`, `OrderBusinessUtil`, or `InventoryBusinessUtil` to bypass the Service/domain layer. Utilities must not access Repositories or hide business rules.

## Code quality guardrails

Follow the shared rules in [`CODE_QUALITY_RULES.md`](CODE_QUALITY_RULES.md). The thresholds below trigger review; they are not reasons to create meaningless classes or helpers.

| Unit | Target | Review trigger | Strong refactor expectation |
| --- | ---: | ---: | ---: |
| Controller | `<= 150-200` lines | `> 250` lines | Review resource responsibility and leaked business logic |
| ServiceImpl | `<= 250-350` lines | `> 400` lines | `> 500` lines; `> 700` is normally a God Service |
| Service/business method | `<= 30-50` lines | `> 60` lines | `> 80` lines |

A longer business workflow may remain together when its sequence is cohesive and splitting would obscure it. Extract helpers by meaningful business step (for example, inventory validation), not as `step1`, `step2`, or one-line wrappers. When an edited file crosses a trigger, report `Large file detected: <file>` and assess the boundary rather than splitting automatically.

### Dependency and responsibility warnings

- A `ServiceImpl` constructor with roughly 10-15 dependencies is a strong responsibility smell. Review its business boundaries; do not hide the problem with a Service Locator, static helper, or lazy lookup.
- A large Controller may indicate unrelated endpoints or leaked business logic, but do not split one coherent resource merely to reduce line count.
- Order confirmation, payment, inventory, and voucher are separate concerns when their workflows become independently meaningful; do not place every checkout-related behavior in one God Service.

### Repository, lookup, and duplication rules

- Do not add `findProductByIdCustom()` when `findById()` satisfies the approved behavior, or `getAllProducts()` when the inherited `findAll()` is correct.
- Service interfaces, Repositories, Mappers, and DTOs must serve current call sites/use cases. Do not add unused operations or speculative variants such as `ProductFullDto`, `ProductBasicDto`, and `ProductSimpleDto` without distinct contracts.
- Use Repository `Optional` results for lookups where applicable and let the Service decide whether absence means not found, a business error, or an optional result.
- Do not return `null` for a contract that promises an object, swallow exceptions, or use `Optional` indiscriminately as Entity fields/properties.
- Do not copy the same voucher or other business validation across multiple `ServiceImpl` classes when one approved service/domain owner can enforce it. Do not combine rules that merely look similar but have different semantics.
- Review obvious N+1 access patterns and repeated queries in loops. Fix them with the simplest approved JPA mechanism; do not introduce an unapproved query/abstraction as speculative optimization.

### Backend clean-code gate

- Remove unused Service/Repository/Mapper methods, DTOs, classes, imports, commented-out code, abandoned endpoints, and debug output.
- Do not catch broad `Exception` and return `null` or false success. Use meaningful exceptions and centralized handling.
- Private helpers need a semantic name and must represent a meaningful step, reduce complexity, or provide real reuse.
- Search for an equivalent before creating a Service, Repository, DTO, Mapper, helper, Entity, or endpoint.

### Backend review checklist

- Does a Controller call a Repository/`EntityManager`, contain business logic, or inject an implementation?
- Does every Service interface method serve a current approved use case?
- Is a `ServiceImpl` beyond a size/dependency trigger or mixing independent responsibilities?
- Does a Repository duplicate an inherited JPA method or use an unnecessary `@Query`/native query?
- Could an obvious dynamic filter use Specification/Pageable instead of `findAll()` plus Java filtering?
- Is there an obvious N+1 query pattern?
- Does a Mapper calculate/authorize/query, or does an Entity leak into the API?
- Are any DTOs, classes, methods, imports, or endpoints unused/speculative?
- Are transaction boundaries, exception/null semantics, authorization, and inventory concurrency correct?
- Does behavior match `BUSINESS_RULES.md` without over-engineering or scope expansion?

## Avoid over-engineering

Prioritize correctness, maintainability, clear layering, and consistent business rules. Unless explicitly approved, do not add:

- DDD frameworks or elaborate domain infrastructure.
- CQRS or Event Sourcing.
- Message brokers or microservices.
- Generic repository abstractions over `JpaRepository`.
- Large generic `BaseService` hierarchies.

## Pending decisions and detected gaps

- Spring Data JPA and PostgreSQL dependencies are not yet present despite being the approved persistence architecture.
- PostgreSQL version, datasource configuration, ERD/schema, and migration tool are TBD.
- A dedicated Bean Validation dependency is not explicitly present; do not add one in a documentation-only task.
- Authentication mechanism and password encoder configuration are TBD.
- API response format and error payload schema are TBD.
- Transaction isolation/locking strategy for concurrent inventory deduction is TBD.
- Cancellation after confirmation and any stock-restoration behavior are not fully defined in `BUSINESS_RULES.md`.
