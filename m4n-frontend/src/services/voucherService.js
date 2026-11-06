import apiClient from '../api/apiClient.js'

function toInstant(value) {
  if (!value) return null
  // Keep the backend's precision when an existing timestamp was not edited.
  return value.endsWith('Z') ? value : new Date(value).toISOString()
}

const voucherService = Object.freeze({
  async getAdminVouchers({ page = 0, search = '', state = 'ALL', promotionType = '' } = {}) {
    const query = new URLSearchParams({ page: String(page), size: '10' })
    if (search.trim()) query.set('search', search.trim())
    if (state !== 'ALL') query.set('state', state)
    if (promotionType) query.set('promotionType', promotionType)
    return apiClient.get(`/admin/vouchers/search?${query}`)
  },

  async createVoucher(payload) {
    return apiClient.post('/admin/vouchers', {
      code: payload.code.trim().toUpperCase(),
      discountRate: payload.promotionType === 'SHIPPING' ? null : Number((Number(payload.discountRate) / 100).toFixed(4)),
      fixedDiscountAmount: payload.promotionType === 'SHIPPING' ? Number(payload.fixedDiscountAmount) : null,
      minimumOrderValue: Number(payload.minimumOrderValue),
      isActive: payload.isActive ?? true,
      description: payload.description ? payload.description.trim() : null,
      validFrom: toInstant(payload.validFrom),
      validUntil: toInstant(payload.validUntil),
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
      promotionType: payload.promotionType || 'MANUAL',
      minimumQuantity: payload.minimumQuantity ? Number(payload.minimumQuantity) : null,
    })
  },

  async updateVoucher(id, payload) {
    return apiClient.put(`/admin/vouchers/${encodeURIComponent(id)}`, {
      discountRate: payload.promotionType === 'SHIPPING' ? null : Number((Number(payload.discountRate) / 100).toFixed(4)),
      fixedDiscountAmount: payload.promotionType === 'SHIPPING' ? Number(payload.fixedDiscountAmount) : null,
      minimumOrderValue: Number(payload.minimumOrderValue),
      isActive: payload.isActive ?? true,
      description: payload.description ? payload.description.trim() : null,
      validFrom: toInstant(payload.validFrom),
      validUntil: toInstant(payload.validUntil),
      usageLimit: payload.usageLimit ? Number(payload.usageLimit) : null,
      promotionType: payload.promotionType || 'MANUAL',
      minimumQuantity: payload.minimumQuantity ? Number(payload.minimumQuantity) : null,
    })
  },

  async deleteVoucher(id) {
    return apiClient.delete(`/admin/vouchers/${encodeURIComponent(id)}`)
  },
})

export default voucherService
