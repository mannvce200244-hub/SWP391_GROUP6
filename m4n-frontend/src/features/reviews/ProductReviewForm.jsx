import { useState } from 'react'
import { Star, MessageSquareCheck, ShieldCheck } from 'lucide-react'
import reviewService from '../../services/reviewService.js'
import useToast from '../../components/ui/useToast.js'

const ratingLabels = ['Kém', 'Chưa hài lòng', 'Đạt yêu cầu', 'Rất tốt', 'Tuyệt hảo']

export default function ProductReviewForm({ productId, productName, orderId, onSubmitted }) {
  const { addToast } = useToast()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (submitting) return
    if (comment.trim().length > 1000) {
      setFormError('Nội dung đánh giá không được vượt quá 1000 ký tự.')
      return
    }
    setSubmitting(true)
    setFormError('')
    try {
      await reviewService.submitReview({ orderId, productId, rating, comment })
      addToast({ message: 'Đánh giá của bạn đã được ghi nhận.', type: 'success' })
      setComment('')
      setRating(5)
      onSubmitted()
    } catch (error) {
      setFormError(error.message || 'Không thể gửi đánh giá. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3 text-brand">
        <ShieldCheck aria-hidden="true" className="w-5 h-5 shrink-0" />
        <span className="text-xs font-semibold">Đã mua từ đơn hàng #{orderId}</span>
      </div>
      <h3 className="text-base font-semibold text-ink mb-1 break-words">Viết đánh giá cho {productName || 'nhạc cụ'}</h3>
      <p className="text-sm text-muted mb-4">Chia sẻ trải nghiệm về âm sắc và độ hoàn thiện.</p>
      {formError && <p role="alert" className="p-3 mb-4 rounded-xl border border-danger-border text-sm text-danger">{formError}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={submitting}>
        <fieldset disabled={submitting}>
          <legend className="text-sm font-semibold text-ink mb-1.5">Mức độ hài lòng</legend>
          <div className="flex flex-wrap items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} type="button" aria-label={`Chọn ${star} sao`} aria-pressed={rating === star}
                onClick={() => setRating(star)}
                className="flex h-11 w-11 items-center justify-center hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 cursor-pointer disabled:opacity-50">
                <Star aria-hidden="true" className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
              </button>
            ))}
          </div>
          <p className="mt-1 text-sm text-muted">{rating} sao — {ratingLabels[rating - 1]}</p>
        </fieldset>

        <div>
          <label htmlFor={`review-comment-${productId}`} className="block text-sm font-semibold text-ink mb-1">Cảm nhận chi tiết</label>
          <textarea id={`review-comment-${productId}`} name="comment" autoComplete="off" maxLength={1000}
            disabled={submitting} rows={3} value={comment} onChange={(event) => setComment(event.target.value)}
            placeholder="Ví dụ: Âm sắc trong trẻo, phần gia công chắc chắn…"
            className="w-full px-3 py-2 text-sm rounded-xl border border-control-border bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 resize-y" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full min-h-11 py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-strong text-white font-semibold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
          <MessageSquareCheck aria-hidden="true" className="w-4 h-4" />
          {submitting ? 'Đang gửi đánh giá…' : 'Gửi đánh giá'}
        </button>
      </form>
    </div>
  )
}
