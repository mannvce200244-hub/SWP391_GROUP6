# Development Guide

Use this guide with the root [`AGENTS.md`](../AGENTS.md) and the nearest module-specific `AGENTS.md`.
Test selection and unavailable test capabilities are defined in
[`TESTING_STRATEGY.md`](TESTING_STRATEGY.md).

## Before changing code

1. Read [`PROJECT_SCOPE.md`](PROJECT_SCOPE.md) and [`BUSINESS_RULES.md`](BUSINESS_RULES.md).
2. Read [`CODE_QUALITY_RULES.md`](CODE_QUALITY_RULES.md).
3. Read [`ARCHITECTURE.md`](ARCHITECTURE.md) for architecture or integration work and [`DATABASE_GUIDE.md`](DATABASE_GUIDE.md) for persistence-related work.
4. Inspect the current implementation, module manifest, equivalent code, and local conventions.
5. Confirm the request is in scope; resolve requirement conflicts before changing behavior.
6. Identify the expected files/change budget, then make the smallest necessary change without unrelated refactoring or dependencies.

## Backend

Confirmed prerequisites and tooling:

- Java 21 (JDK 21 LTS).
- Checked-in Maven Wrapper (`mvnw` / `mvnw.cmd`).
- Spring Boot 4.1.1, Spring Data JPA, Hibernate 7, Jakarta Bean Validation, Spring Security.
- PostgreSQL 14+ (`m4n_db`).
- OpenAPI 3 / Swagger UI via `springdoc-openapi` (v2.8.5).

From `m4n-backend/`:

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

On a Unix-like shell, use `./mvnw` for the same Maven goals.

API Documentation endpoints when backend is running:
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`
- Health check: `http://localhost:8080/api/v1/health`

## Frontend

The repository uses npm, confirmed by `package-lock.json`. Node.js 20 LTS or newer is recommended.

From `m4n-frontend/`:

```powershell
npm ci
npm run dev
npm run lint
npm run build
```

These scripts are defined in `m4n-frontend/package.json`.

Environment variables:
- `VITE_API_BASE_URL`: Base URL for backend APIs (e.g. `http://localhost:8080/api/v1`). Template provided in `.env.example`.

Before frontend implementation, follow the sequence in
[`../m4n-frontend/AGENTS.md`](../m4n-frontend/AGENTS.md). Every changed UI must
pass [`UI_ACCEPTANCE_CHECKLIST.md`](UI_ACCEPTANCE_CHECKLIST.md), and every
client/server exchange must follow
[`API_CONTRACT_RULES.md`](API_CONTRACT_RULES.md).

## Database and Configuration

- **Database Name**: `m4n_db` (PostgreSQL)
- **Environment Variables**:
  - `DB_URL`: JDBC URL (default: `jdbc:postgresql://localhost:5432/m4n_db`)
  - `DB_USERNAME`: Database user (default: `postgres`)
  - `DB_PASSWORD`: Required database password; no source-code fallback.
  - `JWT_SECRET`: Required random signing secret of at least 32 UTF-8 bytes.
  - `SEED_DEV_ACCOUNTS`: Defaults to `false`; enable only for intentional local demo/test fixtures.
  - `M4N_DEFAULT_TEST_PASSWORD`: Required when enabling development fixtures; no default or password logging.
  - `CORS_ALLOWED_ORIGINS`: Allowed CORS origins (default: `http://localhost:5173`)
- JPA DDL Strategy: `update` is the current development configuration; a versioned migration/deployment strategy remains TBD.
- Before deploying the session invalidation repair, apply `docs/migrations/20261010_user_session_version.sql` to the configured PostgreSQL schema. It backfills existing users with authentication generation `0` and sets a non-null default. Existing JWTs without the generation claim are rejected; a valid refresh session can obtain a new JWT, otherwise re-login is required. Development JPA update also uses a `BIGINT DEFAULT 0` column definition; production deployment must apply the explicit SQL first.
- `m4n-backend/.env.example` documents actual keys. Spring Boot does not automatically load `.env`: export values into the process environment or use approved external configuration.
- Backend test resources include deterministic signing and password fixtures for tests only. PostgreSQL connection credentials remain external; run integration tests against a dedicated local test database when available.
- Normal startup does not create sample products/orders/users. Development fixtures are opt-in and preserve existing product media/barcodes on repeated startup.
- Startup initializes the canonical roles using normal data writes; it does not alter enum constraints. Apply the role/order-status migration before starting against an older schema. The deployment application role does not need `ALTER TABLE` privileges.
- Resend reset delivery and VNPay 2.1 sandbox are opt-in and require external provider credentials. With missing configuration reset delivery returns uniform unavailable and VNPay is disabled. See `EXTERNAL_INTEGRATIONS.md`; no provider keys are available for live verification.
- Initial SUPER_ADMIN provisioning is opt-in with external credentials and never overwrites an existing privileged account. Disable the bootstrap flag and remove its password from deployment configuration after initial setup.
- Invoice export embeds a Unicode font. Set `INVOICE_PDF_FONT_PATH` to a readable, licensed TTF with Vietnamese glyphs on the deployment server. Without it common system fonts are tried; a missing font fails clearly instead of corrupting text.
- Shipping charging defaults disabled. Configure product billable weights/surcharges and persisted shipping settings in `/admin/pricing` before enabling. Existing order/invoice snapshots are unchanged by new settings.
- New feature SQL files in `docs/migrations/` are reviewable PostgreSQL deployment scripts. Follow [`migrations/README.md`](migrations/README.md) for order and checks before production startup with `ddl-auto=validate`; `ddl-auto=update` remains for development only. A packaged migration engine is not selected or added.
- Never commit secrets into source control.

## Verification

- Backend change: run the relevant tests and, when practical, `mvnw test`.
- Frontend change: run `npm run lint` and `npm run build`; add/run relevant tests only after a testing approach is approved and present.
- Documentation change: verify links, names, source-of-truth ownership, and consistency with scope and business rules.
- Report commands not run, failures, and unresolved TBD items. Never claim a check passed unless it was run.

## Change review checklist

- The change maps to an approved requirement.
- No business rule changed silently.
- Backend remains authoritative for protected behavior.
- Concurrent inventory changes cannot produce negative stock.
- No dependency, framework, version, status, entity, or integration was invented.
- No unused, debug, commented-out, duplicate, or speculative code introduced by the change remains.
- The actual diff was reviewed for suspicious blast radius and applicable file-size warnings.
- Documentation is updated only where its source of truth is affected.
