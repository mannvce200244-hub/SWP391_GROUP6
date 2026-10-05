import { useEffect, useState } from 'react'
import CustomerLayout from '../layouts/CustomerLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import StaffLayout from '../layouts/StaffLayout.jsx'
import PosLayout from '../layouts/PosLayout.jsx'

import HomePage from '../pages/HomePage.jsx'
import NotFoundPage from '../pages/NotFoundPage.jsx'
import ProductDetailPage from '../pages/ProductDetailPage.jsx'
import ProductListPage from '../pages/ProductListPage.jsx'
import ArtisansPage from '../pages/ArtisansPage.jsx'
import CraftVillageDetailPage from '../pages/CraftVillageDetailPage.jsx'

import LoginPage from '../features/auth/LoginPage.jsx'
import RegisterPage from '../features/auth/RegisterPage.jsx'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from '../features/auth/ResetPasswordPage.jsx'
import ProfilePage from '../features/auth/ProfilePage.jsx'
import AccountSecurityPage from '../features/auth/AccountSecurityPage.jsx'
import ForbiddenPage from '../pages/ForbiddenPage.jsx'

import StaffDashboardPage from '../pages/StaffDashboardPage.jsx'
import PosDashboardPage from '../pages/PosDashboardPage.jsx'
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx'

import RequireAuth from './RequireAuth.jsx'
import RequireRole from './RequireRole.jsx'
import {
  CUSTOMER_ROUTES,
  matchCraftVillageDetailPath,
  matchProductDetailPath,
  normalizePathname,
  ROUTE_CHANGE_EVENT,
} from './customerRoutes.js'

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

  // 1. Auth pages using AuthLayout
  if (pathname === CUSTOMER_ROUTES.login) {
    return <AuthLayout><LoginPage /></AuthLayout>
  }

  if (pathname === CUSTOMER_ROUTES.register) {
    return <AuthLayout><RegisterPage /></AuthLayout>
  }

  if (pathname === CUSTOMER_ROUTES.forgotPassword) {
    return <AuthLayout><ForgotPasswordPage /></AuthLayout>
  }

  if (pathname === CUSTOMER_ROUTES.resetPassword) {
    return <AuthLayout><ResetPasswordPage /></AuthLayout>
  }

  // 2. Admin shell using AdminLayout
  if (pathname === CUSTOMER_ROUTES.admin) {
    return (
      <RequireRole allowedRoles={['ADMIN']}>
        <AdminLayout pathname={pathname}>
          <AdminDashboardPage />
        </AdminLayout>
      </RequireRole>
    )
  }

  // 3. Online Staff shell using StaffLayout
  if (pathname === CUSTOMER_ROUTES.staff) {
    return (
      <RequireRole allowedRoles={['ONLINE_STAFF', 'ADMIN']}>
        <StaffLayout pathname={pathname}>
          <StaffDashboardPage />
        </StaffLayout>
      </RequireRole>
    )
  }

  // 4. POS showroom shell using PosLayout
  if (pathname === CUSTOMER_ROUTES.pos) {
    return (
      <RequireRole allowedRoles={['POS_STAFF']}>
        <PosLayout pathname={pathname}>
          <PosDashboardPage />
        </PosLayout>
      </RequireRole>
    )
  }

  // 5. Customer Account & Public pages using CustomerLayout
  let pageContent

  if (pathname === CUSTOMER_ROUTES.home) {
    pageContent = <HomePage />
  } else if (pathname === CUSTOMER_ROUTES.products) {
    pageContent = <ProductListPage />
  } else if (pathname === CUSTOMER_ROUTES.artisans) {
    pageContent = <ArtisansPage />
  } else if (pathname === CUSTOMER_ROUTES.profile) {
    pageContent = (
      <RequireAuth>
        <ProfilePage />
      </RequireAuth>
    )
  } else if (pathname === CUSTOMER_ROUTES.security) {
    pageContent = (
      <RequireAuth>
        <AccountSecurityPage />
      </RequireAuth>
    )
  } else if (pathname === CUSTOMER_ROUTES.forbidden) {
    pageContent = <ForbiddenPage />
  } else {
    const productId = matchProductDetailPath(pathname)
    const villageSlugOrId = matchCraftVillageDetailPath(pathname)

    if (productId) {
      pageContent = <ProductDetailPage key={productId} productId={productId} />
    } else if (villageSlugOrId) {
      pageContent = (
        <CraftVillageDetailPage
          key={villageSlugOrId}
          slugOrId={villageSlugOrId}
        />
      )
    } else {
      pageContent = <NotFoundPage />
    }
  }

  return (
    <CustomerLayout pathname={pathname}>
      {pageContent}
    </CustomerLayout>
  )
}

export default AppRouter
