import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import { getFirstProductImage } from './productMedia.js'

function ProductCard({ priority = false, product }) {
  const [failedImageUrl, setFailedImageUrl] = useState(null)
  const image = getFirstProductImage(product.media)
  const showImage = image && failedImageUrl !== image.url
  const supportingDetails = [
    product.groupName,
    product.artisanName,
    product.craftVillageName,
  ].filter(Boolean)

  return (
    <RouterLink
      aria-label={`Xem chi tiết ${product.name}`}
      className="group block no-underline focus-visible:outline-none h-full"
      href={CUSTOMER_ROUTES.productDetail(product.id)}
    >
      <article className="flex flex-col h-full rounded-xl border border-border bg-surface overflow-hidden shadow-xs hover:shadow-md hover:border-border-strong transition-all duration-200">
        <div className="aspect-square w-full overflow-hidden bg-surface-secondary relative flex items-center justify-center">
          {showImage ? (
            <img
              alt={
                typeof image.alt === 'string' && image.alt.trim()
                  ? image.alt.trim()
                  : product.name
              }
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
              decoding="async"
              height="480"
              loading={priority ? undefined : 'lazy'}
              onError={() => setFailedImageUrl(image.url)}
              src={image.url}
              width="640"
            />
          ) : (
            <span className="text-xs text-muted font-medium">Chưa có hình ảnh</span>
          )}
        </div>
        <div className="p-4 sm:p-5 flex flex-col flex-1 gap-1.5">
          {supportingDetails.length > 0 ? (
            <p className="text-xs font-medium text-muted truncate">{supportingDetails.join(' · ')}</p>
          ) : null}
          <h2 className="text-base font-semibold text-ink group-hover:text-brand transition-colors line-clamp-2">{product.name}</h2>
          {product.priceDisplay ? (
            <p className="text-base font-bold text-brand mt-1">{product.priceDisplay}</p>
          ) : null}
          <span className="mt-auto pt-3 text-xs font-semibold text-brand flex items-center gap-1 group-hover:underline">
            Xem chi tiết <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </article>
    </RouterLink>
  )
}

export default ProductCard
