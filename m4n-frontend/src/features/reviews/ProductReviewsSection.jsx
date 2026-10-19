import { useState, useEffect } from 'react'
import reviewService from '../../services/reviewService.js'
import useAuth from '../auth/useAuth.js'
import useToast from '../../components/ui/useToast.js'
import { Star, MessageSquareCheck, ShieldCheck, CornerDownRight } from 'lucide-react'

export default function ProductReviewsSection({ productId, productName }) {
  const { isAuthenticated } = useAuth()
  const { addToast } = useToast()

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [eligibility, setEligibility] = useState({ eligible: false, eligibleOrderId: null, message: '' })
  const [reloadSeq, setReloadSeq] = useState(0)

  // Form State
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let active = true
    if (!productId) return

    reviewService
      .getProductReviews(productId)
      .then((data) => {
        if (active) {
          setReviews(Array.isArray(data) ? data : [])
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setReviews([])
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [productId, reloadSeq])

  useEffect(() => {
    let active = true
    if (!productId || !isAuthenticated) return

    reviewService
      .checkEligibility(productId)
      .then((res) => {
        if (active) {
          setEligibility(res || { eligible: false })
        }
      })
      .catch(() => {
        if (active) {
          setEligibility({ eligible: false })
        }
      })

    return () => {
      active = false
    }
  }, [productId, isAuthenticated, reloadSeq])

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!eligibility.eligible || !eligibility.eligibleOrderId) {
      setFormError('Bạn không đủ điều kiện đánh giá sản phẩm này.')
      return
    }

    setSubmitting(true)
    setFormError('')
    try {
      await reviewService.submitReview({
        orderId: eligibility.eligibleOrderId,
        productId,
        rating,
        comment,
      })

      addToast({
        message: 'Cảm ơn quý khách! Đánh giá của bạn đã được ghi nhận.',
        type: 'success',
      })

      setComment('')
      setRating(5)
      setReloadSeq((prev) => prev + 1)
    } catch (err) {
      setFormError(err?.message || 'Không thể gửi đánh giá. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / reviews.length).toFixed(1)
      : null

  return (
    <div className="mt-12 pt-10 border-t border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#1F6B5A]">
              Cảm Nhận Di Sản
            </span>
            <span className="text-zinc-300">/</span>
            <span className="text-xs text-muted font-medium">Trải nghiệm âm sắc</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-ink">
            Đánh giá từ khách hàng ({reviews.length})
          </h2>
        </div>

        {averageRating && (
          <div className="flex items-center gap-3 bg-[#F8FAFC] border border-border px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="text-lg font-extrabold text-ink font-mono">{averageRating}</span>
              <span className="text-xs text-muted font-normal">/ 5.0</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted font-medium">Dựa trên {reviews.length} lượt đánh giá thực tế</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form if eligible, or eligibility notice (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {isAuthenticated ? (
            eligibility.eligible ? (
              <div className="bg-white rounded-2xl border border-teal-200/80 p-5 shadow-xs bg-gradient-to-br from-white to-teal-50/20">
                <div className="flex items-center gap-2 mb-3 text-teal-800">
                  <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
                  <span className="text-xs font-bold">Xác nhận đã mua từ đơn hàng #{eligibility.eligibleOrderId}</span>
                </div>

                <h3 className="text-sm font-bold text-ink mb-1">Viết đánh giá cho {productName || 'nhạc cụ'}</h3>
                <p className="text-xs text-muted mb-4">Chia sẻ trải nghiệm về âm sắc, phím bấm và độ hoàn thiện của làng nghề.</p>

                {formError && (
                  <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                    {formError}
                  </div>
                )}

                <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1.5">Mức độ hài lòng</label>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-xs font-bold text-amber-600 font-mono">
                        {rating === 5
                          ? '5 sao - Tuyệt hảo'
                          : rating === 4
                          ? '4 sao - Rất tốt'
                          : rating === 3
                          ? '3 sao - Đạt chuẩn'
                          : rating === 2
                          ? '2 sao - Chưa ưng ý'
                          : '1 sao - Kém'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Cảm nhận chi tiết</label>
                    <textarea
                      rows="3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Âm sắc trong trẻo, gỗ mun tự nhiên gia công rất kỹ lưỡng..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-[#F8FAFC] focus:outline-hidden focus:ring-2 focus:ring-teal-600 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <MessageSquareCheck className="w-4 h-4" />
                    {submitting ? 'Đang gửi đánh giá...' : 'Gửi đánh giá xác thực'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-border flex flex-col gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-600 font-bold">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  Quy chuẩn đánh giá xác thực M4N
                </div>
                <p className="text-muted leading-relaxed">
                  Nhằm đảm bảo tính trung thực và bảo tồn giá trị nghệ nhân, chỉ những khách hàng đã mua và có đơn hàng hoàn tất (<span className="font-mono text-zinc-700 font-bold">COMPLETED</span>) chứa nhạc cụ này mới có thể đăng nhận xét.
                </p>
                {eligibility.message && (
                  <div className="p-2.5 rounded-lg bg-zinc-100/70 text-zinc-600 flex items-start gap-2">
                    <CornerDownRight className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                    <span>{eligibility.message}</span>
                  </div>
                )}
              </div>
            )
          ) : (
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-border flex flex-col gap-2 text-xs">
              <span className="font-bold text-ink">Bạn đã sở hữu nhạc cụ này?</span>
              <p className="text-muted">
                Đăng nhập tài khoản đã mua hàng để đóng góp đánh giá và cảm âm cho cộng đồng yêu nhạc cụ dân tộc.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: List of Reviews (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted bg-white border border-border rounded-2xl">
              Đang tải đánh giá từ người mua...
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted bg-white border border-border rounded-2xl flex flex-col items-center gap-2">
              <Star className="w-8 h-8 text-zinc-200" />
              <span className="font-semibold text-zinc-600">Chưa có đánh giá nào cho nhạc cụ này.</span>
              <span>Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận sau khi nhận đàn!</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-white border border-border shadow-xs flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                        {rev.customerName ? rev.customerName.charAt(0).toUpperCase() : 'K'}
                      </div>
                      <span className="font-bold text-xs text-ink">{rev.customerName || 'Khách hàng'}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3 h-3" /> Đã mua hàng
                      </span>
                    </div>

                    <span className="text-[11px] text-muted">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-zinc-200'
                        }`}
                      />
                    ))}
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-zinc-700 leading-relaxed bg-[#F8FAFC] p-3 rounded-xl border border-border/50">
                      {rev.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
