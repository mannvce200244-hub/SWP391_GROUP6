import apiClient from '../api/apiClient.js'

export const reviewService = Object.freeze({
  async getProductReviewPage(productId, page = 0, size = 5) {
    const params = new URLSearchParams({ page: String(page), size: String(size), sort: 'createdAt,desc' })
    const data = await apiClient.get(`/reviews/product/${encodeURIComponent(productId)}/page?${params}`)
    if (!data || !Array.isArray(data.content) || !Number.isFinite(data.totalElements)
        || !Number.isFinite(data.totalPages)) {
      throw new Error('Dữ liệu đánh giá không hợp lệ. Vui lòng thử lại.')
    }
    return data
  },

  async checkEligibility(productId) {
    return apiClient.get(`/reviews/eligibility/${encodeURIComponent(productId)}`)
  },

  async submitReview({ orderId, productId, rating, comment }) {
    return apiClient.post('/reviews', {
      orderId: Number(orderId),
      productId: Number(productId),
      rating: Number(rating),
      comment: comment ? comment.trim() : null,
    })
  },
})

export default reviewService
