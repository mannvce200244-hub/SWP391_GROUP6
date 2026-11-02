# Cultural Article / Guide contract

## Approved audit decision — 2026-10-10

The user delegated completion of the approved cultural-content requirement during the project audit. This contract supplies the previously missing field, publication, permission, and validation decisions. It does not introduce an editorial role, comments, tags, rich-text editor, or dependency.

- One persisted `Article` represents `ARTICLE` (cultural article) or `GUIDE` (care/usage guidance).
- Required title: trimmed plain text, 1–200 characters. Optional summary: trimmed plain text, at most 500 characters. Required content: trimmed plain text, 1–30,000 characters. No HTML interpretation.
- Optional image/video URLs: at most 500 characters, absolute HTTPS URLs with a valid host and no credentials. The backend stores URLs without fetching them. Video opens as an external link; no arbitrary iframe or autoplay.
- Optional positive Product, Artisan, and Craft Village identifiers link existing master data. They may be combined or omitted for general cultural content. Product links must reference an active product when newly assigned; an existing archived product association remains editable and is omitted from public navigation.
- Admin and Super Admin create, edit, publish, unpublish, and delete content. Other actors cannot manage it. Creation always saves `DRAFT`.
- Status is `DRAFT` or `PUBLISHED`. Saving `PUBLISHED` makes the article publicly readable. Publishing sets `publishedAt` on the server; edits while published preserve it. Unpublishing clears it; republishing receives a new publication timestamp.
- Public collection and detail endpoints expose only `PUBLISHED`. Missing and draft identifiers both return 404. Public data never includes the edit version.
- Updates and deletes supply `expectedVersion`; stale edits return 409 and preserve the entered form for review/reload. JPA optimistic locking covers simultaneous writes.
- Artisan and Craft Village deletion is blocked while any article references them. Products use their existing archive lifecycle. Article deletion removes only the article and never a linked master record.
- Collection pagination/filtering happens in PostgreSQL. Public filters: type and Product/Artisan/Craft Village IDs. Admin additionally filters status. Page is zero based; size is 1–100 (default 12 public, 20 Admin). Sorting is fixed and stable: publication time then ID descending publicly; update time then ID descending for management.

## HTTP contract

| Route | Permission | Input / response |
| --- | --- | --- |
| `GET /api/v1/articles` | Public | `page`, `size`, optional `type`, `productId`, `artisanId`, `craftVillageId`; Spring Page of public summaries |
| `GET /api/v1/articles/{id}` | Public | Numeric positive ID; published detail |
| `GET /api/v1/admin/articles` | Admin / Super Admin | Same pagination/association filters plus optional status; Page of Admin summaries |
| `GET /api/v1/admin/articles/{id}` | Admin / Super Admin | Full detail with status/version |
| `POST /api/v1/admin/articles` | Admin / Super Admin | Validated fields above, no status/version; 201 draft detail |
| `PUT /api/v1/admin/articles/{id}` | Admin / Super Admin | Full fields plus required status and nonnegative expectedVersion; updated detail |
| `DELETE /api/v1/admin/articles/{id}?expectedVersion=…` | Admin / Super Admin | Required nonnegative version; 204 |

Summaries contain ID, title, summary, type, safe image URL, publication timestamp and associated IDs/names. Details additionally contain plain-text content and video URL. Admin responses additionally contain status/version/update timestamp. New content is never fabricated or seeded to fill an empty public page.
