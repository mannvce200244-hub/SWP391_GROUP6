# Email OTP configuration repair — 2026-10-15

## Cause and change

The local `.env` had OTP enabled and Gmail credentials present. The dotenv processor was registered under the legacy `org.springframework.boot.env.EnvironmentPostProcessor` factory key. Spring Boot 4.1.1 discovers processors under `org.springframework.boot.EnvironmentPostProcessor`, so an ordinary startup did not discover this loader. A previous launch with manually exported variables concealed the defect.

Updated the processor interface import and `META-INF/spring.factories` key. Replaced the test that manually invoked the processor and depended on a real local JWT value with a deterministic regression test for framework factory discovery. Updated local startup documentation. No dependency, API contract, OTP policy, credential value, or pagination serialization change.

## Verification

- New regression test failed before the fix because Spring Boot could not discover the processor; passed after the fix.
- `mvnw.cmd -o verify`: BUILD SUCCESS, 405 tests, 0 failures/errors/skips. Tests used dedicated database `m4n_verify_otp_20261015`, with external delivery disabled. The database was dropped afterward.
- Replaced the previous local packaged backend with the rebuilt application on port 8080, using schema validation and disabled development seeding. Gmail settings were loaded from `.env` without manually exporting credentials or the enable flag.
- Health endpoint returned 200.
- User explicitly authorized one real OTP email to the configured Gmail sender mailbox. `POST /api/v1/auth/email-otp` with purpose REGISTER returned 200 and the real SMTP send completed successfully. No account was created. Inbox placement must be checked by the mailbox owner.
- Backend process after restart: PID 10792. Logs remain in `m4n-backend/target/local-backend-stdout.log` and `local-backend-stderr.log`; Maven evidence is `target/otp-full-verification.log`.
- No recipient address, credential, OTP code, or challenge identifier is recorded here.

The PageImpl serialization warning is separate from OTP delivery and was not changed in this repair.
