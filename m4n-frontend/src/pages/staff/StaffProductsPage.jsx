import { useState, useEffect } from 'react'
import productService from '../../services/productService.js'
import { Search, Package } from 'lucide-react'
import LoadingState from '../../components/ui/LoadingState.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import { isSafeMediaUrl } from '../../features/catalog/productMedia.js'

function StaffProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    let active = true

    const filters = { page, size: 15 }
    if (keyword) filters.keyword = keyword

    async function loadProducts() {
      setLoading(true)
      setError(null)
      return productService.listProductsPage(filters)
    }
    loadProducts()
      .then((result) => {
        if (active) {
          setProducts(result.products)
          setTotalPages(result.totalPages || 1)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || 'Không thể tải danh sách sản phẩm.')
          setLoading(false)
        }
      })

    return () => { active = false }
  }, [keyword, page, reloadKey])

  const handleSearch = (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setKeyword(searchInput.trim())
    setPage(1)
    setReloadKey((current) => current + 1)
  }

  const retryProducts = () => {
    setLoading(true)
    setError(null)
    setReloadKey((current) => current + 1)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Tra cứu sản phẩm</h1>
        <p className="text-sm text-muted mt-1">
          Tra cứu thông tin sản phẩm để hỗ trợ xử lý đơn hàng và tư vấn khách hàng.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            name="productSearch"
            aria-label="Tìm kiếm sản phẩm"
            autoComplete="off"
            maxLength={100}
            placeholder="Tìm theo tên, mã sản phẩm…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors cursor-pointer"
        >
          Tìm kiếm
        </button>
      </form>

      {/* Content */}
      {loading ? (
        <LoadingState message="Đang tải sản phẩm…" />
      ) : error ? (
        <ErrorState
          title="Không thể tải sản phẩm"
          message={error}
          onRetry={retryProducts}
        />
      ) : products.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm"
          description={keyword ? `Không có sản phẩm phù hợp với "${keyword}".` : 'Chưa có sản phẩm nào trong hệ thống.'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-secondary border-b border-border">
                  <th className="text-left px-4 py-3 font-semibold text-ink">Sản phẩm</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink">Danh mục</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink">Nghệ nhân</th>
                  <th className="text-left px-4 py-3 font-semibold text-ink">Làng nghề</th>
                  <th className="text-right px-4 py-3 font-semibold text-ink">Giá</th>
                  <th className="text-center px-4 py-3 font-semibold text-ink">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const image = product.media?.find((media) => media.type === 'IMAGE' && isSafeMediaUrl(media.url))
                  return (
                  <tr key={product.id} className="hover:bg-surface-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {image ? (
                          <img
                            src={image.url}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-surface-secondary border border-border flex items-center justify-center">
                            <Package size={16} className="text-muted" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-ink truncate max-w-[200px]">{product.name}</p>
                          {product.code && (
                            <p className="text-xs text-muted font-mono">{product.code}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.categoryName || product.groupName || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">{product.artisanName || '—'}</td>
                    <td className="px-4 py-3 text-muted">{product.craftVillageName || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                      {product.price != null
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {['IN_STOCK', 'LOW_STOCK'].includes(product.availability) ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-jade-soft text-jade border border-jade-border">
                          {product.availability === 'LOW_STOCK' ? 'Sắp hết hàng' : 'Còn hàng'}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-danger-soft text-danger border border-danger-border">
                          {product.availability === 'OUT_OF_STOCK' ? 'Hết hàng' : 'Chưa xác định'}
                        </span>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {totalPages > 1 && <div className="flex items-center justify-end gap-3 text-sm"><button type="button" disabled={loading || page === 1} onClick={() => setPage((value) => value - 1)}>Trước</button><span>Trang {page}/{totalPages}</span><button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</button></div>}
    </div>
  )
}

export default StaffProductsPage
