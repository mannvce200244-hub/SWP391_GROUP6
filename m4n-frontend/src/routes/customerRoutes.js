export const CUSTOMER_ROUTES = Object.freeze({
  home: '/',
  products: '/products',
  productDetail: (productId) =>
    `/products/${encodeURIComponent(String(productId))}`,
})

export const ROUTE_CHANGE_EVENT = 'm4n:navigate'

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
