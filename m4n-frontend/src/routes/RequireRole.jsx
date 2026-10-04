import { useEffect } from 'react'
import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from './customerRoutes.js'
import AppLoadingScreen from '../components/ui/AppLoadingScreen.jsx'

export function RequireRole({ allowedRoles = [], children }) {
  const { user, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated) {
      navigateTo(CUSTOMER_ROUTES.login)
      return
    }

    if (!allowedRoles.includes(user?.role)) {
      navigateTo(CUSTOMER_ROUTES.forbidden)
    }
  }, [isLoading, isAuthenticated, user, allowedRoles])

  if (isLoading) {
    return <AppLoadingScreen message="Đang kiểm tra quyền truy cập hệ thống…" />
  }

  if (!isAuthenticated || !allowedRoles.includes(user?.role)) {
    return null
  }

  return children
}

export default RequireRole
