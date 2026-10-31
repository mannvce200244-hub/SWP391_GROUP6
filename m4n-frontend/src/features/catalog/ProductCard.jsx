import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import { getFirstProductImage } from './productMedia.js'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import { formatCurrencyVND } from '../../utils/currency.js'

function ProductCard({ priority = false, product }) {
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const rawImage = getFirstProductImage(product.media)
  const hasValidImage = Boolean(rawImage && failedImageUrl !== rawImage.url)

  // Stock status text if available in product data
  const hasStockInfo =
    product.inStock !== undefined ||
    product.status !== undefined ||
    product.availability !== undefined
  const isInStock =
    product.inStock === true ||
    product.status === 'AVAILABLE' ||
    product.status === 'IN_STOCK' ||
    product.availability === 'IN_STOCK' || product.availability === 'LOW_STOCK'
  const isLowStock = product.availability === 'LOW_STOCK'

  return (
    <RouterLink
      aria-label={`Xem chi tiết ${product.name}`}
      className="group flex flex-col h-full no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 select-none rounded-xl bg-white border border-border hover:border-brand/40 p-3 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
      href={CUSTOMER_ROUTES.productDetail(product.id)}
    >
      {/* 1. Image Container (1:1 aspect ratio, smooth hover scale) */}
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface-secondary relative flex items-center justify-center border border-border-subtle">
        {hasValidImage ? (
          <img
            alt={
              typeof rawImage.alt === 'string' && rawImage.alt.trim()
                ? rawImage.alt.trim()
                : product.name
            }
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300 ease-out"
            decoding="async"
            height="500"
            loading={priority ? undefined : 'lazy'}
            onError={() => setFailedImageUrl(rawImage.url)}
            src={rawImage.url}
            width="500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-secondary/60 text-subtle p-4 text-center select-none">
            <IconInstrument size={40} className="text-muted/40 mb-2 group-hover:scale-105 transition-transform duration-200" />
            <span className="text-xs font-medium text-muted/70">Hình ảnh đang cập nhật</span>
          </div>
        )}

        {/* Category Tag */}
        {product.groupName ? (
          <span className="absolute top-2.5 left-2.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-white/95 text-ink-secondary border border-border/80 shadow-2xs backdrop-blur-xs">
            {product.groupName}
          </span>
        ) : null}

        {/* Optional Stock Status badge */}
        {hasStockInfo ? (
          <span
            className={`absolute bottom-2.5 right-2.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs shadow-2xs ${
              isInStock
                ? 'bg-surface-secondary text-jade border border-jade-border'
                : 'bg-white/95 text-muted border border-border'
            }`}
          >
            {isLowStock ? 'Sắp hết hàng' : isInStock ? 'Còn hàng' : 'Hết hàng'}
          </span>
        ) : null}
      </div>

      {/* 2. Product Details */}
      <div className="pt-3 pb-1 flex flex-col flex-1 gap-1.5">
        {/* Product Title */}
        <h3 className="text-base font-bold text-ink leading-snug group-hover:text-brand transition-colors duration-200 line-clamp-2">
          {product.name}
        </h3>

        {/* Artisan & Village Metadata */}
        {product.artisanName || product.craftVillageName ? (
          <p className="text-xs text-muted truncate flex items-center gap-1.5">
            {product.artisanName && (
              <span className="font-medium text-ink-secondary">{product.artisanName}</span>
            )}
            {product.artisanName && product.craftVillageName && (
              <span className="text-muted/50" aria-hidden="true">•</span>
            )}
            {product.craftVillageName && (
              <span>{product.craftVillageName}</span>
            )}
          </p>
        ) : null}

        {/* Price & Action Row */}
        {Number(product.productDiscountAmount) > 0 && <p className="text-xs text-muted mt-2">Giá niêm yết: <del>{formatCurrencyVND(product.originalPrice)}</del></p>}
        <div className="mt-auto pt-2.5 flex items-baseline justify-between gap-2 border-t border-border-subtle">
          {product.priceDisplay ? (
            <p className="text-base font-extrabold text-brand tracking-tight">
              {product.priceDisplay}
            </p>
          ) : (
            <span className="text-xs text-muted font-medium">Liên hệ báo giá</span>
          )}

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted group-hover:text-brand transition-colors shrink-0">
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
