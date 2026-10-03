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
    <div className="flex flex-col rounded-lg border border-border bg-surface overflow-hidden shadow-xs" aria-hidden="true">
      <div className="aspect-square w-full bg-surface-secondary">
        <Skeleton height="100%" variant="rect" width="100%" />
      </div>
      <div className="p-4 flex flex-col gap-2.5">
        <Skeleton height="0.875rem" variant="text" width="40%" />
        <Skeleton height="1.25rem" variant="text" width="85%" />
        <Skeleton height="1.125rem" variant="text" width="50%" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Đang tải danh sách sản phẩm">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <article className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12" aria-hidden="true">
      <div className="aspect-square w-full rounded-xl overflow-hidden bg-surface-secondary border border-border">
        <Skeleton height="100%" variant="rect" width="100%" />
      </div>
      <div className="flex flex-col gap-4">
        <Skeleton height="0.875rem" variant="text" width="30%" />
        <Skeleton height="2rem" variant="text" width="80%" />
        <Skeleton height="1.75rem" variant="text" width="45%" />
        <div className="mt-6 flex flex-col gap-3">
          <Skeleton height="1.25rem" variant="text" width="100%" />
          <Skeleton height="1.25rem" variant="text" width="90%" />
          <Skeleton height="1.25rem" variant="text" width="70%" />
        </div>
      </div>
    </article>
  )
}

export default Skeleton
