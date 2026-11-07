# Production demo-data cleanup — 2026-11-07

The user explicitly approved removing the identified PM/PV/SWT301 fixture graph
after a full backup, including its completed order and issued test invoices.
This is a one-off approved data cleanup, not a change to historical-data rules
or an application-startup migration. No replacement sales or customers were invented.

## Database operation

- Created a private full PostgreSQL custom-format dump; `pg_restore --list`
  succeeded (251 archive entries). The dump, full before/after row snapshots,
  and detailed recovery evidence stay outside Git under the user's local
  `m4n/backups/fixture-cleanup-20261107-202324` directory.
- In one locked transaction, checked exact fixture identifiers, verified that
  every affected invoice/order contained fixture products only, then deleted
  children before parents without disabling foreign keys.
- Removed 90 fixture products, 87 fixture categories, 13 orders, 37 invoices,
  94 POS payment intents, two online sandbox payment attempts, six stock
  documents and their dependent rows. The two online attempts were pending;
  their complete records remain in the private backup. No provider payment or
  refund action was performed.
- Removed the unused SWT fixture voucher and 34 related notifications.
- Anonymized the exact user-requested personal display name on two profiles,
  seven order snapshots, two invoice snapshots and one saved address.
  IDs, emails, phones, credentials, roles and payment payloads were preserved.
- Compared every remaining row in every public table against the pre-operation
  snapshot, allowing only those explicit deletions/display-name edits. Remaining
  prices, totals, payment/status fields and stock matched exactly.
- Result: 3 categories, 12 active products, 77 retained orders and 6 retained
  invoices. The previously inactive numeric placeholder remains inactive;
  it was outside the approved PM/PV/SWT deletion set.
- A fresh read-only scan found no remaining SWT301 or POS MoMo/VNPay test
  records in products, categories, orders or invoices.

Aggregate counts and dump checksum: [20261107-demo-cleanup.json](20261107-demo-cleanup.json).

## Images and UI

- Corrected the artisan photo's encoded source URL in production and development
  seed data. The original publisher continues hosting the photograph; no new
  portrait or identity is fabricated.
- Added one feature-local portrait component shared by discovery cards and the
  detail page. `no-referrer` allows the publisher image to load; failed/missing
  photos show an honest neutral placeholder instead of a broken image or a shop
  photograph labelled as someone's portrait.
- Browser verified the patched detail page using the production API: the portrait
  loaded with `no-referrer`, and the desktop page had no horizontal overflow.
  Production's older frontend still needs this frontend deployment for the
  referrer/fallback fix. Updating the database URL alone was insufficient.
- Browser verified production catalog: 12 products, no test labels, and all nine
  product images on the first page loaded. Screenshot: [catalog](20261107-clean-catalog.jpg).
- Screenshot of the patched detail page: [portrait](20261107-artisan-portrait-desktop.jpg).
- Mobile viewport override did not apply to the tested tab; no mobile pass is
  claimed. Existing responsive layout classes and image frame dimensions remain.
- No form, route, API contract, price, inventory or permission rule changed.
  No dependency added. Local UI/UX, React and security guidance informed review;
  project rules remained authoritative.
- Focused Web Interface Guidelines audit: `ArtisanPortrait.jsx` has a meaningful
  alternative, reserved parent image space and white/cool-gray fallback; both
  callers preserve image dimensions and existing loading priority.

## Verification

- `npm run lint`: passed.
- `npm run build`: passed.
- `node --test tests/*.test.mjs`: 95 passed, 3 existing failures in
  `posMomoService.test.mjs`. The untouched service currently uses VNPay while
  those tests expect MoMo paths/URLs. This unrelated mismatch is not changed here.
- Backend `clean verify`: passed; 566 tests, zero failures/errors. Tests use only
  the dedicated local `m4n_test` database. The first attempt found that database
  missing; created it locally and reran. No tests connected to production.
- Existing test environment guard rejects hosted/application databases before
  fixtures run. External/manual API testing must also target a separate test
  deployment; it is not protected by the Maven test guard.

Large file detected: `m4n-backend/.../config/DataSeeder.java`.
Large file detected: `m4n-frontend/src/pages/ArtisanDetailPage.jsx`.
The seeder changes one URL; the page delegates its existing image to the shared
portrait component. A broad seeder/page refactor is outside this cleanup.
