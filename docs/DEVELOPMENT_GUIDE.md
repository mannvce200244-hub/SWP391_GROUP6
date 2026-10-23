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
  - `DB_PASSWORD`: Database password (default: `postgres`)
  - `CORS_ALLOWED_ORIGINS`: Allowed CORS origins (default: `http://localhost:5173`)
- JPA DDL Strategy: `update` (safe for development).
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
