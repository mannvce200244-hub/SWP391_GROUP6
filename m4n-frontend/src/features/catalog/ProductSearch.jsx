import { useState } from 'react'
import { IconSearch, IconX } from '../../components/ui/Icons.jsx'

function ProductSearch({
  busy = false,
  className = '',
  id = 'catalog-search',
  onSearch,
  placeholder = 'Tìm theo tên nhạc cụ, nghệ nhân...',
  value = '',
}) {
  const [prevValue, setPrevValue] = useState(value)
  const [query, setQuery] = useState(value)

  // Adjust state during render when incoming prop changes (React recommended pattern)
  if (value !== prevValue) {
    setPrevValue(value)
    setQuery(value)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSearch(query.trim())
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
    document.getElementById(id)?.focus()
  }

  return (
    <form
      className={`relative w-full ${className}`}
      noValidate
      onSubmit={handleSubmit}
      role="search"
    >
      <label className="sr-only" htmlFor={id}>
        Tìm kiếm nhạc cụ truyền thống
      </label>
      <div className="relative flex items-center">
        <span
          aria-hidden="true"
          className="absolute left-3.5 text-muted pointer-events-none flex items-center justify-center"
        >
          <IconSearch className="text-subtle" size={18} />
        </span>

        <input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="w-full h-11 sm:h-12 pl-10.5 pr-28 bg-white text-ink text-sm rounded-xl border border-border placeholder:text-subtle transition-all duration-150 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 disabled:bg-surface-secondary disabled:cursor-not-allowed shadow-xs hover:border-border-strong"
          disabled={busy}
          id={id}
          name="search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          spellCheck="false"
          type="search"
          value={query}
        />

        <div className="absolute right-1.5 sm:right-2 flex items-center gap-1">
          {query ? (
            <button
              aria-label="Xóa từ khóa tìm kiếm"
              className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer"
              onClick={handleClear}
              type="button"
            >
              <IconX size={15} />
            </button>
          ) : null}

          <button
            aria-label="Thực hiện tìm kiếm"
            className="h-8 sm:h-8.5 px-3.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover active:scale-[0.98] transition-all duration-150 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy}
            type="submit"
          >
            Tìm kiếm
          </button>
        </div>
      </div>
    </form>
  )
}

export default ProductSearch
