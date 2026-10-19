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
      <div className="flex items-center justify-center p-12 bg-surface-secondary/60 rounded-xl border border-border text-sm text-muted text-center" role="status">
        <p>Chưa có hình ảnh hoặc video cho sản phẩm này.</p>
      </div>
    )
  }

  return (
    <section aria-label={`Media của ${productName}`} className="flex flex-col gap-4 w-full">
      {visibleMedia.map((item, index) => (
        <figure className="rounded-xl overflow-hidden bg-surface border border-border shadow-xs m-0" key={`${item.type}-${item.url}`}>
          {item.type === 'image' ? (
            <img
              alt={getAccessibleText(item.alt, productName)}
              className="w-full h-auto object-cover aspect-4/3"
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
              className="w-full rounded-xl aspect-video bg-black"
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
