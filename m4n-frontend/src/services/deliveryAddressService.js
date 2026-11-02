import apiClient from '../api/apiClient.js'

const path = '/profile/delivery-addresses'
export default Object.freeze({
  list: (page = 0) => apiClient.get(`${path}?page=${page}`),
  create: (address) => apiClient.post(path, address),
  update: (id, address) => apiClient.put(`${path}/${encodeURIComponent(id)}`, address),
  remove: (id, version) => apiClient.delete(`${path}/${encodeURIComponent(id)}?expectedVersion=${version}`),
})
