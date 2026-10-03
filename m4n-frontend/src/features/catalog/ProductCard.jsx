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
      className="product-card-link"
      href={CUSTOMER_ROUTES.productDetail(product.id)}
    >
      <article className="product-card">
        <div className="product-card__media">
          {showImage ? (
            <img
              alt={
                typeof image.alt === 'string' && image.alt.trim()
                  ? image.alt.trim()
                  : product.name
              }
              decoding="async"
              height="480"
              loading={priority ? undefined : 'lazy'}
              onError={() => setFailedImageUrl(image.url)}
              src={image.url}
              width="640"
            />
          ) : (
            <span>Chưa có hình ảnh</span>
          )}
        </div>
        <div className="product-card__body">
          {supportingDetails.length > 0 ? (
            <p className="product-card__group">{supportingDetails.join(' · ')}</p>
          ) : null}
          <h2>{product.name}</h2>
          {product.priceDisplay ? (
            <p className="product-card__price">{product.priceDisplay}</p>
          ) : null}
          <span className="text-link">
            Xem chi tiết <span aria-hidden="true">→</span>
          </span>
        </div>
      </article>
    </RouterLink>
  )
}

export default ProductCard
