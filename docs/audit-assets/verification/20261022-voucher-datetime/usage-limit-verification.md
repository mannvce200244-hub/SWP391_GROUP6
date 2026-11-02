# Voucher usage-limit clarity — 2026-10-22

An empty optional usage limit already maps to null in create/update services and backend eligibility accepts no configured cap. Minimum quantity is separate from total usage. This change preserves that contract and does not change real voucher data.

## Changed surface

- AdminVouchersPage.jsx: show used count plus explicit maximum or “Không giới hạn lượt” instead of infinity. Label usage limit as optional and associate persistent explanatory helper text with input.
- FORM_VALIDATION_RULES.md: record the presentation and existing optional semantics.

## Browser evidence

Actual AdminVouchersPage with mocked list/update requests, no database writes:

- SALE fixture with null cap displays “Đã dùng 0 lượt / Không giới hạn lượt”.
- LIMITED fixture with cap 100 and used count 7 displays “Đã dùng 7 lượt / Tối đa 100 lượt”.
- Editing SALE shows optional limit and helper, entering 100 and saving updates mocked row to “Tối đa 100 lượt”.
- Screenshot usage-limits.png captures both unlimited and finite rows before update.
- Agent-created harness/tab removed; user's tab preserved.

## Review scope

Automated gates: `npm run lint` and `npm run build` passed; `node --test tests/*.test.mjs` passed all 70 tests, zero failures/skips. Backend unchanged, no backend test rerun needed for display-only changes.

No dependencies, backend/API changes, or business rule changes. Existing table horizontal scrolling remains. No new responsive behavior or control type; browser check at desktop only this turn. Input has visible label and associated helper; text disambiguates state independently of color. Existing validation, pending/error handling and permissions unchanged.

Large file detected: m4n-frontend/src/pages/admin/AdminVouchersPage.jsx. Kept edits limited to usage column and field copy; page-wide extraction remains outside scope.
