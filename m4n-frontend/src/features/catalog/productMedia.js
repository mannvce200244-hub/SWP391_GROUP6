import apiClient from '../../api/apiClient.js'

function isSafeMediaUrl(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return false
  }

  const url = value.trim()
  if (url.includes('\\') || Array.from(url).some((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127
  })) return false

  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }

  try {
    const parsed = new URL(url)
    if (parsed.username || parsed.password) return false
    if (parsed.protocol === 'https:') return true
    // Local uploads use the backend HTTP URL during development. Never allow
    // arbitrary HTTP media or mixed content on an HTTPS storefront.
    if (typeof window === 'undefined' || window.location.protocol !== 'http:') return false
    const api = new URL(apiClient.getBaseUrl(), window.location.origin)
    const mediaPath = `${api.pathname.replace(/\/+$/, '')}/media/`
    return parsed.protocol === 'http:' && parsed.origin === api.origin
      && ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)
      && parsed.pathname.startsWith(mediaPath)
      && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/.test(parsed.pathname.slice(mediaPath.length))
      && !parsed.search && !parsed.hash
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
