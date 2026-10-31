# Cultural content implementation review — 2026-10-10

## Scope and decision

Approved Article/Guide persistence, Admin management and customer browsing are implemented under [CONTENT_CONTRACT.md](CONTENT_CONTRACT.md). No new dependency, editorial role, fake cultural content, HTML editor, comments or iframe was added.

## Delivered

- PostgreSQL Article entity, enum statuses/types, optional Product/Artisan/Craft Village associations, timestamps and JPA optimistic version.
- Reviewed deployment schema script [20261010_articles.sql](migrations/20261010_articles.sql) matches entity columns, optional restrictive foreign keys, publication/association indexes, statuses and version. It inserts no content.
- Published-only public detail/list with server filters and pagination; Admin CRUD/publish/unpublish with expected-version checks.
- Separate request/response DTOs, service interface/implementation, repository/entity graph and transformation-only mapper. Controllers remain transport-only.
- Required plain-text validation and optional HTTPS media validation; unsafe schemes, credentials and malformed ports are rejected. External video links use `noopener noreferrer`; content is rendered as escaped React text.
- Customer list/detail, related content on all three provenance/detail surfaces; responsive navigation and Admin sidebar entry.
- Admin editor: loading/pending/error/recovery, explicit association search, preserved input on conflict, explicit reload and unsaved-edit confirmation, keyboard containment/restoration, inline errors and first-invalid focus.
- Draft delete confirmation, collection page clamp, request cleanup/stale-response guards, image fallback and reserved dimensions. All new surfaces use white/cool-gray backgrounds.
- Public/Admin Article pagination rejects offsets beyond the JPA integer range with a safe 400 response instead of a database error.

## Verification

- Targeted ESLint over all new content files and changed routing/navigation/detail integrations: passed.
- `npm run build`: passed (Vite production bundle includes lazy public/Admin content routes and payment-return integration).
- Backend ArticleIntegrationTest: 8/8 passed in the security owner's combined targeted Maven run (126 tests total, zero failures/errors). Production/test sources compiled. Earlier sandbox network and concurrent Payment test import blockers were resolved before this successful run.
- A ninth Article regression for public/Admin database pagination overflow was added after that run. Final whole-suite evidence is recorded in [audit-completion.md](audit-completion.md).
- ArticleIntegrationTest includes 9 cases: persisted drafts/public 404, publication withdrawal/time preservation, filtered server pagination excluding drafts, stale update/delete integrity, nonexistent association rejection, required text/unsafe URL constraints, Customer/Staff denial, Admin field errors and pagination overflow.
- The security owner independently checked Article deployment schema parity against the entity and approved content contract: passed, including columns, enum values, optional restrictive foreign keys, version, publication rules and indexes.
- Significant UI source audit used the current [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Resolved modal scroll containment, unsaved reload protection, association search names/IME behavior, URL port parity and public page/query clamp. Parent owns combined live browser checks at the final freeze; no independent server was started.

## Ownership notes

- Root owns Artisan/Craft Village deletion guards using ArticleRepository `existsByArtisanId`/`existsByCraftVillageId` and their fixtures.
- Security owner added public GET `/articles/**` while existing Admin security plus method role checks protect management.
- Root owns existing discovery service/backend pagination; content picker uses `/artisans/search`, `/craft-villages/search` and `/products` with keyword/page/size.
- Generic optimistic-lock message now describes data rather than users; existing error code is preserved for AdminUsers recovery compatibility.
- No newly edited content file crossed the architecture size review threshold. Existing oversized router/layout remain focused integration changes without broad refactor.

## Remaining verification

Combined backend and frontend results, local schema validation and API smoke evidence are recorded in [audit-completion.md](audit-completion.md). Phase 2 rendered public/Admin content flows remain unverified because the browser-control tools became unavailable. The reviewed Article deployment SQL is included in the controlled rollout order.
