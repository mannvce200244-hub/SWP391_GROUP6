# Catalogue cleanup — 2026-11-06

The live catalogue contained 93 active products. 87 products matched known POS
integration fixtures by both product/category code (`PM-`/`PV-` plus 32 hex
characters) and category name. Product 50 was the numeric placeholder `111111`.

## Applied production data correction

- Backed up the complete database before changes; private dump and rollback
  records remain outside Git under the user's local M4N backup folder.
- Disabled these 88 products. Five existing instrument products remain active.
- Preserved product identities, prices, order/invoice references and inventory.
- Replaced misleading gallery associations with one instrument illustration per
  product. Added a licensed bamboo-flute photograph for TIEU-001; attribution and
  source are recorded in CONTENT_SOURCES.md.
- All five live image responses were decoded successfully; browser checks also
  confirmed all five images have non-zero natural dimensions.

## Code changes awaiting deployment

- Public category listings omit categories containing only disabled products;
  administration keeps access to all categories.
- Cards and galleries contain the whole image rather than cropping it.
- Gallery illustrations show their caption and, where applicable, source/license.
- Development seed media uses the same correct associations.
- Test runtime refuses application/hosted databases and defaults to m4n_test.
  The safety processor is absent from the packaged production JAR.

## Verification

- Backend `mvnw.cmd -q verify`: 557 tests, zero failures/errors/skips, on a
  dedicated local PostgreSQL test database.
- Frontend lint and production build: passed.
- Media and Vercel regression tests: 8 passed.
- Production catalogue: five products, five loaded images; local gallery:
  full illustration and linked attribution verified.
- Existing unrelated payment-test failures were not resolved by this change;
  the complete frontend test suite is not represented by the eight focused tests.

During anonymous browser startup, session-revision handling caused initial
catalogue requests to fail until Retry. This separate authentication race was
observed on both production and local UI, and is not fixed by this data/media
change. Production still exposes old test category labels until backend deploy.
