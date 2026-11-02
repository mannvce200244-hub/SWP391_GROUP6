# M4N UI Acceptance Checklist

This is the required Definition of Done gate for any changed frontend Page,
feature, component, form, or visual system. Mark each applicable item with
evidence. `N/A` requires a short reason; unchecked applicable items mean the UI
is not complete.

## Requirement and scope

- [ ] The change maps to an approved item in `PROJECT_SCOPE.md`.
- [ ] Applicable `BUSINESS_RULES.md` rules are named and preserved.
- [ ] No role, workflow, status, endpoint, DTO, field, token, dependency, or feature was invented.
- [ ] The implementation is the smallest change that satisfies the request.
- [ ] Unresolved decisions are recorded as `TBD`; design suggestions are `PROPOSED`.

## Architecture

- [ ] Page, feature, shared component, hook, API/service, formatter, and constant responsibilities follow `FRONTEND_ARCHITECTURE.md`.
- [ ] No endpoint URL, request construction, or response normalization is scattered through components.
- [ ] Reuse is based on real shared semantics, not speculative abstraction.
- [ ] Large-file review triggers were checked and any natural extraction was justified.
- [ ] No unapproved framework, language, routing, state, data, form, UI, icon, CSS, animation, or testing dependency was added.

## State and data flow

- [ ] Each data-driven view handles loading, empty, error, and success.
- [ ] Each operation handles pending, success, and failure.
- [ ] State has the narrowest correct owner; derived values are not duplicated in synchronized state.
- [ ] Effects synchronize an external system, use correct dependencies, and clean up.
- [ ] Independent requests avoid unnecessary waterfalls; repeated requests are controlled.
- [ ] Backend-authoritative roles, permissions, price, stock, voucher, totals, statuses, and eligibility are not trusted from client state.

## Forms and validation

- [ ] Every field appears in the approved validation matrix in `FORM_VALIDATION_RULES.md`.
- [ ] Requiredness, type, normalization, range, length, format, and business rule are approved or explicitly TBD.
- [ ] Frontend validation improves UX and backend validation remains authoritative.
- [ ] Field and form errors are specific, safe, semantic, and preserve input when appropriate.
- [ ] Double-submit is prevented while pending; success is not assumed before the server confirms it.
- [ ] No password, token, secret, or sensitive value is logged, persisted unsafely, or placed in a URL.

## Interaction and UX

- [ ] Actions use precise labels and the correct native element.
- [ ] Hover, active, focus-visible, disabled, loading, success, and error feedback exist where applicable.
- [ ] Empty and error states explain the situation and provide an appropriate recovery/next action.
- [ ] Consequential actions have a proportionate safeguard without adding unnecessary friction.
- [ ] Customer, Admin, or POS density and task priority is appropriate to the affected area.
- [ ] Motion is purposeful, interruptible, performant, and respects reduced-motion preferences.

## Accessibility

- [ ] Semantic structure and heading order were reviewed.
- [ ] All controls have visible labels or an accessible name; placeholders do not replace labels.
- [ ] Keyboard order, operation, visible focus, dialog focus trap/restoration, and skip behavior were tested as applicable.
- [ ] Images/icons have correct text alternatives; decorative media is hidden from assistive technology.
- [ ] Color is not the only signal, and text/non-text/focus contrast meets the approved WCAG AA baseline.
- [ ] Errors and important asynchronous changes are programmatically associated/announced when needed.
- [ ] Browser zoom, paste, password managers, and native semantics are not unnecessarily blocked.

## Responsive behavior

- [ ] The changed flow was tested at relevant mobile, tablet, and desktop widths.
- [ ] No accidental horizontal overflow, clipped content, hidden focus, or content obscured by sticky UI remains.
- [ ] Navigation, forms, dialogs, tables, grids, cart, and checkout adapt where applicable.
- [ ] Touch targets and spacing are usable; hover is not the only interaction path.
- [ ] Wide tables have an explicit usable strategy rather than unreadably small text.
- [ ] Images/video reserve space and remain responsive without distortion.

## Quality and verification

- [ ] Existing equivalent code was searched before adding a component, hook, service, utility, or style.
- [ ] No unused import, variable, state, prop, component, hook, dead branch, commented-out implementation, `console.log`, or `console.debug` remains.
- [ ] `npm run lint` passes, or the exact failure is reported.
- [ ] `npm run build` passes, or the exact failure is reported.
- [ ] Relevant tests pass; if no frontend test setup exists, that limitation is reported without inventing one.
- [ ] The actual changed files were reviewed for unrelated edits and documentation drift.

## Skill audit

- [ ] UI/UX Pro Max was used only for relevant design intelligence; generated output remains `PROPOSED` until approved in `DESIGN_SYSTEM.md`.
- [ ] Vercel React Best Practices was applied only to React/Vite-relevant rules; Next.js-only guidance was excluded.
- [ ] Vercel Web Design Guidelines fetched the current official checklist for a significant UI review and applicable findings were resolved or reported.
- [ ] Vercel Composition Patterns checked boolean-prop proliferation, prop drilling, state ownership, and reuse without forcing compound components.
- [ ] No skill changed requirements, business rules, dependencies, or approved design decisions.
- [ ] No redundant aesthetic skill was added to the project-local skill set.

## Acceptance record

Record the affected surface, evidence (commands/screens/paths), exceptions, and
remaining `TBD` items in the task or pull-request summary. A reviewer must be
able to distinguish verified behavior from assumptions.

