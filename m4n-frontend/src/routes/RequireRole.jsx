import { useEffect } from 'react'
import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from './customerRoutes.js'
import AppLoadingScreen from '../components/ui/AppLoadingScreen.jsx'
import { hasRolePermission } from './roleUtils.js'

export function RequireRole({ allowedRoles = [], children }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  const hasAccess = hasRolePermission(user?.role, allowedRoles)

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      navigateTo(CUSTOMER_ROUTES.login)
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
