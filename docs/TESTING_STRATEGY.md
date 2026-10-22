# M4N Testing Strategy

This document is the source of truth for test selection and verification. It
records the current repository capabilities without selecting a new framework
or inventing test infrastructure.

## Current testing baseline

| Area | Repository evidence | Required command | Status |
| --- | --- | --- | --- |
| Backend | Maven Wrapper, Spring Boot test starters, one application context test | `m4n-backend\mvnw.cmd test` | AVAILABLE |
| Frontend static checks | ESLint and Vite build scripts | `npm run lint`, `npm run build` from `m4n-frontend/` | AVAILABLE |
| Frontend automated tests | No project test script or test framework | None | TBD — team decision required |
| End-to-end tests | No runner, configuration, or command | None | TBD — team decision required |
| Coverage thresholds | No approved threshold/tool | None | TBD — team decision required |

Dependency files inside `node_modules/` are not project tests and do not prove
M4N behavior.

## Test routing

- Documentation-only change: validate links, names, ownership, routing, and
  consistency; application test commands are optional unless implementation or
  configuration was touched.
- Backend change: run the narrowest relevant existing test first, then the full
  Maven test suite when practical.
- Frontend change: run lint and build. Run frontend tests only after a project
  test command/framework has been explicitly approved and configured.
- API integration: verify both sides agree with `API_CONTRACT_RULES.md`; test
  safe success and applicable validation/authentication/authorization/conflict/
  failure behavior supported by the approved contract.
- UI/form change: complete `UI_ACCEPTANCE_CHECKLIST.md` in addition to available
  automated checks.

## Behavior that requires authoritative backend tests

When implemented or changed, inventory, order confirmation/cancellation,
payment, voucher calculation, authorization/ownership, review eligibility, and
revenue behavior require tests at the backend boundary where those decisions
are authoritative. Include valid and invalid paths and applicable concurrency/
transaction behavior. Frontend tests cannot replace these checks.

## Test quality rules

- Test approved observable behavior, not speculative features or private
  implementation details.
- A test must be deterministic, isolated at the appropriate boundary, readable,
  and capable of failing for the defect it protects against.
- Reuse existing fixtures/builders only when their semantics match. Do not create
  a broad test abstraction for a single simple case.
- Do not hide failures by weakening assertions, disabling tests, skipping suites,
  changing production behavior only for tests, or suppressing lint/compiler errors.
- Do not use production secrets or real personal data. Do not call an external
  paid/production service unless an approved integration-test environment and
  explicit task require it.
- Keep test data minimal and make business-rule intent visible in the test name.
- Report flaky, blocked, skipped, or unavailable checks accurately; never claim
  a check ran when it did not.

## Completion record

Report the commands run, their result, the behaviors covered, and any missing
test capability. Adding a frontend/E2E framework, coverage tool, database
container strategy, CI test matrix, or threshold remains an explicit team
decision rather than an automatic response to a testing task.
