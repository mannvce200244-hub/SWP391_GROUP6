export const VIETNAMESE_MOBILE_PATTERN = /^(03|05|07|08|09)\d{8}$/

export const VIETNAMESE_MOBILE_ERROR =
  'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 03, 05, 07, 08 hoặc 09.'

export function isValidVietnameseMobile(value) {
  return VIETNAMESE_MOBILE_PATTERN.test(String(value || '').trim())
}

export function sanitizeVietnameseMobile(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10)
}
