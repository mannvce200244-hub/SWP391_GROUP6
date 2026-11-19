import apiClient from '../api/apiClient.js'

export default Object.freeze({
  list(productId, page = 0) {
    return apiClient.get(`/products/${encodeURIComponent(productId)}/variants?page=${page}&size=20`)
  },
})
