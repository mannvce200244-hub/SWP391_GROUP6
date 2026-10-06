export const CUSTOMER_ROUTES = Object.freeze({
  home: '/',
  products: '/products',
  productDetail: (productId) =>
    `/products/${encodeURIComponent(String(productId))}`,
  artisans: '/artisans',
  artisanDetail: (slugOrId) =>
    `/artisans/${encodeURIComponent(String(slugOrId))}`,
  craftVillages: '/craft-villages',
  craftVillageDetail: (slugOrId) =>
    `/craft-villages/${encodeURIComponent(String(slugOrId))}`,
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  profile: '/profile',
  security: '/account/security',
  orders: '/account/orders',
  cart: '/cart',
  forbidden: '/403',
  staff: '/staff',
  pos: '/pos',
  admin: '/admin',
  adminInstruments: '/admin/instruments',
  adminStore: '/admin/store',
  adminProfile: '/admin/profile',
  adminSecurity: '/admin/security',
})

const ARTISAN_SECTION_ID = 'artisans'

export const HOME_ARTISAN_SECTION = Object.freeze({
  id: ARTISAN_SECTION_ID,
  href: CUSTOMER_ROUTES.artisans,
})

export const ROUTE_CHANGE_EVENT = 'm4n:navigate'

export function navigateTo(pathname) {
  if (typeof window === 'undefined') return
  window.history.pushState(null, '', pathname)
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
  window.scrollTo(0, 0)
}

export function normalizePathname(pathname) {
  if (pathname === CUSTOMER_ROUTES.home) {
    return pathname
  }

  return pathname.replace(/\/+$/, '')
}

export function matchProductDetailPath(pathname) {
  const detailPrefix = `${CUSTOMER_ROUTES.products}/`

  if (!pathname.startsWith(detailPrefix)) {
    return null
  }

  const encodedProductId = pathname.slice(detailPrefix.length)

  if (!encodedProductId || encodedProductId.includes('/')) {
    return null
  }

  try {
    return decodeURIComponent(encodedProductId)
  } catch {
    return null
  }
}

export function isProductPath(pathname) {
  return (
    pathname === CUSTOMER_ROUTES.products ||
    pathname.startsWith(`${CUSTOMER_ROUTES.products}/`)
  )
}

export function matchCraftVillageDetailPath(pathname) {
  const detailPrefix = `${CUSTOMER_ROUTES.craftVillages}/`

  if (!pathname.startsWith(detailPrefix)) {
    return null
  }

  const encodedId = pathname.slice(detailPrefix.length)

  if (!encodedId || encodedId.includes('/')) {
    return null
  }

  try {
    return decodeURIComponent(encodedId)
  } catch {
    return null
  }
}

