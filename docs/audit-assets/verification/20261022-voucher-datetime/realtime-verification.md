# Realtime end-time suggestion and SA/CH — 2026-10-22

## Changes

- `VoucherDateTimeField.jsx`: selected-time confirmation uses explicit SA/CH. Earliest end suggestion is now inside the end field group with an associated accessible description and polite live announcement.
- `voucherPeriod.js`: shared local-time formatter covers morning, noon, afternoon and midnight.
- `AdminVouchersPage.jsx`: earliest end changes immediately with start input for create and edit. Creation baseline refreshes on start edits and failed validation. Suggestions are rounded up to a selectable minute; unchanged stored timestamp precision and backend validation remain intact. Does not silently replace the user's end value.
- `FORM_VALIDATION_RULES.md`: updated the displayed format and suggestion placement.

## Verification

- Browser harness rendered actual AdminVouchersPage with blocked writes and mocked list API, no real voucher/data changes.
- Start 22/10/2027 11:29 displayed `11:29 SA, ngày 22/10/2027`; end 01:30 displayed `01:30 SA, ngày 22/10/2027`; earliest end immediately displayed `12:29 CH, ngày 22/10/2027` below end input.
- Changing start to 23:30 immediately displayed earliest end `12:30 SA, ngày 23/10/2027`, confirming day rollover.
- Native datetime format still follows browser/OS locale. Explicit SA/CH applies to confirmation and earliest suggestion.
- `npm run lint`, `npm run build`: passed. Native Node suite: 70 passed, zero failures/skips. Includes midnight/noon formatting and existing full-hour precision validation.
- Focus/labels, live suggestion association and neutral white surfaces reviewed against project rules and Web Interface Guidelines. No new dependencies or API/backend changes.
- Temporary harness deleted and agent tab closed; user's tab unchanged. Existing responsive layout unchanged; no new mobile screenshot this turn.

Large file detected: `m4n-frontend/src/pages/admin/AdminVouchersPage.jsx`. Kept edits limited to suggestion wiring and creation baseline; broad page extraction is outside this request.
