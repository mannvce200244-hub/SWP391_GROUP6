import apiClient from '../api/apiClient.js'

const orderService = Object.freeze({
  async previewCheckout(voucherCode) {
    return apiClient.post('/checkout/preview', {
      voucherCode: voucherCode || null,
    })
  },

  async placeOrder(orderData) {
    return apiClient.post('/orders', orderData)
  },

  async getMyOrders() {
    return apiClient.get('/orders/me')
  },

  async getOrderDetail(orderId) {
    return apiClient.get(`/orders/${orderId}`)
  },

  async customerCancelOrder(orderId, reason) {
    return apiClient.post(`/orders/${orderId}/cancel`, {
      reason: reason || 'Khách hàng yêu cầu hủy',
    })
  },

  async getAdminOrders({ status, search, page = 0, size = 10 } = {}) {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (search) params.append('search', search)
    params.append('page', String(page))
    params.append('size', String(size))

    return apiClient.get(`/admin/orders?${params.toString()}`)
  },

  async getAdminOrderDetail(orderId) {
    return apiClient.get(`/admin/orders/${orderId}`)
  },

  async confirmOrder(orderId) {
    return apiClient.post(`/admin/orders/${orderId}/confirm`, {})
  },

  async completeOrder(orderId) {
    return apiClient.post(`/admin/orders/${orderId}/complete`, {})
  },

  async staffCancelOrder(orderId, reason) {
    return apiClient.post(`/admin/orders/${orderId}/cancel`, {
      reason: reason || 'Nhân viên hủy đơn',
    })
  },
})

export default orderService
