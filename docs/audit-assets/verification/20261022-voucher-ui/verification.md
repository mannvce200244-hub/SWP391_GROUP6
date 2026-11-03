# Vietnamese voucher period UI — 2026-10-22

## Changes

- Grouped the fields under “Thời gian áp dụng” with “Bắt đầu áp dụng” and
  “Kết thúc áp dụng” fieldsets. Each shows short visible “Ngày” and “Giờ” labels,
  preserving complete accessible names and the explicit 24-hour instruction.
- Date/time controls sit together on each row; narrow screens below 360px stack
  them. Neutral white surfaces, existing tokens and 44px controls retained.
- Replaced “Bỏ mốc” with a quiet “Xóa” action. It clears only its own pair and
  restores keyboard focus to that date input.
- Selected dates have a Vietnamese confirmation such as “14:30, ngày 22/10/2027”
  using Intl formatting. Native calendar appearance can still follow browser
  locale; the confirmation remains day/month/year.
- Shortened the threshold and period explanations. Kept the one-hour rule and
  concrete earliest end hint; no business, backend, API or dependency changes.
- Modified `VoucherDateTimeField.jsx`, `AdminVouchersPage.jsx` and
  `docs/FORM_VALIDATION_RULES.md`.

## Verification and review

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 69 passed, zero failures/skips.
- Actual page/components checked through a temporary local harness with all
  requests mocked. No application voucher/database mutation was performed.
- Desktop and 375×667 screenshots inspected. On mobile, dialog width 343.2px,
  clientWidth/scrollWidth both 326px; both date and time remained readable.
- Clearing only the end retained the selected start and focused
  `promotion-validUntil-date`. Reentering end 15:45 and submitting start 14:30
  sent the expected UTC times (07:30Z–08:45Z) and showed success feedback.
- Existing period, required/pattern validation, edit timestamp preservation and
  pending guards retained; this layout/copy pass did not change their logic.
- Labels, legends, heading order, field descriptions, focus-visible styling,
  button targets and localized summaries reviewed. No placeholder-only labels,
  secret exposure, injected HTML, polling or new request waterfall introduced.
- Focused UI/UX Pro Max label guidance applied. React/security and current Web
  Design Guidelines reviewed for the changed controls; no broad redesign added.
- Temporary voucher-ui-check HTML/JSX and agent tab removed; viewport reset and
  user tab preserved.

Large file detected: `m4n-frontend/src/pages/admin/AdminVouchersPage.jsx`.
The existing oversized page retains form orchestration. Date/time rendering and
interaction remain in its existing feature component; broader page decomposition
is outside this focused presentation fix.

## Evidence

- [Desktop](desktop.png)
- [Mobile](mobile.png)
- [Synthetic request payload](payload.json)
