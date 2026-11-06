import apiClient from '../api/apiClient.js'
import { verifiedPaymentUrl } from './paymentService.js'

export function posPaymentReturnId(search) {
  const values = new URLSearchParams(search).getAll('m4nPosPaymentId')
  return values.length === 1 && /^pos-[a-f0-9]{32}$/.test(values[0]) ? values[0] : null
}

export function posPaymentMethodLabel(method) {
  return {
    CASH: 'Tiền mặt',
    BANK_TRANSFER: 'Chuyển khoản',
    VNPAY: 'VNPay (Thẻ ATM / QR)',
    MOMO: 'Thẻ quốc tế qua MoMo',
  }[method] || 'Chưa xác định'
}

const posVnpayService = {
  create: (request) => apiClient.post('/pos/payments/vnpay', request),
  getStatus: (id) => apiClient.get(`/pos/payments/vnpay/${encodeURIComponent(id)}`),
  reconcile: (id) => apiClient.post(`/pos/payments/vnpay/${encodeURIComponent(id)}/reconcile`, {}),
  cancel: (id) => apiClient.post(`/pos/payments/vnpay/${encodeURIComponent(id)}/cancel`, {}),
  recent: (page = 0) => apiClient.get(`/pos/payments/vnpay?page=${page}`),
  async notifyReturn(id, search = typeof window !== 'undefined' ? window.location.search : '') {
    if (search && search.includes('vnp_SecureHash')) {
      try {
        await apiClient.get(`/payments/vnpay/ipn${search.startsWith('?') ? search : '?' + search}`)
      } catch {
        // Status endpoint below remains authoritative if callback was already processed.
      }
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', `${window.location.pathname}?m4nPosPaymentId=${encodeURIComponent(id)}`)
      }
    }
  },
  open(payment) {
    window.location.assign(verifiedPaymentUrl(payment.paymentUrl, 'VNPAY'))
  },
}

export default posVnpayService
