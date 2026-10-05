import apiClient, { ApiError } from './apiClient.js'

const productCatalogAdapter = Object.freeze({
  async listProducts(filters = {}) {
    const params = new URLSearchParams()

    if (filters.keyword && String(filters.keyword).trim()) {
      params.append('keyword', String(filters.keyword).trim())
    }
    if (filters.group && String(filters.group).trim()) {
      params.append('group', String(filters.group).trim())
    }
    if (filters.artisan && String(filters.artisan).trim()) {
      params.append('artisan', String(filters.artisan).trim())
    }
    if (filters.craftVillage && String(filters.craftVillage).trim()) {
      params.append('craftVillage', String(filters.craftVillage).trim())
    }
    if (filters.minPrice !== undefined && filters.minPrice !== '' && filters.minPrice !== null) {
      params.append('minPrice', String(filters.minPrice).trim())
    }
    if (filters.maxPrice !== undefined && filters.maxPrice !== '' && filters.maxPrice !== null) {
      params.append('maxPrice', String(filters.maxPrice).trim())
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/products?${queryString}` : '/products'

    try {
      const data = await apiClient.get(endpoint)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  },

  async getProductById(productId) {
    if (!productId) {
      return null
    }

    try {
      const data = await apiClient.get(`/products/${encodeURIComponent(String(productId))}`)
      return data && typeof data === 'object' ? data : null
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null
      }
      throw error
    }
  },
})

export default productCatalogAdapter
