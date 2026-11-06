import apiClient from '../api/apiClient.js'

export function getVoucherSuggestions({ pos = false, type = 'MANUAL', page = 0 }) {
  const params = new URLSearchParams({ page: String(page), size: pos ? '3' : '6' })
  if (!pos) params.set('type', type)
  return apiClient.get(`/${pos ? 'pos' : 'checkout'}/voucher-suggestions?${params}`)
}
