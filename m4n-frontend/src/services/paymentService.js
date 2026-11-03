import apiClient from '../api/apiClient.js'

export function paymentReturnOrderId(search) {
  const params = new URLSearchParams(search)
  // MoMo returns its own orderId; keep the internal ID in a separate parameter.
  const key = params.has('m4nOrderId') ? 'm4nOrderId' : 'orderId'
  const values = params.getAll(key)
  return values.length === 1 && /^[1-9]\d*$/.test(values[0]) ? values[0] : null
}

export function verifiedPaymentUrl(value, method = 'VNPAY') {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('Liên kết thanh toán không hợp lệ. Đơn đã tạo; kiểm tra tại Đơn hàng của tôi.')
  }
  const isSimulator =
    url.origin === window.location.origin &&
    url.pathname === '/momo-simulator'
  const allowedDestination = method === 'VNPAY'
    ? url.hostname === 'sandbox.vnpayment.vn' && url.pathname === '/paymentv2/vpcpay.html'
    : method === 'MOMO' && (
        (url.hostname === 'test-payment.momo.vn' && url.pathname === '/v2/gateway/pay') ||
        isSimulator
      )
  if (
    (!isSimulator && (url.protocol !== 'https:' || url.port)) ||
    (isSimulator && !['http:', 'https:'].includes(url.protocol)) ||
    !allowedDestination ||
    url.username ||
    url.password ||
    url.hash
  ) {
    throw new Error('Liên kết thanh toán không hợp lệ. Đơn đã tạo; kiểm tra tại Đơn hàng của tôi.')
  }
  return url.href
}

const paymentService = Object.freeze({
  getOptions: () => apiClient.get('/payments/options'),
  getStatus: (orderId) => apiClient.get(`/payments/orders/${encodeURIComponent(orderId)}`),
  async getReturnStatus(orderId, search = typeof window !== 'undefined' ? window.location.search : '') {
    if (search && search.includes('vnp_SecureHash')) {
      try {
        await apiClient.get(`/payments/vnpay/ipn${search.startsWith('?') ? search : '?' + search}`)
      } catch (err) {
        // IPN callback may have already processed or order is already confirmed; status query below provides authoritative truth.
        console.warn('VNPay return notification warning:', err)
      }
    }
    const status = await paymentService.getStatus(orderId)
    return status.status === 'PENDING' && ['MOMO', 'VNPAY'].includes(status.paymentMethod)
      ? paymentService.reconcile(orderId) : status
  },
  reconcile: (orderId) => apiClient.post(`/payments/orders/${encodeURIComponent(orderId)}/reconcile`, {}),
  async start(orderId, method = 'VNPAY') {
    if (!['VNPAY', 'MOMO'].includes(method)) throw new Error('Phương thức thanh toán không hợp lệ.')
    const result = await apiClient.post(`/payments/orders/${encodeURIComponent(orderId)}/${method.toLowerCase()}`, {})
    return verifiedPaymentUrl(result.paymentUrl, method)
  },
  simulatePayment: (reference, success = true) =>
    apiClient.post('/payments/momo/simulate-payment', { reference, success }),
  refund: (orderId, reason) => apiClient.post(`/admin/orders/${encodeURIComponent(orderId)}/refund`, { reason }),
  reconcileRefund: (orderId) => apiClient.post(`/admin/orders/${encodeURIComponent(orderId)}/refund/reconcile`, {}),
})

export default paymentService
