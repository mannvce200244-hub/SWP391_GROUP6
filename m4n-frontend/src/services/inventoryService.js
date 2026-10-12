import apiClient from '../api/apiClient.js'

export async function getInventory({ page = 0, size = 10, keyword = '', status = '' } = {}) {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('size', size)
  if (keyword && keyword.trim()) {
    params.append('keyword', keyword.trim())
  }
  if (status && status !== 'ALL') {
    params.append('status', status)
  }

  return apiClient.get(`/inventory?${params.toString()}`)
}

export async function importStock(productId, { quantity, notes = '' }) {
  return apiClient.post(`/inventory/${encodeURIComponent(productId)}/import`, {
    quantity: Number(quantity),
    notes,
  })
}

export default {
  getInventory,
  importStock,
}
