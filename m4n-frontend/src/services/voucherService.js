import apiClient from '../api/apiClient.js'

const voucherService = Object.freeze({
  async validateVoucher(voucherCode, orderAmount) {
    return apiClient.post('/vouchers/validate', {
      voucherCode: voucherCode ? voucherCode.trim().toUpperCase() : '',
      orderAmount: Number(orderAmount) || 0,
    })
  },
})

export default voucherService
