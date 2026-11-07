import { useState } from 'react'

function ArtisanPortrait({ src, name, className = '', ...imageProps }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return (
      <div
        aria-label={`Ảnh ${name} đang cập nhật`}
        className={`${className} flex items-center justify-center bg-surface-secondary p-6 text-center text-sm text-muted`}
        role="img"
      >
        Ảnh nghệ nhân đang cập nhật
      </div>
    )
  }

  return (
    <img
      {...imageProps}
      alt={`Chân dung ${name}`}
      className={className}
      onError={() => setFailedSrc(src)}
      referrerPolicy="no-referrer"
      src={src}
    />
  )
}

export default ArtisanPortrait
