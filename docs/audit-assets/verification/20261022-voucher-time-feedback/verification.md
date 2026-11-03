# Voucher end-time guidance — 2026-10-22

## Diagnosis and change

The user's 22/10/2026 10:00–11:00 interval meets the start-based hour, but at
inspection the actual local time was already 11:01. A newly created voucher must
also end at least one hour after its server creation time (BR-VOUCHER-01). The
existing rejection is correct; the form did not explain the concrete minimum.

`m4n-frontend/src/pages/admin/AdminVouchersPage.jsx` now shows the explicit local
earliest end time, rounded upward to the minute. Copy explains the create-action
baseline and original creation time on edits. Native validation failures display
an inline recovery message, refresh the baseline and retain all form fields.
The minimum is derived from existing state; no clock reads were added to render,
no polling, dependency, backend or business-rule change was introduced.

Large file detected: `m4n-frontend/src/pages/admin/AdminVouchersPage.jsx`
(420 lines). The page was already oversized. The focused date hint and native
error handling remain within its existing form; broad form decomposition is
outside this fix. `docs/FORM_VALIDATION_RULES.md` records the feedback behavior.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 69 passed, no failures/skips.
- Actual AdminVouchersPage and ToastProvider mounted in a temporary local
  harness with all fetches intercepted. No live voucher/database change made.
- Reproduced start 10:00/end 11:00 on 22/10/2026; native range validation failed,
  an inline error and concrete minimum appeared, and no POST was sent.
- Changed only the end to the suggested 12:06; native validity became true,
  inline error cleared, and submit sent the expected UTC timestamps and displayed
  the success message. See [payload](create-payload.json).
- Desktop screenshot inspected. Existing responsive grid, scrolling modal,
  native keyboard controls and focus management retained. New helper/error copy
  wraps normally; this focused copy change did not receive a separate mobile audit.
- `aria-describedby` connects the date field with its hint, concrete minimum and
  error. The minimum is announced politely; field error remains an alert.
- Security/React review: framework-escaped text, no new API/secret handling,
  derived minimum and existing backend authority preserved.
- Current Web Design Guidelines reviewed: changed date hint/field passes label,
  semantic feedback, localized date formatting and actionable recovery checks.
- Temporary `voucher-time-check.html`, `src/voucher-time-check.jsx` and the
  agent-created browser tab removed. User tab untouched; viewport unchanged.

[Rejected old end with guidance](past-end-guidance.png)

[Valid suggested end](valid-end-guidance.png)
