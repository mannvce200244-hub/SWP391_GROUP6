# Code review and verification — 2026-10-16

## Scope

Reviewed the existing authentication/OTP/session, catalog/media, cart/direct
checkout, orders, inventory, pricing/vouchers, payment/refund, POS, saved address,
chat, notification and administration code. This is a review of the current
implementation with regression checks; it does not prove every possible defect
has been eliminated.

## Confirmed defects repaired

### Pagination returned HTTP 500 for excessive page numbers

JPA only supports integer offsets. Requests such as `page=2147483647` reached
JPA with unsupported offsets in several list services. Added validation before
queries, using the existing HTTP 400 error contract.

Changed services under `m4n-backend/src/main/java/com/m4n/backend/service/serviceImpl/`:

- `OrderServiceImpl.java`
- `PosServiceImpl.java`
- `InventoryServiceImpl.java`
- `StockDocumentServiceImpl.java`
- `AdminUserServiceImpl.java`
- `NotificationServiceImpl.java`
- `DeliveryAddressServiceImpl.java`
- `PosMomoPaymentServiceImpl.java`
- `ChatServiceImpl.java`

Regression test:
`m4n-backend/src/test/java/com/m4n/backend/service/PaginationBoundaryIntegrationTest.java`.
Eleven parameterized endpoint cases failed with HTTP 500 before the repair.
The final test covers those endpoints plus conversation messages, and checks
that ordinary page-zero requests still succeed. Tests use their own users and
transactional rollback.

### Response bodies could finish after an account change

`m4n-frontend/src/api/apiClient.js` checked the session when response headers
arrived, but did not check again after asynchronous body decoding. A response
from the previous session could therefore reach UI code after logout/account
switch. It now checks the session after JSON/text and blob decoding as well.

Two regression cases in `m4n-frontend/tests/apiClient.test.mjs` reproduce delayed
JSON across account switching and delayed invoice blobs across logout. Both
failed before the repair and pass afterward. The new session token is preserved.

### Default localhost upload URLs were rejected as product media

`m4n-frontend/src/features/catalog/productMedia.js` now accepts HTTP upload URLs
only on HTTP pages, from the exact configured loopback API origin and canonical
media path/PNG filename. HTTPS pages still reject HTTP media. Credentials,
control characters, backslashes and arbitrary HTTP hosts/paths remain rejected.

Three cases in `m4n-frontend/tests/productMedia.test.mjs` cover rendering, unsafe
URLs and HTTPS mixed content protection. The local-upload success case failed
before the repair.

## Verification

| Gate | Result |
| --- | --- |
| Backend baseline `mvnw.cmd -o test` | 471 passed |
| Final backend `mvnw.cmd -o verify` | BUILD SUCCESS; 483 tests, zero failures/errors/skips; executable JAR packaged |
| Frontend `npm run lint` | Passed |
| Frontend `npm run build` | Passed |
| Frontend `node --test tests/*.test.mjs` | 60 passed; zero failures/skips |
| Restarted packaged backend | Started with schema validation and development seeding disabled |
| `GET http://localhost:8080/api/v1/health` | HTTP 200 |
| Browser: real ProductGallery with local backend upload | Image complete, natural dimensions 1200 × 896 |
| Browser: `/products?group=DAY` | Selected group visible; four products rendered |

Backend test logs are under `m4n-backend/target/code-review-*.log`; frontend
check logs are also stored there. These are local build artifacts.

Browser evidence: [Local upload gallery](local-upload-gallery.png).

## Cleanup and limits

- Integration tests ran against disposable PostgreSQL database
  `m4n_review_20261016`, which was dropped after verification.
- Removed the temporary gallery HTML and uploaded PNG fixture, stopped the
  temporary Vite server on 5175 and closed the agent's review tab. The user's
  frontend on 5173 and restarted backend on 8080 remain available.
- No dependencies, schema migrations or approved business rules were changed.
- No actual MoMo charge/refund was performed. Existing gateway tests use mocked
  provider responses; live provider behavior requires a separate sandbox run.
- No configured frontend end-to-end runner exists; browser verification was
  limited to the cases above.
- Existing large files `OrderServiceImpl.java` (879 lines) and
  `PosServiceImpl.java` (567 lines) received only pagination guards. Broader
  extraction would exceed these confirmed bug fixes.
- The existing Spring Data `PageImpl` serialization warning remains; changing
  pagination response formats globally was not required for these repairs.
