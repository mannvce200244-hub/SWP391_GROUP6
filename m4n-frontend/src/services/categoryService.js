import apiClient from '../api/apiClient.js'

export const categoryService = Object.freeze({
  async getCategories() {
    return apiClient.get('/categories')
  },

  async getAdminCategories() {
    return apiClient.get('/admin/categories')
  },

  async getCategoryDetail(id) {
    return apiClient.get(`/admin/categories/${id}`)
  },

  async createCategory(payload) {
    return apiClient.post('/admin/categories', payload)
  },

  async updateCategory(id, payload) {
    return apiClient.put(`/admin/categories/${id}`, payload)
  },

  async deleteCategory(id) {
    return apiClient.delete(`/admin/categories/${id}`)
  },
})

export default categoryService
