# M4N Form Validation Rules

This file is the source of truth for frontend form behavior. Frontend validation improves usability; the backend remains authoritative for all security and business decisions.

## Field contract required before implementation

Every field must have a documented contract:

| Attribute | Required definition |
| --- | --- |
| Required? | Required or optional according to approved requirements |
| Type | String, integer, decimal/money input, date/time, enum/reference, file/media, etc. |
| Range | Minimum/maximum value where approved |
| Length | Maximum and any minimum where approved |
| Format | Email, product code, voucher code, URL, etc. |
| Normalization | Trimming/canonicalization that does not alter meaningful data |
| Business constraints | Backend-authoritative rules that affect acceptance |

Do not invent a maximum length, password policy, allowed file type/size, date range, or other constraint. If the backend/business contract is missing, mark it **TBD — team decision required** and resolve it before implementation can safely depend on it.

## Validation layers

1. **Frontend validation:** immediate structural feedback and obvious input protection.
2. **Backend validation:** authoritative structural, security, uniqueness, permission, and business validation.

Frontend success never proves that an email is available, a voucher is valid, inventory is sufficient, an order transition is allowed, a review is eligible, or a payment is accepted.

## Required and string fields

- Required strings reject empty and whitespace-only values.
- Consider `trim()` before validating identifiers/names where surrounding whitespace is not meaningful.
- Do not trim or otherwise normalize secrets such as passwords unless the approved password contract explicitly says so.
- Business text fields need backend-aligned maximum lengths. Unknown limits remain TBD; do not select a convenient number silently.
- Give inputs meaningful `name`, suitable `type`/`inputMode`, and approved autocomplete behavior.
- Do not block paste.

## Email

When an approved form contains email:

- Trim surrounding whitespace and apply the approved normalization.
- Use the appropriate input type and a reasonable format check; do not invent an extremely complex regex.
- Disable spellcheck where useful for email input.
- Backend verifies format, uniqueness, account state, and other authoritative rules.
- A format-valid email must not be presented as available until the backend confirms it.

Whether email is required for each account flow and the exact normalization rules are TBD.

## Password

- Password policy comes from approved security/business requirements; do not invent length or complexity rules.
- Display approved requirements before or while the user enters a password.
- When registration requires confirmation, verify password and confirmation match before submission.
- Do not log passwords or place them in URLs, analytics, `localStorage`, or `sessionStorage`.
- Provide show/hide only when the approved UI includes it, preserving accessible naming and focus.
- Backend hashing and acceptance remain authoritative.

Exact password policy, confirmation requirement, autocomplete values, and recovery behavior are **TBD — team decision required**.

## Numeric fields

For every numeric input, validate that the parsed value is numeric and finite before applying range rules.

- **Cart/POS/direct purchase quantity:** integer and greater than 0; reject `NaN`, negative, zero, and decimal values. Direct purchase requires a positive product ID and quantity within Java Integer range; malformed/duplicate URL parameters block checkout. Server rechecks active product, stock, pricing and discounts (user correction, 2026-10-15).
- **Inventory input:** never allow a negative quantity to be submitted. The exact operation-specific minimum/maximum is TBD.
- **Product listed price:** numeric, finite, strictly positive and within NUMERIC(14,2), without silent rounding. Charged prices can be zero under an approved 100% program.
- **MinimumOrderValue:** numeric, finite, and greater than or equal to 0 when editing the approved voucher condition.
- **DiscountRate displayed as percent:** numeric, finite, and `0 <= value <= 100`. Conversion to the backend's rate representation is TBD; do not calculate the authoritative discount in the browser.

Backend still revalidates every numeric field and remains authoritative for stock, money, and voucher results.

## Validation timing

- Do not show every field as invalid on first render.
- Validate at an appropriate point after interaction, commonly blur or submit.
- On submit, validate all fields and focus or navigate to the first invalid field when practical.
- Update an existing error as the user corrects the field without creating distracting message flicker.
- Use expensive/asynchronous validation sparingly and prevent request spam.

## Error messages

- Place a field error near its field and explain how to fix it.
- Avoid generic text such as “Invalid”, “Bad input”, “Validation error”, or “Error 400”.
- Associate errors with their fields using semantic markup and `aria-describedby`; use `aria-invalid` as appropriate.
- Do not rely on red color alone.
- Do not expose stack traces, database details, internal class names, or unsafe raw server text.

Examples of useful copy:

- “Vui lòng nhập tên sản phẩm.”
- “Giá sản phẩm phải lớn hơn hoặc bằng 0.”
- “Số lượng phải là số nguyên lớn hơn 0.”

Copy must use the product's approved language and terminology.

## Server validation errors

- Preserve and handle server errors; never discard them because frontend validation passed.
- Map field-level errors to the corresponding field when the API contract provides a safe mapping.
- Show global business/permission/conflict errors in an appropriate form-level alert or notification.
- Distinguish authentication, permission, validation, conflict, network, and server failures when the backend contract supports it.
- Keep user input after failure when safe and useful.

The backend error payload schema is TBD.

## Submission behavior

- Validate before sending.
- Prevent double-submit and repeated requests while pending.
- Show a submitting/loading state and communicate it accessibly.
- Handle success and failure explicitly.
- Do not reset the form or redirect before the server confirms success.
- Preserve entered values after API failure unless security or the approved flow requires clearing them.
- Warn before losing meaningful unsaved changes when the approved router/browser flow supports it and the consequence justifies the interruption.

## Labels and accessibility

- Every control has a visible label correctly associated through `htmlFor`/`id` or native wrapping.
- Placeholder text gives supplemental examples only; it never replaces the label.
- Group checkboxes/radios with their labels as one usable hit target.
- Ensure keyboard order follows the visual/reading order.
- Keep focus indicators visible.
- Announce significant asynchronous form status with an appropriate live region.
- Do not use autofocus on mobile or multiple controls; use it only when one clear desktop task benefits.

## Validation matrices

The requirements do not yet define complete fields for every form. This single
matrix records only known constraints. `TBD` cells must not be guessed, and a
row does not authorize implementation of its form.

| Form | Field | Required? | Type | Frontend validation | Backend validation | Error message | Business Rule | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Customer registration/login | Email or identifier | TBD | TBD; email if approved | Apply trim/format only after the identifier contract is approved | Identity lookup, uniqueness where applicable, account/security checks | TBD | None defined | TBD |
| Customer registration/login | Password | TBD per flow | Secret string | Apply only the approved policy; never log or persist client-side | Authoritative credential validation and secure storage | TBD | None defined | TBD |
| Customer registration | Confirm password | TBD | Secret string | Match password only if this field is approved | Revalidate the accepted credential; never trust client confirmation | “Mật khẩu xác nhận không khớp.” only if field is approved | None defined | TBD |
| Customer account/profile | Profile fields | TBD | TBD | Enforce only approved type/length/format | Authoritative validation | TBD | None defined | TBD |
| Product create/update | Product name | TBD | String | Trim; reject blank only if required; maximum length TBD | Enforce approved name constraints | “Vui lòng nhập tên sản phẩm.” only if required | Product management is in scope; field contract is not defined | TBD |
| Product create/update | Category / instrument group | TBD | Backend reference | Accept only backend-supplied choices | Validate reference and permission | “Vui lòng chọn nhóm nhạc cụ hợp lệ.” only if required | Approved concepts include Dây/Hơi/Gõ; representation is TBD | TBD |
| Product create/update | Artist/Artisan | TBD | Backend reference | Use backend-supplied choices | Validate reference | TBD | Product search/detail supports Artist/Artisan | TBD |
| Product create/update | Craft Village | TBD | Backend reference | Use backend-supplied choices | Validate reference | TBD | Product search/detail supports Craft Village | TBD |
| Product create/update | Price | Required | JSON decimal | Strictly positive; at most 12 integer and 2 fraction digits | Validate exact NUMERIC(14,2), no silent rounding | “Giá niêm yết phải lớn hơn 0, tối đa 12 chữ số nguyên và 2 chữ số thập phân.” | PRICING_CONTRACT | APPROVED |
| Product create/update | Material, dimensions, audio/vocal range, origin | TBD | String/reference/structured value TBD | Enforce only an approved representation, unit, and limit | Authoritative validation | TBD | Product detail concepts are approved; field contracts are not | TBD |
| Product create/update | Image/video | TBD | File/URL TBD | File type, size, count, URL, and upload behavior TBD | Validate approved media/storage contract | TBD | Product images/video are in scope | TBD |
| Cart / POS bill | Quantity | Yes when an item is present | Integer | Numeric, finite integer `> 0`; control duplicate/spam updates | Recheck quantity, current stock, and operation rules | “Số lượng phải là số nguyên lớn hơn 0.” | BR-ORDER-01; BR-INVENTORY-01/02/03; BR-POS-01 | APPROVED |
| POS MoMo sandbox | Customer email | Required only for MoMo card | Email string, max 255 | Trim, email format, native email input; never collect card data | `@NotBlank`, `@Email`, max 255, lowercase snapshot | “Vui lòng nhập email hợp lệ của khách hàng để thanh toán thẻ MoMo.” | User-approved POS MoMo extension; provider card contract | APPROVED |
| POS MoMo sandbox | Payment ID / expected amount | Required transport metadata | `pos-` + 32 lowercase hex characters / integer VND | Generate ID once before request; keep unknown outcome for reconciliation | Owner-bound idempotency; backend recalculation, amount equal to acknowledged preview and within 1,000–10,000,000 VND | Reload bill if price changed; reconcile unknown transaction | BR-POS-01; BR-PAYMENT-01 | APPROVED |
| Voucher create/update | Code | TBD | String | Trim/format only after the contract is approved | Validate uniqueness and approved constraints | TBD | Voucher management is in scope; code rules are not defined | TBD |
| Voucher create/update | DiscountRate | Required for approved percentage formula | Percent input | Numeric, finite, `0 <= value <= 100`; wire representation TBD | Recalculate authoritative discount; enforce approved representation/rounding | “Tỷ lệ giảm giá phải từ 0 đến 100.” | BR-VOUCHER-01 | APPROVED range; representation TBD |
| Voucher create/update | MinimumOrderValue | Required for approved voucher condition | Money input | Numeric, finite, and `>= 0` | Enforce `OrderAmount >= MinimumOrderValue` | “Giá trị đơn hàng tối thiểu không được âm.” | BR-VOUCHER-01 | APPROVED constraint; representation TBD |
| Voucher create/update | Start/end dates | Not approved / TBD | Date/time TBD | Do not validate or add until expiry is approved | Enforce only future approved date rules | TBD | Voucher expiry is explicitly undefined | TBD |
| Checkout | Customer/contact/delivery fields | TBD | TBD | Validate only approved required fields/contracts | Authoritative validation | TBD | Checkout is in scope; field list is not defined | TBD |
| Checkout | Payment option | Yes | Backend-supported enum/reference | Require one approved backend-supported option | Validate availability and result | “Vui lòng chọn phương thức thanh toán.” | Online payment and COD are in scope; gateway/encoding TBD | APPROVED concept; contract TBD |
| Checkout | Voucher | No unless requirements change | Code/reference TBD | Submit approved input and show backend validation state | Validate condition and calculate result | Safe backend-derived message | BR-VOUCHER-01 | APPROVED optional concept; contract TBD |
| Checkout | OrderAmount / Discount / FinalAmount | Read-only preview | Money display | Never accept browser values as authoritative | Recalculate all authoritative values | Safe mismatch/update feedback | BR-VOUCHER-01 | APPROVED authority; representation TBD |
| Review | Content/rating | TBD | TBD | Constraints TBD | Validate content, ownership, and permission | TBD | Product review is in scope; content/rating contract is not defined | TBD |
| Review | Eligibility | Not editable | Backend state | Show action only from backend-provided eligibility | Require matching Product in Customer's `COMPLETED` Order | Safe eligibility message | BR-REVIEW-01 | APPROVED |

Current stock may inform a UI warning, but online checkout never reserves stock;
Staff/Admin rechecks it at confirmation. The API representation for every field
is governed by [`API_CONTRACT_RULES.md`](API_CONTRACT_RULES.md).

## Form completion checklist

### Feature completion decisions — 2026-10-10

Earlier TBD cells are historical scaffold notes. The approved feature contracts
in `API_CONTRACT_RULES.md` now define the corresponding form fields. Apply:

- Product listed price: strictly positive NUMERIC(14,2), max 999,999,999,999.99;
  billable weight optional positive NUMERIC(10,3); per-unit bulky surcharge whole
  VND, nonnegative, up to 13 integer digits (`PRICING_CONTRACT.md`).
- Product program percentage 0–100%, max two decimal percentage digits; required
  active product/name≤150; optional ISO dates, end strictly after start.
- Shipping settings: nonnegative rate/kg up to 12 integer/2 fractional digits;
  an enabled freeship threshold is a nonnegative whole VND amount up to 13 digits.
- Shipping vouchers use a positive fixed whole-VND amount up to 13 digits and
  omit percentage. Other vouchers use decimal rate0..1 up to four fraction digits;
  the Admin percentage input has at most two fraction digits. Descriptions≤255,
  codes≤50. Once referenced by a sale, the promotion type is immutable.
- Stock creation/confirmation and QC: `STOCK_CONTRACT.md`; creating a draft does
  not alter stock. Reason fields≤500; positive integer quantity; rejected0..qty.
- Content fields/URLs/version checks: `CONTENT_CONTRACT.md`.
- VNPay refund reason≤500; explicit full-refund confirmation, pending state and
  reconcile action: `EXTERNAL_INTEGRATIONS.md`. No client editable paid status.

Backend request validation is required in addition to these UI constraints;
monetary intermediate/final totals must fit their database columns.

- [ ] Every field has a label and an approved required/optional status.
- [ ] Required strings reject whitespace-only values.
- [ ] Approved type, range, length, format, and normalization rules are enforced.
- [ ] Numeric input rejects `NaN`, infinity, and invalid integer/decimal forms.
- [ ] Field errors are specific, nearby, semantic, and not color-only.
- [ ] Server field/global errors are handled safely.
- [ ] Double-submit is prevented only while pending.
- [ ] Loading, disabled, success, and failure behavior is defined.
- [ ] Failure does not unnecessarily erase user input.
- [ ] Keyboard and mobile behavior are usable.
- [ ] Frontend does not replace backend validation or authority.
- [ ] No TBD constraint was silently invented.

If any applicable check fails, the form is not complete.

## Approved customer-flow fields — 2026-10-12

| Field | Rules |
| --- | --- |
| Email OTP request | Existing valid email ≤255 characters, trimmed/lowercased on backend; purpose exactly REGISTER or RESET_PASSWORD |
| Registration steps (2026-10-16) | Accepted details persist an unverified CUSTOMER; hide all profile/password inputs, clear plaintext passwords from memory and show only OTP. Login resumes verification when credentials match. Store only email/challenge metadata in the tab; verification uses no resubmitted profile/password. |
| OTP proof | Required challenge ID ≤36 characters and code exactly six ASCII digits; email/purpose binding, expiry and attempts validated by backend |
| OTP reset | Existing password rules (8–72 characters, ≤72 UTF-8 bytes), matching confirmation; no password/code persisted in browser storage |
| Delivery address | When GHN enabled: positive province/ward IDs, verified hierarchy, required street details ≤200 characters; canonical full address ≤300 |
| Carrier preview recipient | Required name ≤150 and existing Vietnamese mobile format; preview blocked until complete |
| Saved recipient address | Same checkout name/mobile/email/address/notes limits; multiple owned entries, optional notes ≤500; structured GHN address required when enabled; update/delete send loaded version |
| Fee acknowledgment | Nonnegative money (≤13 integer /2 fraction digits), required for GHN Place Order; must match backend's newly calculated net fee |
| Product images | JPEG/PNG only, ≤10 files/submission, ≤5 MB/file, backend-decoded ≤16 megapixels; safe reencoding and randomized storage names |
| GHN package dimensions | Existing product dimensions field ≤100 characters; carrier use requires positive integer length x width x height cm, each 1–200, and positive billable weight; parcel limits in CUSTOMER_FLOW_INTEGRATIONS.md |

Native OTP inputs permit paste/password-manager one-time-code autofill. Provider
unavailability returns safe actionable copy; errors preserve other form fields.
No bank/MoMo credentials are accepted by checkout. Missing API configuration
does not generate simulated OTP, shipping rates or successful payments.
