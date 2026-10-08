import apiClient from '../api/apiClient.js'

export async function getDashboardSummary(period = 'month') {
  return apiClient.get(`/admin/dashboard?period=${encodeURIComponent(period)}`)
}

export default {
  getDashboardSummary,
}
