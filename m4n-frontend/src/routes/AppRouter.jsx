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
import CartPage from '../pages/CartPage.jsx'
import CheckoutPage from '../pages/CheckoutPage.jsx'

import LoginPage from '../features/auth/LoginPage.jsx'
import RegisterPage from '../features/auth/RegisterPage.jsx'
import ForgotPasswordPage from '../features/auth/ForgotPasswordPage.jsx'
import ResetPasswordPage from '../features/auth/ResetPasswordPage.jsx'
import ProfilePage from '../features/auth/ProfilePage.jsx'
import AccountSecurityPage from '../features/auth/AccountSecurityPage.jsx'
import CustomerOrdersPage from '../features/orders/CustomerOrdersPage.jsx'
import ForbiddenPage from '../pages/ForbiddenPage.jsx'

import StaffDashboardPage from '../pages/StaffDashboardPage.jsx'
import PosDashboardPage from '../pages/PosDashboardPage.jsx'
import PosTransactionHistoryPage from '../pages/PosTransactionHistoryPage.jsx'
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx'
import AdminInstrumentsPage from '../pages/admin/AdminInstrumentsPage.jsx'
import AdminCategoriesPage from '../pages/admin/AdminCategoriesPage.jsx'
import AdminArtisansPage from '../pages/admin/AdminArtisansPage.jsx'
import AdminCraftVillagesPage from '../pages/admin/AdminCraftVillagesPage.jsx'
import AdminInventoryPage from '../pages/admin/AdminInventoryPage.jsx'
import AdminOrdersPage from '../pages/admin/AdminOrdersPage.jsx'
import AdminInvoicesPage from '../pages/admin/AdminInvoicesPage.jsx'
import AdminVouchersPage from '../pages/admin/AdminVouchersPage.jsx'
import AdminProductDetailPage from '../pages/admin/AdminProductDetailPage.jsx'
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx'
import StaffChatPage from '../pages/staff/StaffChatPage.jsx'
import StaffProductsPage from '../pages/staff/StaffProductsPage.jsx'
import StaffNotificationsPage from '../pages/staff/StaffNotificationsPage.jsx'

import RequireAuth from './RequireAuth.jsx'
import RequireRole from './RequireRole.jsx'
import {
  CUSTOMER_ROUTES,
  matchCraftVillageDetailPath,
  matchProductDetailPath,
  matchAdminInstrumentDetailPath,
  normalizePathname,
  ROUTE_CHANGE_EVENT,
} from './customerRoutes.js'

function readCurrentPathname() {
  const currentPathname = normalizePathname(window.location.pathname)
  return currentPathname === CUSTOMER_ROUTES.legacyAdminStockImport
    ? CUSTOMER_ROUTES.adminInventory
    : currentPathname
}

function AppRouter() {
  const [pathname, setPathname] = useState(readCurrentPathname)

  useEffect(() => {
    const updatePathname = () => {
      setPathname(readCurrentPathname())
    }

    window.addEventListener('popstate', updatePathname)
    window.addEventListener(ROUTE_CHANGE_EVENT, updatePathname)

    if (normalizePathname(window.location.pathname) === CUSTOMER_ROUTES.legacyAdminStockImport) {
      window.history.replaceState(null, '', CUSTOMER_ROUTES.adminInventory)
    }

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
  const adminInstrumentDetailId = matchAdminInstrumentDetailPath(pathname)

  if (
    pathname === CUSTOMER_ROUTES.admin ||
    pathname === CUSTOMER_ROUTES.adminInstruments ||
    Boolean(adminInstrumentDetailId) ||
    pathname === CUSTOMER_ROUTES.adminCategories ||
    pathname === CUSTOMER_ROUTES.adminArtisans ||
    pathname === CUSTOMER_ROUTES.adminCraftVillages ||
    pathname === CUSTOMER_ROUTES.adminInventory ||
    pathname === CUSTOMER_ROUTES.adminOrders ||
    pathname === CUSTOMER_ROUTES.adminInvoices ||
    pathname === CUSTOMER_ROUTES.adminVouchers ||
    pathname === CUSTOMER_ROUTES.adminProfile ||
    pathname === CUSTOMER_ROUTES.adminSecurity ||
    pathname === CUSTOMER_ROUTES.adminUsers
  ) {
    let adminContent = <AdminDashboardPage />
    if (adminInstrumentDetailId) {
      adminContent = <AdminProductDetailPage productId={adminInstrumentDetailId} />
    } else if (pathname === CUSTOMER_ROUTES.adminInstruments) {
      adminContent = <AdminInstrumentsPage />
    } else if (pathname === CUSTOMER_ROUTES.adminCategories) {
      adminContent = <AdminCategoriesPage />
    } else if (pathname === CUSTOMER_ROUTES.adminArtisans) {
      adminContent = <AdminArtisansPage />
    } else if (pathname === CUSTOMER_ROUTES.adminCraftVillages) {
      adminContent = <AdminCraftVillagesPage />
    } else if (pathname === CUSTOMER_ROUTES.adminInventory) {
      adminContent = <AdminInventoryPage />
    } else if (pathname === CUSTOMER_ROUTES.adminOrders) {
      adminContent = <AdminOrdersPage />
    } else if (pathname === CUSTOMER_ROUTES.adminInvoices) {
      adminContent = <AdminInvoicesPage />
    } else if (pathname === CUSTOMER_ROUTES.adminVouchers) {
      adminContent = <AdminVouchersPage />
    } else if (pathname === CUSTOMER_ROUTES.adminProfile) {
 feature/product-master-data
      adminContent = (
        <ProfilePage
          profileRoute={CUSTOMER_ROUTES.adminProfile}
          securityRoute={CUSTOMER_ROUTES.adminSecurity}
        />
      )
    } else if (pathname === CUSTOMER_ROUTES.adminSecurity) {
      adminContent = (
        <AccountSecurityPage
          profileRoute={CUSTOMER_ROUTES.adminProfile}
          securityRoute={CUSTOMER_ROUTES.adminSecurity}
        />
      )
=======
      adminContent = <ProfilePage />
    } else if (pathname === CUSTOMER_ROUTES.adminSecurity) {
      adminContent = <AccountSecurityPage />
 main
    } else if (pathname === CUSTOMER_ROUTES.adminUsers) {
      adminContent = <AdminUsersPage />
    }

    return (
      <RequireRole allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AdminLayout pathname={pathname}>
          {adminContent}
        </AdminLayout>
      </RequireRole>
    )
  }

  // 3. Online Staff shell using StaffLayout
  if (
    pathname === CUSTOMER_ROUTES.staff ||
    pathname === CUSTOMER_ROUTES.staffOrders ||
    pathname === CUSTOMER_ROUTES.staffChat ||
    pathname === CUSTOMER_ROUTES.staffProducts ||
    pathname === CUSTOMER_ROUTES.staffNotifications ||
    pathname === CUSTOMER_ROUTES.staffProfile ||
    pathname === CUSTOMER_ROUTES.staffSecurity
  ) {
    let staffContent = <StaffDashboardPage />
    if (pathname === CUSTOMER_ROUTES.staffOrders) {
      staffContent = <AdminOrdersPage />
    } else if (pathname === CUSTOMER_ROUTES.staffChat) {
      staffContent = <StaffChatPage />
    } else if (pathname === CUSTOMER_ROUTES.staffProducts) {
      staffContent = <StaffProductsPage />
    } else if (pathname === CUSTOMER_ROUTES.staffNotifications) {
      staffContent = <StaffNotificationsPage />
    } else if (pathname === CUSTOMER_ROUTES.staffProfile) {
 feature/product-master-data
      staffContent = (
        <ProfilePage
          profileRoute={CUSTOMER_ROUTES.staffProfile}
          securityRoute={CUSTOMER_ROUTES.staffSecurity}
        />
      )
    } else if (pathname === CUSTOMER_ROUTES.staffSecurity) {
      staffContent = (
        <AccountSecurityPage
          profileRoute={CUSTOMER_ROUTES.staffProfile}
          securityRoute={CUSTOMER_ROUTES.staffSecurity}
        />
      )
=======
      staffContent = <ProfilePage />
    } else if (pathname === CUSTOMER_ROUTES.staffSecurity) {
      staffContent = <AccountSecurityPage />
 main
    }

    return (
      <RequireRole allowedRoles={['ONLINE_STAFF']}>
        <StaffLayout pathname={pathname}>
          {staffContent}
        </StaffLayout>
      </RequireRole>
    )
  }

  // 4. POS showroom shell using PosLayout
  if (pathname === CUSTOMER_ROUTES.pos || pathname === CUSTOMER_ROUTES.posHistory) {
    return (
      <RequireRole allowedRoles={['POS_STAFF']}>
        <PosLayout pathname={pathname}>
          {pathname === CUSTOMER_ROUTES.posHistory
            ? <PosTransactionHistoryPage />
            : <PosDashboardPage />}
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
  } else if (pathname === CUSTOMER_ROUTES.orders) {
    pageContent = (
      <RequireRole allowedRoles={['CUSTOMER']}>
        <CustomerOrdersPage />
      </RequireRole>
    )
  } else if (pathname === CUSTOMER_ROUTES.cart) {
    pageContent = (
      <RequireRole allowedRoles={['CUSTOMER']}>
        <CartPage />
      </RequireRole>
    )
  } else if (pathname === CUSTOMER_ROUTES.checkout) {
    pageContent = (
      <RequireRole allowedRoles={['CUSTOMER']}>
        <CheckoutPage />
      </RequireRole>
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
