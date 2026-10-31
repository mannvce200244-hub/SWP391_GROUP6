import apiClient from '../api/apiClient.js'

function discoveryQuery({ limit, page, search, sort, province }) {
  const query = new URLSearchParams({ page: String(Math.max(0, page - 1)), size: String(limit) })
  if (search?.trim()) query.set('keyword', search.trim())
  if (province && province !== 'all') query.set('location', province)
  const sorting = sort === 'az' ? 'name,asc' : sort === 'newest' ? 'createdAt,desc' : 'id,asc'
  query.append('sort', sorting)
  if (sorting !== 'id,asc') query.append('sort', 'id,asc')
  return query.toString()
}

function mapPage(response, mapper) {
  if (!Array.isArray(response?.content)) throw new Error('Không thể đọc danh sách trả về từ máy chủ.')
  return {
    items: response.content.map(mapper),
    page: response.number + 1,
    limit: response.size,
    total: response.totalElements,
    totalPages: Math.max(1, response.totalPages),
  }
}

function mapArtisan(artisan) {
  return {
    id: artisan.id,
    name: artisan.name,
    description: artisan.biography || '',
    avatar: artisan.avatarUrl || null,
  }
}

function mapVillage(village) {
  return {
    id: village.id,
    slug: String(village.id),
    name: village.name,
    province: village.location || '',
    location: village.location || '',
    description: village.description || '',
    coverImage: village.imageUrl || null,
    artisanCount: village.artisanCount,
    productCount: village.productCount,
    createdAt: village.createdAt,
  }
}

const artisanService = Object.freeze({
  async listArtisans({ limit = 6, page = 1, search = '', sort = 'featured' } = {}) {
    const response = await apiClient.get(`/artisans/search?${discoveryQuery({ limit, page, search, sort })}`)
    return { ...mapPage(response, mapArtisan), provinces: [] }
  },

  async listCraftVillages({
    limit = 6,
    page = 1,
    province = '',
    search = '',
    sort = 'featured',
  } = {}) {
    const [response, provinces] = await Promise.all([
      apiClient.get(`/craft-villages/search?${discoveryQuery({ limit, page, search, sort, province })}`),
      apiClient.get('/craft-villages/locations'),
    ])
    if (!Array.isArray(provinces)) throw new Error('Không thể đọc danh sách địa phương.')
    return { ...mapPage(response, mapVillage), provinces }
  },

  async getDiscoveryCounts() {
    const [artisans, villages] = await Promise.all([
      apiClient.get('/artisans/search?page=0&size=1'),
      apiClient.get('/craft-villages/search?page=0&size=1'),
    ])
    return {
      artisans: mapPage(artisans, mapArtisan).total,
      villages: mapPage(villages, mapVillage).total,
    }
  },

  async getCraftVillageBySlug(slugOrId) {
    if (!slugOrId) return null
    try {
      const data = await apiClient.get(
        `/craft-villages/${encodeURIComponent(String(slugOrId))}`,
      )
      return data?.id ? mapVillage(data) : null
    } catch (error) {
      if (error?.status === 404) return null
      throw error
    }
  },

  async getArtisanById(id) {
    if (!id) return null

    try {
      const response = await apiClient.get(`/artisans/${encodeURIComponent(String(id))}`)
      return response?.id ? mapArtisan(response) : null
    } catch (error) {
      if (error?.status === 404) return null
      throw error
    }
  },

  async getArtisans() {
    return apiClient.get('/artisans')
  },

  async getAdminArtisans() {
    return apiClient.get('/admin/artisans')
  },

  async getArtisanDetail(id) {
    return apiClient.get(`/admin/artisans/${id}`)
  },

  async createArtisan(payload) {
    return apiClient.post('/admin/artisans', payload)
  },

  async updateArtisan(id, payload) {
    return apiClient.put(`/admin/artisans/${id}`, payload)
  },

  async deleteArtisan(id) {
    return apiClient.delete(`/admin/artisans/${id}`)
  },
})

export default artisanService
