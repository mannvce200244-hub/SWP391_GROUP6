import apiClient from '../api/apiClient.js'

function productFormData(payload, files) {
  const form = new FormData()
  form.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  files.forEach((file) => form.append('images', file))
  return form
}

export const adminProductService = Object.freeze({
  async listProducts({
    keyword,
    categoryId,
    artisanId,
    craftVillageId,
    isActive,
    groupVariants = false,
    page = 0,
    size = 10,
    sort = 'stockQuantity,asc',
  } = {}) {
    const params = new URLSearchParams()
    if (groupVariants) params.set('groupVariants', 'true')
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

  listVariants: (id, page = 0, size = 100) => apiClient.get(`/admin/products/${encodeURIComponent(id)}/variants?page=${page}&size=${size}`),

  createVariants(variants, files = []) {
    const payload = { variants }
    return files.length ? apiClient.post('/admin/products/variants/with-images', productFormData(payload, files))
      : apiClient.post('/admin/products/variants', payload)
  },

  async createProduct(payload, files = []) {
    return files.length ? apiClient.post('/admin/products/with-images', productFormData(payload, files))
      : apiClient.post('/admin/products', payload)
  },

  async updateProduct(id, payload, files = []) {
    return files.length ? apiClient.put(`/admin/products/${id}/with-images`, productFormData(payload, files))
      : apiClient.put(`/admin/products/${id}`, payload)
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
