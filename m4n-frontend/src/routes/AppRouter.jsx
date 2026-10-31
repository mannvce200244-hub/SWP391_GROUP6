import { useEffect, useState, lazy } from 'react'
import RouteContent from './RouteContent.jsx'
import CustomerLayout from '../layouts/CustomerLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import AdminLayout from '../layouts/AdminLayout.jsx'
import StaffLayout from '../layouts/StaffLayout.jsx'
import PosLayout from '../layouts/PosLayout.jsx'

const HomePage = lazy(() => import('../pages/HomePage.jsx'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage.jsx'))
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage.jsx'))
const ProductListPage = lazy(() => import('../pages/ProductListPage.jsx'))
const ArtisansPage = lazy(() => import('../pages/ArtisansPage.jsx'))
const ArtisanDetailPage = lazy(() => import('../pages/ArtisanDetailPage.jsx'))
const CraftVillageDetailPage = lazy(() => import('../pages/CraftVillageDetailPage.jsx'))
const ArticlesPage = lazy(() => import('../pages/ArticlesPage.jsx'))
const ArticleDetailPage = lazy(() => import('../pages/ArticleDetailPage.jsx'))
const CartPage = lazy(() => import('../pages/CartPage.jsx'))
const CheckoutPage = lazy(() => import('../pages/CheckoutPage.jsx'))
const PaymentReturnPage = lazy(() => import('../pages/PaymentReturnPage.jsx'))

const LoginPage = lazy(() => import('../features/auth/LoginPage.jsx'))
const RegisterPage = lazy(() => import('../features/auth/RegisterPage.jsx'))
const ForgotPasswordPage = lazy(() => import('../features/auth/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('../features/auth/ResetPasswordPage.jsx'))
const ProfilePage = lazy(() => import('../features/auth/ProfilePage.jsx'))
const AccountSecurityPage = lazy(() => import('../features/auth/AccountSecurityPage.jsx'))
const CustomerOrdersPage = lazy(() => import('../features/orders/CustomerOrdersPage.jsx'))
const DeliveryAddressesPage = lazy(() => import('../features/checkout/DeliveryAddressesPage.jsx'))
const ForbiddenPage = lazy(() => import('../pages/ForbiddenPage.jsx'))

const StaffDashboardPage = lazy(() => import('../pages/StaffDashboardPage.jsx'))
const PosDashboardPage = lazy(() => import('../pages/PosDashboardPage.jsx'))
const PosTransactionHistoryPage = lazy(() => import('../pages/PosTransactionHistoryPage.jsx'))
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage.jsx'))
const AdminInstrumentsPage = lazy(() => import('../pages/admin/AdminInstrumentsPage.jsx'))
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage.jsx'))
const AdminArtisansPage = lazy(() => import('../pages/admin/AdminArtisansPage.jsx'))
const AdminCraftVillagesPage = lazy(() => import('../pages/admin/AdminCraftVillagesPage.jsx'))
const AdminArticlesPage = lazy(() => import('../pages/admin/AdminArticlesPage.jsx'))
const AdminInventoryPage = lazy(() => import('../pages/admin/AdminInventoryPage.jsx'))
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage.jsx'))
const AdminInvoicesPage = lazy(() => import('../pages/admin/AdminInvoicesPage.jsx'))
const AdminVouchersPage = lazy(() => import('../pages/admin/AdminVouchersPage.jsx'))
const AdminPricingPage = lazy(() => import('../pages/admin/AdminPricingPage.jsx'))
const AdminProductDetailPage = lazy(() => import('../pages/admin/AdminProductDetailPage.jsx'))
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage.jsx'))
const StaffChatPage = lazy(() => import('../pages/staff/StaffChatPage.jsx'))
const StaffProductsPage = lazy(() => import('../pages/staff/StaffProductsPage.jsx'))
const StaffNotificationsPage = lazy(() => import('../pages/staff/StaffNotificationsPage.jsx'))

import RequireAuth from './RequireAuth.jsx'
import RequireRole from './RequireRole.jsx'
import {
  CUSTOMER_ROUTES,
  matchArtisanDetailPath,
  matchArticleDetailPath,
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

function CurrentRoute() {
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
    return <AuthLayout><RouteContent pathname={pathname}><LoginPage /></RouteContent></AuthLayout>
  }

  if (pathname === CUSTOMER_ROUTES.register) {
    return <AuthLayout><RouteContent pathname={pathname}><RegisterPage /></RouteContent></AuthLayout>
  }

  if (pathname === CUSTOMER_ROUTES.forgotPassword) {
    return <AuthLayout><RouteContent pathname={pathname}><ForgotPasswordPage /></RouteContent></AuthLayout>
  }

  if (pathname === CUSTOMER_ROUTES.resetPassword) {
    return <AuthLayout><RouteContent pathname={pathname}><ResetPasswordPage /></RouteContent></AuthLayout>
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
    pathname === CUSTOMER_ROUTES.adminArticles ||
    pathname === CUSTOMER_ROUTES.adminInventory ||
    pathname === CUSTOMER_ROUTES.adminOrders ||
    pathname === CUSTOMER_ROUTES.adminInvoices ||
    pathname === CUSTOMER_ROUTES.adminVouchers ||
    pathname === CUSTOMER_ROUTES.adminPricing ||
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
    } else if (pathname === CUSTOMER_ROUTES.adminArticles) {
      adminContent = <AdminArticlesPage />
    } else if (pathname === CUSTOMER_ROUTES.adminInventory) {
      adminContent = <AdminInventoryPage />
    } else if (pathname === CUSTOMER_ROUTES.adminOrders) {
      adminContent = <AdminOrdersPage />
    } else if (pathname === CUSTOMER_ROUTES.adminInvoices) {
      adminContent = <AdminInvoicesPage />
    } else if (pathname === CUSTOMER_ROUTES.adminVouchers) {
      adminContent = <AdminVouchersPage />
    } else if (pathname === CUSTOMER_ROUTES.adminPricing) {
      adminContent = <AdminPricingPage />
    } else if (pathname === CUSTOMER_ROUTES.adminProfile) {
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
    } else if (pathname === CUSTOMER_ROUTES.adminUsers) {
      adminContent = <AdminUsersPage />
    }

    return (
      <RequireRole allowedRoles={['ADMIN', 'SUPER_ADMIN']}>
        <AdminLayout pathname={pathname}>
          <RouteContent pathname={pathname}>{adminContent}</RouteContent>
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
    }

    return (
      <RequireRole allowedRoles={['ONLINE_STAFF']}>
        <StaffLayout pathname={pathname}>
          <RouteContent pathname={pathname}>{staffContent}</RouteContent>
        </StaffLayout>
      </RequireRole>
    )
  }

  // 4. POS showroom shell using PosLayout
  if (pathname === CUSTOMER_ROUTES.pos || pathname === CUSTOMER_ROUTES.posHistory) {
    return (
      <RequireRole allowedRoles={['POS_STAFF']}>
        <PosLayout pathname={pathname}>
          <RouteContent pathname={pathname}>
            {pathname === CUSTOMER_ROUTES.posHistory
              ? <PosTransactionHistoryPage />
              : <PosDashboardPage />}
          </RouteContent>
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
  } else if (pathname === CUSTOMER_ROUTES.articles) {
    pageContent = <ArticlesPage />
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
  } else if (pathname === CUSTOMER_ROUTES.addresses) {
    pageContent = <RequireRole allowedRoles={['CUSTOMER']}><DeliveryAddressesPage /></RequireRole>
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
  } else if (pathname === CUSTOMER_ROUTES.paymentReturn) {
    pageContent = <RequireRole allowedRoles={['CUSTOMER']}><PaymentReturnPage /></RequireRole>
  } else if (pathname === CUSTOMER_ROUTES.forbidden) {
    pageContent = <ForbiddenPage />
  } else {
    const productId = matchProductDetailPath(pathname)
    const artisanId = matchArtisanDetailPath(pathname)
    const articleId = matchArticleDetailPath(pathname)
    const villageSlugOrId = matchCraftVillageDetailPath(pathname)

    if (productId) {
      pageContent = <ProductDetailPage key={productId} productId={productId} />
    } else if (artisanId) {
      pageContent = <ArtisanDetailPage artisanId={artisanId} key={artisanId} />
    } else if (articleId) {
      pageContent = <ArticleDetailPage articleId={articleId} key={articleId} />
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
      <RouteContent pathname={pathname}>{pageContent}</RouteContent>
    </CustomerLayout>
  )
}

export default function AppRouter() {
  return <CurrentRoute />
}
