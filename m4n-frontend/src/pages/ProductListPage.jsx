import { useEffect, useState } from 'react'
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

function ProductListPage() {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [request, setRequest] = useState({ filters: EMPTY_FILTERS, sequence: 0 })
  const [catalog, setCatalog] = useState({ status: 'loading', products: [] })
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState('default')
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // Fetch product list when request changes
  useEffect(() => {
    let active = true

    productService
      .listProducts(request.filters)
      .then((products) => {
        if (active) {
          setCatalog({ status: 'success', products })
        }
      })
      .catch(() => {
        if (active) {
          setCatalog({ status: 'error', products: [] })
        }
      })

    return () => {
      active = false
    }
  }, [request])

  const applyFilters = (filters) => {
    setDraftFilters(filters)
    setCurrentPage(1)
    setCatalog({ status: 'loading', products: [] })
    setRequest((current) => ({
      filters,
      sequence: current.sequence + 1,
    }))
  }

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    setCurrentPage(1)
    setCatalog({ status: 'loading', products: [] })
    setRequest((current) => ({
      filters: EMPTY_FILTERS,
      sequence: current.sequence + 1,
    }))
  }

  const handleSearchSubmit = (keyword) => {
    const updatedFilters = { ...draftFilters, keyword }
    applyFilters(updatedFilters)
  }

  const handleCategoryTabClick = (groupId) => {
    const updatedFilters = { ...draftFilters, group: groupId }
    applyFilters(updatedFilters)
  }

  const handleRemoveSingleFilter = (filterKey) => {
    let updatedFilters = { ...draftFilters }
    if (filterKey === 'price') {
      updatedFilters.minPrice = ''
      updatedFilters.maxPrice = ''
    } else {
      updatedFilters[filterKey] = ''
    }
    applyFilters(updatedFilters)
  }

  const retry = () => {
    setCatalog({ status: 'loading', products: [] })
    setRequest((current) => ({ ...current, sequence: current.sequence + 1 }))
  }

  const isLoading = catalog.status === 'loading'
  const hasAppliedFilters = Object.values(request.filters).some(
    (val) => val && String(val).trim() !== '',
  )

  const activeFilterCount = Object.values(draftFilters).filter(
    (val) => val && String(val).trim() !== '',
  ).length

  // Sort products locally
  const sortedProducts = [...catalog.products].sort((a, b) => {
    const priceA = Number(a.price ?? a.unitPrice ?? 0)
    const priceB = Number(b.price ?? b.unitPrice ?? 0)
    if (sortBy === 'price-asc') return priceA - priceB
    if (sortBy === 'price-desc') return priceB - priceA
    if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '', 'vi')
    return 0
  })

  // Pagination calculation
  const totalProducts = sortedProducts.length
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE) || 1
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* 1. Pure White Heritage Catalog Header */}
      <section className="bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14 text-center">
          {/* Eyebrow with string resonance motif */}
          <div className="flex justify-center mb-3">
            <EditorialEyebrow brandPrefix="M4N" label="BỘ SƯU TẬP DI SẢN" showResonance />
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink tracking-tight font-sans">
            Nhạc cụ truyền thống Việt Nam
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-muted max-w-2xl mx-auto leading-relaxed">
            Được đẽo gọt thủ công từ danh mộc mun, cẩm lai và tre nứa già tuyển chọn bởi các nghệ nhân ưu tú tại các làng nghề di sản.
          </p>

          {/* Centered Prominent Search Bar */}
          <div className="w-full max-w-xl mx-auto mt-6 sm:mt-7">
            <ProductSearch
              busy={isLoading}
              onSearch={handleSearchSubmit}
              value={draftFilters.keyword}
            />
          </div>

          {/* Centered Category Filter Segmented Tabs */}
          <div className="flex items-center justify-center mt-6">
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
                filters={request.filters}
                onClearAll={resetFilters}
                onRemoveFilter={handleRemoveSingleFilter}
              />
            )}

            {/* Toolbar above grid */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-border">
              <p aria-live="polite" className="text-xs font-semibold text-muted tracking-wide">
                {catalog.status === 'success' ? (
                  <span>
                    Hiển thị <strong className="text-ink font-bold">{totalProducts}</strong> sản phẩm
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
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-9 px-2.5 pr-7 text-xs bg-white text-ink rounded-lg border border-border hover:border-border-strong focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand/20 transition-colors cursor-pointer shadow-2xs"
                  >
                    <option value="default">Mặc định</option>
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
                    <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 text-[10px] font-bold text-white bg-brand rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Product Grid / States Section */}
            <section aria-busy={isLoading} aria-label="Kết quả sản phẩm">
              {catalog.status === 'loading' ? (
                <ProductGridSkeleton count={6} />
              ) : null}

              {catalog.status === 'error' ? (
                <ErrorState
                  message="Không thể tải sản phẩm. Vui lòng kiểm tra lại kết nối hoặc thử lại sau."
                  onRetry={retry}
                />
              ) : null}

              {catalog.status === 'success' && totalProducts === 0 ? (
                <EmptyState
                  message={
                    hasAppliedFilters
                      ? 'Thử thay đổi từ khóa hoặc bộ lọc hiện tại để tìm thấy sản phẩm.'
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

              {catalog.status === 'success' && totalProducts > 0 ? (
                <div>
                  <ProductGrid products={paginatedProducts} />
                  <Pagination
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    totalPages={totalPages}
                  />
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
