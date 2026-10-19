import apiClient from '../api/apiClient.js'

const voucherService = Object.freeze({
  async getAdminVouchers() {
    return apiClient.get('/admin/vouchers')
  },

  async createVoucher(payload) {
    return apiClient.post('/admin/vouchers', {
      code: payload.code.trim().toUpperCase(),
      discountRate: Number(payload.discountRate) / 100,
      minimumOrderValue: Number(payload.minimumOrderValue),
      isActive: payload.isActive ?? true,
      description: payload.description ? payload.description.trim() : null,
    })
  },

  async updateVoucher(id, payload) {
    return apiClient.put(`/admin/vouchers/${encodeURIComponent(id)}`, {
      discountRate: Number(payload.discountRate) / 100,
      minimumOrderValue: Number(payload.minimumOrderValue),
      isActive: payload.isActive ?? true,
      description: payload.description ? payload.description.trim() : null,
    })
  },

  async deleteVoucher(id) {
    return apiClient.delete(`/admin/vouchers/${encodeURIComponent(id)}`)
  },
})

export default voucherService
