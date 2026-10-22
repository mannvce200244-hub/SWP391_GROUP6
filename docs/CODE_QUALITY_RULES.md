# M4N Code Quality Rules

This file is the source of truth for engineering quality across frontend and backend. It does not override [`PROJECT_SCOPE.md`](PROJECT_SCOPE.md), [`BUSINESS_RULES.md`](BUSINESS_RULES.md), security/data-integrity rules, or the approved architecture documents.

## Priorities

Apply engineering judgment in this order:

1. Correctness.
2. Approved business requirements and rules.
3. Security and data integrity.
4. Readability.
5. Maintainability.
6. Simplicity.
7. Consistency.
8. Testability.

Do not optimize for clever code, architecture ceremony, abstraction count, pattern count, file count, or unnecessary “enterprise style”.

**Write the smallest correct solution that satisfies the approved requirement.**

Implement the full approved requirement, but nothing beyond it. Do not create future behavior in anticipation of a later request.

## Conflict priority

When guidelines differ, authority is ordered as follows:

1. Approved business requirement.
2. `BUSINESS_RULES.md`.
3. Security and data integrity.
4. Existing approved architecture.
5. This code quality guide.
6. External design/coding skills.

Do not use this order to hide a contradiction. Report conflicting project documents to the developer before changing behavior.

## No speculative code

Create code only for a current approved use case. Do not create a future Service, endpoint, DTO, component, hook, utility, Repository, Entity, framework, or generic abstraction “for later”.

**Concrete first, abstraction after evidence.**

Extract or generalize only when there is a current reason such as actual reuse, meaningful behavior encapsulation, isolated complexity/state/side effects, a clear semantic boundary, improved testability, or reduced coupling.

Before creating any Component, Service, Repository, DTO, Mapper, Hook, or Utility, search the repository for an equivalent and inspect the local naming/structure convention.

## Zero dead code

Do not leave:

- Unused imports, variables, parameters (unless required by a contract), functions, props, state, constants, methods, classes, DTOs, components, or hooks.
- Unused Service, Repository, or Mapper methods.
- Unreachable branches or abandoned endpoints.
- Commented-out implementations or “maybe later” code.
- Temporary `console.log`, `console.debug`, `System.out.println`, breakpoints, debug flags, mock shortcuts, or temporary TODOs.

Delete obsolete code. Version control preserves history; comments are not an archive.

Do not suppress lint/compiler warnings merely to make a check pass. A narrow suppression requires a documented reason and no clearer fix.

## Responsibility and abstraction

Every module, class, component, hook, and function should have one primary responsibility explainable in one sentence.

Line count is a signal, not a target. Do not split code into meaningless wrappers or helpers only to satisfy a threshold. Extract when a named boundary improves comprehension, ownership, reuse, side-effect isolation, or testing.

Do not create architecture theater such as `usecase`, `ports`, `adapters`, `facade`, `manager`, `coordinator`, `processor`, or `handler` layers without an approved, concrete need.

Do not create `BaseController`, `BaseService`, `BaseServiceImpl`, `BaseRepository`, `BaseMapper`, `UniversalForm`, `UniversalTable`, `UniversalModal`, `DynamicEverything`, or similar catch-all abstractions before proven shared behavior exists.

Detailed size thresholds and stack-specific boundaries live in:

- [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md)
- [`BACKEND_ARCHITECTURE.md`](BACKEND_ARCHITECTURE.md)

## Duplication and reuse

- Remove duplicated logic when the copies have the same semantics and one clear owner.
- Do not genericize two code blocks merely because they look similar; different business meaning may require separate implementations.
- Do not promote a component/helper to shared status because it might be reused later.
- If one business rule appears in multiple places, move it to its appropriate authoritative service/domain boundary rather than copying it.
- Do not hide duplication behind a highly configurable abstraction with many modes or boolean flags.

## Naming and comments

- Names state intent: `confirmOrder`, `validateInventoryAvailability`, and `calculateVoucherDiscount`, not `processData`, `handleStuff`, or `doLogic`.
- Comments explain **why**, constraints, tradeoffs, or non-obvious business behavior; they do not narrate obvious syntax.
- Business-rule-sensitive code may reference the applicable BR ID.
- Replace repeated domain/configuration literals with an appropriate existing constant/enum/config when they represent one shared concept.
- Do not create constants for obvious one-use literals such as `ZERO = 0`.
- Do not invent a new status, configuration value, limit, or business constant because a clean-code rule suggests extracting one.

## Error and null handling

- Never swallow an error, catch a broad exception and return `null`, or convert a failure into false success.
- Handle errors at the boundary that can add meaning or recovery; otherwise let the approved centralized mechanism handle them.
- Do not return `null` where the contract promises a value. Define absence/error semantics explicitly.
- Backend lookup behavior and Java `Optional` rules are detailed in `BACKEND_ARCHITECTURE.md`.
- Frontend errors require user-facing loading/error/recovery behavior as detailed in `UI_UX_RULES.md`.

## No premature optimization

Do not add `memo`, `useMemo`, `useCallback`, caching, custom queries, native SQL, prefetching, virtualization, or new infrastructure merely because it might be faster. Use a specific performance reason, evidence, or an obvious scale requirement.

Do not ignore obvious correctness/performance hazards such as request waterfalls, unbounded list loading, N+1 persistence access, filtering an entire database result in memory, expensive work on each keystroke, or repeated queries in loops. Address them with the simplest mechanism already supported by the approved architecture.

## Change budget and scope control

Before implementation, identify the files expected to change and the smallest safe behavior boundary.

- If a small request appears to require a broad cross-project change, stop and review the cause before editing.
- Do not rewrite a form, change libraries, reorganize folders, redesign UI, or refactor many unrelated files for a local validation or bug-fix request.
- If a natural refactor is outside the requested scope, record it as technical debt rather than silently expanding the change.
- Review for suspicious blast radius; no fixed file count replaces judgment.

## Dependency discipline

- Use existing language/framework capabilities and approved dependencies when they clearly satisfy the requirement.
- Do not add a second library for a capability already standardized in the repository.
- Do not install or modify a dependency unless the task explicitly permits it.
- When a new dependency appears necessary, report the problem, proposed dependency, why current capabilities are insufficient, and the tradeoffs. Wait for approval before adding it.

## Testability

- Put behavior behind boundaries that can be exercised without unrelated infrastructure.
- Do not bury business logic in Controllers, JSX, Mappers, Entity lifecycle callbacks, or static utilities when that makes behavior hard to test.
- Keep side effects explicit and isolate external systems at the appropriate architecture boundary.
- Test the approved behavior and meaningful invalid cases, not private implementation details.

## Large-file and God-object warnings

When an edited file crosses a threshold in the applicable architecture guide, report:

```text
Large file detected: <file>
```

Then assess whether it has a natural split, whether the split improves readability, and whether that refactor is within scope. Never split automatically just to reduce line count.

Treat a file/class/component with many unrelated dependencies, state values, endpoints, handlers, conditions, or business concerns as a potential God Object. Refactor when a natural boundary exists and the task permits it; otherwise report focused technical debt.

## M4N critical invariants

Never compromise these rules for code convenience:

- Online Place Order does not deduct/reserve inventory.
- Online inventory decreases only after successful Staff/Admin confirmation.
- POS inventory decreases after successful payment confirmation.
- Customer self-cancellation is limited to `PENDING_CONFIRMATION`.
- Product review requires the applicable order to be `COMPLETED`.
- Inventory never becomes negative.
- Frontend previews and permissions never override backend authority.

[`BUSINESS_RULES.md`](BUSINESS_RULES.md) remains the detailed authority.

## Task execution protocol

Every coding task follows:

```text
UNDERSTAND -> INSPECT -> PLAN -> IMPLEMENT -> VERIFY -> CLEAN -> REVIEW -> REPORT
```

1. **Understand:** read the request and applicable source-of-truth documents.
2. **Inspect:** search existing implementation, equivalents, tests, and conventions.
3. **Plan:** identify the smallest change, expected files, business flow, risks, and verification.
4. **Implement:** make only the approved change.
5. **Verify:** run relevant lint/build/compile/tests using existing tooling.
6. **Clean:** remove unused, debug, commented-out, speculative, and duplicate code introduced by the change.
7. **Review:** inspect the diff for scope, architecture, security, business behavior, file size, and dependencies.
8. **Report:** list files changed, checks run/results, assumptions, TBD items, and any technical debt left because it was out of scope.

For a complex Order Confirmation, Checkout, POS, or Inventory feature, describe this flow before implementation:

```text
Input -> Validation -> Business operation -> Persistence/API state -> Response/UI result
```

## Verification gates

### Frontend

- Run `npm run lint` and `npm run build`.
- Run tests only when a project test command/framework exists.
- Leave no unused imports/state/props/components, temporary console output, or build errors.
- Do not weaken ESLint configuration to pass a change.

### Backend

- Compile and run the existing Maven tests.
- Run the relevant application-context/integration check when present and applicable.
- Leave no broken imports, debug output, unused classes/methods, or compile errors.
- Do not weaken build/test configuration to pass a change.

If a check cannot run, report exactly which check and why. Never claim a check passed without running it.

## Post-implementation self-review

Before completion, inspect the actual diff and ask:

1. Did I create any unnecessary file, abstraction, method, prop, state, import, or dependency?
2. Did I duplicate logic or create two concepts with the same owner?
3. Did any file cross a size threshold or become a God Object?
4. Did I hide business logic in the wrong layer?
5. Did I add an unrequested feature, future code, status, field, route, endpoint, or workflow?
6. Did I change a business rule or security/data-integrity behavior?
7. Is every changed behavior testable and verified with existing tooling?
8. Does the diff remain within the expected change budget?

Clean up any introduced violation before reporting completion.

## Definition of Done

A coding task is not done while it has a failing build/lint/compile/test, unused or speculative code, temporary TODO/debug output, unreviewed oversized files, a God Object introduced by the change, incorrect layer dependencies, missing applicable validation/UI states, an unapproved dependency, business-rule drift, or out-of-scope changes.

A task is done when the approved requirement is fully satisfied by the smallest clear solution, architecture and business rules are preserved, code has explicit responsibilities, dead/speculative code is absent, relevant existing checks pass (or blockers are truthfully reported), and the final diff stays within scope.
