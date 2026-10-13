import apiClient from '../api/apiClient.js'

const cartService = Object.freeze({
  async getMyCart() {
    return apiClient.get('/cart')
  },

  async addToCart(productId, quantity = 1) {
    return apiClient.post('/cart/items', {
      productId: Number(productId),
      quantity: Number(quantity),
    })
  },

  async updateCartItem(itemId, quantity) {
    return apiClient.put(`/cart/items/${itemId}`, {
      quantity: Number(quantity),
    })
  },

  async removeCartItem(itemId) {
    return apiClient.delete(`/cart/items/${itemId}`)
  },

  async clearCart() {
    return apiClient.delete('/cart')
  },
})

export default cartService
