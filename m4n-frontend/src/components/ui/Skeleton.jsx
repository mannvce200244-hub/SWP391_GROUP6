/**
 * Accessible Skeleton loading component.
 * Provides shimmering placeholders approximating final content shape.
 * Respects prefers-reduced-motion.
 */

export function Skeleton({
  variant = 'rect',
  width,
  height,
  className = '',
  style = {},
}) {
  const inlineStyles = {
    ...style,
    ...(width ? { width } : {}),
    ...(height ? { height } : {}),
  }

  const variantClass = {
    rect: 'rounded-md',
    circle: 'rounded-full',
    text: 'rounded h-4',
  }[variant] || 'rounded-md'

  return (
    <span
      aria-hidden="true"
      className={`skeleton inline-block ${variantClass} ${className}`}
      style={inlineStyles}
    />
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full" aria-hidden="true">
      <div className="aspect-square w-full rounded-xl overflow-hidden bg-surface-secondary/70 border border-border/40">
        <Skeleton height="100%" variant="rect" width="100%" />
      </div>
      <div className="pt-3 pb-1 flex flex-col flex-1 gap-2">
        <Skeleton height="0.75rem" variant="text" width="30%" />
        <Skeleton height="1.125rem" variant="text" width="85%" />
        <Skeleton height="0.875rem" variant="text" width="50%" />
        <div className="mt-auto pt-2 flex items-center justify-between">
          <Skeleton height="1.125rem" variant="text" width="40%" />
          <Skeleton height="0.875rem" variant="text" width="20%" />
        </div>
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6, className = 'lg:grid-cols-3' }) {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải danh sách sản phẩm"
      role="status"
      className={`grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-8 ${className}`}
    >
      <span className="sr-only">Đang tải danh sách sản phẩm…</span>
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export function ArticleListSkeleton() {
  return (
    <div role="status" aria-label="Đang tải bài viết…">
      <span className="sr-only">Đang tải bài viết…</span>
      {[0, 1, 2].map((item) => (
        <div key={item} aria-hidden="true" className="grid gap-5 border-b border-border py-6 sm:grid-cols-[160px_1fr] sm:py-8">
          <Skeleton className="aspect-4/3 w-full sm:w-40" />
          <div className="flex min-w-0 flex-col items-start gap-3">
            <Skeleton width="30%" height="0.75rem" />
            <Skeleton width="85%" height="1.5rem" />
            <Skeleton width="100%" height="0.875rem" />
            <Skeleton width="65%" height="0.875rem" />
            <Skeleton width="6rem" height="0.875rem" className="mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <article className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start" aria-hidden="true">
      <div className="lg:col-span-7 flex flex-col gap-3.5">
        <div className="aspect-4/3 sm:aspect-square w-full rounded-2xl overflow-hidden bg-surface-secondary/70 border border-border/40">
          <Skeleton height="100%" variant="rect" width="100%" />
        </div>
        <div className="flex gap-2.5">
          <Skeleton className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl" variant="rect" />
          <Skeleton className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl" variant="rect" />
          <Skeleton className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl" variant="rect" />
        </div>
      </div>
      <div className="lg:col-span-5 flex flex-col gap-5 bg-surface p-6 sm:p-8 rounded-2xl border border-border/80 shadow-xs">
        <Skeleton height="0.875rem" variant="text" width="30%" />
        <Skeleton height="2.5rem" variant="text" width="85%" />
        <Skeleton height="2rem" variant="text" width="45%" />
        <div className="h-px bg-border/60 my-1" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-14 rounded-lg" variant="rect" />
          <Skeleton className="h-14 rounded-lg" variant="rect" />
        </div>
        <div className="mt-2 flex gap-3.5">
          <Skeleton className="h-11 w-32 rounded-lg" variant="rect" />
          <Skeleton className="h-11 flex-1 rounded-lg" variant="rect" />
        </div>
      </div>
    </article>
  )
}

export default Skeleton
