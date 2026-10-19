import apiClient from '../api/apiClient.js'

export const reviewService = Object.freeze({
  async getProductReviews(productId) {
    return apiClient.get(`/reviews/product/${encodeURIComponent(productId)}`)
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
