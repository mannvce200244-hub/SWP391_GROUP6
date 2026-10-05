function generatePageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

function Pagination({ className = '', currentPage = 1, onPageChange, totalPages = 1 }) {
  if (totalPages <= 1) return null

  const pages = generatePageNumbers(currentPage, totalPages)

  return (
    <nav
      aria-label="Điều hướng trang sản phẩm"
      className={`flex items-center justify-center gap-1.5 pt-8 pb-4 select-none ${className}`}
    >
      {/* Previous button */}
      <button
        aria-label="Trang trước"
        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-control-border bg-surface text-ink text-sm font-medium hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
      >
        ←
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="w-9 h-9 flex items-center justify-center text-xs text-muted"
            >
              …
            </span>
          )
        }

        const isCurrent = page === currentPage
        return (
          <button
            key={page}
            aria-current={isCurrent ? 'page' : undefined}
            aria-label={`Trang ${page}`}
            className={`w-9 h-9 flex items-center justify-center rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              isCurrent
                ? 'bg-brand text-white shadow-xs'
                : 'border border-control-border bg-surface text-ink hover:bg-surface-secondary'
            }`}
            onClick={() => onPageChange(page)}
            type="button"
          >
            {page}
          </button>
        )
      })}

      {/* Next button */}
      <button
        aria-label="Trang kế tiếp"
        className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-control-border bg-surface text-ink text-sm font-medium hover:bg-surface-secondary disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
      >
        →
      </button>
    </nav>
  )
}

export default Pagination
