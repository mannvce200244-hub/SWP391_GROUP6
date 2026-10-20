import apiClient from '../api/apiClient.js'

export const adminUserService = Object.freeze({
  async listUsers({ search, role, isActive, page = 0, size = 10 } = {}) {
    const params = new URLSearchParams()
    if (search && search.trim()) params.append('search', search.trim())
    if (role && role !== 'ALL') params.append('role', role)
    if (typeof isActive === 'boolean') params.append('isActive', String(isActive))
    params.append('page', String(page))
    params.append('size', String(size))

    const query = params.toString()
    const endpoint = `/admin/users${query ? `?${query}` : ''}`
    return apiClient.get(endpoint)
  },

  async getUserById(id) {
    return apiClient.get(`/admin/users/${id}`)
  },

  async createStaff(payload) {
    return apiClient.post('/admin/users/staff', payload)
  },

  async updateUser(id, payload) {
    return apiClient.patch(`/admin/users/${id}`, payload)
  },

  async changeRole(id, { newRole, expectedVersion }) {
    return apiClient.post(`/admin/users/${id}/role`, { newRole, expectedVersion })
  },

  async disableUser(id, { expectedVersion }) {
    return apiClient.post(`/admin/users/${id}/disable`, { expectedVersion })
  },

  async reactivateUser(id, { expectedVersion }) {
    return apiClient.post(`/admin/users/${id}/reactivate`, { expectedVersion })
  },
})

export default adminUserService
