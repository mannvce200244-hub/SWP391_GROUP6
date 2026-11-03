import apiClient from '../../api/apiClient.js'

export const authService = Object.freeze({
  async getGoogleLoginOptions(options = {}) {
    return apiClient.get('/auth/google/options', options)
  },

  startGoogleLogin(paymentOrderId) {
    if (paymentOrderId) sessionStorage.setItem('m4n-google-return-order', String(paymentOrderId))
    else sessionStorage.removeItem('m4n-google-return-order')
    // Keep OAuth state and refresh cookies on the frontend origin, including hosted deployments.
    window.location.assign('/api/v1/auth/google/authorization/google')
  },

  async login({ email, password }) {
    return apiClient.post('/auth/login', {
      email: email?.trim(),
      password,
    })
  },

  async register({ fullName, email, password, phone, address, challengeId, code }) {
    return apiClient.post('/auth/register', {
      registration: {
      fullName: fullName?.trim(),
      email: email?.trim()?.toLowerCase(),
      password,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      },
      challengeId,
      code,
    })
  },

  async requestEmailOtp({ email, purpose }) {
    return apiClient.post('/auth/email-otp', { email: email?.trim()?.toLowerCase(), purpose })
  },

  async startRegistration({ fullName, email, password, phone }) {
    return apiClient.post('/auth/register/start', {
      fullName: fullName?.trim(), email: email?.trim()?.toLowerCase(), password, phone: phone?.trim() || null,
    })
  },

  async verifyRegistration({ email, challengeId, code }) {
    return apiClient.post('/auth/register/verify', { email, challengeId, code })
  },

  async resetPasswordOtp(payload) {
    return apiClient.post('/auth/reset-password-otp', payload)
  },

  async verifyResetOtp({ email, challengeId, code }) {
    return apiClient.post('/auth/verify-reset-otp', {
      email: email?.trim()?.toLowerCase(), challengeId, code,
    })
  },

  async refresh() {
    return apiClient.refreshSession()
  },

  async logout() {
    return apiClient.post('/auth/logout')
  },

  async logoutAll() {
    return apiClient.post('/auth/logout-all')
  },

  async getCurrentUser() {
    return apiClient.get('/auth/me')
  },

  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    })
  },

  async forgotPassword({ email }) {
    return apiClient.post('/auth/forgot-password', {
      email: email?.trim()?.toLowerCase(),
    })
  },

  async resetPassword({ token, newPassword, confirmPassword }) {
    return apiClient.post('/auth/reset-password', {
      token: token?.trim(),
      newPassword,
      confirmPassword,
    })
  },

  async getProfile() {
    return apiClient.get('/profile')
  },

  async updateProfile({ fullName, phone, address }) {
    return apiClient.put('/profile', {
      fullName: fullName?.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
    })
  },
})

export default authService
