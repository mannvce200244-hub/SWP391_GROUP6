# Product review paging

Approved completion decision: 2026-10-10. Preserve BR-REVIEW-01 and the existing
create/eligibility contract. No review update, deletion or moderation workflow
is introduced.

## Public list

`GET /api/v1/reviews/product/{productId}/page?page=0&size=5&sort=createdAt,desc`

- Zero-based page index; default size 5, maximum 100. The backend bounds the
  page size. Offsets beyond JPA's integer limit return safe `400` rather than a
  persistence error. Unknown products return `404`.
- Sort fields are only `id`, `createdAt` and `rating`; unsupported fields return
  safe `400`. Default newest first; add an ID tie-break when absent.
- Response: `{content,number,size,totalElements,totalPages,averageRating}`.
  `content` contains existing `ReviewResponse` DTOs. `averageRating` is the
  database average of all reviews of this product; `null` when none exist.
- Existing `GET /api/v1/reviews/product/{productId}` retains its reference-list
  array response for compatibility. Customer product detail uses the page API.
- The server loads response associations in the page query, avoiding one query
  per review. No client full-list slicing/average is required.

## Customer interface

The existing section loads five records per page and reuses catalog pagination.
It shows the global count/average, loading, empty and failure/retry states.
Stale requests cannot replace the current product/page. After successful
submission, return to the first page and recheck eligibility before showing
another submission action. The backend remains authoritative for eligibility.

The UI preserves white/cool-gray surfaces and labelled keyboard controls. No
dependency, frontend test framework or review lifecycle endpoint is added.
