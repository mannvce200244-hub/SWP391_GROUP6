# Hosted MoMo sandbox preparation — 2026-10-16

## Requirement and scope

The user requested online payment remain usable after deployment and selected
Vercel frontend + Railway backend. Earlier approval explicitly selected official
MoMo sandbox/card checkout, not real-money processing. PROJECT_SCOPE and
production/development/provider guides record the hosted demo exception.

## Implemented

- `m4n-frontend/vercel.mjs`: native Vercel programmatic configuration, no added
  package; validated `M4N_BACKEND_ORIGIN` from deployment environment, same-origin
  API forwarding, separate SPA fallback and no-store API responses. Rejects
  missing/insecure/local/tunnel credentials/path origins and cross-site browser
  API overrides that would break SameSite refresh cookies.
- `m4n-backend/railway.json`: Maven build, JAR start and public healthcheck.
  `server.port=${PORT:8080}` supports Railway's platform-assigned port.
- `ProductionConfiguration`: retains secure production checks; MoMo needs
  explicit `MOMO_SANDBOX_DEPLOYMENT_ENABLED=true`, complete sandbox credentials,
  permanent HTTPS callbacks with exact return/IPN paths and matching frontend
  return origin. Default still rejects sandbox activation under prod. VNPay
  remains disabled. Fixed official sandbox gateway/verification unchanged.
- Environment examples and `VERCEL_RAILWAY_DEPLOYMENT.md`: root directories,
  Java/Node versions, persistent database/media, migration sequence, secrets,
  stable callback URLs, deployment protection, cookies and acceptance steps.
- Production configuration regressions, Vercel route/config tests and an
  explicit manual `HostedDemoDeploymentSmoke` gate. The manual gate requires a
  prepared disposable schema; it is intentionally separate from default tests
  that create/update their own test schema. No test framework/dependency added.

## Verification

- `mvnw.cmd -o -Dtest=ProductionConfigurationTest,MomoPropertiesTest test`:
  11 passed.
- `mvnw.cmd -o test`: 432 passed, zero failures/errors/skips;
  `m4n-backend/target/hosted-demo-full-tests.log`.
- `mvnw.cmd -o -Dtest=HostedDemoDeploymentSmoke test`: 1 passed;
  `m4n-backend/target/hosted-demo-startup-test.log`.
  Real application booted with prod, validated existing test schema, dynamic
  PORT=0 resolved to ephemeral port 49715, Secure cookies,
  Swagger and development seeding disabled. HTTP health UP and payment options
  MoMo=true/VNPay=false. Synthetic provider/mail credentials only; no outbound
  payment or SMTP requests. Server shut down after the check.
- Full tests and startup gate used the dedicated database
  `m4n_hosted_demo_20261016`, removed after verification. Existing database and
  customer orders unchanged.
- `npm run lint`: passed; `npm run build`: passed;
  `node --test tests/*.test.mjs`: 45 passed, zero failures.
- Security review: configuration secrets stay in Railway, no provider secrets
  in browser configuration, allowlisted return Origin logic unchanged, no CORS
  wildcard/cookie weakening or fake payment success. Provider requests remain
  fixed to MoMo HTTPS; callback signature/amount/identity rules unchanged.
- No UI changed; no new browser UI acceptance needed. Existing local frontend,
  backend and tunnels were retained. No dependency/schema changes.
- A compound shell command to launch a background startup check was rejected
  before execution. Startup was subsequently verified in the existing Maven
  test framework with synthetic configuration and automatic shutdown.

## Remaining host acceptance

No actual Vercel/Railway projects/domains were supplied or deployed. Local tests
do not verify host rewrite execution, TLS, edge protection, cookie forwarding,
provider reachability, merchant acceptance or an online refund. Run the linked
deployment guide's acceptance steps using the actual two stable domains and a
dedicated sandbox order before claiming hosted payment works end to end.

Official Railway documentation states SMTP requires Pro or above; Free/Trial/
Hobby block it. Current Gmail OTP therefore needs Pro or a separately approved
HTTPS email-provider change. This task does not change OTP providers or bypass
email verification.

No edited production file crosses project size thresholds. Deployment code
uses existing monolith boundaries; no controller/service/order refactor.
