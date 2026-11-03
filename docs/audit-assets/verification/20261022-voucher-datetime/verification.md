# Voucher datetime control verification — 2026-10-22

## Scope

User requested one combined date/time control per start and end field. Replaced split date and time fields with native `datetime-local`. Kept Vietnamese 24-hour summaries, full-value clear buttons, accessible labels, and the existing one-hour rule. Native picker formatting follows the browser/OS locale; `lang="vi-VN"` does not guarantee a Vietnamese native widget.

Focused source changes: `VoucherDateTimeField.jsx`, datetime validation focus target and helper copy in `AdminVouchersPage.jsx`, and corresponding form documentation. The existing Admin page exceeds the project line budget; this task keeps its change limited to datetime wiring and does not broaden the refactor.

## Browser checks

Used the actual AdminVouchersPage and ToastProvider in a temporary harness. All API calls intercepted locally; no real vouchers or database changes made.

- Start 22/10/2027 14:30, end 14:45: rejected with the one-hour message, focusing the end field.
- Changed end to 15:45: Vietnamese summary updated and validation error cleared. Submission succeeded through mocked API; payload contains start `2027-10-22T07:30:00.000Z`, end `2027-10-22T08:45:00.000Z`, matching UTC+7 selections. See payload.json.
- Desktop screenshot confirms combined fields and Vietnamese confirmation text.
- Mobile at 375×812 confirms both combined controls fit; dialog clientWidth and scrollWidth both 326px, no horizontal overflow. See mobile.png.
- Clearing start removes its value and returns focus to the same input.
- Native calendar popup interaction was not separately verified.
- Temporary harness removed, agent tab closed, viewport reset; user's existing tab preserved.

## Automated checks

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 69 passed, no failures or skips.
- Backend unchanged; backend tests not repeated for this UI-only change.
