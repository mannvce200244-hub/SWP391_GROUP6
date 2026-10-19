let inMemoryToken = null

export const authTokenStorage = Object.freeze({
  getToken() {
    return inMemoryToken
  },

  setToken(token) {
    inMemoryToken = typeof token === 'string' && token.trim().length > 0 ? token.trim() : null
  },

  clearToken() {
    inMemoryToken = null
  },

  hasToken() {
    return Boolean(inMemoryToken)
  },
})

export default authTokenStorage
