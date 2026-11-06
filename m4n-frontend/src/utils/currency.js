const VIETNAMESE_LOCALE = 'vi-VN'

export function formatCurrencyVND(value) {
  if (value === null || value === undefined || value === '') {
    return '0 ₫'
  }

  if (typeof value === 'bigint' || (typeof value === 'string' && /^-?\d+(?:\.0+)?$/.test(value))) {
    return new Intl.NumberFormat(VIETNAMESE_LOCALE).format(BigInt(String(value).replace(/\.0+$/, ''))) + ' ₫'
  }
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return String(value)
  }

  return new Intl.NumberFormat(VIETNAMESE_LOCALE).format(numericValue) + ' ₫'
}

export default formatCurrencyVND
