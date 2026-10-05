function isSafeMediaUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false
  }

  const url = value.trim()

  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }

  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

function getRenderableMedia(media) {
  if (!Array.isArray(media)) {
    return []
  }

  return media.filter((item) => {
    if (!item || !isSafeMediaUrl(item.url)) return false
    const type = item.type ? String(item.type).toLowerCase() : 'image'
    return type === 'image' || type === 'video'
  })
}

function getFirstProductImage(media) {
  return (
    getRenderableMedia(media).find((item) => {
      const type = item.type ? String(item.type).toLowerCase() : 'image'
      return type === 'image'
    }) ?? null
  )
}

export { getFirstProductImage, getRenderableMedia, isSafeMediaUrl }
