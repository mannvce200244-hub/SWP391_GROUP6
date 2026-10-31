# Account email uniqueness — 2026-10-16

The user requires each account email to be unique. Existing registration and
Admin account creation already trim/lowercase new emails and use
`existsByEmailIgnoreCase` before insertion. The existing exact-string unique
column protects normalized concurrent application writes, but did not prohibit
case/space variants inserted outside those services.

## Change

- Added ordered migration 18, `20261016_unique_account_email.sql`, defining unique
  expression index `uq_users_email_normalized` on `LOWER(BTRIM(email))`.
- The index applies across roles, verified/unverified and active/inactive users.
  It does not alter or delete historical account records. Historical conflicts
  cause a transaction rollback requiring an approved data correction.
- Existing HTTP conflict mapping already recognizes `uq_users_email...` and
  returns 409 `EMAIL_ALREADY_EXISTS`; no new HTTP endpoint or UI was needed.
- Documented the approved invariant in BR-AUTH-09, database guide and rollout.

## Verification

- Focused `PendingRegistrationIntegrationTest`: 12 tests passed.
- Added coverage: uppercase duplicate email rejected with HTTP 409 before and
  after verification; surrounding spaces normalized by the service; repeated
  registration preserves the User ID and does not send another OTP; database
  rejects a direct case/space variant; two concurrent starts create one account
  and send one OTP.
- Migration executed twice against the disposable test schema: passed.
- Local configured database preflight: zero duplicate normalized-email groups.
- Migration applied to local configured database: index is unique and valid.
- Running backend health after migration: HTTP 200.

Integration tests use disposable `m4n_unique_email_20261016`, with mocked SMTP.
No test accounts or verification mail were added to the user's database.
No dependencies added, no production controller/service logic changed, no UI
change, and no outstanding acceptance issue found. No file crossed its size
review threshold.

Deployment: run the new ordered SQL upgrade before restoring application writes.
Hibernate `ddl-auto=validate` does not validate expression indexes; development
`update` does not create this index automatically.

Full gate: `mvnw.cmd -o verify` passed with 452 tests, zero failures/errors/skips and successful packaged build. Disposable test database removed after verification.
