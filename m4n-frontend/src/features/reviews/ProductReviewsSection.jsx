import { useState, useEffect } from 'react'
import { Star, ShieldCheck, CornerDownRight } from 'lucide-react'
import reviewService from '../../services/reviewService.js'
import useAuth from '../auth/useAuth.js'
import ErrorState from '../../components/ui/ErrorState.jsx'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import Pagination from '../catalog/Pagination.jsx'
import ProductReviewForm from './ProductReviewForm.jsx'
import ProductReviewCard from './ProductReviewCard.jsx'

export default function ProductReviewsSection({ productId, productName }) {
  const { isAuthenticated, user } = useAuth()
  const [pageSelection, setPageSelection] = useState({ productId, page: 1 })
  const currentPage = pageSelection.productId === productId ? pageSelection.page : 1
  const [reviewState, setReviewState] = useState(null)
  const [reloadSeq, setReloadSeq] = useState(0)
  const isCurrent = reviewState?.productId === productId && reviewState?.page === currentPage
    && reviewState?.reloadSeq === reloadSeq
  const loading = !isCurrent
  const reviewError = isCurrent ? reviewState.error : null
  const reviewData = isCurrent ? reviewState.data : null
  const reviews = reviewData?.content ?? []
  const totalReviews = reviewData?.totalElements
  const averageRating = Number.isFinite(reviewData?.averageRating)
    ? new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(reviewData.averageRating)
    : null
  const [eligibilityState, setEligibilityState] = useState(null)
  const hasCurrentEligibility = eligibilityState?.productId === productId && eligibilityState?.userId === user?.id
    && eligibilityState?.reloadSeq === reloadSeq
  const eligibility = hasCurrentEligibility ? eligibilityState.data : { eligible: false }
  const userId = user?.id
  const isCustomer = user?.role === 'CUSTOMER'

  useEffect(() => {
    let active = true
    if (!productId) return
    const request = { productId, page: currentPage, reloadSeq }
    reviewService.getProductReviewPage(productId, currentPage - 1)
      .then((data) => {
        if (active) setReviewState({ ...request, data, error: null })
      })
      .catch((error) => {
        if (active) setReviewState({ ...request, data: null, error: error.message || 'Không thể tải đánh giá sản phẩm.' })
      })
    return () => { active = false }
  }, [productId, currentPage, reloadSeq])

  useEffect(() => {
    let active = true
    if (!productId || !isAuthenticated || !isCustomer) return
    const request = { productId, userId, reloadSeq }
    reviewService.checkEligibility(productId)
      .then((data) => {
        if (active) setEligibilityState({ ...request, error: false, data: data || { eligible: false } })
      })
      .catch(() => {
        if (active) setEligibilityState({ ...request, error: true, data: { eligible: false,
          message: 'Không thể kiểm tra điều kiện đánh giá. Vui lòng thử lại.' } })
      })
    return () => { active = false }
  }, [productId, isAuthenticated, isCustomer, userId, reloadSeq])

  const reload = () => setReloadSeq((current) => current + 1)
  const handleSubmitted = () => {
    setPageSelection({ productId, page: 1 })
    reload()
  }

  return (
    <section className="mt-12 pt-10 border-t border-border" aria-labelledby={`reviews-title-${productId}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <EditorialEyebrow className="mb-2">Trải nghiệm từ người mua</EditorialEyebrow>
          <h2 id={`reviews-title-${productId}`} className="text-xl sm:text-2xl font-bold text-ink">
            Đánh giá từ khách hàng{totalReviews != null ? ` (${totalReviews})` : ''}
          </h2>
        </div>
        {averageRating && (
          <div className="flex flex-wrap items-center gap-3 bg-surface-secondary border border-border px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-1">
              <Star aria-hidden="true" className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-extrabold text-ink tabular-nums">{averageRating}</span>
              <span className="text-xs text-muted">/ 5</span>
            </div>
            <span className="text-xs text-muted">Dựa trên {totalReviews} lượt đánh giá</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 min-w-0">
          {isAuthenticated && eligibility.eligible ? (
            <ProductReviewForm key={`${productId}-${eligibility.eligibleOrderId}`} productId={productId}
              productName={productName} orderId={eligibility.eligibleOrderId} onSubmitted={handleSubmitted} />
          ) : (
            <div className="p-5 rounded-2xl bg-surface-secondary border border-border flex flex-col gap-2.5 text-sm">
              <div className="flex items-center gap-2 text-ink font-semibold">
                <ShieldCheck aria-hidden="true" className="w-4 h-4 text-brand shrink-0" />
                {isAuthenticated ? 'Đánh giá sau khi nhận hàng' : 'Bạn đã sở hữu nhạc cụ này?'}
              </div>
              <p className="text-muted leading-relaxed">
                {isAuthenticated
                  ? 'Khách hàng có đơn hàng đã hoàn thành chứa sản phẩm này có thể gửi đánh giá.'
                  : 'Đăng nhập tài khoản đã mua hàng để chia sẻ trải nghiệm với nhạc cụ.'}
              </p>
              {eligibility.message && (
                <div className="text-muted flex items-start gap-2">
                  <CornerDownRight aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{eligibility.message}</span>
                </div>
              )}
              {isAuthenticated && isCustomer && hasCurrentEligibility && eligibilityState?.error && (
                <button type="button" onClick={reload} className="self-start text-brand underline underline-offset-4 cursor-pointer">
                  Kiểm tra lại điều kiện đánh giá
                </button>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-7 min-w-0 flex flex-col gap-4" aria-busy={loading}>
          {loading ? (
            <div role="status" className="p-8 text-center text-sm text-muted bg-white border border-border rounded-2xl">
              Đang tải đánh giá từ người mua…
            </div>
          ) : reviewError ? (
            <ErrorState message={reviewError} onRetry={reload} />
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted bg-white border border-border rounded-2xl flex flex-col items-center gap-2">
              <Star aria-hidden="true" className="w-8 h-8 text-zinc-300" />
              <span className="font-semibold text-ink">Chưa có đánh giá nào cho nhạc cụ này.</span>
              <span>Bạn có thể chia sẻ cảm nhận sau khi hoàn thành đơn hàng.</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3.5">
                {reviews.map((review) => <ProductReviewCard key={review.id} review={review} />)}
              </div>
              <Pagination currentPage={currentPage} totalPages={reviewData.totalPages}
                onPageChange={(page) => setPageSelection({ productId, page })} />
            </>
          )}
        </div>
      </div>
    </section>
  )
}
