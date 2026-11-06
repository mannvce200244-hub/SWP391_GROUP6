import apiClient from '../api/apiClient.js'

function queryUrl(endpoint, parameters) {
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== '') query.set(name, String(value))
  }
  return `${endpoint}?${query}`
}

function normalizeDetail(data, admin = false) {
  const detail = admin ? data?.detail : data
  if (!detail?.article?.id || typeof detail.content !== 'string') throw new Error('Không thể đọc dữ liệu bài viết. Vui lòng thử lại.')
  return { ...detail.article, content: detail.content, videoUrl: detail.videoUrl,
    ...(admin ? { status: data.status, version: data.version, updatedAt: data.updatedAt } : {}) }
}

function normalizePage(data, admin = false) {
  if (!Array.isArray(data?.content) || !Number.isInteger(data.totalPages) || !Number.isInteger(data.totalElements)) {
    throw new Error('Không thể đọc danh sách bài viết. Vui lòng thử lại.')
  }
  return { items: admin ? data.content.map(({ article, ...metadata }) => ({ ...article, ...metadata })) : data.content,
    totalPages: Math.max(1, data.totalPages), totalElements: data.totalElements, page: data.number + 1 }
}

const articleService = Object.freeze({
  async listPublished({ page = 1, size = 12, ...filters } = {}) {
    return normalizePage(await apiClient.get(queryUrl('/articles', { ...filters, page: page - 1, size })))
  },
  async getPublished(id) {
    if (!/^[1-9]\d*$/.test(String(id)) || !Number.isSafeInteger(Number(id))) return null
    try {
      return normalizeDetail(await apiClient.get(`/articles/${encodeURIComponent(id)}`))
    } catch (error) {
      if (error.status === 404) return null
      throw error
    }
  },
  async listAdmin({ page = 1, size = 20, ...filters } = {}) {
    return normalizePage(await apiClient.get(queryUrl('/admin/articles', { ...filters, page: page - 1, size })), true)
  },
  async getAdmin(id) {
    return normalizeDetail(await apiClient.get(`/admin/articles/${encodeURIComponent(id)}`), true)
  },
  async create(payload) {
    return normalizeDetail(await apiClient.post('/admin/articles', payload), true)
  },
  async update(id, payload) {
    return normalizeDetail(await apiClient.put(`/admin/articles/${encodeURIComponent(id)}`, payload), true)
  },
  delete(id, expectedVersion) {
    return apiClient.delete(queryUrl(`/admin/articles/${encodeURIComponent(id)}`, { expectedVersion }))
  },
  async searchAssociations(kind, keyword) {
    const endpoints = { product: '/products', artisan: '/artisans/search', craftVillage: '/craft-villages/search' }
    const data = await apiClient.get(queryUrl(endpoints[kind], { keyword: keyword.trim(), page: 0, size: 8 }))
    if (!Array.isArray(data?.content)) throw new Error('Không thể đọc danh sách liên kết. Vui lòng thử lại.')
    return data.content.map(({ id, name }) => ({ id, name }))
  },
})

export default articleService
