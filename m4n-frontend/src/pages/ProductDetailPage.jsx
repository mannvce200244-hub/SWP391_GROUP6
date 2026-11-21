import { useEffect, useState } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { ProductDetailSkeleton } from '../components/ui/Skeleton.jsx'
import ProductDetailInfo from '../features/catalog/ProductDetailInfo.jsx'
import ProductReviewsSection from '../features/reviews/ProductReviewsSection.jsx'
import RelatedArticles from '../features/content/RelatedArticles.jsx'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import productService from '../services/productService.js'

function ProductDetailPage({ productId }) {
  const [requestSequence, setRequestSequence] = useState(0)
  const [detail, setDetail] = useState({ status: 'loading', product: null })
  const [selection, setSelection] = useState(null)
  const current = detail.productId === String(productId) && detail.sequence === requestSequence
  const selected = selection?.id === Number(productId) ? selection : null
  const product = current ? detail.product : selected ? { ...detail.product, ...selected } : null
  const switching = !current && Boolean(selected)
  const loading = !current && !selected

  useEffect(() => {
    let active = true

    productService
      .getProductById(productId)
      .then((product) => {
        if (active) {
          setDetail({ status: 'success', product, productId: String(productId), sequence: requestSequence })
        }
      })
      .catch(() => {
        if (active) {
          setDetail({ status: 'error', product: null, productId: String(productId), sequence: requestSequence })
        }
      })

    return () => {
      active = false
    }
  }, [productId, requestSequence])

  useEffect(() => {
    if (product?.name) {
      const originalTitle = document.title
      document.title = `${product.name} · M4N Nhạc Cụ Truyền Thống`
      return () => {
        document.title = originalTitle
      }
    }
  }, [product?.name])

  const retry = () => {
    setDetail({ status: 'loading', product: null })
    setRequestSequence((current) => current + 1)
  }

  const productName = product?.name
  const selectVariant = (variant) => {
    if (variant.id === Number(productId)) return
    setSelection(variant)
    navigateTo(CUSTOMER_ROUTES.productDetail(variant.id), { preserveScroll: true })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Đường dẫn trang"
        className="flex items-center gap-2 text-xs sm:text-sm text-muted mb-8 overflow-x-auto whitespace-nowrap scrollbar-none"
      >
        <RouterLink
          className="hover:text-ink transition-colors"
          href={CUSTOMER_ROUTES.home}
        >
          Trang chủ
        </RouterLink>
        <span aria-hidden="true" className="text-subtle">
          /
        </span>
        <RouterLink
          className="hover:text-ink transition-colors"
          href={CUSTOMER_ROUTES.products}
        >
          Sản phẩm
        </RouterLink>
        {productName && (
          <>
            <span aria-hidden="true" className="text-subtle">
              /
            </span>
            <span
              aria-current="page"
              className="text-ink font-medium truncate max-w-[200px] sm:max-w-md"
            >
              {productName}
            </span>
          </>
        )}
      </nav>

      {/* Main Content Area */}
      <section
        aria-busy={loading || switching}
        aria-label="Chi tiết sản phẩm"
      >
        {loading ? <ProductDetailSkeleton /> : null}

        {current && detail.status === 'error' ? (
          <div className="py-12">
            <ErrorState
              message="Không thể lấy thông tin chi tiết nhạc cụ lúc này. Vui lòng thử lại hoặc kiểm tra kết nối."
              onRetry={retry}
            />
          </div>
        ) : null}

        {current && detail.status === 'success' && !product ? (
          <div className="py-12">
            <EmptyState
              message="Nhạc cụ này có thể đã dừng lưu hành hoặc đường dẫn không còn hiệu lực."
              title="Không tìm thấy nhạc cụ"
            >
              <RouterLink
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand hover:bg-brand-hover active:bg-brand-dark transition-colors shadow-xs mt-3 cursor-pointer"
                href={CUSTOMER_ROUTES.products}
              >
                Khám phá danh mục nhạc cụ
              </RouterLink>
            </EmptyState>
          </div>
        ) : null}

        {product ? (
          <>
            <ProductDetailInfo product={product} switching={switching} onSelectVariant={selectVariant} />
            {!switching && <RelatedArticles key={product.id} productId={product.id} />}
            {!switching &&
            <ProductReviewsSection
              productId={product.id}
              productName={product.name}
            />}
          </>
        ) : null}
      </section>
    </div>
  )
}

export default ProductDetailPage
