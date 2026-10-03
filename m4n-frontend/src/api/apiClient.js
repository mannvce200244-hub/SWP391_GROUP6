import { authTokenStorage } from '../features/auth/authTokenStorage.js'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
).replace(/\/+$/, '')

export const AUTH_UNAUTHORIZED_EVENT = 'm4n:auth-unauthorized'

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// Single in-flight refresh promise to prevent concurrent refresh stampedes
let refreshPromise = null

function isAuthExemptEndpoint(endpoint) {
  const normalized = endpoint.toLowerCase()
  return (
    normalized.includes('/auth/login') ||
    normalized.includes('/auth/register') ||
    normalized.includes('/auth/refresh') ||
    normalized.includes('/auth/forgot-password') ||
    normalized.includes('/auth/reset-password')
  )
}

async function performTokenRefresh() {
  const refreshUrl = `${API_BASE_URL}/auth/refresh`
  try {
    const response = await fetch(refreshUrl, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      authTokenStorage.clearToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
      }
      return null
    }

    const data = await response.json()
    if (data && data.accessToken) {
      authTokenStorage.setToken(data.accessToken)
      return data.accessToken
    }
    return null
  } catch {
    authTokenStorage.clearToken()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT))
    }
    return null
  }
}

async function request(endpoint, options = {}, isRetry = false) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  const token = authTokenStorage.getToken()
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

    if (response.status === 204) {
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    const isJson = contentType.includes('application/json')
    const payload = isJson ? await response.json() : await response.text()

    if (!response.ok) {
      // Check for automatic refresh on 401
      if (response.status === 401 && !isRetry && !isAuthExemptEndpoint(endpoint)) {
        if (!refreshPromise) {
          refreshPromise = performTokenRefresh().finally(() => {
            refreshPromise = null
          })
        }

        const newToken = await refreshPromise
        if (newToken) {
          // Retry the original request with the new access token
          return request(endpoint, options, true)
        }
      }

      const errorMessage =
        (typeof payload === 'object' && payload !== null && payload.message) ||
        `Request failed with status ${response.status}`
      throw new ApiError(errorMessage, response.status, payload)
    }

    return payload
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(error.message || 'Network error occurred', 0, null)
  }
}

export const apiClient = Object.freeze({
  getBaseUrl() {
    return API_BASE_URL
  },
  get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' })
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
