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
    if (filters.page != null && Number(filters.page) > 0) {
      params.append('page', String(Math.max(0, Number(filters.page) - 1)))
    }
    if (filters.size != null && Number(filters.size) > 0) {
      params.append('size', String(filters.size))
    }
    if (filters.sort && String(filters.sort).trim()) {
      params.append('sort', String(filters.sort).trim())
    }

    const queryString = params.toString()
    const endpoint = queryString ? `/products?${queryString}` : '/products'

    try {
      const data = await apiClient.get(endpoint)
      if (data && Array.isArray(data.content)) {
        return {
          products: data.content,
          totalPages: data.totalPages ?? 1,
          totalElements: data.totalElements ?? data.content.length,
          page: (data.number ?? 0) + 1,
          size: data.size ?? data.content.length,
        }
      }
      if (Array.isArray(data)) {
        return {
          products: data,
          totalPages: 1,
          totalElements: data.length,
          page: 1,
          size: data.length,
        }
      }
      return {
        products: [],
        totalPages: 1,
        totalElements: 0,
        page: 1,
        size: 9,
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return {
          products: [],
          totalPages: 1,
          totalElements: 0,
          page: 1,
          size: 9,
        }
      }
      throw error
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
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
        return null
      }
      throw error
    }
  },

  async getCategories() {
    try {
      const data = await apiClient.get('/categories')
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  },
})

export default productCatalogAdapter
