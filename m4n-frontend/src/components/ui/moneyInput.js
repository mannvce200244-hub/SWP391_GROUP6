const integerFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

export function formatMoneyInput(value) {
  const raw = String(value ?? '')
  if (!/^\d+(?:\.\d*)?$/.test(raw)) return raw
  const [integer, fraction] = raw.split('.')
  return integerFormat.format(BigInt(integer)) + (fraction === undefined ? '' : `,${fraction}`)
}

export function parseMoneyInput(value, pasted = false) {
  const text = value.trim().replace(/\s*(?:₫|đ|VND)$/iu, '').trim()
  if (pasted && text && !/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{0,2})?$/.test(text)) return null
  if (!/^[\d.]*(?:,\d{0,2})?$/.test(text)) return null
  const [integer, fraction] = text.replaceAll('.', '').split(',')
  const digits = integer.replace(/^0+(?=\d)/, '')
  return fraction === undefined ? digits : `${digits || '0'}.${fraction}`
}

export function moneyCaretPosition(raw, cursor, formatted) {
  let remaining = raw.slice(0, cursor).replace(/[^\d,]/g, '').length
  if (!remaining) return 0
  for (let index = 0; index < formatted.length; index += 1) {
    if (/[\d,]/.test(formatted[index])) remaining -= 1
    if (!remaining) return index + 1
  }
  return formatted.length
}
