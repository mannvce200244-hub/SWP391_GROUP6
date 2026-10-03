import { useEffect, useState } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
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
    <div className="page-shell catalog-page">
      <header className="page-heading">
        <p className="eyebrow">Customer Catalog</p>
        <h1>Danh mục sản phẩm</h1>
        <p>
          Tìm kiếm nhạc cụ theo những tiêu chí đã được xác định trong phạm vi M4N.
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
          <LoadingState message="Đang tải danh mục sản phẩm…" />
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
          <div className="catalog-results">
            <p aria-live="polite" className="catalog-results__summary">
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
