# Voucher 24-hour input — 2026-10-22

## Cause and fix

The user's native control displayed 12:09 SA (00:09), while the minimum was
12:08 CH (12:08 noon). The earlier explanatory minimum did not remove this
locale-dependent input ambiguity.

- Added `src/features/admin/VoucherDateTimeField.jsx`, used for both start and
  end: native date picker plus a text time field explicitly labeled 24 hours,
  accepting HH:mm from 00:00 through 23:59. No AM/PM control remains.
- The component derives both parts from the existing form value; no duplicate
  local state/effect or new dependency. Native required/pattern validation blocks
  incomplete pairs and invalid times; clearing the pair retains optional periods.
- `AdminVouchersPage.jsx` retains existing period validation and UTC service
  serialization. Invalid end focuses its time input. Partial input no longer
  reaches an unsafe invalid-Date formatting call. Existing stored timestamp
  precision remains preserved when an edit does not change the period.
- Updated `docs/FORM_VALIDATION_RULES.md`. BR-VOUCHER-01, server authority and
  the one-hour rule are unchanged. No backend implementation/API/migration change.

Large file detected: `m4n-frontend/src/pages/admin/AdminVouchersPage.jsx`
(419 lines). The page was already oversized. Repeated date/time interactions
now have a concrete feature component used twice; unrelated form orchestration
remains in place to avoid a broad refactor.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 69 passed, zero failures/skips.
- Browser used actual AdminVouchersPage/ToastProvider with intercepted API
  responses and synthetic fixtures. No voucher or database mutation was made in
  the running application's data.
- Start 2027-01-01 11:06/end 00:09: inline period rejection, focus moved to end
  time, no POST sent. End 24:09: native pattern validation failed, no POST sent.
- Correcting to 12:09 submitted 04:06Z–05:09Z (GMT+7 local 11:06–12:09), with
  success feedback. This verifies noon is not converted to midnight.
- Editing only description retained the original end 2026-10-22T04:00:30Z.
- End date without a time was blocked by required validation. Clearing the end
  pair then submitted null expiry as before. See [payloads](all-payloads.json).
- Desktop and 375×667 screenshots inspected. Mobile fields stack; dialog width
  343.2px, scrollWidth/clientWidth both 326px (no internal horizontal overflow).
  Existing scrollable modal keeps the longer form usable. Viewport reset.
- Labels, fieldset legends, native required/pattern semantics, field error
  association, keyboard text input and focus reviewed. No paste blocking, custom
  keyboard widget or locale-sensitive AM/PM parsing introduced.
- Security review: framework-escaped values, bounded time input, no new network,
  auth or secret handling; backend still validates accepted timestamps.
- React review: derived input parts; no new effects, request waterfall or render
  clock reads. Current Web Design Guidelines reviewed for affected fields;
  existing focus/neutral surface conventions retained.
- Temporary voucher-24h-check HTML/JSX and agent-created tab removed; user tab
  and live application data preserved.

## Evidence

- [24-hour fields](24h-fields.png)
- [Mobile fields](mobile-fields.png)
- [Create payload](create-payload.json)
- [Create/edit/unlimited payloads](all-payloads.json)
