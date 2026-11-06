# Production returns and twelve-product demo catalogue — 2026-11-06

## Configuration

Payment return defaults (VNPay and MoMo) and the Google callback now derive from
`FRONTEND_URL`, rather than a localhost constant. Explicit provider environment
overrides retain precedence. The checked-in, non-secret
`m4n-backend/.env.production.example` contains this project's Vercel/Railway URLs.
Copy these values into Railway and redeploy; editing a local file or PostgreSQL
does not change a running Railway service's environment. Production additionally
rejects Google callbacks that point to a different frontend or localhost.

An existing gateway checkout URL has already captured its return URL. Changing
configuration affects newly generated payment links; do not pay again to test an
old charged transaction. VNPay's registered IPN endpoint must also point at
`https://swp391group6-production.up.railway.app/api/v1/payments/vnpay/ipn`.
The VNPay IPN environment value alone does not change merchant-side registration.
Payment success still requires signed server verification. The supplied browser
return for order 538 does not authorize manually marking that order paid; the
database read during investigation still showed PENDING_CONFIRMATION/unpaid.
No payment, refund, order status or enabled-provider policy was changed here.

## Approved catalogue

`m4n-backend/src/main/resources/seed/catalog.json` is the shared source for the
twelve demo products: four string, four wind, four percussion. It contains price,
initial stock, shipping weight, material, dimensions, range and a matching bundled
photograph. Demo specifications and illustrations are identified as such.
Development startup reads this dataset without overwriting existing products,
media, prices or inventory. Production startup keeps development seeding off.

The seven additional products are TAM-001, SAO-002, TIEU-002, TCM-001, TDE-001,
SLO-001 and PHA-001. No new customer, order, invoice, payment, artisan or village
fixtures are required for the production catalogue import. Existing historical
POS fixtures remain disabled. Photograph sources/licenses are in CONTENT_SOURCES.

The reviewed one-off import is performed separately with a full private pg_dump,
rollback records, parameterized writes and before/after checks preserving all
existing prices, stock and historical transaction counts. New products alone
receive the explicitly approved sample opening quantities. Image links are
verified immutable GitHub asset URLs so the import does not depend on an
unreleased frontend deployment. Import results are recorded locally in
`20261106-twelve-product-import.json` after successful commit.

## Verification

- Backend `mvnw.cmd -q clean verify`: 561 tests, zero failures/errors; dedicated
  local PostgreSQL test database, external integrations disabled.
- Frontend `npm run lint`, `npm run build`: passed.
- Media/catalogue/Vercel regression tests: 10 passed.
- The initial completeness assertion exposed an intentionally preserved empty
  gallery in the reused test database. The test now checks the bundled seed
  completeness separately from merchant-owned persistent media. Re-running
  seed explicitly verifies price, stock and gallery edits are preserved.
- All five newly downloaded photographs decoded and visually inspected;
  attribution and licenses are maintained in the gallery and source register.
- The separately reported anonymous startup session race remains outside this
  change. Production hosting configuration and a full sandbox payment on the
  deployed release still require verification after Railway redeploy.
