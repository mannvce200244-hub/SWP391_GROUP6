import { useEffect } from 'react'
import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo, normalizePathname } from './customerRoutes.js'
import AppLoadingScreen from '../components/ui/AppLoadingScreen.jsx'
import { hasRolePermission } from './roleUtils.js'
import { paymentReturnOrderId } from '../services/paymentService.js'
import { posPaymentReturnId } from '../services/posMomoService.js'

export function RequireRole({ allowedRoles = [], children }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  const hasAccess = hasRolePermission(user?.role, allowedRoles)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      const orderId = normalizePathname(window.location.pathname) === CUSTOMER_ROUTES.paymentReturn
        ? paymentReturnOrderId(window.location.search) : null
      const posPaymentId = normalizePathname(window.location.pathname) === CUSTOMER_ROUTES.pos
        ? posPaymentReturnId(window.location.search) : null
      navigateTo(posPaymentId ? `${CUSTOMER_ROUTES.login}?m4nPosPaymentId=${encodeURIComponent(posPaymentId)}`
        : orderId ? `${CUSTOMER_ROUTES.login}?m4nOrderId=${encodeURIComponent(orderId)}` : CUSTOMER_ROUTES.login)
      return
    }

    if (!hasAccess) {
      navigateTo(CUSTOMER_ROUTES.forbidden)
    }
  }, [isLoading, isAuthenticated, hasAccess])

  if (isLoading) {
    return <AppLoadingScreen message="Đang kiểm tra quyền truy cập hệ thống…" />
  }

  if (!isAuthenticated || !hasAccess) {
    return null
  }

  return children
}

export default RequireRole
