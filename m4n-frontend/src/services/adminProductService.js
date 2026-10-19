import apiClient from '../api/apiClient.js'

export const adminProductService = Object.freeze({
  async listProducts({
    keyword,
    categoryId,
    artisanId,
    craftVillageId,
    isActive,
    page = 0,
    size = 10,
    sort = 'createdAt,desc',
  } = {}) {
    const params = new URLSearchParams()
    if (keyword && keyword.trim()) params.append('keyword', keyword.trim())
    if (categoryId) params.append('categoryId', String(categoryId))
    if (artisanId) params.append('artisanId', String(artisanId))
    if (craftVillageId) params.append('craftVillageId', String(craftVillageId))
    if (typeof isActive === 'boolean') params.append('isActive', String(isActive))
    params.append('page', String(page))
    params.append('size', String(size))
    if (sort) params.append('sort', sort)

    const query = params.toString()
    return apiClient.get(`/admin/products${query ? `?${query}` : ''}`)
  },

  async getProductDetail(id) {
    return apiClient.get(`/admin/products/${id}`)
  },

  async createProduct(payload) {
    return apiClient.post('/admin/products', payload)
  },

  async updateProduct(id, payload) {
    return apiClient.put(`/admin/products/${id}`, payload)
  },

  async updateStatus(id, isActive) {
    return apiClient.patch(`/admin/products/${id}/status`, { isActive })
  },

  async addMedia(id, mediaPayload) {
    return apiClient.post(`/admin/products/${id}/media`, mediaPayload)
  },

  async updateMedia(id, mediaId, mediaPayload) {
    return apiClient.put(`/admin/products/${id}/media/${mediaId}`, mediaPayload)
  },

  async deleteMedia(id, mediaId) {
    return apiClient.delete(`/admin/products/${id}/media/${mediaId}`)
  },
})

export default adminProductService
