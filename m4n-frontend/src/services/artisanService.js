import {
  MOCK_ARTISANS,
  MOCK_CRAFT_VILLAGES,
} from '../features/artisans/data/mockArtisansData.js'
import apiClient from '../api/apiClient.js'

/**
 * Service abstraction for Artisans & Craft Villages.
 * Serves standard data with search, filter, and pagination logic.
 * Ready for transparent switch to backend endpoints (/api/v1/artisans, /api/v1/craft-villages).
 */
function createArtisanService() {
  return Object.freeze({
    /**
     * List artisans with filtering, search, sorting and client pagination.
     */
    async listArtisans({
      craft = '',
      limit = 6,
      page = 1,
      province = '',
      region = '',
      search = '',
      sort = 'featured',
    } = {}) {
      let filtered = [...MOCK_ARTISANS]

      if (search && search.trim()) {
        const query = search.trim().toLowerCase()
        filtered = filtered.filter(
          (a) =>
            a.name.toLowerCase().includes(query) ||
            a.craft.toLowerCase().includes(query) ||
            (a.categoryCraft && a.categoryCraft.toLowerCase().includes(query)) ||
            (a.village?.name && a.village.name.toLowerCase().includes(query)) ||
            a.description.toLowerCase().includes(query),
        )
      }

      if (craft && craft !== 'all') {
        filtered = filtered.filter(
          (a) =>
            a.categoryCraft === craft ||
            a.craft.toLowerCase().includes(craft.toLowerCase()),
        )
      }

      if (province && province !== 'all') {
        filtered = filtered.filter((a) => a.province === province)
      }

      if (region && region !== 'all') {
        filtered = filtered.filter((a) => a.region === region)
      }

      // Sorting
      if (sort === 'az') {
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      } else if (sort === 'experience') {
        filtered.sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0))
      } else if (sort === 'newest') {
        filtered.sort((a, b) => b.id - a.id)
      } else {
        // default: featured first, then experience
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return (b.experienceYears || 0) - (a.experienceYears || 0)
        })
      }

      const total = filtered.length
      const totalPages = Math.max(1, Math.ceil(total / limit))
      const safePage = Math.max(1, Math.min(page, totalPages))
      const offset = (safePage - 1) * limit
      const items = filtered.slice(offset, offset + limit)

      return {
        items,
        page: safePage,
        limit,
        total,
        totalPages,
      }
    },

    /**
     * Get artisan by URL slug.
     */
    async getArtisanBySlug(slug) {
      if (!slug) return null
      return MOCK_ARTISANS.find((a) => a.slug === slug) || null
    },

    /**
     * List craft villages with filtering, search, sorting and client pagination.
     */
    async listCraftVillages({
      craft = '',
      limit = 6,
      page = 1,
      province = '',
      region = '',
      search = '',
      sort = 'featured',
    } = {}) {
      let filtered = [...MOCK_CRAFT_VILLAGES]

      if (search && search.trim()) {
        const query = search.trim().toLowerCase()
        filtered = filtered.filter(
          (v) =>
            v.name.toLowerCase().includes(query) ||
            v.craft.toLowerCase().includes(query) ||
            v.province.toLowerCase().includes(query) ||
            v.description.toLowerCase().includes(query),
        )
      }

      if (craft && craft !== 'all') {
        filtered = filtered.filter(
          (v) =>
            v.craft === craft || v.craft.toLowerCase().includes(craft.toLowerCase()),
        )
      }

      if (province && province !== 'all') {
        filtered = filtered.filter((v) => v.province === province)
      }

      if (region && region !== 'all') {
        filtered = filtered.filter((v) => v.region === region)
      }

      // Sorting
      if (sort === 'az') {
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'))
      } else if (sort === 'artisans') {
        filtered.sort((a, b) => (b.artisanCount || 0) - (a.artisanCount || 0))
      } else if (sort === 'newest') {
        filtered.sort((a, b) => b.id - a.id)
      } else {
        // default: featured first, then product count
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          return (b.productCount || 0) - (a.productCount || 0)
        })
      }

      const total = filtered.length
      const totalPages = Math.max(1, Math.ceil(total / limit))
      const safePage = Math.max(1, Math.min(page, totalPages))
      const offset = (safePage - 1) * limit
      const items = filtered.slice(offset, offset + limit)

      return {
        items,
        page: safePage,
        limit,
        total,
        totalPages,
      }
    },

    /**
     * Get craft village by URL slug or numeric ID with backend fallback.
     */
    async getCraftVillageBySlug(slugOrId) {
      if (!slugOrId) return null

      // 1. First check local dataset by slug or ID
      const matched = MOCK_CRAFT_VILLAGES.find(
        (v) => v.slug === slugOrId || String(v.id) === String(slugOrId),
      )
      if (matched) return matched

      // 2. Query backend API endpoint if numeric ID
      try {
        const data = await apiClient.get(`/craft-villages/${encodeURIComponent(String(slugOrId))}`)
        if (data && data.id) {
          return {
            id: data.id,
            slug: String(data.id),
            name: data.name,
            province: data.location,
            craft: 'Nhạc cụ cổ truyền',
            coverImage: data.imageUrl || '/assets/images/artisan-workshop.jpg',
            description: data.description,
            metadataText: `${data.name} · ${data.location}`,
          }
        }
      } catch {
        // Backend returned 404 or network error
      }

      return null
    },

    /**
     * Get filter options (provinces and craft types) for a given tab.
     */
    getFilterOptions(tab = 'artisans') {
      const dataset = tab === 'villages' ? MOCK_CRAFT_VILLAGES : MOCK_ARTISANS
      const provinces = Array.from(new Set(dataset.map((item) => item.province))).sort(
        (a, b) => a.localeCompare(b, 'vi'),
      )
      const crafts = Array.from(
        new Set(
          dataset.map((item) =>
            tab === 'villages' ? item.craft : (item.categoryCraft || item.craft),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, 'vi'))

      return { provinces, crafts }
    },
  })
}

const artisanService = createArtisanService()

export default artisanService
