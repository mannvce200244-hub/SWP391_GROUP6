# M4N Frontend Architecture

This document is the source of truth for frontend structure and technical boundaries. AI behavior is governed by [`../m4n-frontend/AGENTS.md`](../m4n-frontend/AGENTS.md); business behavior remains governed by [`BUSINESS_RULES.md`](BUSINESS_RULES.md). Cross-module payload rules are in [`API_CONTRACT_RULES.md`](API_CONTRACT_RULES.md), and changed UI must pass [`UI_ACCEPTANCE_CHECKLIST.md`](UI_ACCEPTANCE_CHECKLIST.md).

## Inspected repository baseline

| Concern | Current repository state |
| --- | --- |
| Language | JavaScript with JSX; no TypeScript source/configuration |
| Framework | React 19.2.8 and React DOM 19.2.8 |
| Build tool | Vite 8.3.0 |
| Linting | ESLint 10.10.0 with React Hooks and React Refresh plugins |
| Package manager | npm with `package-lock.json` |
| Node.js | No project version is pinned; Vite compatibility constrains usable versions, but the team-selected version is TBD |
| Runtime dependencies | React and React DOM only |
| Development dependencies | Vite React plugin, ESLint core/config/plugins, React type packages, and browser globals package |
| Routing | Small native History API adapter; provisional while a routing library/route map remains TBD |
| State management | No external library configured |
| API client/data fetching | Product service boundary with an empty adapter; endpoint/config/error contracts remain TBD |
| Forms/validation | No library configured |
| Component/UI library | Local shared React primitives; no external UI library |
| Frontend testing | No test script or testing library configured |
| Styling | Tailwind CSS v4 with `@tailwindcss/vite` plugin and semantic theme tokens in `src/styles/global.css` |
| Environment/API configuration | None configured |
| Current implementation | Customer layout, Home, Product list/detail states, and shared UI primitives |

Do not infer an approved library or architecture from a common React setup. Missing choices are team decisions.

## Required source structure

The current starter has no feature structure. Add only the folders needed by an approved feature, following this simple convention:

```text
src/
├── api/
├── assets/
├── components/
│   ├── common/
│   └── ui/
├── features/
├── hooks/
├── layouts/
├── pages/
├── routes/
├── services/
├── utils/
├── constants/
└── styles/
```

Do not create empty folders merely to match the diagram. Do not replace this with a more complex architecture unless the team approves it.

## Responsibility boundaries

### Components

- Reusable presentation and interaction units with one clear responsibility.
- Shared primitives such as Button, Input, Modal, Pagination, Table, Loading, EmptyState, and ErrorState belong in shared component areas only when more than one context benefits.
- Feature-specific components stay near their feature rather than becoming global prematurely.
- Use PascalCase for components and clear event names such as `handleSubmit`, `handleQuantityChange`, and `handleRemoveItem`.
- Avoid very large components, duplicated rendering/formatting/API logic, deeply nested ternaries, and complex business logic inside JSX.
- Do not split components so finely that navigation and readability get worse. Do not create a generic component with many unrelated props or a large set of boolean modes.

### Shared UI convention

- Inspect `src/components/ui/` before creating Button, Input, Select, Textarea,
  form-message, Dialog, Table, Pagination, Badge, Loading, Empty, or Error UI.
- Current reusable primitives are `Button`, `FormField`, `Input`, `Select`,
  `LoadingState`, `EmptyState`, and `ErrorState`.
- Keep native element attributes available through the wrapper. Shared fields
  own label/helper/error presentation, not form state or feature validation.
- Prefer `children` and a small semantic variant API over boolean-prop
  combinations. Do not create compound/context APIs for simple controls.
- A missing primitive is created with its first approved use case, not as a
  placeholder. The component inventory and unresolved visual decisions are
  recorded in `DESIGN_SYSTEM.md`.

### Features

`features/` groups approved business-oriented UI such as auth, product, cart, checkout, order, inventory, POS, voucher, review, or dashboard only when that feature is requested. An example directory name does not authorize implementation.

Keep feature-specific components, hooks, and transformations close to their owning feature when that improves cohesion. Shared behavior should move out only after genuine reuse is established.

### Pages

- A Page is a route-level composition of layouts, features, and components.
- A Page coordinates screen state; it must not become one component containing all API calls, validation, data transformations, and UI.
- Every data-driven Page explicitly handles loading, empty, error, and success states.
- Every mutation flow handles pending, success, and failure states.

### Layouts and routes

- Layouts own shared page chrome and composition, not feature business logic.
- The current Customer routes use the provisional native History API adapter.
  The routing library and complete route map remain **TBD — team decision
  required**.
- `src/routes/customerRoutes.js` is the single source for implemented Customer
  path values, path builders, matching helpers, and the native route-change
  event. `AppRouter.jsx` is the single registration point for route-level Page
  composition.
- Do not install a router or invent route paths. Add a route only with its
  approved, usable Page; then update the central route source, router, relevant
  layout navigation, and this implemented-route record together.
- Feature owners own Page content and business flows. The Frontend Lead owns
  route registration, layout composition, navigation consistency, and shared
  integration boundaries.
- URL-worthy state such as meaningful filters, tabs, or pagination should be linkable when the chosen router supports it and the feature requires it.

Current implemented route record:

| Area | Path | Page owner | Layout | Status |
| --- | --- | --- | --- | --- |
| Customer | `/` | Frontend Lead | `CustomerLayout` | IMPLEMENTED |
| Customer | `/products` | Frontend Lead / Customer Catalog | `CustomerLayout` | IMPLEMENTED |
| Customer | `/products/:id` | Frontend Lead / Customer Catalog | `CustomerLayout` | IMPLEMENTED |

`CustomerLayout` is the only layout with an approved current use case. Create
`AdminLayout` and `PosLayout` with the first approved Admin and POS Pages rather
than leaving unused shells. Each area layout owns its shared chrome and
navigation; a feature Page must not render a competing Header, Sidebar, or
Footer. Customer/Admin/POS hierarchy examples are proposals until their owning
features and concrete paths are approved.

Navigation exposes only implemented routes. Unknown frontend paths use the
global `NotFoundPage`; a missing resource returned inside an implemented Page
uses that feature's empty/not-found state instead.

## API and service layer

- Follow [`API_CONTRACT_RULES.md`](API_CONTRACT_RULES.md); it records approved boundaries without inventing endpoints or DTOs.
- Centralize endpoint paths, request construction, response/error normalization, and API configuration in `api/` and/or `services/` according to the first approved implementation convention.
- Components and Pages must not scatter hardcoded `fetch`/client calls or URLs.
- Never hardcode `http://localhost:8080` in a component.
- Read the base API URL from the approved Vite environment/configuration mechanism once it is defined.
- Do not expose secrets through `import.meta.env`; frontend environment values are client-visible.
- Distinguish validation (400), authentication (401), permission (403), missing resource (404), conflict (409 when used by the backend), server (5xx), and network failures where the backend contract supports those distinctions.
- Do not display unsafe raw backend messages, stack traces, or implementation details.

The API client, base URL variable name, response/error shape, authentication transport, and retry policy are **TBD — team decision required**.

Until those decisions and the first business endpoint exist, the repository
must not contain a placeholder global client, guessed environment key, token
interceptor, or status mapper. The current Product flow remains
`Page -> productService -> productCatalogAdapter`; future feature Pages follow
`Page/hook -> feature service -> shared client` after the shared transport is
approved. Keep services capability-focused rather than creating one system-wide
service containing unrelated methods.

### Authentication and route-guard integration

- Auth feature ownership remains with its assigned feature owner. The Frontend
  Lead integrates the owner-provided auth state contract rather than duplicating
  login, logout, token, or storage logic.
- When an auth implementation exists, expose one focused access boundary for
  current user, authenticated state, backend-provided role, and logout. Feature
  code must not read `localStorage`, `sessionStorage`, cookies, or JWT payloads
  directly.
- Add a route guard only when an approved protected Page and auth contract need
  it. One guard may accept allowed roles; do not create speculative
  `PublicRoute`, `ProtectedRoute`, and `RoleGuard` layers without distinct uses.
- Keep role values in the auth contract boundary when implemented. Do not
  scatter role literals or define frontend business transitions.
- An unauthenticated result and a forbidden result are different states: `401`
  follows the approved re-authentication flow, while `403` renders an access
  denied experience and must not automatically log out the user. Exact behavior
  remains TBD until the auth/API contract is approved.
- A frontend guard is navigation UX only. The backend remains authoritative for
  authentication, role, ownership, and every protected operation.

### Feature integration handoff

Before registering a member-owned frontend module, verify all of the following:

1. The Page and capability are approved, usable, and owned.
2. The concrete path, area layout, navigation visibility, and access needs are
   agreed; no unfinished menu item is exposed.
3. API path/method, DTOs, safe errors, auth transport, role/ownership,
   pagination/filtering, and money/date semantics needed by the feature are
   approved in the cross-module contract.
4. The Page reuses shared fields, buttons, and loading/empty/error states where
   their semantics match, while feature-specific meaning stays in the feature.
5. Feature internals are not imported across feature boundaries. Promote only a
   genuinely reusable, stable abstraction to shared code.
6. Route conflicts, duplicate clients/components/utilities, circular imports,
   mocks, dead code, and debug logging are removed before merge.
7. Frontend lint/build and the applicable UI acceptance checks pass.

## State ownership

Use the narrowest owner that needs the state:

1. Local component state for isolated UI.
2. Lift state to the nearest common owner when siblings share it.
3. Use focused custom hooks for reusable stateful behavior.
4. Add external state management only after explicit team approval.

No Redux, Zustand, TanStack Query, or equivalent is currently installed. Use React built-in patterns for current needs unless the team approves a dependency. Do not persist passwords or sensitive authentication material in `localStorage` or `sessionStorage`.

## React implementation rules

- Keep render logic pure and derive values during render when possible instead of mirroring them through effects.
- Put user-triggered work in event handlers; use effects only to synchronize with external systems.
- Clean up subscriptions, timers, and global event listeners.
- Use functional state updates when the next value depends on the previous value.
- Do not define component types inside other components.
- Avoid sequential request waterfalls when independent requests can safely run in parallel.
- Keep controlled inputs inexpensive per keystroke. Do not add memoization without a measured or clear rendering benefit.
- Import only what is needed and avoid pulling a large module into the initial bundle for a small use case.
- Consider built-in lazy loading/code splitting for genuinely heavy routes or components when the approved implementation needs it; do not add a library merely for this.
- Use stable domain identifiers as list keys; do not use array indexes when items can reorder or be removed.

These are React/Vite rules. Do not apply Next.js-only recommendations such as Server Components, `next/image`, `next/font`, Server Actions, or `next/dynamic`.

### Composition review

- Prefer explicit, one-purpose components over a universal component controlled by many boolean props.
- Lift state only to the nearest owner that coordinates it; do not use Context merely to avoid passing one or two clear props.
- Review prop drilling, duplicated ownership, impossible prop combinations, and unclear component APIs before extracting an abstraction.
- Compound components are appropriate only when a reusable complex UI has related subparts, shared state, and multiple legitimate compositions.
- Prefer normal `children` composition and explicit variants when they make the API clearer; do not add render props, providers, or compound APIs mechanically.
- React 19 guidance applies only when it fits the existing JavaScript/Vite code and current React APIs. It never authorizes a framework or dependency change.

## Frontend/backend boundary

The frontend may provide previews and interaction guidance but is not authoritative for:

- User role or authorization.
- Product price or inventory.
- Voucher validity, discount, or final amount.
- Order or payment status.
- Review eligibility.

The backend validates and recalculates all authoritative values. UI permissions hide or show available actions for usability, but they never replace backend enforcement.

Specific M4N constraints:

- Online Place Order does not reserve or deduct inventory.
- Do not imply that stock is guaranteed before Staff/Admin confirmation.
- Customer self-cancel is available only for `PENDING_CONFIRMATION`; do not invent other order statuses.
- Show Review only when backend data confirms a completed qualifying purchase.
- POS payment/inventory mutation occurs on the backend, never in frontend state as authority.

## Formatting and shared utilities

- Centralize repeated currency, date/time, and domain display formatting.
- Use `Intl.NumberFormat` for approved currency formatting and `Intl.DateTimeFormat` for dates/times.
- Do not assume a business timezone, locale, or currency that project documentation has not approved. The request mentions VND conditionally; the official currency decision remains TBD.
- Keep `utils/` generic and stateless. Do not hide cart, voucher, order, inventory, or authorization business rules there.

## Code quality guardrails

Follow the shared rules in [`CODE_QUALITY_RULES.md`](CODE_QUALITY_RULES.md). The thresholds below are review signals, not quotas.

| Unit | Target | Review trigger | Strong refactor expectation |
| --- | ---: | ---: | ---: |
| Route Page | `<= 250` lines | `> 300` lines | `> 400` lines; `> 700` requires exceptional justification |
| Reusable Component | `<= 150-200` lines | `> 250` lines | `> 300` lines |
| Custom Hook | `<= 100-150` lines | `> 200` lines | Review state/side-effect responsibility |
| Function | `<= 30-50` lines | `> 60` lines | `> 80` lines |

Do not split code into meaningless files/helpers to satisfy these ranges. A Page beyond 700 lines requires exceptional justification; a 1,000-line Page is an architecture failure. When an edited file crosses a trigger, report `Large file detected: <file>` and assess natural boundaries.

### Page and feature boundaries

- A Page may read route parameters, compose major features, coordinate page-level state, call an approved hook/service, and render the overall layout.
- Move out a block when it has its own responsibility, meaningful state/interaction, complex conditional UI, real reuse, a semantic name, or useful independent tests.
- Do not extract a small one-use JSX wrapper merely to shorten a Page.
- A feature may contain its own `components`, `hooks`, `services`, or `utils` only when its current size requires them. Do not give every small feature a full directory tree.
- Move a component into `components/common` after it is used by at least two features or when it is an approved system primitive such as Button/Input/Modal/Table.

### Purity, state, and effects

- Never mutate props/state, call an API, change a global variable, or perform another side effect during render.
- Store only state that must persist between renders. Derive values such as a cart subtotal from current inputs when possible instead of maintaining synchronized duplicate state.
- Every significant `useEffect` must identify the external system or lifecycle behavior it synchronizes. Do not use effects for event handling, render transformations, or avoidable state chains.
- A custom hook encapsulates meaningful reusable React stateful behavior. Do not create one to rename a short service call, hide a five-line function, evade a file-size warning, or speculate about reuse.

### Frontend clean-code gate

- Avoid deeply nested ternaries, giant conditional JSX, repeated magic values/strings, duplicate formatters/API calls, and components with 20-30 unrelated props.
- Avoid boolean-prop explosion. Prefer a component with one semantic purpose over a universal component with many behavior switches.
- Remove unused imports, variables, state, props, components, hooks, and commented-out code.
- Production code must not retain `console.log` or `console.debug`. `console.error` is not a substitute for user-facing error handling.
- Do not add arbitrary `eslint-disable` comments or weaken lint rules merely to pass.

### Frontend review checklist

- Is the Page or component beyond a size trigger, and was the reason reviewed?
- Does every component/hook have a clear responsibility without being split too finely?
- Are API calls and base configuration in the approved API/service boundary?
- Is state minimal, with no redundant or manually synchronized derived state?
- Does every effect synchronize an external system and clean up when needed?
- Is there duplicated UI/API/formatting logic with the same semantics?
- Are all imports, components, hooks, props, and state used?
- Do forms follow `FORM_VALIDATION_RULES.md`?
- Are loading, error, empty, success, responsive, and accessibility states covered?
- Does frontend behavior preserve backend authority and M4N business rules?
- Did the change avoid speculative code, over-engineering, and unapproved dependencies?

## Dependency discipline

Do not add routing, state, form, validation, CSS, UI, animation, icon, date, or data-fetching libraries without explicit team approval. External design/performance skills may suggest tools, but they cannot authorize installation or override this architecture.

## Project-local frontend skills

These four checked-in project tools are approved for guidance:

| Skill | Location | Role |
| --- | --- | --- |
| UI/UX Pro Max | `../.agents/skills/ui-ux-pro-max/` | Design intelligence and focused UI/UX checks; generated design output is PROPOSED |
| Vercel React Best Practices | `../.agents/skills/react-best-practices/` | React/Vite performance review; exclude Next.js-only advice |
| Vercel Web Design Guidelines | `../.agents/skills/web-design-guidelines/` | Current web accessibility, interaction, responsive, and quality audit |
| Vercel Composition Patterns | `../.agents/skills/composition-patterns/` | Component API, ownership, and composition review |

Skills cannot change requirements, approve design values, or install runtime
dependencies. Taste and overlapping aesthetic skills are not part of the
mandatory project-local set.

## Pending decisions

- Routing library and route map.
- API client, base URL environment key, API/error contract, and authentication transport.
- Shared/global state approach if React built-ins become insufficient.
- Form and validation approach.
- UI/component, CSS, icon, and animation libraries.
- Frontend testing framework.
- Project-pinned Node.js version compatible with the current Vite manifest.
- Locale, currency, timezone, and centralized formatting policy.
