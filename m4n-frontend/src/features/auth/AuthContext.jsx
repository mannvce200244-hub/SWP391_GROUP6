import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AUTH_UNAUTHORIZED_EVENT } from '../../api/apiClient.js'
import authService from './authService.js'
import authTokenStorage from './authTokenStorage.js'
import { AuthContext } from './authContext.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initial authentication hydration via HttpOnly refresh cookie
  useEffect(() => {
    let isMounted = true

    async function hydrateAuth() {
      try {
        const response = await authService.refresh()
        if (isMounted && response && response.accessToken) {
          authTokenStorage.setToken(response.accessToken)
          setUser(response.user)
        }
      } catch {
        if (isMounted) {
          authTokenStorage.clearToken()
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    hydrateAuth()

    const handleUnauthorized = () => {
      authTokenStorage.clearToken()
      setUser(null)
    }

    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => {
      isMounted = false
      window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [])

  const login = useCallback(async ({ email, password }) => {
    const response = await authService.login({ email, password })
    authTokenStorage.setToken(response.accessToken)
    setUser(response.user)
    return response.user
  }, [])

  const register = useCallback(async (payload) => {
    return authService.register(payload)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      authTokenStorage.clearToken()
      setUser(null)
    }
  }, [])

  const logoutAll = useCallback(async () => {
    try {
      await authService.logoutAll()
    } finally {
      authTokenStorage.clearToken()
      setUser(null)
    }
  }, [])

  const changePassword = useCallback(async ({ currentPassword, newPassword, confirmPassword }) => {
    const response = await authService.changePassword({ currentPassword, newPassword, confirmPassword })
    authTokenStorage.clearToken()
    setUser(null)
    return response
  }, [])

  const forgotPassword = useCallback(async ({ email }) => {
    return authService.forgotPassword({ email })
  }, [])

  const resetPassword = useCallback(async ({ token, newPassword, confirmPassword }) => {
    const response = await authService.resetPassword({ token, newPassword, confirmPassword })
    authTokenStorage.clearToken()
    setUser(null)
    return response
  }, [])

  const updateProfile = useCallback(async (payload) => {
    const updated = await authService.updateProfile(payload)
    setUser((prev) => (prev ? { ...prev, ...updated } : null))
    return updated
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch {
      authTokenStorage.clearToken()
      setUser(null)
      return null
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      logoutAll,
      changePassword,
      forgotPassword,
      resetPassword,
      updateProfile,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, logoutAll, changePassword, forgotPassword, resetPassword, updateProfile, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
