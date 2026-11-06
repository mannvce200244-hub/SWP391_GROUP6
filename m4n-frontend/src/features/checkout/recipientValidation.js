import { isValidVietnameseMobile, VIETNAMESE_MOBILE_ERROR } from '../../utils/phone.js'

export function validateRecipient(value, carrierEnabled = false) {
  const errors = {}
  if (!value.customerName.trim()) errors.customerName = 'Vui lòng nhập họ tên người nhận.'
  else if (value.customerName.trim().length > 150) errors.customerName = 'Họ tên không được vượt quá 150 ký tự.'
  if (!value.customerPhone.trim()) errors.customerPhone = 'Vui lòng nhập số điện thoại.'
  else if (!isValidVietnameseMobile(value.customerPhone)) errors.customerPhone = VIETNAMESE_MOBILE_ERROR
  if (!value.customerEmail.trim()) errors.customerEmail = 'Vui lòng nhập email nhận thông báo.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.customerEmail.trim())) errors.customerEmail = 'Email không đúng định dạng.'
  else if (value.customerEmail.trim().length > 150) errors.customerEmail = 'Email không được vượt quá 150 ký tự.'
  if (!carrierEnabled && !value.shippingAddress.trim()) errors.shippingAddress = 'Vui lòng nhập địa chỉ giao nhận nhạc cụ.'
  else if (!carrierEnabled && value.shippingAddress.trim().length > 300) errors.shippingAddress = 'Địa chỉ không được vượt quá 300 ký tự.'
  if (value.notes.trim().length > 500) errors.notes = 'Ghi chú không được vượt quá 500 ký tự.'
  return errors
}

export function recipientFromAddress(address) {
  return Object.fromEntries(['customerName', 'customerPhone', 'customerEmail', 'shippingAddress', 'notes']
    .map((key) => [key, address[key] ?? '']))
}

export function deliveryFromAddress(address) {
  return address.deliveryAddress ?? { provinceId: null, wardId: null, streetAddress: '' }
}
