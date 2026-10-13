import { useEffect, useState } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { ProductDetailSkeleton } from '../components/ui/Skeleton.jsx'
import ProductDetailInfo from '../features/catalog/ProductDetailInfo.jsx'
import RelatedProducts from '../features/catalog/RelatedProducts.jsx'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import productService from '../services/productService.js'

function ProductDetailPage({ productId }) {
  const [requestSequence, setRequestSequence] = useState(0)
  const [detail, setDetail] = useState({ status: 'loading', product: null })

  useEffect(() => {
    let active = true

    productService
      .getProductById(productId)
      .then((product) => {
        if (active) {
          setDetail({ status: 'success', product })
        }
      })
      .catch(() => {
        if (active) {
          setDetail({ status: 'error', product: null })
        }
      })

    return () => {
      active = false
    }
  }, [productId, requestSequence])

  useEffect(() => {
    if (detail.product?.name) {
      const originalTitle = document.title
      document.title = `${detail.product.name} · M4N Nhạc Cụ Truyền Thống`
      return () => {
        document.title = originalTitle
      }
    }
  }, [detail.product?.name])

  const retry = () => {
    setDetail({ status: 'loading', product: null })
    setRequestSequence((current) => current + 1)
  }

  const productName = detail.product?.name

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
        aria-busy={detail.status === 'loading'}
        aria-label="Chi tiết sản phẩm"
      >
        {detail.status === 'loading' ? <ProductDetailSkeleton /> : null}

        {detail.status === 'error' ? (
          <div className="py-12">
            <ErrorState
              message="Không thể lấy thông tin chi tiết nhạc cụ lúc này. Vui lòng thử lại hoặc kiểm tra kết nối."
              onRetry={retry}
            />
          </div>
        ) : null}

        {detail.status === 'success' && !detail.product ? (
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

        {detail.status === 'success' && detail.product ? (
          <>
            <ProductDetailInfo product={detail.product} />
            <RelatedProducts currentProduct={detail.product} />
          </>
        ) : null}
      </section>
    </div>
  )
}

export default ProductDetailPage
