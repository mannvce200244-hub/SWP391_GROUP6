import apiClient from '../api/apiClient.js'

export default Object.freeze({
  listPromotions({ page = 0, productId, isActive } = {}) {
    const query = new URLSearchParams({ page: String(page), size: '10' })
    if (productId) query.set('productId', productId)
    if (isActive !== '' && isActive != null) query.set('isActive', String(isActive))
    return apiClient.get(`/admin/product-promotions?${query}`)
  },
  createPromotion: (data) => apiClient.post('/admin/product-promotions', data),
  updatePromotion: (id, data) => apiClient.put(`/admin/product-promotions/${id}`, data),
  deletePromotion: (id, version) => apiClient.delete(`/admin/product-promotions/${id}?expectedVersion=${version}`),
  getShippingSettings: () => apiClient.get('/admin/shipping-settings'),
  updateShippingSettings: (data) => apiClient.put('/admin/shipping-settings', data),
})
