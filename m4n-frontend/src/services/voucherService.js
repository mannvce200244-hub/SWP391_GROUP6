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
      validFrom: payload.validFrom ? new Date(payload.validFrom).toISOString() : null,
      validUntil: payload.validUntil ? new Date(payload.validUntil).toISOString() : null,
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
    })
  },

  async updateVoucher(id, payload) {
    return apiClient.put(`/admin/vouchers/${encodeURIComponent(id)}`, {
      discountRate: Number(payload.discountRate) / 100,
      minimumOrderValue: Number(payload.minimumOrderValue),
      isActive: payload.isActive ?? true,
      description: payload.description ? payload.description.trim() : null,
      validFrom: payload.validFrom ? new Date(payload.validFrom).toISOString() : null,
      validUntil: payload.validUntil ? new Date(payload.validUntil).toISOString() : null,
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
    })
  },

  async deleteVoucher(id) {
    return apiClient.delete(`/admin/vouchers/${encodeURIComponent(id)}`)
  },
})

export default voucherService
