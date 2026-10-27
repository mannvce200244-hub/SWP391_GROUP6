# Audit customer frontend and support chat

Date: 2026-10-10. Workspace: `D:/m4n/m4n-frontend`.

## Coverage and authority

Static inspection covers all 43 current source files under `features/auth`,
`cart`, `catalog`, `checkout`, `reviews`, `artisans`, `home`, and `chat`, plus the
three customer order files, eight customer pages, shared API client, product
adapter, and the services used by these flows. Four confirmed unused components
were removed after coordination with the root audit.

The audit follows the project scope, business rules, code quality, frontend
architecture, design system, UI/form/accessibility requirements, API contract,
testing strategy, and development instructions. Security, React, UI/UX, customer
visual-design, and web-interface skills were consulted as subordinate guidance.
Admin, POS, shared layout/router/global styles, and notifications are covered by
the root agent. Backend fixes are owned by the backend audit agents.

No dependency or test framework was added. No online payment option was added.
Prices, discount eligibility, inventory, order transitions, and review eligibility
remain backend-owned.

## Confirmed findings and changes

| Area | Confirmed defect | Correction |
| --- | --- | --- |
| Authentication hydration | StrictMode hydration and protected requests could independently rotate the same refresh cookie. | Shared one in-flight refresh promise across initial hydration and automatic retries. |
| Authentication concurrency | A late 401 could trigger another rotation after another request already refreshed. | Retry with the rotated token before attempting another refresh. |
| Session isolation | A protected request started for an earlier account could be replayed with a newly logged-in account. A late refresh could restore a cleared session. | Track token and session revisions; reject responses belonging to a changed session and discard stale refresh results. |
| Authentication state | Automatic refresh did not update the user/role held by React. Transient refresh errors could clear a valid session. | Publish refreshed-user event, preserve tokens for network/5xx failures, clear only invalid refresh or an unauthorized protected retry. |
| PDF downloads | Blob downloads bypassed the refresh pipeline. | Use the same request/refresh/retry path for JSON and blob responses. |
| Authentication transport | Public login/reset/recovery requests carried an unnecessary bearer token; login/logout could race a cookie rotation. | Omit bearer on public auth endpoints and wait for an in-flight rotation before login/logout. |
| Auth forms | Duplicate submission, backend field errors, and first-invalid focus were inconsistently handled. Forgot-password transport failures appeared successful. | Pending guards, field-error mapping and accessible feedback; report transport failures while preserving email non-enumeration. |
| Passwords | Character-only limits did not account for BCrypt's 72 UTF-8-byte input limit. | Validate byte length on new-password forms, coordinated with explicit backend validation; retain approved character constraints. |
| Profile/security | Address/name limits disagreed with backend; logout-all could clear local state despite server failure; delayed redirects remained active. | Align field limits, merge profile only into matching user, clear logout-all session only after server success, navigate after successful password change. |
| Cart ownership | Requests from an old account or an older refresh could overwrite a newer cart/mutation. | Owner-keyed cart, request sequence guards and immediate mutation serialization. |
| Cart feedback | Initial failures appeared as empty carts; quantity errors were not surfaced. | Loading/error/retry states in page/drawer, mutation failure messages and keyboard-accessible product links. |
| Checkout cart | A redundant post-order DELETE could erase items added after successful placement. | Respect transactional backend cart clearing; only refresh the returned/current cart after placement. |
| Checkout totals | Older previews could overwrite current totals or authorize submission for a changed cart. | Sequence guards and cart-snapshot checks; pending controls, retry and stale-preview submission prevention. |
| Checkout discounts | Undefined voucher percentage rendered `NaN%`; one combined discount was presented as a manual voucher discount. | Render exact backend manual/automatic amounts and total; invalidate rejected voucher and remove hardcoded code suggestion. |
| Checkout forms | Limits/error fields differed from server; unsupported transfer instructions appeared in COD checkout. | Align recipient/address/notes constraints, focus invalid fields, extract recipient fields, retain COD content only. |
| Orders | Nested click handlers issued duplicate detail requests; stale requests reopened or replaced detail. | Explicit action buttons, guarded detail requests, close invalidation and shared modal focus management. |
| Order mutations | A successful cancel/receipt followed by a failed reload was reported as mutation failure. | Apply returned detail DTO directly, and reload the list through its separately handled request effect. |
| Order listing | Unbounded client listing/filtering could become incomplete or slow. | Coordinated backend owner/status filtering and server pagination; show totals for selected status. |
| Catalog filters | Applying unchanged filters/current page could leave a permanent spinner; desktop/mobile duplicate IDs and drawer apply bypassed validation. | Reuse a sequenced request effect, disable current-page button, unique IDs, focus errors and native form submission from drawer footer. |
| Quantity | `parseInt` silently truncated non-integer input. | Require positive safe integer quantities. |
| Home filters | Filtering only the first eight unfiltered products could falsely show an empty group. | Request the selected group from the backend before paging; separate approved Dây/Hơi/Gõ tabs and provide retry. |
| Stock badges | New `LOW_STOCK` availability would appear as out of stock on cards. | Show `Sắp hết hàng`; keep low-stock products purchasable. |
| Reviews | Another user's eligibility could survive account change; a failed list looked empty; comment/rating controls lacked complete limits/labels. | Owner/product-keyed eligibility, error/retry, 1000-character comments, named rating buttons and 44px targets. |
| Artisan/village pages | Associated-product failures looked empty; a previous edit misplaced the error flag; village text fabricated historical details. | Distinct error/empty states, correct success/catch flags, fetch four related products, display stored description only. |
| Artisan navigation/counts | History mutation inside a state updater could run twice; failed counts showed zero. | Move history update outside updater, listen to native route events, show unknown counts as `—`. |
| Chat history | Fetching oldest page 0 stopped showing new messages once a thread exceeded 100 messages. | Coordinated newest-first backend contract, chronological rendering, explicit older-message pagination. |
| Chat polling | Overlapping polling and late send/read results overwrote selected thread or removed sent/older messages. | Shared thread lifecycle hook, owner/conversation keys, request generation checks, serialized polling and merge/deduplicate by message ID. |
| Chat queue | Only first 50 conversations were reachable; manual refresh failures were unhandled; failed lists looked empty. | Server page navigation, guarded queue requests, error/retry and manual pending handling. |
| Chat access/UI | Composer, close action and reply drafts were insufficiently isolated; dialog lacked focus/escape management. | Assigned-staff checks, pending mutation guards, clear draft on selection, remount customer panel on account change, shared dialog focus hook and labeled send control. |
| Visual/accessibility cleanup | Pastel/warm surfaces, incomplete tab semantics, missing focus indication and small targets remained. | White/cool-gray surfaces, approved accents, native pressed-button semantics, visible focus and enlarged key controls. |

## Coordinated HTTP contract changes

The frontend uses the following contracts agreed with the backend owners:

- `GET /orders/me?page=0&size=10&status=...` returns direct Spring
  `Page<OrderResponse>`. Status is omitted for the ALL filter. Ownership and
  status filtering happen before pagination.
- Checkout preview/order response/detail append `manualDiscountAmount`,
  `automaticDiscountAmount`, and `automaticPromotionCode`. Existing
  `discountAmount` is the combined total; voucher fields identify manual voucher.
- Chat message page content is ordered by `createdAt DESC, id DESC`.
  Page 0 contains latest messages. Frontend merges pages in chronological order.
  Reading marks only the returned page's received messages read.
- Public product summaries/details may contain `LOW_STOCK`. It is available for
  purchase; only `OUT_OF_STOCK` disables purchase controls.

## Verification evidence

Executed with Node 22.21.1:

```text
node --test tests/apiClient.test.mjs tests/chatMessages.test.mjs
12 tests, 12 pass, 0 fail
```

API tests cover shared hydration/concurrent-401 refresh, late-401 retry without a
second rotation, PDF blob refresh, network/503/ordinary-403 preservation, invalid
refresh/unauthorized-retry clearing, stale refresh rejection, cross-account
request isolation, and public auth bearer omission.

Chat tests cover newest-first chronological ordering and stable ties, retaining
locally sent/older messages while deduplicating polls/pages, and safe malformed
date/response presentation. A regression also verifies detection of a missing
message range after a polling outage: history paging restarts at page 1 if more
than one latest page arrived, including when an older-page request is in flight.

The final targeted ESLint command covers the customer features/pages, customer
orders, chat and shared API client: **0 errors, 0 warnings**. Full repository
`npm run lint` / `npm run build` and browser checks are coordinated by the root
agent; this report does not claim a separate live end-to-end run for every flow.
Mocked HTTP tests do not verify browser cookie storage, mail delivery, PostgreSQL
transactions, or production deployment settings.

## File-size review

Large file detected and reviewed:

| File | Lines | Boundary assessment |
| --- | ---: | --- |
| `src/pages/CheckoutPage.jsx` | 656 | Recipient fields extracted into `CheckoutRecipientFields`; page retains cart/preview/voucher/submission coordination and summary. Below 700-line exceptional-justification threshold. |
| `src/pages/HomePage.jsx` | 565 | Static editorial sections composing one home page; no separate transactional state per section beyond featured catalog. Avoided one-use wrappers. |
| `src/features/orders/CustomerOrdersPage.jsx` | 451 | Detail modal and presentation moved to dedicated files; page owns list/status/pagination and customer mutations. |
| `src/features/chat/StaffChatWorkspace.jsx` | 446 | Queue presentation extracted into `StaffConversationQueue` (184 lines); shared history/polling in `useChatMessages`. Page owns queue/selection/assignment/send/close coordination. |
| `src/pages/ProductListPage.jsx` | 440 | Named filters/grid/mobile drawer/pagination already separate; page owns URL and catalog request state. |
| `src/features/auth/ProfilePage.jsx` | 421 | One profile-editing flow; no new generic form abstraction introduced. |
| `src/features/auth/AccountSecurityPage.jsx` | 381 | Related password/session management flows with existing shared confirmation dialog; no framework introduced. |
| `src/pages/CraftVillageDetailPage.jsx` | 382 | One public detail page; unsupported narrative removed and related-product state corrected. |
| `src/features/catalog/ProductFilters.jsx` | 366 | A cohesive filter form with shared validation and real desktop/drawer reuse. |
| `src/pages/ArtisansPage.jsx` | 328 | Existing named hero/tabs/filter/cards/products components keep page focused on discovery state and URL. |
| `src/features/catalog/ProductDetailInfo.jsx` | 278 | Gallery/specs/provenance/quantity are already separate; this component owns purchase interactions and their product presentation. |
| `src/features/chat/CustomerChatWidget.jsx` | 252 | History lifecycle moved into shared hook; widget owns open/start/send and authentication prompt. |

## Remaining constraints for final review

- Public artisan/village APIs still return unbounded lists, so their current
  service performs client filtering/pagination and artisan lookup. Converting
  these to backend paging requires a coordinated list/filter/count contract;
  this subtask does not silently invent a different response shape.
- Cultural articles/guides and product fields absent from the current persistence
  contract were not fabricated. Broader scope decisions are recorded by the
  root audit rather than represented as working data.
- Queue/message HTTP polling remains the existing transport; no WebSocket/SSE
  dependency or infrastructure was added.
- A final live review should exercise customer account switching during pending
  requests, checkout voucher/automatic discount changes, cancel/receipt modal
  flows, a chat with over 100 messages, queue pagination, and mobile drawers.

## Cleanup

Final browser findings repaired: footer support and the floating chat button now
share the customer layout's dialog state. Guests receive the login prompt;
customers open their own conversation, and Online Staff uses the existing staff
queue route. Removed the cart drawer's unsupported shipping/insurance claim.
Replaced nested `main` elements in account and artisan detail content with `div`,
and labeled product video thumbnails as video. Targeted ESLint on these final
changed files passes with zero errors and warnings. Root owns final live browser
confirmation and whole-project lint/build evidence.

The catalog filter also reports category loading, valid empty data, and request
failure separately. Failure exposes a focused retry while the approved static
instrument groups remain available; request cleanup prevents late responses
from updating an unmounted or superseded filter. Targeted ESLint passes.

Removed confirmed unused `ProductMedia.jsx`, `RelatedProducts.jsx`,
`HomepageVideoSection.jsx`, and `SectionHeading.jsx`. No debug logging, temporary
test harness, generated output, dependency changes or disabled lint rules were
left in the customer implementation. Native regression tests remain reviewable
source artifacts under `m4n-frontend/tests/`.
