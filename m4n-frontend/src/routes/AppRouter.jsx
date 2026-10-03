import { useEffect, useState } from 'react'
import CustomerLayout from '../layouts/CustomerLayout.jsx'
import HomePage from '../pages/HomePage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import ProductDetailPage from '../pages/ProductDetailPage.jsx'
import ProductListPage from '../pages/ProductListPage.jsx'
import {
  CUSTOMER_ROUTES,
  matchProductDetailPath,
  normalizePathname,
  ROUTE_CHANGE_EVENT,
} from './customerRoutes.js'

function resolvePage(pathname) {
  if (pathname === CUSTOMER_ROUTES.home) {
    return <HomePage />
  }

  if (pathname === CUSTOMER_ROUTES.products) {
    return <ProductListPage />
  }

  const productId = matchProductDetailPath(pathname)

  if (productId) {
    return <ProductDetailPage key={productId} productId={productId} />
  }

  return <NotFoundPage />
}

function AppRouter() {
  const [pathname, setPathname] = useState(() =>
    normalizePathname(window.location.pathname),
  )

  useEffect(() => {
    const updatePathname = () => {
      setPathname(normalizePathname(window.location.pathname))
    }

    window.addEventListener('popstate', updatePathname)
    window.addEventListener(ROUTE_CHANGE_EVENT, updatePathname)

    return () => {
      window.removeEventListener('popstate', updatePathname)
      window.removeEventListener(ROUTE_CHANGE_EVENT, updatePathname)
    }
  }, [])

  return (
    <CustomerLayout pathname={pathname}>{resolvePage(pathname)}</CustomerLayout>
  )
}

export default AppRouter
