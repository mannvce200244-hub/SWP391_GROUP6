import apiClient from '../api/apiClient.js'

export function verifiedPaymentUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('Liên kết thanh toán không hợp lệ. Đơn đã tạo; kiểm tra tại Đơn hàng của tôi.')
  }
  if (url.protocol !== 'https:' || url.hostname !== 'sandbox.vnpayment.vn'
      || url.port || url.username || url.password || url.hash
      || url.pathname !== '/paymentv2/vpcpay.html') {
    throw new Error('Liên kết thanh toán không hợp lệ. Đơn đã tạo; kiểm tra tại Đơn hàng của tôi.')
  }
  return url.href
}

const paymentService = Object.freeze({
  getOptions: () => apiClient.get('/payments/options'),
  getStatus: (orderId) => apiClient.get(`/payments/orders/${encodeURIComponent(orderId)}`),
  reconcile: (orderId) => apiClient.post(`/payments/orders/${encodeURIComponent(orderId)}/reconcile`, {}),
  async start(orderId) {
    const result = await apiClient.post(`/payments/orders/${encodeURIComponent(orderId)}/vnpay`, {})
    return verifiedPaymentUrl(result.paymentUrl)
  },
  refund: (orderId, reason) => apiClient.post(`/admin/orders/${encodeURIComponent(orderId)}/refund`, { reason }),
  reconcileRefund: (orderId) => apiClient.post(`/admin/orders/${encodeURIComponent(orderId)}/refund/reconcile`, {}),
})

export default paymentService
