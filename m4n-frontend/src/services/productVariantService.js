import apiClient from '../api/apiClient.js'

export default Object.freeze({
  list(productId, page = 0, size = 100) {
    return apiClient.get(`/products/${encodeURIComponent(productId)}/variants?page=${page}&size=${size}`)
  },
})
