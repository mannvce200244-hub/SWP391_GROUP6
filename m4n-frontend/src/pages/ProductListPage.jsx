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

function ProductListPage() {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [request, setRequest] = useState({ filters: EMPTY_FILTERS, sequence: 0 })
  const [catalog, setCatalog] = useState({ status: 'loading', products: [] })
  const [currentPage, setCurrentPage] = useState(1)
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

  // Pagination calculation
  const totalProducts = catalog.products.length
  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE) || 1
  const paginatedProducts = catalog.products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-white">
      {/* 1. Compact Catalog Header */}
      <section className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            {/* Title & Eyebrow */}
            <div className="flex flex-col gap-1.5 max-w-2xl">
              <EditorialEyebrow label="Bộ sưu tập M4N" />
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
                Nhạc cụ truyền thống Việt Nam
              </h1>
              <p className="text-sm text-muted leading-relaxed">
                Khám phá sản phẩm theo nhóm nhạc cụ, nghệ nhân, làng nghề và khoảng giá phù hợp.
              </p>
            </div>

            {/* Prominent Search Bar (360–480px wide on desktop) */}
            <div className="w-full md:w-80 lg:w-96 shrink-0">
              <ProductSearch
                busy={isLoading}
                onSearch={handleSearchSubmit}
                value={draftFilters.keyword}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Catalog Body with 2-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10">
          {/* Desktop Left Filter Sidebar (Section 8: 220–260px wide) */}
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
            {/* Active Filters Chips Bar (Section 10 & 11) */}
            {hasAppliedFilters && (
              <ActiveFilterChips
                className="mb-3"
                filters={request.filters}
                onClearAll={resetFilters}
                onRemoveFilter={handleRemoveSingleFilter}
              />
            )}

            {/* Toolbar above grid (Section 13) */}
            <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-border/60">
              <p aria-live="polite" className="text-xs font-semibold text-muted uppercase tracking-wide">
                {catalog.status === 'success'
                  ? `${totalProducts} sản phẩm`
                  : isLoading
                    ? 'Đang tải sản phẩm…'
                    : 'Danh mục sản phẩm'}
              </p>

              {/* Mobile Filter Trigger Button (Section 12) */}
              <button
                aria-label="Mở bộ lọc tìm kiếm"
                className="lg:hidden inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border border-control-border bg-surface text-ink text-xs font-medium hover:bg-surface-secondary hover:border-brand/40 transition-colors shadow-2xs cursor-pointer"
                onClick={() => setMobileDrawerOpen(true)}
                type="button"
              >
                <IconFilter className="text-brand" size={16} />
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 text-[10px] font-bold text-white bg-brand rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>
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

      {/* 3. Mobile Filter Drawer (Section 12) */}
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
