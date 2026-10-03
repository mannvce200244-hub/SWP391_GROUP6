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

  return media.filter(
    (item) =>
      item &&
      (item.type === 'image' || item.type === 'video') &&
      isSafeMediaUrl(item.url),
  )
}

function getFirstProductImage(media) {
  return getRenderableMedia(media).find((item) => item.type === 'image') ?? null
}

export { getFirstProductImage, getRenderableMedia }
