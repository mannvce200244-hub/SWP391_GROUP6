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
      className={`inline-block bg-surface-muted/60 animate-pulse ${variantClass} ${className}`}
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

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải danh sách sản phẩm"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8"
    >
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
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
