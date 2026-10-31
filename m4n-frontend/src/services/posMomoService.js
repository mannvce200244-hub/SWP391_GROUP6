import apiClient from '../api/apiClient.js'
import { verifiedPaymentUrl } from './paymentService.js'

export function posPaymentReturnId(search) {
  const values = new URLSearchParams(search).getAll('m4nPosPaymentId')
  return values.length === 1 && /^pos-[a-f0-9]{32}$/.test(values[0]) ? values[0] : null
}

export function posPaymentMethodLabel(method) {
  return { CASH: 'Tiền mặt', BANK_TRANSFER: 'Chuyển khoản', MOMO: 'Thẻ quốc tế qua MoMo' }[method] || 'Chưa xác định'
}

const posMomoService = {
  create: (request) => apiClient.post('/pos/payments/momo', request),
  getStatus: (id) => apiClient.get(`/pos/payments/momo/${encodeURIComponent(id)}`),
  reconcile: (id) => apiClient.post(`/pos/payments/momo/${encodeURIComponent(id)}/reconcile`, {}),
  cancel: (id) => apiClient.post(`/pos/payments/momo/${encodeURIComponent(id)}/cancel`, {}),
  recent: (page = 0) => apiClient.get(`/pos/payments/momo?page=${page}`),
  open(payment) { window.location.assign(verifiedPaymentUrl(payment.paymentUrl, 'MOMO')) },
}
export default posMomoService
