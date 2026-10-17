import apiClient from '../api/apiClient.js'

export const notificationService = Object.freeze({
  async getMyNotifications({ page = 0, size = 15 } = {}) {
    return apiClient.get(`/notifications?page=${page}&size=${size}`)
  },

  async getRecentNotifications() {
    return apiClient.get('/notifications/recent')
  },

  async getUnreadCount() {
    const data = await apiClient.get('/notifications/unread-count')
    return data?.unreadCount || 0
  },

  async markAsRead(id) {
    return apiClient.post(`/notifications/${id}/read`, {})
  },

  async markAllAsRead() {
    return apiClient.post('/notifications/read-all', {})
  },
})

export default notificationService
