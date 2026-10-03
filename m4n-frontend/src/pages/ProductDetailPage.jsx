import { useEffect, useState } from 'react'
import EmptyState from '../components/ui/EmptyState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
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
    <div className="page-shell">
      <RouterLink className="back-link" href={CUSTOMER_ROUTES.products}>
        <span aria-hidden="true">←</span> Trở về danh mục
      </RouterLink>
      <section aria-busy={detail.status === 'loading'} aria-label="Chi tiết sản phẩm">
        {detail.status === 'loading' ? (
          <LoadingState message="Đang tải thông tin sản phẩm…" />
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
