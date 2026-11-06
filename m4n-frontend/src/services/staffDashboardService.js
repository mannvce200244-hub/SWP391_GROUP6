import apiClient from '../api/apiClient.js'

export function getStaffDashboardSummary({ days = 7, status = '' } = {}) {
  const params = new URLSearchParams({ days: String(days) })
  if (status) {
    params.set('status', status)
  }
  return apiClient.get(`/staff/dashboard?${params.toString()}`)
}

export default {
  getStaffDashboardSummary,
}
