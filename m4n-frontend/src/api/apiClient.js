import { authTokenStorage } from '../features/auth/authTokenStorage.js'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8080/api/v1' : '/api/v1')
).replace(/\/+$/, '')

export const AUTH_UNAUTHORIZED_EVENT = 'm4n:auth-unauthorized'
export const AUTH_REFRESHED_EVENT = 'm4n:auth-refreshed'

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = data && typeof data === 'object' ? data.error || null : null
    this.fieldErrors =
      data && typeof data === 'object' && data.fieldErrors && typeof data.fieldErrors === 'object'
        ? data.fieldErrors
        : {}
  }
}

function getValidationMessage(payload) {
  if (!payload || typeof payload !== 'object' || !payload.fieldErrors) return null

  const messages = [...new Set(
    Object.values(payload.fieldErrors)
      .filter((message) => typeof message === 'string')
      .map((message) => message.trim())
      .filter(Boolean)
  )]

  if (messages.length === 0) return null
  const detail = messages.join('; ')
  return `Vui lòng kiểm tra: ${detail}${/[.!?]$/.test(detail) ? '' : '.'}`
}

// Single in-flight refresh promise to prevent concurrent refresh stampedes
let refreshPromise = null

function isAuthExemptEndpoint(endpoint) {
  const normalized = endpoint.toLowerCase().split('?')[0]
  return ['/auth/login', '/auth/google/options', '/auth/register', '/auth/register/start', '/auth/register/verify', '/auth/email-otp', '/auth/verify-reset-otp', '/auth/reset-password-otp', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/logout'].includes(normalized)
}

function clearSession() {
  authTokenStorage.clearToken()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
  }
}

function refreshSession() {
  if (!refreshPromise) {
    const revision = authTokenStorage.getRevision()
    refreshPromise = request('/auth/refresh', { method: 'POST' })
      .then((data) => {
        if (authTokenStorage.getRevision() !== revision) {
          throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.', 401)
        }
        if (!data?.accessToken || !data?.user) {
          throw new ApiError('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.', 502)
        }
        authTokenStorage.setToken(data.accessToken, { isRefresh: true })
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(AUTH_REFRESHED_EVENT, { detail: data.user }))
        }
        return data
      })
      .catch((error) => {
        if ((error.status === 401 || error.status === 403) && authTokenStorage.getRevision() === revision) {
          clearSession()
        }
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

async function request(endpoint, options = {}, isRetry = false) {
  // Login/logout must follow any cookie rotation already in flight.
  if (/^\/auth\/(login|logout|logout-all)$/.test(endpoint) && refreshPromise) {
    await refreshPromise.catch(() => {})
  }
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`

  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'M4N',
    ...options.headers,
  }

  const token = isAuthExemptEndpoint(endpoint) ? null : authTokenStorage.getToken()
  const sessionRevision = authTokenStorage.getSessionRevision()
  const requireCurrentSession = () => {
    if (!isAuthExemptEndpoint(endpoint) && authTokenStorage.getSessionRevision() !== sessionRevision) {
      throw new ApiError('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.', 401)
    }
  }
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const config = {
    ...options,
    credentials: 'include',
    headers,
  }

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
    config.body = JSON.stringify(config.body)
  }

  try {
    const response = await fetch(url, config)

    requireCurrentSession()

    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    if (response.ok && options.responseType === 'blob') {
      const file = await response.blob()
      requireCurrentSession()
      return file
    }
    const payload = isJson ? await response.json() : await response.text()
    requireCurrentSession()

    if (!response.ok) {
      // Check for automatic refresh on 401
      if (response.status === 401 && !isRetry && !isAuthExemptEndpoint(endpoint)) {
        // Another response may already have rotated the token while this request was pending.
        if (authTokenStorage.getToken() && authTokenStorage.getToken() !== token) {
          return request(endpoint, options, true)
        }
        const refreshed = await refreshSession()
        if (refreshed.accessToken) {
          return request(endpoint, options, true)
        }
      }
      if (response.status === 401 && isRetry && authTokenStorage.getToken() === token) clearSession()

      const validationMessage = getValidationMessage(payload)
      const unavailableMessage = response.status === 503 && typeof payload?.message === 'string'
        ? payload.message : null
      const errorMessage =
        unavailableMessage || (response.status >= 500 ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.' : validationMessage) ||
        (typeof payload === 'object' && payload !== null && payload.message) ||
        `Yêu cầu không thành công (HTTP ${response.status}).`
      throw new ApiError(errorMessage, response.status, payload)
    }

    return payload
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    if (error.name === 'AbortError') throw error
    throw new ApiError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.', 0)
  }
}

export const apiClient = Object.freeze({
  refreshSession,
  getBaseUrl() {
    return API_BASE_URL
  },
  get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' })
  },
  getBlob(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET', responseType: 'blob' })
  },
  post(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'POST', body })
  },
  put(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'PUT', body })
  },
  patch(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'PATCH', body })
  },
  delete(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'DELETE' })
  },
})

export default apiClient
