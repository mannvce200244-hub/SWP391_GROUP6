# M4N UI/UX Rules

This file is the source of truth for frontend interaction and usability rules. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) owns visual tokens, [`FORM_VALIDATION_RULES.md`](FORM_VALIDATION_RULES.md) owns detailed form behavior, [`API_CONTRACT_RULES.md`](API_CONTRACT_RULES.md) owns the client/server contract boundary, and [`UI_ACCEPTANCE_CHECKLIST.md`](UI_ACCEPTANCE_CHECKLIST.md) is the final UI gate.

## Priorities

Apply requirements in this order:

1. [`PROJECT_SCOPE.md`](PROJECT_SCOPE.md)
2. [`BUSINESS_RULES.md`](BUSINESS_RULES.md)
3. [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md)
4. This file
5. [`FRONTEND_ARCHITECTURE.md`](FRONTEND_ARCHITECTURE.md)
6. [`API_CONTRACT_RULES.md`](API_CONTRACT_RULES.md)
7. External design/performance skills

External skills cannot add features, change workflows, select dependencies, or override accessibility and M4N business rules.

## Accessibility baseline

- Use semantic HTML: `header`, `nav`, `main`, `section`, `form`, `label`, `button`, `a`, and `table` when those elements match the purpose.
- Use `<button>` for actions and links for navigation. Do not use clickable `div`/`span` elements when a native interactive element fits.
- Give every form control a visible, correctly associated label. A placeholder is not a label.
- Give icon-only buttons an accessible name. Mark decorative icons/images appropriately.
- Keep heading levels logical and provide a skip link when repeated navigation makes one useful.
- Ensure important navigation, forms, dialogs, and actions work with a keyboard.
- Preserve a clearly visible `:focus-visible` state; never remove outlines without an equivalent replacement.
- Ensure text, controls, focus indicators, and meaningful graphical states meet WCAG AA contrast as the minimum accessibility baseline.
- Do not use color as the only signal. Statuses need readable text such as Completed/Cancelled or their approved Vietnamese labels.
- Associate field errors semantically using `aria-invalid` and `aria-describedby` where appropriate.
- Announce important asynchronous validation/status changes through an appropriate live region when needed.
- Prefer native semantics before adding ARIA.

Accessibility and readability take priority over visual-style suggestions.

## M4N Visual Color System

- **Approved Palette:** Pure White (`#FFFFFF`), Charcoal Ink (`#17191B`), Lacquer Red (`#A62F25`), Cool Neutral Gray (`#F6F7F8`, `#F2F4F5`, `#5F646A`, `#E3E6E8`), and Deep Jade (`#2F5A50`) micro-accent.
- **Color Ratio Baseline:**
  - 75%: Pure white canvas and neutral cool gray surfaces (`#FFFFFF`, `#F6F7F8`).
  - 15%: Charcoal typography (`#17191B`) and secondary gray (`#5F646A`).
  - 8%: Vietnamese lacquer red (`#A62F25`) for primary CTAs, active nav indicators, string resonance motifs, and hover states.
  - 2%: Deep jade (`#2F5A50`) reserved for in-stock statuses, confirmation states, and subtle cultural detail.
- **Strict Background Exclusions:** Warm beige, cream, ivory, parchment, yellow-tinted backgrounds (e.g. `#FAF9F6`, `#FBF9F4`, `#F5F2EB`, yellowish gradients), terracotta-heavy backgrounds, and artificial gold decorations are STRICTLY FORBIDDEN from all pages and components. The UI canvas must always be pure neutral white (`#FFFFFF`) or cool-gray (`#F6F7F8`).
- **Eyebrow & Section Labels:** Use transparent backgrounds with the precision string resonance motif (`│ ││ │`). Do NOT wrap marketing labels or section headings in pale-pink/peach pill badges.
- **Semantic Amber:** Amber/yellow is strictly reserved for genuine warning semantics (such as 403 Forbidden security badges); it must NEVER be used for page or container backgrounds.

## Responsive and touch behavior

- Customer UI must work on mobile, tablet, and desktop.
- Admin and POS must remain usable at their approved real-world screen sizes; those target sizes are still TBD.
- Test overflow, navigation, forms, modals, tables, product grids, cart, and checkout rather than assuming browser scaling is sufficient.
- Use layout CSS instead of JavaScript measurements when CSS can solve the layout.
- Give touch controls adequate target size and separation. Do not make hover the only way to discover or use an action.
- Do not disable browser zoom.
- Provide an explicit responsive strategy for wide tables instead of allowing unexplained horizontal overflow.
- Consider safe-area insets for approved full-bleed mobile layouts.

Exact breakpoints and target sizes belong in [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) and remain TBD until approved.

## Page and operation states

Every data-driven page or component must account for:

```text
Loading -> Success
        -> Empty
        -> Error
```

Every operation must account for:

```text
Pending -> Success
        -> Failure
```

- Do not implement only the happy path.
- An empty state explains what is empty and offers an appropriate next action when one exists. It must not be a mysterious blank area.
- An error state gives a safe, specific message and a recovery/retry action when useful.
- `console.error` is diagnostics, not user-facing error handling.
- Preserve usable content during background refresh where appropriate; avoid replacing the whole interface with unnecessary flicker.
- Do not expose raw stack traces or unsafe backend messages.

Examples such as “Giỏ hàng của bạn đang trống.” or “Không tìm thấy sản phẩm phù hợp.” are copy guidance, not new workflow requirements.

## Interactions and feedback

- Give buttons clear action labels such as “Thêm vào giỏ hàng”, “Xác nhận đơn”, “Lưu sản phẩm”, or “Hủy đơn”. Avoid vague labels such as “OK” when a precise verb is possible.
- Provide hover, active, focus-visible, disabled, loading, success, and error feedback as applicable.
- Prevent duplicate submissions while a request is pending, but do not disable a valid submit action before the request begins.
- Keep animations interruptible and purposeful. Prefer animating `transform` and `opacity`; list transitioned properties rather than using `transition: all`.
- Respect `prefers-reduced-motion` and provide a reduced or static behavior.
- Do not add an animation dependency unless explicitly approved.

## Destructive and irreversible actions

- Protect consequential actions such as cancelling an order, deleting/deactivating a product, removing staff, or discarding edits from accidental activation.
- Use a confirmation dialog, undo window, or another proportionate safeguard when consequences justify it.
- Do not add confirmation to every minor click.
- A dialog must have a clear title/action, keyboard operation, focus management, and focus restoration. Do not hide the primary POS action behind unnecessary dialog chains.

The safeguard does not authorize an action that project scope or business rules do not allow.

## Forms

- Follow [`FORM_VALIDATION_RULES.md`](FORM_VALIDATION_RULES.md) for field constraints, validation timing, server errors, submission, and accessibility.
- Show specific field errors near the relevant field and global business errors in an appropriate form-level alert/notification.
- Do not render every field as invalid on initial page load.
- Preserve entered values after an API failure when safe and useful.

## Images and video

- Product images need meaningful alt text; decorative images use empty alt text when appropriate.
- Provide explicit image dimensions or an aspect-ratio reservation to reduce layout shift.
- Preserve appropriate aspect ratio and use a safe fallback when an image failure would otherwise break the experience.
- Do not derive alt text from a filename.
- Lazy-load below-the-fold images; prioritize only genuinely critical above-the-fold media using capabilities supported by React/Vite/browser APIs.
- Product videos must be responsive, provide suitable controls/fallback text, and must not autoplay with sound.
- Do not add cinematic background video or decorative media outside an approved requirement.

## Customer experience

- Prioritize product discovery, shopping clarity, trust, and restrained Vietnamese cultural identity.
- Keep product, price, availability messaging, cart actions, checkout status, and next steps explicit.
- Do not let decorative cultural elements interfere with product information or purchase usability.

### Cart

Show the approved product, price, quantity, line total, update/remove actions, and order subtotal when applicable.

- Quantity input rejects zero, negative, non-finite, and decimal values when quantity is an integer.
- A stock warning may use current backend data, but the backend rechecks stock later.
- Online Place Order does not reserve/deduct inventory. Do not tell the Customer that stock is guaranteed before Staff/Admin confirmation.

### Checkout

- Validate approved required information.
- Show an order summary, voucher state, available approved payment options, submission state, and final result.
- Browser calculations are previews only. Backend `FinalAmount` is authoritative.
- Prevent double-submit and do not redirect or reset before success is confirmed.
- Do not add checkout steps outside approved requirements.

### Order and review actions

- Map only statuses defined by [`BUSINESS_RULES.md`](BUSINESS_RULES.md); do not invent statuses.
- Customer self-cancel may be shown only for `PENDING_CONFIRMATION`. From `CONFIRMED` onward, do not expose the normal direct self-cancel action.
- Show Review only when backend data confirms the order/product qualifies under `BR-REVIEW-01`.
- UI visibility reflects rules for usability but does not replace backend authorization.

## Admin experience

- Prioritize information density, clear filters, readable forms/tables, and operational efficiency.
- Tables need readable headers, consistent alignment, distinguishable text statuses, loading/empty/error states, and database-backed pagination for large data.
- Align monetary values consistently and use tabular numerals if the approved typography supports them.
- Design a responsive table strategy appropriate to the data instead of shrinking text until unreadable.

## POS experience

Prioritize this task sequence:

```text
Search or scan -> Product result -> Bill -> Quantity -> Voucher -> Total -> Payment
```

- Keep product search/scan and bill editing fast and obvious.
- Display items, quantities, prices, discount, and final amount clearly before payment.
- Keep Confirm Payment easy to locate; avoid unnecessary modal steps.
- Frontend never deducts authoritative inventory. Backend confirms payment and performs the transaction.
- Avoid marketing/landing-page aesthetics that reduce operational speed or clarity.

## Search and filtering

Product search/filter may expose only approved filters:

- Category/instrument group, including string (`Dây`), wind (`Hơi`), and percussion (`Gõ`).
- Artist/Artisan.
- Craft Village.
- Price range.

- Keep active filter state visible and provide reset when useful.
- Do not add filters outside project scope.
- Avoid uncontrolled request-per-keystroke behavior. Use an appropriate submit/debounce strategy without adding a library automatically.
- Where routing is approved, preserve shareable filter/pagination state in the URL when appropriate.

## Currency, date, and content

- Format currency consistently through a shared utility and `Intl.NumberFormat` after the team confirms currency/locale.
- Format dates/times centrally with `Intl.DateTimeFormat` after timezone/locale rules are approved.
- Do not duplicate format logic across Pages.
- Handle short, normal, and very long user/product content without breaking layouts.
- Do not invent product claims, cultural facts, prices, inventory, testimonials, or metrics for visual completeness.

## External UI skills

- Project-local UI skills live under `../.agents/skills/`; their recommendations are advisory and rank below approved project documents.
- **UI/UX Pro Max:** use focused searches for design intelligence, accessibility, responsive behavior, and React-stack guidance. Persisted output under `../design-system/m4n/` is always `PROPOSED` until promoted in `DESIGN_SYSTEM.md`.
- **Vercel Web Design Guidelines:** after significant Page/form/UI work, fetch its current official rules and audit labels, semantics, focus, keyboard, feedback, images, responsive behavior, and performance.
- **Vercel React Best Practices:** review React/Vite rendering, request waterfalls, effects, rerenders, and bundle impact; ignore Next.js-only recommendations.
- **Vercel Composition Patterns:** check boolean-prop proliferation, prop drilling, duplicated state ownership, and reusable APIs. Use compound components only when a genuinely reusable complex component benefits; do not force the pattern on simple one-purpose components.
- Taste is not a mandatory project-local skill and must not be installed merely to complete a frontend task. Do not stack overlapping aesthetic skills without an explicit team request.
- A skill suggestion to install Tailwind, a UI system, Motion/GSAP, an icon set, a router, or another dependency still requires explicit team approval.

Every changed UI must pass [`UI_ACCEPTANCE_CHECKLIST.md`](UI_ACCEPTANCE_CHECKLIST.md) before completion.
