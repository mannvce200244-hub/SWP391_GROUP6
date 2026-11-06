import { Star, ShieldCheck } from 'lucide-react'

export default function ProductReviewCard({ review }) {
  return (
    <article className="p-4 rounded-2xl bg-white border border-border flex flex-col gap-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <span className="min-w-0 max-w-full font-semibold text-sm text-ink break-words">{review.customerName || 'Khách hàng'}</span>
          <span className="text-xs text-brand flex items-center gap-1">
            <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5" /> Đã mua hàng
          </span>
        </div>
        <time dateTime={review.createdAt} className="text-xs text-muted">
          {review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : ''}
        </time>
      </div>
      <div role="img" className="flex items-center gap-1" aria-label={`${review.rating} trên 5 sao`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} aria-hidden="true"
            className={`w-3.5 h-3.5 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}`} />
        ))}
      </div>
      {review.comment && <p className="text-sm text-ink leading-relaxed break-words whitespace-pre-wrap">{review.comment}</p>}
    </article>
  )
}
