import apiClient from '../api/apiClient.js'

export const chatService = Object.freeze({
  async getAdminConversations({ search = '', status = '', page = 0 } = {}) {
    const params = new URLSearchParams({ search, page: String(page), size: '20' })
    if (status) params.set('status', status)
    return apiClient.get(`/admin/chat/conversations?${params}`)
  },

  async getAdminMessages(id, page = 0) {
    return apiClient.get(`/admin/chat/conversations/${id}/messages?page=${page}&size=50`)
  },
  async getMyConversation() {
    return apiClient.get('/chat/my-conversation')
  },

  async startMyConversation() {
    return apiClient.post('/chat/my-conversation', {})
  },

  async getConversation(conversationId) {
    return apiClient.get(`/chat/conversations/${conversationId}`)
  },

  async getMessages(conversationId, { page = 0, size = 100 } = {}) {
    return apiClient.get(`/chat/conversations/${conversationId}/messages?page=${page}&size=${size}`)
  },

  async sendMessage(conversationId, content) {
    return apiClient.post(`/chat/conversations/${conversationId}/messages`, { content })
  },

  async getStaffConversations({ scope = 'WAITING', page = 0, size = 50 } = {}) {
    return apiClient.get(`/chat/staff/conversations?scope=${scope}&page=${page}&size=${size}`)
  },

  async assignStaff(conversationId) {
    return apiClient.post(`/chat/conversations/${conversationId}/assign`, {})
  },

  async takeOver(conversationId, expectedStaffId) {
    return apiClient.post(`/chat/conversations/${conversationId}/take-over`, { expectedStaffId })
  },

  async closeConversation(conversationId) {
    return apiClient.post(`/chat/conversations/${conversationId}/close`, {})
  },
})

export default chatService
