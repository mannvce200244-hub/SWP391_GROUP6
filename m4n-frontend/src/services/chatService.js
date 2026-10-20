import apiClient from '../api/apiClient.js'

export const chatService = Object.freeze({
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

  async closeConversation(conversationId) {
    return apiClient.post(`/chat/conversations/${conversationId}/close`, {})
  },
})

export default chatService
