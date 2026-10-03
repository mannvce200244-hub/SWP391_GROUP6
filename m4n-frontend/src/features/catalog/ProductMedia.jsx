import { useState } from 'react'
import { getRenderableMedia } from './productMedia.js'

function getAccessibleText(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function ProductMedia({ media, productName }) {
  const [failedUrls, setFailedUrls] = useState(() => new Set())
  const visibleMedia = getRenderableMedia(media).filter(
    (item) => !failedUrls.has(item.url),
  )

  const markAsFailed = (url) => {
    setFailedUrls((current) => new Set(current).add(url))
  }

  if (visibleMedia.length === 0) {
    return (
      <div className="product-media product-media--empty" role="status">
        <p>Chưa có hình ảnh hoặc video cho sản phẩm này.</p>
      </div>
    )
  }

  return (
    <section aria-label={`Media của ${productName}`} className="product-media">
      {visibleMedia.map((item, index) => (
        <figure className="product-media__item" key={`${item.type}-${item.url}`}>
          {item.type === 'image' ? (
            <img
              alt={getAccessibleText(item.alt, productName)}
              decoding="async"
              height="720"
              loading={index === 0 ? 'eager' : 'lazy'}
              onError={() => markAsFailed(item.url)}
              src={item.url}
              width="960"
            />
          ) : (
            <video
              aria-label={getAccessibleText(
                item.label,
                `Video về ${productName}`,
              )}
              controls
              onError={() => markAsFailed(item.url)}
              preload="metadata"
              src={item.url}
            >
              Trình duyệt của bạn không hỗ trợ video.
            </video>
          )}
        </figure>
      ))}
    </section>
  )
}

export default ProductMedia
