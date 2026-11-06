import apiClient from '../api/apiClient.js'

export const craftVillageService = Object.freeze({
  async getCraftVillages() {
    return apiClient.get('/craft-villages')
  },

  async getAdminCraftVillages() {
    return apiClient.get('/admin/craft-villages')
  },

  async getCraftVillageDetail(id) {
    return apiClient.get(`/admin/craft-villages/${id}`)
  },

  async createCraftVillage(payload) {
    return apiClient.post('/admin/craft-villages', payload)
  },

  async updateCraftVillage(id, payload) {
    return apiClient.put(`/admin/craft-villages/${id}`, payload)
  },

  async deleteCraftVillage(id) {
    return apiClient.delete(`/admin/craft-villages/${id}`)
  },
})

export default craftVillageService
