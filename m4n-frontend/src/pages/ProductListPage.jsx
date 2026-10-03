import { useEffect, useState } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { ProductGridSkeleton } from '../components/ui/Skeleton.jsx'
import Button from '../components/ui/Button.jsx'
import ProductFilters from '../features/catalog/ProductFilters.jsx'
import ProductGrid from '../features/catalog/ProductGrid.jsx'
import productService from '../services/productService.js'

const EMPTY_FILTERS = Object.freeze({
  keyword: '',
  group: '',
  artisan: '',
  craftVillage: '',
  minPrice: '',
  maxPrice: '',
})

function ProductListPage() {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS)
  const [request, setRequest] = useState({ filters: EMPTY_FILTERS, sequence: 0 })
  const [catalog, setCatalog] = useState({ status: 'loading', products: [] })

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
    setCatalog({ status: 'loading', products: [] })
    setRequest((current) => ({
      filters,
      sequence: current.sequence + 1,
    }))
  }

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS)
    setCatalog({ status: 'loading', products: [] })
    setRequest((current) => ({
      filters: EMPTY_FILTERS,
      sequence: current.sequence + 1,
    }))
  }

  const retry = () => {
    setCatalog({ status: 'loading', products: [] })
    setRequest((current) => ({ ...current, sequence: current.sequence + 1 }))
  }

  const isLoading = catalog.status === 'loading'
  const hasAppliedFilters = Object.values(request.filters).some(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <header className="mb-8 flex flex-col gap-2 max-w-2xl">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
          <span className="resonance-motif" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          BỘ SƯU TẬP M4N
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">Danh mục sản phẩm</h1>
        <p className="text-sm text-muted leading-relaxed">
          Khám phá các nhạc cụ truyền thống Việt Nam được chế tác thủ công bởi các nghệ nhân làng nghề uy tín.
        </p>
      </header>

      <ProductFilters
        busy={isLoading}
        onApply={applyFilters}
        onChange={setDraftFilters}
        onReset={resetFilters}
        value={draftFilters}
      />

      <section aria-busy={isLoading} aria-label="Kết quả sản phẩm">
        {catalog.status === 'loading' ? (
          <ProductGridSkeleton count={6} />
        ) : null}
        {catalog.status === 'error' ? (
          <ErrorState
            message="Vui lòng thử lại sau. Bộ lọc của bạn vẫn được giữ nguyên."
            onRetry={retry}
          />
        ) : null}
        {catalog.status === 'success' && catalog.products.length === 0 ? (
          <EmptyState
            message={
              hasAppliedFilters
                ? 'Hãy điều chỉnh hoặc xóa bộ lọc để xem kết quả khác.'
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
        {catalog.status === 'success' && catalog.products.length > 0 ? (
          <div>
            <p aria-live="polite" className="text-xs font-medium text-muted mb-4">
              Đang hiển thị {catalog.products.length} sản phẩm
            </p>
            <ProductGrid products={catalog.products} />
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default ProductListPage
