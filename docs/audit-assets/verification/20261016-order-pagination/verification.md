# Customer orders pagination — 2026-10-16

## Findings and implementation

`GET /api/v1/orders/me` and `orderService.getMyOrders` already implement server
pagination with 10 orders/page. CustomerOrdersPage already renders page controls,
but hid them entirely for a one-page result. No backend/API change was needed.

- Explicitly request 10 orders/page; show the visible record range and total.
- Show page position and numbered previous/next controls for any nonempty result,
  including a single page with disabled previous/next.
- Keep footer controls visible but disabled while fetching; mark list aria-busy
  and announce loading/result through a status region.
- Changing page focuses/scrolls to the result summary. Existing filter changes
  reset to page 1; retain server status filtering and stale-request protection.
- Clamp a page that becomes invalid after a mutation, including an empty result.
- Allow existing long order codes to wrap so pagination fits mobile screens.
- Reuse existing Pagination with opt-in showSinglePage and disabled properties;
  other consumers preserve their previous visibility behavior.

Changed production files:
- `m4n-frontend/src/features/orders/CustomerOrdersPage.jsx`
- `m4n-frontend/src/features/catalog/Pagination.jsx`

## Verification

- Browser test mounted the actual customer-orders page, layout, feature service,
  shared transport and pagination against an isolated synthetic fetch fixture.
  No user login, real orders, backend state changes or SMTP were needed.
- 23 orders: pages 1/2/3 request zero-based 0/1/2 and size=10; visible ranges
  1–10, 11–20, 21–23. Last-page next button disabled.
- Status filtering from page 3 sends page=0 and the selected status; resulting
  filtered total was 12, not a client-side subset of one fetched page.
- One-page result shows page 1/1; previous and next disabled.
- Empty result has no pagination and shows the existing empty-state action.
- Simulated HTTP 503 shows contextual error and retry. Retry restores the same
  second page and correct range. Keyboard Enter on page 3 changes page correctly.
- Phone 390x844, tablet 768x1024 and default desktop checked. No horizontal
  document overflow. Footer controls fit mobile and have 44px touch targets.
- Screens: desktop.png and mobile.png (synthetic order data).
- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 50 passed, zero failures/skips.
- Native Node tests cover API page/filter serialization, backend metadata
  preservation and propagation of request errors for page retry.

Temporary fixture files were removed, the temporary browser tab closed and
viewport reset before completion. No dependencies or backend changes.

## UI acceptance and review

Scope: requested customer order-history pagination; existing cancellation,
receipt confirmation, ownership and price/payment authority preserved.
No new form fields, business status, route or transport contract. Forms/password
and media acceptance items N/A. Native buttons, accessible labels, aria-current,
keyboard operation, visible focus, busy state, live result summary, disabled
boundaries, loading/empty/error/retry and responsive controls reviewed.
White/cool-gray canvases retained. Skeleton respects reduced-motion preference.
Existing UI primitives reused. No speculative hook/component added.

Project UI guidance, React best practices and current Web Interface Guidelines
were reviewed; no outstanding issue in the changed pagination controls.

Large file detected: m4n-frontend/src/features/orders/CustomerOrdersPage.jsx
(412 lines, already above 300 before this change). The page owns order history
and existing detail/cancel/receive dialogs; those dialogs are already extracted.
A later presentation-only order-card extraction is a natural boundary. Retained
that existing block for this focused pagination change to avoid rewriting order
actions. No new independent business concern or dependency was introduced.
