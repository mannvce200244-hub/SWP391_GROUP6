import apiClient from '../api/apiClient.js'

export async function getDashboardSummary(period = 'month', year = null) {
  const params = new URLSearchParams()
  if (period) params.set('period', period)
  if (year !== null && year !== undefined && year !== '') {
    params.set('year', String(year))
  }
  const queryString = params.toString()
  return apiClient.get(`/admin/dashboard${queryString ? `?${queryString}` : ''}`)
}

export default {
  getDashboardSummary,
}
