import apiClient from '../api/apiClient.js'

function paginate(items, page, limit) {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const safePage = Math.max(1, Math.min(page, totalPages))
  const offset = (safePage - 1) * limit

  return {
    items: items.slice(offset, offset + limit),
    page: safePage,
    limit,
    total,
    totalPages,
  }
}

function sortItems(items, sort) {
  const sorted = [...items]
  if (sort === 'az') {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  } else if (sort === 'newest') {
    sorted.sort((a, b) => Number(b.id) - Number(a.id))
  }
  return sorted
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

function matchesSearch(item, search) {
  if (!search?.trim()) return true
  const query = search.trim().toLocaleLowerCase('vi')
  return [item.name, item.description, item.province]
    .filter(Boolean)
    .some((value) => value.toLocaleLowerCase('vi').includes(query))
}

const artisanService = Object.freeze({
  async listArtisans({ limit = 6, page = 1, search = '', sort = 'featured' } = {}) {
    const response = await apiClient.get('/artisans')
    const source = Array.isArray(response) ? response.map(mapArtisan) : []
    const filtered = source.filter((item) => matchesSearch(item, search))
    return { ...paginate(sortItems(filtered, sort), page, limit), provinces: [] }
  },

  async listCraftVillages({
    limit = 6,
    page = 1,
    province = '',
    search = '',
    sort = 'featured',
  } = {}) {
    const response = await apiClient.get('/craft-villages')
    const source = Array.isArray(response) ? response.map(mapVillage) : []
    const provinces = Array.from(new Set(source.map((item) => item.province).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, 'vi'))
    const filtered = source.filter(
      (item) =>
        matchesSearch(item, search) &&
        (!province || province === 'all' || item.province === province),
    )
    return { ...paginate(sortItems(filtered, sort), page, limit), provinces }
  },

  async getDiscoveryCounts() {
    const [artisans, villages] = await Promise.all([
      apiClient.get('/artisans'),
      apiClient.get('/craft-villages'),
    ])
    return {
      artisans: Array.isArray(artisans) ? artisans.length : 0,
      villages: Array.isArray(villages) ? villages.length : 0,
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

    const response = await apiClient.get('/artisans')
    const artisans = Array.isArray(response) ? response.map(mapArtisan) : []
    return artisans.find((artisan) => String(artisan.id) === String(id)) || null
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
