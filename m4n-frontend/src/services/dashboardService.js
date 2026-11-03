import apiClient from '../api/apiClient.js'

export async function getDashboardSummary(period = 'month', year = null) {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  if (year) params.set('year', year)
  return apiClient.get(`/admin/dashboard?${params.toString()}`)
}

export default {
  getDashboardSummary,
}
