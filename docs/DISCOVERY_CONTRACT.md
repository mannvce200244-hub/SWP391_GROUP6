# Public discovery pagination contract

Decision recorded under the user's request to complete the remaining audit gaps.

- Existing `/artisans` and `/craft-villages` reference arrays remain compatible
  for current association editors. Public discovery uses the paginated APIs.
- `GET /api/v1/artisans/search`: optional `keyword`, Spring `page`/`size` and
  `sort`. Searches name/biography; stable default `id,asc`. Supported sort
  properties: `id`, `name`, `createdAt`. Uses the existing Page JSON contract.
- `GET /api/v1/artisans/{id}`: public summary, `404` when absent. Detail pages
  fetch one record instead of finding it in the entire collection.
- `GET /api/v1/craft-villages/search`: optional `keyword`, exact `location`,
  `page`/`size` and `sort`; keyword searches name/description/location. Same sort
  allowlist and default as artisans.
- `GET /api/v1/craft-villages/locations`: distinct nonblank persisted locations
  sorted ascending for the existing location selector. Locations are stored
  text, not invented province codes or regional groupings.
- Existing global Pageable maximum size applies. Invalid sort returns safe
  `400`. Empty pages are successful empty data, with true database totals.
- Discovery counts use size-one pages' `totalElements`, not full lists.
- The frontend continues its one-based page convention and maps it once in the
  service adapter. No browser slicing/filtering/sorting of database collections.
- Current UI `featured` means stable default order; `az` maps `name,asc` with an
  ID tie-breaker; `newest` maps `createdAt,desc` with an ID tie-breaker. No ranking
  algorithm or new craft/region field is introduced.

Public list/detail reads require no authentication. Controllers delegate to
Service interfaces; Specifications execute filtering and pagination in JPA.
