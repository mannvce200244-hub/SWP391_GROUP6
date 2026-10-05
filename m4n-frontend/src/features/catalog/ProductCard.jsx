import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import { getFirstProductImage } from './productMedia.js'
import { IconInstrument } from '../../components/ui/Icons.jsx'

function ProductCard({ priority = false, product }) {
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const image = getFirstProductImage(product.media)
  const showImage = image && failedImageUrl !== image.url

  // Stock status text if available in product data
  const hasStockInfo = product.inStock !== undefined || product.status !== undefined || product.availability !== undefined
  const isInStock = product.inStock === true || product.status === 'AVAILABLE' || product.status === 'IN_STOCK' || product.availability === 'IN_STOCK'

  return (
    <RouterLink
      aria-label={`Xem chi tiết ${product.name}`}
      className="group flex flex-col h-full no-underline focus-visible:outline-none select-none"
      href={CUSTOMER_ROUTES.productDetail(product.id)}
    >
      {/* 1. Image Container (Product visual priority, 1:1, hover scale ~1.02) */}
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface-secondary relative flex items-center justify-center border border-border/60 transition-colors group-hover:border-border-strong">
        {showImage ? (
          <img
            alt={
              typeof image.alt === 'string' && image.alt.trim()
                ? image.alt.trim()
                : product.name
            }
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-out"
            decoding="async"
            height="500"
            loading={priority ? undefined : 'lazy'}
            onError={() => setFailedImageUrl(image.url)}
            src={image.url}
            width="500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-muted">
            <IconInstrument className="text-subtle/50" size={36} />
            <span className="text-xs font-medium text-subtle">Nhạc cụ truyền thống</span>
          </div>
        )}

        {/* Floating Category Group Tag (Option A: neutral gray badge on white/95) */}
        {product.groupName ? (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-white/95 backdrop-blur-xs text-muted border border-border/80 shadow-2xs">
            {product.groupName}
          </span>
        ) : null}

        {/* Optional Stock Status badge (deep jade for in-stock, neutral for out-of-stock) */}
        {hasStockInfo ? (
          <span
            className={`absolute bottom-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-xs shadow-2xs ${
              isInStock
                ? 'bg-jade-soft text-jade border border-jade-border'
                : 'bg-white text-muted border border-border'
            }`}
          >
            {isInStock ? 'Còn hàng' : 'Hết hàng'}
          </span>
        ) : null}
      </div>

      {/* 2. Product Details */}
      <div className="pt-3 pb-1 flex flex-col flex-1 gap-1">
        {/* Category Metadata */}
        {product.groupName ? (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            {product.groupName}
          </p>
        ) : null}

        {/* Product Title */}
        <h3 className="text-base font-semibold text-ink leading-snug group-hover:text-brand transition-colors duration-200 line-clamp-2">
          {product.name}
        </h3>

        {/* Artisan & Village Metadata (rendered only when available) */}
        {(product.artisanName || product.craftVillageName) ? (
          <p className="text-xs text-subtle truncate pt-0.5">
            {product.artisanName && (
              <span>{product.artisanName}</span>
            )}
            {product.artisanName && product.craftVillageName && (
              <span className="mx-1 text-muted/60" aria-hidden="true">•</span>
            )}
            {product.craftVillageName && (
              <span>{product.craftVillageName}</span>
            )}
          </p>
        ) : null}

        {/* Price & Action Row */}
        <div className="mt-auto pt-2 flex items-baseline justify-between gap-2">
          {product.priceDisplay ? (
            <p className="text-base font-bold text-ink tracking-tight">
              {product.priceDisplay}
            </p>
          ) : (
            <span className="text-xs text-muted">Liên hệ báo giá</span>
          )}

          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted group-hover:text-brand transition-colors shrink-0">
            <span>Chi tiết</span>
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </div>
    </RouterLink>
  )
}

export default ProductCard
