import { IconSearch } from '../../components/ui/Icons.jsx'

function ArtisanFilters({
  activeTab = 'artisans',
  craftOptions = [],
  filters = {},
  onClearFilters,
  onFilterChange,
  provinceOptions = [],
  totalResults = 0,
}) {
  const isArtisans = activeTab === 'artisans'
  const hasActiveFilters = Boolean(
    (filters.search && filters.search.trim() !== '') ||
      (filters.craft && filters.craft !== 'all') ||
      (filters.province && filters.province !== 'all') ||
      (filters.sort && filters.sort !== 'featured'),
  )

  const searchPlaceholder = isArtisans
    ? 'Tìm theo tên nghệ nhân, nghề thủ công...'
    : 'Tìm theo tên làng nghề, địa phương...'

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top row: Search Bar & Filters Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        {/* Search Input (5 cols on lg) */}
        <div className="lg:col-span-5 relative">
          <label htmlFor="artisan-search-input" className="sr-only">
            {searchPlaceholder}
          </label>
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
            <IconSearch size={18} />
          </div>
          <input
            autoComplete="off"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface border border-control-border text-ink placeholder:text-muted/70 text-sm transition-all focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 shadow-2xs"
            id="artisan-search-input"
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder={searchPlaceholder}
            type="search"
            value={filters.search || ''}
          />
        </div>

        {/* Dropdowns row (7 cols on lg) */}
        <div className="lg:col-span-7 flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Province Filter */}
          <div className="w-full sm:w-auto sm:flex-1">
            <label htmlFor="filter-province" className="sr-only">
              Tỉnh / Thành phố
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-control-border text-ink text-sm transition-all focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 shadow-2xs cursor-pointer"
              id="filter-province"
              onChange={(e) => onFilterChange('province', e.target.value)}
              value={filters.province || 'all'}
            >
              <option value="all">Tất cả địa phương</option>
              {provinceOptions.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          {/* Craft Filter */}
          <div className="w-full sm:w-auto sm:flex-1">
            <label htmlFor="filter-craft" className="sr-only">
              Loại nghề thủ công
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-control-border text-ink text-sm transition-all focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 shadow-2xs cursor-pointer"
              id="filter-craft"
              onChange={(e) => onFilterChange('craft', e.target.value)}
              value={filters.craft || 'all'}
            >
              <option value="all">Tất cả loại nghề</option>
              {craftOptions.map((cr) => (
                <option key={cr} value={cr}>
                  {cr}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="w-full sm:w-auto sm:flex-1">
            <label htmlFor="filter-sort" className="sr-only">
              Sắp xếp
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-control-border text-ink text-sm transition-all focus:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/15 shadow-2xs cursor-pointer"
              id="filter-sort"
              onChange={(e) => onFilterChange('sort', e.target.value)}
              value={filters.sort || 'featured'}
            >
              <option value="featured">Nổi bật nhất</option>
              <option value={isArtisans ? 'experience' : 'artisans'}>
                {isArtisans ? 'Nhiều kinh nghiệm nhất' : 'Nhiều nghệ nhân nhất'}
              </option>
              <option value="az">Tên A → Z</option>
              <option value="newest">Mới cập nhật</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bottom Status bar: Result Counter + Clear Filter Button */}
      <div className="flex items-center justify-between gap-3 text-xs sm:text-sm text-muted pt-1 border-t border-border/60">
        <div className="flex items-center gap-2">
          <span>
            Tìm thấy <strong className="text-ink font-semibold">{totalResults}</strong> {isArtisans ? 'nghệ nhân' : 'làng nghề'}
          </span>
          {filters.search && (
            <span className="text-muted/70 truncate max-w-[200px] sm:max-w-xs">
              cho "{filters.search}"
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-hover hover:underline transition-colors cursor-pointer"
            onClick={onClearFilters}
            type="button"
          >
            ✕ Xóa bộ lọc
          </button>
        )}
      </div>
    </div>
  )
}

export default ArtisanFilters
