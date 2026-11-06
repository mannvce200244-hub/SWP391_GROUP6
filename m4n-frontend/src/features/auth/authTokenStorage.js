let inMemoryToken = null
let revision = 0
let sessionRevision = 0

export const authTokenStorage = Object.freeze({
  getToken() {
    return inMemoryToken
  },

  setToken(token, { isRefresh = false } = {}) {
    inMemoryToken = typeof token === 'string' && token.trim().length > 0 ? token.trim() : null
    revision += 1
    if (!isRefresh) sessionRevision += 1
  },

  clearToken() {
    inMemoryToken = null
    revision += 1
    sessionRevision += 1
  },

  getRevision() {
    return revision
  },

  getSessionRevision() {
    return sessionRevision
  },

  hasToken() {
    return Boolean(inMemoryToken)
  },
})

export default authTokenStorage
