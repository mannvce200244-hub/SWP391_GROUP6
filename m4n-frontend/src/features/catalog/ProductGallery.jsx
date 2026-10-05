import { useState } from 'react'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import { getRenderableMedia } from './productMedia.js'

function ProductGallery({ media = [], productName = 'Nhạc cụ truyền thống' }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedUrls, setFailedUrls] = useState(() => new Set())

  const validMedia = getRenderableMedia(media).filter(
    (item) => !failedUrls.has(item.url),
  )

  const markFailed = (url) => {
    setFailedUrls((prev) => new Set(prev).add(url))
  }

  if (validMedia.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center aspect-4/3 sm:aspect-square bg-surface-secondary/50 rounded-2xl border border-border/60 p-8 text-center">
        <IconInstrument className="text-subtle/50 mb-3" size={48} />
        <p className="text-sm font-medium text-muted">Chưa có hình ảnh cho nhạc cụ này</p>
      </div>
    )
  }

  const safeIndex = activeIndex < validMedia.length ? activeIndex : 0
  const currentMedia = validMedia[safeIndex] || validMedia[0]
  const currentType = currentMedia.type ? String(currentMedia.type).toLowerCase() : 'image'

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* 1. Main Display Viewer */}
      <div className="relative aspect-4/3 sm:aspect-square w-full rounded-2xl bg-surface-secondary/50 border border-border/60 overflow-hidden flex items-center justify-center transition-all duration-300">
        {currentType === 'video' ? (
          <video
            aria-label={`Video về ${productName}`}
            className="w-full h-full object-cover bg-black"
            controls
            key={currentMedia.url}
            onError={() => markFailed(currentMedia.url)}
            playsInline
            preload="metadata"
            src={currentMedia.url}
          >
            Trình duyệt không hỗ trợ xem video.
          </video>
        ) : (
          <img
            alt={currentMedia.alt || productName}
            className="w-full h-full object-cover animate-in fade-in duration-250"
            decoding="async"
            height="800"
            key={currentMedia.url}
            loading="eager"
            onError={() => markFailed(currentMedia.url)}
            src={currentMedia.url}
            width="800"
          />
        )}
      </div>

      {/* 2. Thumbnails Row (only when multiple media exist) */}
      {validMedia.length > 1 && (
        <div
          aria-label="Danh sách ảnh thu nhỏ"
          className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none"
          role="tablist"
        >
          {validMedia.map((item, idx) => {
            const isActive = idx === safeIndex
            const itemType = item.type ? String(item.type).toLowerCase() : 'image'
            return (
              <button
                key={`${item.url}-${idx}`}
                aria-label={`Xem ảnh ${idx + 1}: ${item.alt || productName}`}
                aria-selected={isActive}
                className={`relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-surface-secondary border-2 transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'border-brand ring-2 ring-brand/20 shadow-xs'
                    : 'border-border/60 hover:border-brand/40 opacity-70 hover:opacity-100'
                }`}
                onClick={() => setActiveIndex(idx)}
                role="tab"
                type="button"
              >
                {itemType === 'video' ? (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white relative">
                    <span className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-xs backdrop-blur-xs">
                      ▶
                    </span>
                  </div>
                ) : (
                  <img
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    decoding="async"
                    height="80"
                    loading="lazy"
                    onError={() => markFailed(item.url)}
                    src={item.url}
                    width="80"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProductGallery
