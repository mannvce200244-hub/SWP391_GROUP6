# M4N Frontend

React/Vite frontend for M4N. The current foundation contains the Customer layout
and the Customer Catalog UI flow.

## Commands

- `npm run dev` starts the local development server.
- `npm run lint` runs the existing ESLint configuration.
- `npm run build` creates a production build.

## Current routes

- `/`
- `/products`
- `/products/:id`

Routing uses a small History API adapter because the repository has not approved
a routing dependency. Implemented Customer paths and builders are centralized in
`src/routes/customerRoutes.js`; route-to-Page composition remains in
`src/routes/AppRouter.jsx`. Routes owned by Auth, Cart, Checkout, Order, Admin,
and POS are intentionally not created.

## Feature integration

- A feature owner supplies an approved, usable Page and its business behavior.
- The Frontend Lead registers the route, chooses the area layout, exposes only
  usable navigation, and checks shared UI and module boundaries.
- `CustomerLayout` is the only implemented layout. `AdminLayout` and `PosLayout`
  are created with their first approved Pages, not as empty placeholders.
- Auth storage, auth transport, role guards, API base URL key, error shape, and
  the shared API transport remain TBD. Do not guess or duplicate them.
- When the first real API contract is approved, the intended flow is shared
  transport to capability-focused feature service to Page/hook.

See [`docs/FRONTEND_ARCHITECTURE.md`](../docs/FRONTEND_ARCHITECTURE.md) and
[`docs/API_CONTRACT_RULES.md`](../docs/API_CONTRACT_RULES.md) for the integration
handoff and contract checklist.

## Product data boundary

Pages depend on `services/productService.js`, which delegates to
`api/productCatalogAdapter.js`. The current adapter returns no data because the
Product endpoint, DTOs, filter parameter names, base URL environment key,
currency, and locale are still TBD. Replace the adapter after those contracts are
approved; do not put API URLs in components.

The catalog UI currently validates and trims filters before calling the service,
handles loading/error/empty/success states, renders only product fields provided
by the adapter, and supports responsive images and controlled video playback.

## Shared UI

Reusable primitives live in `src/components/ui/`. Check that directory before
creating form controls, buttons, or page states. The current reusable set is
Button, FormField, Input, Select, LoadingState, EmptyState, and ErrorState.
Visual token values remain provisional until `docs/DESIGN_SYSTEM.md` records an
approved team decision.
