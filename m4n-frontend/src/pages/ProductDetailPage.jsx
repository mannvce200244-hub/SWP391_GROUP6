import { useEffect, useState } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { ProductDetailSkeleton } from '../components/ui/Skeleton.jsx'
import ProductDetailInfo from '../features/catalog/ProductDetailInfo.jsx'
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

  const retry = () => {
    setDetail({ status: 'loading', product: null })
    setRequestSequence((current) => current + 1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <RouterLink className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-brand transition-colors mb-6 cursor-pointer" href={CUSTOMER_ROUTES.products}>
        <span aria-hidden="true">←</span> Trở về danh mục
      </RouterLink>
      <section aria-busy={detail.status === 'loading'} aria-label="Chi tiết sản phẩm">
        {detail.status === 'loading' ? (
          <ProductDetailSkeleton />
        ) : null}
        {detail.status === 'error' ? (
          <ErrorState
            message="Không thể lấy thông tin sản phẩm lúc này."
            onRetry={retry}
          />
        ) : null}
        {detail.status === 'success' && !detail.product ? (
          <EmptyState
            message="Sản phẩm này chưa có dữ liệu để hiển thị hoặc không còn tồn tại."
            title="Không tìm thấy sản phẩm"
          />
        ) : null}
        {detail.status === 'success' && detail.product ? (
          <ProductDetailInfo product={detail.product} />
        ) : null}
      </section>
    </div>
  )
}

export default ProductDetailPage
