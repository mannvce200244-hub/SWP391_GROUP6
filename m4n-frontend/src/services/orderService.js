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

  async confirmReceived(orderId) {
    return apiClient.post(`/orders/${orderId}/confirm-received`, {})
  },

  async getAdminOrders({ status, isPaid, paymentMethod, search, page = 0, size = 10 } = {}) {
    const params = new URLSearchParams()
    if (status) params.append('status', status)
    if (isPaid !== undefined && isPaid !== null && isPaid !== '') params.append('isPaid', String(isPaid))
    if (paymentMethod) params.append('paymentMethod', paymentMethod)
    if (search) params.append('search', search)
    params.append('page', String(page))
    params.append('size', String(size))

    return apiClient.get(`/admin/orders?${params.toString()}`)
  },

  async getOrderStatusCounts() {
    return apiClient.get('/admin/orders/status-counts')
  },

  async getAdminOrderDetail(orderId) {
    return apiClient.get(`/admin/orders/${orderId}`)
  },

  async confirmOrder(orderId) {
    return apiClient.post(`/admin/orders/${orderId}/confirm`, {})
  },

  async retryOrderConfirmation(orderId) {
    return apiClient.post(`/admin/orders/${orderId}/retry-confirmation`, {})
  },

  async markOrderShipping(orderId) {
    return apiClient.post(`/admin/orders/${orderId}/ship`, {})
  },

  async markOrderDelivered(orderId) {
    return apiClient.post(`/admin/orders/${orderId}/mark-delivered`, {})
  },

  async staffCancelOrder(orderId, reason) {
    return apiClient.post(`/admin/orders/${orderId}/cancel`, {
      reason: reason || 'Nhân viên hủy đơn',
    })
  },
})

export default orderService
