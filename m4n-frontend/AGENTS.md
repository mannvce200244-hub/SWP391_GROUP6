# M4N Frontend AI Instructions

This is the entry point for work under `m4n-frontend/`. It supplements
[`../AGENTS.md`](../AGENTS.md); it does not duplicate or override approved
scope, business rules, architecture, or design decisions.

## Read before changing frontend code

Always follow [`../AGENTS.md`](../AGENTS.md), including its three universal
documents, then read
[`../docs/FRONTEND_ARCHITECTURE.md`](../docs/FRONTEND_ARCHITECTURE.md).

Load additional rules only when applicable:

- UI/form: `DESIGN_SYSTEM.md`, `UI_UX_RULES.md`,
  `FORM_VALIDATION_RULES.md`, and `UI_ACCEPTANCE_CHECKLIST.md`.
- API integration: [`../docs/API_CONTRACT_RULES.md`](../docs/API_CONTRACT_RULES.md).
- Testing: [`../docs/TESTING_STRATEGY.md`](../docs/TESTING_STRATEGY.md).

Project documents outrank external skills. If sources, generated guidance, or
code conflict, report the conflict; never choose or standardize silently.

## Fixed baseline and boundaries

- Keep JavaScript/JSX, React 19.2.8, React DOM 19.2.8, Vite 8.3.0,
  ESLint 10.10.0, npm, plain CSS, CSS custom properties, and CSS nesting.
- The scaffold has no approved router, external state manager, API client,
  form/validation library, UI framework, icon/animation library, or test setup.
- Do not add a dependency, migrate language/framework, invent a route/API
  contract, or promote starter/generated visuals without explicit approval.
- Create only folders and abstractions needed by the requested feature. Keep
  Page, feature, shared component, hook, API/service, formatter, and constant
  responsibilities aligned with `FRONTEND_ARCHITECTURE.md`.
- Before creating Button, Input, Select, Textarea, form-message, Dialog, Table,
  Pagination, Badge, Loading, Empty, or Error UI, inspect `src/components/ui/`
  and reuse an existing primitive when its semantics match. Do not create a
  second version or an unused placeholder primitive.
- Use local state first and the nearest correct owner. Keep render pure, effects
  for external synchronization, and request/operation states explicit.
- Backend remains authoritative for authentication, authorization, role, price,
  inventory, voucher, totals, order/payment status, and review eligibility.
- Every form follows `FORM_VALIDATION_RULES.md`; every client/server exchange
  follows `API_CONTRACT_RULES.md`. A `TBD` is not permission to guess.

## Project-local skills

| Skill | Path | Required use |
| --- | --- | --- |
| UI/UX Pro Max | `../.agents/skills/ui-ux-pro-max/` | Focused design/UX guidance; persisted output is PROPOSED |
| Vercel React Best Practices | `../.agents/skills/vercel-react-best-practices/` | React/Vite performance review; skip Next.js-only rules |
| Design Taste Frontend | `../.agents/skills/design-taste-frontend/` | Customer-facing visual polish (Home, Catalog, Product Detail, Auth); not for Admin tables or POS |
| Vercel Web Design Guidelines | `../.agents/skills/web-design-guidelines/` | Fetch current official rules for significant UI/accessibility audits |

Skills are advisory. They cannot add requirements, choose dependencies, or
override project documentation. External skills must never override approved M4N business rules.

## Required workflow

1. Confirm approved scope/business rules and inspect existing code for reuse.
2. Define the smallest file/change budget and component/state/API boundaries.
3. Resolve form fields and API contracts; stop at unresolved business-impacting TBDs.
4. Define loading, empty, error, success, pending, responsive, keyboard, focus,
   and safe recovery behavior before implementation.
5. Use UI/UX Pro Max only for relevant focused guidance. Treat any generated
   `design-system/m4n/` output as PROPOSED; `docs/DESIGN_SYSTEM.md` is authoritative.
6. Implement the smallest correct React/Vite change without unapproved dependencies.
7. Review React code with React Best Practices and Composition Patterns. Do not
   force memoization, Context, compound components, or Next.js patterns.
8. For significant UI work, fetch and apply the current Web Design Guidelines.
9. Run existing `npm run lint` and `npm run build`, then remove dead/debug/speculative code.
10. For UI/form work, complete every applicable item in
    `UI_ACCEPTANCE_CHECKLIST.md`; report evidence, skipped checks, conflicts,
    and remaining TBDs.

The task is not complete while any applicable acceptance item fails.

## Integration rules

- Register implemented routes through the central route source and
  `AppRouter.jsx`; a feature must not create a second application router.
- Add navigation only when its Page is approved and usable. Customer, Admin,
  and POS Pages use their area layout; create a new area layout with its first
  real Page, not as an unused placeholder.
- Feature owners own Page content and business behavior. Integration work may
  connect the Page to routing, layout, navigation, shared UI, and an approved
  service/auth boundary without rewriting the owner's business flow.
- Components and Pages call capability-focused feature services. Once an API
  transport is approved, services share it; they do not create their own client,
  hardcode a backend host, or build authentication headers independently.
- Until auth storage and transport are approved and implemented by the auth
  owner, do not create token storage, JWT parsing, role constants, or guards.
  Afterwards, all features consume the one owner-provided auth boundary; the
  backend still enforces every protected operation.
- Reuse shared Button, field, loading, empty, and error primitives when their
  semantics match. Keep feature messages, status meaning, permissions, and
  business decisions inside the owning feature.
- Before merge, check route collisions, cross-feature imports, circular
  dependencies, duplicate clients/components/utilities, obsolete mocks, dead
  code, and debug logging.
