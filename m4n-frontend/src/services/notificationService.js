import apiClient from '../api/apiClient.js'

const changeListeners = new Set()

function notifyReadChange() {
  changeListeners.forEach((listener) => listener())
}

export const notificationService = Object.freeze({
  subscribeReadChanges(listener) {
    changeListeners.add(listener)
    return () => changeListeners.delete(listener)
  },
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
    const result = await apiClient.post(`/notifications/${id}/read`, {})
    notifyReadChange()
    return result
  },

  async markAllAsRead() {
    const result = await apiClient.post('/notifications/read-all', {})
    notifyReadChange()
    return result
  },
})

export default notificationService
