import { useEffect } from 'react'
import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from './customerRoutes.js'
import AppLoadingScreen from '../components/ui/AppLoadingScreen.jsx'

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigateTo(CUSTOMER_ROUTES.login)
    }
  }, [isLoading, isAuthenticated])

  if (isLoading) {
    return <AppLoadingScreen message="Đang xác thực thông tin tài khoản…" />
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}

export default RequireAuth
