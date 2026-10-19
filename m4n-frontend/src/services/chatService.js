import apiClient from '../api/apiClient.js'

export const chatService = Object.freeze({
  async getMyConversation() {
    return apiClient.get('/chat/my-conversation')
  },

  async getMessages(conversationId) {
    return apiClient.get(`/chat/conversations/${conversationId}/messages`)
  },

  async sendMessage(conversationId, content) {
    return apiClient.post(`/chat/conversations/${conversationId}/messages`, { content })
  },

  async getStaffConversations({ page = 0, size = 20 } = {}) {
    return apiClient.get(`/chat/staff/conversations?page=${page}&size=${size}`)
  },

  async assignStaff(conversationId) {
    return apiClient.post(`/chat/conversations/${conversationId}/assign`, {})
  },
})

export default chatService
