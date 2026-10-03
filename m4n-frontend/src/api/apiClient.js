const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`

  const headers = {
    Accept: 'application/json',
    ...options.headers,
  }

  const config = {
    ...options,
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
