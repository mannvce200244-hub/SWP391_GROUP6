import apiClient from '../api/apiClient.js'

export default Object.freeze({
  getOptions: () => apiClient.get('/shipping/options'),
  getProvinces: () => apiClient.get('/shipping/provinces'),
  getWards: (provinceId) => apiClient.get(`/shipping/provinces/${encodeURIComponent(provinceId)}/wards`),
})
