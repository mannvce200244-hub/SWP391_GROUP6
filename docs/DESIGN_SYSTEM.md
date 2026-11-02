# M4N Design System

This file is the source of truth for visual design decisions. It deliberately separates approved direction from proposals and unresolved choices. External design skills are advisory only.

## Decision register

Every design decision must carry one of these statuses:

- **APPROVED:** implementation authority for the project.
- **PROPOSED:** reviewable direction, not implementation authority.
- **TBD:** no decision; the team must decide before code relies on it.

| Area | Decision | Status |
| --- | --- | --- |
| Design principles | Modern digital-first commerce, trustworthy, accessible, contemporary Vietnamese crafted identity | APPROVED |
| Visual direction | **Contemporary Vietnamese Craft Commerce**: neutral white/cool-gray digital foundation, pure white surfaces, modern sans-serif typography, resonance line motif, lacquer red (#A62F25) primary accent, restrained deep jade (#2F5A50) micro-accent, commercial usability first | APPROVED |
| Color | Modern Neutral palette: canvas #FFFFFF, surface #FFFFFF, surface-muted #F6F7F8, surface-subtle #F2F4F5, ink/charcoal #17191B, secondary #5F646A, muted #7D8389, border #E3E6E8, strong border #CDD2D5, primary lacquer red #A62F25, secondary deep jade #2F5A50 | APPROVED |
| Typography | Primary: modern sans-serif (**Be Vietnam Pro**) for all UI, headings (Hero 48–56px, Section 30–38px), product titles, navigation, Admin, POS. Serif (**Lora**) is only an optional micro-accent for short quotes | APPROVED |
| Spacing | One 4px-based scale: `--space-1` 4px through `--space-32` 128px | APPROVED |
| Radius | Clean modern radii: `--radius-xs` 4px, `--radius-sm` 6px, `--radius-md` 8px, `--radius-lg` 12px, `--radius-xl` 16px | APPROVED |
| Shadows/elevation | Clean neutral soft levels `--shadow-2xs` through `--shadow-xl`, plus dropdown and floating panel levels | APPROVED |
| Buttons | Modern 48px/3rem height, 8px radius, primary lacquer red #A62F25, interactive translateY(-1px), active scale(.99), loading spinner | APPROVED |
| Form controls | Labels, semantics, 8px radius, subtle focus ring (rgba(166, 47, 37, 0.12)), inline feedback | APPROVED |
| Cards/product tiles | Clean minimal container, 8px radius, sans-serif title, lacquer red price, maker/village metadata, subtle hover image zoom | APPROVED |
| Tables/pagination | Readability and operational clarity are approved; visual specifications are undecided | APPROVED / TBD |
| Badges/status indicators | Must include readable text and not rely on color; visual tokens are undecided | APPROVED / TBD |
| Modal/dialog | Keyboard/focus behavior is approved; visual anatomy and tokens are undecided | APPROVED / TBD |
| Feedback | Loading, empty, error, success, disabled, and pending states are required; visual tokens are undecided | APPROVED / TBD |
| Responsive behavior | Relevant surfaces must work across their target sizes; breakpoints and exact targets are undecided | APPROVED / TBD |
| Customer guidance | Product discovery, shopping clarity, trust, modern commerce usability, and contemporary Vietnamese crafted identity | APPROVED |
| Admin guidance | Information density, readable tables/filters/forms, operational efficiency | APPROVED |
| POS guidance | Speed, large practical targets, low click count, clear bill and totals | APPROVED |

When a row contains two statuses, the stated behavior is approved while its
concrete visual values remain TBD. Do not promote a proposed or TBD value by
implementing it first.

## Approved

### Visual principles

- **M4N uses a strict neutral white/cool-gray digital foundation.** Warm beige, cream, ivory, parchment, and yellow-tinted backgrounds (e.g., `#FAF9F6`, `#FBF9F4`, or yellowish gradients) are STRICTLY FORBIDDEN. All UI surfaces and page backgrounds must be pure crisp white (`#FFFFFF` / `bg-white`) or cool-gray (`#F6F7F8` / `bg-surface-secondary`). Vietnamese identity is expressed through lacquer-red accents (`#A62F25`), authentic photography, craftsmanship metadata and subtle resonance motifs.
- **M4N is a modern e-commerce product with contemporary Vietnamese cultural identity.**
- Priority order: 1. Modern digital product, 2. E-commerce usability, 3. Vietnamese identity, 4. Traditional craftsmanship.
- Cultural identity supports product discovery and trust through subtle contemporary cues (lacquer red, dark wood, resonance lines, craft geometry) — never through museum nostalgia, sepia tones, yellowed paper aesthetics, or decorative clutter.
- Customer surfaces emphasize clear product cataloging, fast navigation, and commercial clarity.
- Admin prioritizes information density, clear tables/filters/forms, and operational efficiency.
- POS prioritizes speed, large practical targets, low click count, immediately visible totals, and fast quantity editing.
- Customer, Admin, and POS share one design system while allowing appropriate density differences.
- Accessibility, readability, performance, and business clarity take priority over visual novelty.
- Color must never be the only carrier of status or meaning. Target color proportion: 75% white/cool neutral, 15% charcoal typography, 8% lacquer red, 2% jade micro-accent.
- Radius, spacing, typography, and other tokens must be consistent once approved; do not invent page-specific values.

### Contemporary Craft Commerce tokens (approved values)

The implemented semantic tokens are configured via Tailwind CSS v4 `@theme` in `m4n-frontend/src/styles/global.css`. Utility classes (`bg-brand`, `text-ink`, `border-border`, etc.) map directly to these design tokens.

**Surfaces:** canvas `#FFFFFF`, surface `#FFFFFF`, surface-secondary `#F6F7F8`,
surface-muted `#F6F7F8`, surface-subtle `#F2F4F5`, footer surface `#17191B`.

**Text:** ink/foreground `#17191B`, ink-secondary `#2C3033`, muted/secondary `#5F646A`, subtle `#7D8389`,
faint `#CDD2D5`.

**Borders:** border `#E3E6E8`, border-subtle `#F2F4F5`, border-strong `#CDD2D5`,
control-border `#CDD2D5`.

**Primary (lacquer red):** primary/brand `#A62F25`, primary-hover `#84231D`, primary-deep/active `#721D18`, primary-soft
`#FBEDEC`, primary-border `#F7D7D4`.

**Secondary (deep jade):** jade `#2F5A50`, jade-hover `#24483F`, jade-active `#1D3B34`, jade-soft
`#EDF4F1`, jade-border `#D5E5E0`.

**Accent/links (lacquer red):** accent `#A62F25`, accent-hover `#84231D`,
accent-strong `#721D18`, accent-soft `#FBEDEC`, accent-subtle `#F7D7D4`.

**Semantic:** success `#2F5A50` (soft `#EDF4F1`, border `#D5E5E0`), warning
`#856404` (soft `#FFF9E6`, border `#FFEBAA`), danger `#A62F25` (soft `#FBEDEC`,
border `#F7D7D4`).

**Typography:** All headings (Hero 48–56px, Section 30–38px), product titles, navigation, and UI use `--font-sans` (Be Vietnam Pro). Serif (`--font-serif`: Lora) is strictly reserved as an optional micro-accent for short quotes.

**Radii:** modern 6–8px standard (`--radius-sm` 6px, `--radius-md` 8px, `--radius-lg` 12px).

**Shadows:** clean neutral soft shadows (`rgb(0 0 0 / …)`); no heavy black or sepia drop shadows.

**Motion:** transitions stay within 140–220ms and the `prefers-reduced-motion`
block is preserved.

**Focus:** `2px solid #A63F2A` with a 2–3px offset, visible on every interactive
element, including `role="button"` elements.

**Contrast:** `--color-control-border` uses the approved `faint` value `#8A8072`
(3.66:1 against surface) because the proposed `#B9AB94` measured only 2.13:1,
below the required 3:1 for a control boundary.

### Interaction principles

- Motion must explain a transition, provide feedback, or improve comprehension.
- Checkout and POS must not be slowed by decorative animation.
- Respect `prefers-reduced-motion` whenever motion is implemented.
- Do not apply large rounded cards, gradients, glass effects, or decorative cultural motifs as automatic AI defaults.
- Do not add fonts, icon sets, motion packages, or UI libraries without explicit approval.

### Eyebrow Labels & Section Markers

- **Prohibited:** Rounded-full pill badges (`px-3 py-1 rounded-full bg-brand-soft border border-brand-border`), pale pink/cream pill surfaces, and decorative outline pills for generic section decoration or eyebrow headers.
- **Approved Editorial Marker:**
  - Component: `EditorialEyebrow.jsx`
  - Anatomy: Acoustic resonance string motif in authentic lacquer red (`#A6412B`) + uppercase sans-serif label in dark charcoal (`#17191B`).
  - Styling: Transparent background, no border, no pill, no shadow, font-size 11–12px (`text-[11px] sm:text-xs`), font-weight 600 (`font-semibold`), restrained tracking (`tracking-wider`).
  - Usage: Applied consistently across Homepage hero, Catalog collection header, Section headings, Artisan details, and Values sections.
- **Pills Scope:** Pill-shaped badges (`rounded-full`) are strictly reserved for genuine semantic states: stock status (in stock / out of stock), order status, numeric counter badges, and active filter dismiss chips.

## Current implementation observed

The current frontend foundation contains the following implementation values.
The Heirloom palette, typography, spacing, radius, shadow, and card-anatomy rows
are now APPROVED tokens (see the register and Approved section above). Rows that
are still only descriptive remain marked as such.

| Area | Observed value | Status |
| --- | --- | --- |
| Typography | `--font-display` Lora (Georgia/Times fallback) for h1–h3 and marketing headings; `--font-sans` Be Vietnam Pro for UI, body, labels, tables, buttons, badges; body 1rem/1.7 | APPROVED token (Heirloom) |
| Color | Heirloom semantic variables: canvas, surface, surface-secondary, surface-muted, ink, ink-secondary, muted, subtle, faint, border, border-subtle, border-strong, control-border, primary, accent, success, warning, danger, footer | APPROVED token (Heirloom) |
| Theme | Light presentation only | Current implementation; theme requirement remains TBD |
| Spacing | 4px base scale (`--space-1` 4px through `--space-32` 128px) plus responsive `clamp()` values per section | APPROVED scale; the responsive `clamp()` values remain implementation detail |
| Radius | `--radius-xs` 4 / `--radius-sm` 7 / `--radius-md` 10 / `--radius-lg` 14 / `--radius-xl` 18, with `--radius-small/medium/large` aliases kept for existing usages | APPROVED token |
| Shadow | Warm-tinted `--shadow-xs…xl`, `--shadow-dropdown`, and a lacquer-tinted featured-media level (`--shadow-lantern`) | APPROVED token |
| Breakpoints | `68rem`, `54rem`, `38rem` in customer CSS; `900px`, `860px`, `800px`, `768px`, `640px`, `600px`, `540px` in the layout/Auth/Admin/Workspace CSS | Current implementation for current screens, not approved global breakpoints |

Current text, focus, and control-border combinations are required to meet the
approved WCAG AA baseline. Adjusting an observed implementation value to meet
that baseline does not promote it to an approved brand token.

Do not replace an approved token in a feature task unless the requested scope includes the affected visual work.

## Shared UI inventory

A3 audited the current frontend and stabilized primitives that already have real
usage. Their required semantics and states follow the Approved rules above;
their concrete visual anatomy and tokens remain TBD.

| Primitive | Current implementation | Decision status |
| --- | --- | --- |
| `Button` | Native button; `primary` and `quiet` variants used by current screens; disabled/loading semantics | Behavior APPROVED; variants and visuals TBD |
| `FormField` | Shared visible label and associated helper/error messages | Behavior APPROVED; visuals TBD |
| `Input` | Native input composed with `FormField`; forwards native attributes | Behavior APPROVED; visuals TBD |
| `Select` | Native select composed with `FormField`; used by Product filters | Behavior APPROVED; visuals TBD |
| `LoadingState` | One live, busy page/region state | Behavior APPROVED; visuals TBD |
| `EmptyState` | Title, description, and optional composed action | Behavior APPROVED; visuals TBD |
| `ErrorState` | Safe title/message and optional retry action | Behavior APPROVED; visuals TBD |
| `ConfirmDialog` | Accessible confirmation modal (Escape close, focus trap, cancel/confirm, consequences) | Behavior APPROVED; used in AccountSecurity |
| `ToastProvider / useToast` | Non-intrusive notification feedback; replaces browser alert() | Behavior APPROVED; used across Auth/Account/Admin/Staff/POS |

The following are deliberately not implemented yet because no current approved
screen proves their API or data needs: `Textarea`, StatusBadge, Table, and Pagination.
Create them only with the first approved use case, then reuse them when their semantics match.
Status mappings, page indexing, table behavior, destructive actions, and field contracts stay in
their owning feature/API contracts.

### Shared component conventions

- Check `m4n-frontend/src/components/ui/` before creating a primitive.
- Shared controls preserve native semantics and attributes; they do not own
  feature form state or business validation.
- Use `children` for optional actions/content. Add a semantic `variant` only
  after an actual use case exists; do not add many boolean appearance props.
- Every field keeps a visible label. Helper and error IDs are included in
  `aria-describedby`; invalid fields use `aria-invalid`.
- A pending Button exposes `aria-busy`, displays a specific loading label, and
  is natively disabled to prevent duplicate activation.
- Empty and Error states accept recovery content/actions without learning
  feature business behavior.

## Proposed (not approved)

The following are safe directions for team review, not implementation authority:

- Continue using semantic CSS custom properties so components refer to meaning (text, surface, border, accent, danger, success) rather than scattered raw values.
- Define one shared token foundation with density variants or component sizing appropriate to Customer, Admin, and POS.
- Centralize component states (default, hover, active, focus-visible, disabled, loading, error) in shared primitives after the first real UI patterns are approved.
- Select cultural references from real M4N brand/product assets rather than generic AI-generated Vietnamese decoration.

No proposed item becomes approved until the team moves it into the Approved section with concrete values.

### UI/UX Pro Max persistence

UI/UX Pro Max may persist generated guidance under
`design-system/m4n/MASTER.md` and page proposals under
`design-system/m4n/pages/`. Every generated value in that tree is **PROPOSED**,
even if the generated file calls itself a master or source of truth.

- This file remains the approved visual-design source of truth.
- Generated output cannot override scope, business rules, UI/UX rules, or this file.
- Review product classification, assumptions, accessibility, feasibility, and dependency suggestions before considering promotion.
- Promote a decision only through an explicit team update to this file.
- The current generated proposal classifies M4N as Banking/Traditional Finance, which conflicts with the approved musical-instrument domain; therefore none of its concrete palette, typography, component, or layout values is approved.

## TBD

### Palette

- Order-status colors beyond success/warning/danger (approved in the Heirloom tokens above). Status mapping itself stays in `BUSINESS_RULES.md`.
- Light/dark theme requirement and theme-switching behavior.
- Required contrast targets beyond the accessibility baseline.

### Typography

- Table text and tabular-number treatment for data-heavy admin tables (the released surfaces use tabular numerals for prices only).
- Form label and helper/error text scale for future form components beyond the current `.field__*` styles.

Font family, loading strategy, heading hierarchy, body text, weights, sizes,
line-heights, and letter-spacing are approved in the Heirloom tokens above.
Lora and Be Vietnam Pro are the only approved font families and are loaded from
the existing Google Fonts `<link>` in `m4n-frontend/index.html`. Adding another
font dependency still requires explicit approval.

### Spacing, radius, and shadows

- Layout gutters and container widths per surface.
- Z-index/layer scale.

The spacing scale, component/card radius scale, and elevation/shadow levels are
approved in the Heirloom tokens above. Avoid many near-duplicate values. Do not
round every container simply because it is a common generated-design style.

### Components

The following need approved anatomy, tokens, variants, states, and accessibility behavior before they become canonical:

- Buttons and icon buttons.
- Inputs, selects, checkboxes, radios, and form messages.
- Tables and pagination.
- Badges and status indicators.
- Modal/dialog.
- Notifications/toasts/alerts.
- Loading, EmptyState, and ErrorState.

The released Heirloom work standardized existing buttons, fields, cards,
dropdowns, dialogs, toasts, and state panels on the approved tokens above
(hairline 1px borders, `--radius-md` for controls and menus, `--radius-lg` for
panels and cards, lacquer focus ring). Their full canonical anatomy is still TBD;
do not treat the current implementation as approved anatomy for a new component.

### Responsive behavior

- Breakpoint values.
- Container widths and page gutters.
- Customer product-grid behavior.
- Admin table responsive strategy.
- POS target screen sizes and density.

Until approved, every requested screen must still be usable on relevant mobile, tablet, and desktop sizes without declaring new global breakpoint tokens.

## Visual decision process

1. Start from approved project and business requirements.
2. Inspect current brand assets and affected UI.
3. Reuse approved tokens/components when they exist.
4. Record a missing visual choice under Proposed or TBD rather than silently standardizing it.
5. Obtain team approval before adding dependencies or promoting proposals.
6. Audit readability, contrast, focus, responsive behavior, motion, and all UI states before completion.
