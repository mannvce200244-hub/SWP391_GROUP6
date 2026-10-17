import { useEffect, useState, useCallback } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { ProductGridSkeleton } from '../components/ui/Skeleton.jsx'
import Button from '../components/ui/Button.jsx'
import { IconFilter } from '../components/ui/Icons.jsx'
import ProductFilters from '../features/catalog/ProductFilters.jsx'
import ProductGrid from '../features/catalog/ProductGrid.jsx'
import ProductSearch from '../features/catalog/ProductSearch.jsx'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import ActiveFilterChips from '../features/catalog/ActiveFilterChips.jsx'
import MobileFilterDrawer from '../features/catalog/MobileFilterDrawer.jsx'
import Pagination from '../features/catalog/Pagination.jsx'
import productService from '../services/productService.js'
import { ROUTE_CHANGE_EVENT } from '../routes/customerRoutes.js'

const EMPTY_FILTERS = Object.freeze({
  keyword: '',
  group: '',
  artisan: '',
  craftVillage: '',
  minPrice: '',
  maxPrice: '',
})

const ITEMS_PER_PAGE = 9

const CATEGORY_TABS = Object.freeze([
  { id: '', label: 'Tất cả' },
  { id: 'DAY', label: 'Nhạc cụ dây' },
  { id: 'HOI', label: 'Nhạc cụ hơi' },
  { id: 'GO', label: 'Nhạc cụ gõ' },
])

const SORT_MAPPINGS = Object.freeze({
  default: 'createdAt,desc',
  'price-asc': 'price,asc',
  'price-desc': 'price,desc',
  'name-asc': 'name,asc',
})

function parseParamsFromUrl() {
  if (typeof window === 'undefined') {
    return { filters: EMPTY_FILTERS, page: 1, sort: 'default' }
  }
  const searchParams = new URLSearchParams(window.location.search)
  const filters = {
    keyword: searchParams.get('keyword') || searchParams.get('q') || '',
    group: searchParams.get('group') || searchParams.get('category') || '',
    artisan: searchParams.get('artisan') || '',
    craftVillage: searchParams.get('craftVillage') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
  }
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const sort = searchParams.get('sort') || 'default'
  return { filters, page, sort }
}

function syncUrlWithState(filters, page, sort) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams()
  if (filters.keyword) params.set('keyword', filters.keyword)
  if (filters.group) params.set('group', filters.group)
  if (filters.artisan) params.set('artisan', filters.artisan)
  if (filters.craftVillage) params.set('craftVillage', filters.craftVillage)
  if (filters.minPrice) params.set('minPrice', filters.minPrice)
  if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
  if (page > 1) params.set('page', String(page))
  if (sort && sort !== 'default') params.set('sort', sort)

  const newSearch = params.toString()
  const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname
  const currentUrl = `${window.location.pathname}${window.location.search}`
  if (newUrl !== currentUrl) {
    window.history.pushState(null, '', newUrl)
  }
}

function ProductListPage() {
  const [draftFilters, setDraftFilters] = useState(() => parseParamsFromUrl().filters)
  const [activeFilters, setActiveFilters] = useState(() => parseParamsFromUrl().filters)
  const [currentPage, setCurrentPage] = useState(() => parseParamsFromUrl().page)
  const [sortBy, setSortBy] = useState(() => parseParamsFromUrl().sort)
  const [isLoading, setIsLoading] = useState(true)
  const [catalog, setCatalog] = useState({
    status: 'loading',
    products: [],
    totalPages: 1,
    totalElements: 0,
    errorMessage: '',
  })
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Listen for browser Back/Forward (popstate) to restore state from URL
  useEffect(() => {
    function handleLocationChange() {
      const parsed = parseParamsFromUrl()
      setDraftFilters(parsed.filters)
      setActiveFilters(parsed.filters)
      setCurrentPage(parsed.page)
      setSortBy(parsed.sort)
      setIsLoading(true)
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener(ROUTE_CHANGE_EVENT, handleLocationChange)
    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleLocationChange)
    }
  }, [])

  // Sync state to URL whenever activeFilters, currentPage, or sortBy changes
  useEffect(() => {
    syncUrlWithState(activeFilters, currentPage, sortBy)
  }, [activeFilters, currentPage, sortBy])

  // Fetch product list using backend Pageable
  useEffect(() => {
    let active = true

    const backendSort = SORT_MAPPINGS[sortBy] || 'createdAt,desc'

    productService
      .listProductsPage({
        ...activeFilters,
        page: currentPage,
        size: ITEMS_PER_PAGE,
        sort: backendSort,
      })
      .then((data) => {
        if (active) {
          setIsLoading(false)
          setCatalog({
            status: 'success',
            products: data.products || [],
            totalPages: data.totalPages || 1,
            totalElements: data.totalElements || 0,
            errorMessage: '',
          })
        }
      })
      .catch((err) => {
        if (active) {
          setIsLoading(false)
          setCatalog({
            status: 'error',
            products: [],
            totalPages: 1,
            totalElements: 0,
            errorMessage: err.message || 'Không thể tải danh sách sản phẩm.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [activeFilters, currentPage, sortBy])

  const applyFilters = useCallback((nextFilters) => {
    setDraftFilters(nextFilters)
    setActiveFilters(nextFilters)
    setCurrentPage(1)
    setIsLoading(true)
  }, [])

  const resetFilters = useCallback(() => {
    setDraftFilters(EMPTY_FILTERS)
    setActiveFilters(EMPTY_FILTERS)
    setCurrentPage(1)
    setIsLoading(true)
  }, [])

  const handleSearchSubmit = useCallback((keyword) => {
    const trimmed = typeof keyword === 'string' ? keyword.trim() : ''
    setDraftFilters((prev) => ({ ...prev, keyword: trimmed }))
    setActiveFilters((prev) => ({ ...prev, keyword: trimmed }))
    setCurrentPage(1)
    setIsLoading(true)
  }, [])

  const handleCategoryTabClick = useCallback((groupId) => {
    setDraftFilters((prev) => ({ ...prev, group: groupId }))
    setActiveFilters((prev) => ({ ...prev, group: groupId }))
    setCurrentPage(1)
    setIsLoading(true)
  }, [])

  const handleRemoveSingleFilter = useCallback((filterKey) => {
    const removeKey = (prev) => {
      const next = { ...prev }
      if (filterKey === 'price') {
        next.minPrice = ''
        next.maxPrice = ''
      } else {
        next[filterKey] = ''
      }
      return next
    }
    setDraftFilters(removeKey)
    setActiveFilters(removeKey)
    setCurrentPage(1)
    setIsLoading(true)
  }, [])

  const handlePageChange = useCallback((nextPage) => {
    setCurrentPage(nextPage)
    setIsLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleSortChange = useCallback((e) => {
    setSortBy(e.target.value)
    setCurrentPage(1)
    setIsLoading(true)
  }, [])

  const retry = useCallback(() => {
    setIsLoading(true)
    const backendSort = SORT_MAPPINGS[sortBy] || 'createdAt,desc'
    productService
      .listProductsPage({
        ...activeFilters,
        page: currentPage,
        size: ITEMS_PER_PAGE,
        sort: backendSort,
      })
      .then((data) => {
        setIsLoading(false)
        setCatalog({
          status: 'success',
          products: data.products || [],
          totalPages: data.totalPages || 1,
          totalElements: data.totalElements || 0,
          errorMessage: '',
        })
      })
      .catch((err) => {
        setIsLoading(false)
        setCatalog({
          status: 'error',
          products: [],
          totalPages: 1,
          totalElements: 0,
          errorMessage: err.message || 'Không thể tải danh sách sản phẩm.',
        })
      })
  }, [activeFilters, currentPage, sortBy])

  const hasAppliedFilters = Object.values(activeFilters).some(
    (val) => val && String(val).trim() !== '',
  )

  const activeFilterCount = Object.values(draftFilters).filter(
    (val) => val && String(val).trim() !== '',
  ).length

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* 1. Pure White Heritage Catalog Header */}
      <section className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 text-center">
          {/* Eyebrow with resonance motif */}
          <div className="flex justify-center mb-2.5">
            <EditorialEyebrow brandPrefix="M4N" label="BỘ SƯU TẬP DI SẢN" showResonance />
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight font-sans">
            Nhạc cụ truyền thống Việt Nam
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-muted max-w-2xl mx-auto leading-relaxed">
            Được chế tác thủ công từ danh mộc mun, cẩm lai và tre nứa già tuyển chọn bởi các nghệ nhân ưu tú tại các làng nghề di sản.
          </p>

          {/* Centered Prominent Search Bar */}
          <div className="w-full max-w-xl mx-auto mt-6">
            <ProductSearch
              busy={isLoading}
              onSearch={handleSearchSubmit}
              value={draftFilters.keyword}
            />
          </div>

          {/* Centered Category Filter Segmented Tabs */}
          <div className="flex items-center justify-center mt-5">
            <div className="inline-flex items-center p-1 bg-surface-secondary rounded-full border border-border shadow-2xs gap-1 max-w-full overflow-x-auto scrollbar-none">
              {CATEGORY_TABS.map((tab) => {
                const isSelected = (!draftFilters.group && !tab.id) || draftFilters.group === tab.id
                return (
                  <button
                    key={tab.id || 'all'}
                    type="button"
                    onClick={() => handleCategoryTabClick(tab.id)}
                    className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-brand text-white shadow-2xs'
                        : 'text-muted hover:text-ink hover:bg-surface-muted'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Catalog Body with 2-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10">
          {/* Desktop Left Filter Sidebar (240–260px wide) */}
          <aside
            aria-label="Bộ lọc danh mục sản phẩm"
            className="hidden lg:block w-60 xl:w-64 shrink-0"
          >
            <div className="sticky top-24">
              <ProductFilters
                busy={isLoading}
                onApply={applyFilters}
                onChange={setDraftFilters}
                onReset={resetFilters}
                value={draftFilters}
              />
            </div>
          </aside>

          {/* Right: Products Area */}
          <div className="flex-1 min-w-0">
            {/* Active Filters Chips Bar */}
            {hasAppliedFilters && (
              <ActiveFilterChips
                className="mb-4"
                filters={activeFilters}
                onClearAll={resetFilters}
                onRemoveFilter={handleRemoveSingleFilter}
              />
            )}

            {/* Toolbar above grid */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-border">
              <p aria-live="polite" className="text-xs font-semibold text-muted tracking-wide">
                {!isLoading && catalog.status === 'success' ? (
                  <span>
                    Hiển thị <strong className="text-ink font-bold">{catalog.totalElements}</strong> sản phẩm
                  </span>
                ) : isLoading ? (
                  'Đang tải sản phẩm...'
                ) : (
                  'Danh mục sản phẩm'
                )}
              </p>

              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <label htmlFor="catalog-sort" className="text-xs text-muted font-medium shrink-0">
                    Sắp xếp:
                  </label>
                  <select
                    id="catalog-sort"
                    value={sortBy}
                    onChange={handleSortChange}
                    className="h-9 px-2.5 pr-7 text-xs bg-white text-ink rounded-lg border border-border hover:border-border-strong focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20 transition-colors cursor-pointer shadow-2xs"
                  >
                    <option value="default">Mới nhất</option>
                    <option value="price-asc">Giá: Thấp đến cao</option>
                    <option value="price-desc">Giá: Cao đến thấp</option>
                    <option value="name-asc">Tên: A - Z</option>
                  </select>
                </div>

                {/* Mobile Filter Trigger Button */}
                <button
                  aria-label="Mở bộ lọc tìm kiếm"
                  className="lg:hidden inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-border bg-white text-ink text-xs font-medium hover:bg-surface-secondary transition-colors shadow-2xs cursor-pointer"
                  onClick={() => setMobileDrawerOpen(true)}
                  type="button"
                >
                  <IconFilter className="text-brand" size={15} />
                  <span>Bộ lọc</span>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-semibold text-white bg-brand rounded-full leading-none">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Product Grid / States Section */}
            <section aria-busy={isLoading} aria-label="Kết quả sản phẩm">
              {isLoading ? (
                <ProductGridSkeleton count={6} />
              ) : null}

              {!isLoading && catalog.status === 'error' ? (
                <ErrorState
                  message={catalog.errorMessage || 'Không thể tải sản phẩm. Vui lòng kiểm tra lại kết nối hoặc thử lại sau.'}
                  onRetry={retry}
                />
              ) : null}

              {!isLoading && catalog.status === 'success' && catalog.totalElements === 0 ? (
                <EmptyState
                  message={
                    hasAppliedFilters
                      ? 'Thử thay đổi từ khóa hoặc khoảng giá hiện tại để tìm thấy sản phẩm.'
                      : 'Danh mục hiện chưa có sản phẩm để hiển thị.'
                  }
                  title={
                    hasAppliedFilters
                      ? 'Không tìm thấy sản phẩm phù hợp'
                      : 'Chưa có sản phẩm'
                  }
                >
                  {hasAppliedFilters ? (
                    <Button onClick={resetFilters} variant="quiet">
                      Xóa bộ lọc
                    </Button>
                  ) : null}
                </EmptyState>
              ) : null}

              {!isLoading && catalog.status === 'success' && catalog.totalElements > 0 ? (
                <div>
                  <ProductGrid products={catalog.products} />
                  {catalog.totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      onPageChange={handlePageChange}
                      totalPages={catalog.totalPages}
                    />
                  )}
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      {/* 3. Mobile Filter Drawer */}
      <MobileFilterDrawer
        busy={isLoading}
        isOpen={mobileDrawerOpen}
        onApply={applyFilters}
        onChange={setDraftFilters}
        onClose={() => setMobileDrawerOpen(false)}
        onReset={resetFilters}
        value={draftFilters}
      />
    </div>
  )
}

export default ProductListPage
