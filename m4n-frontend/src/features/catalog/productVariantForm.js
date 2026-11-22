export function variantFormErrors(base, rows, requireVariant = false) {
  const errors = {}
  const needsVariant = requireVariant || rows.length > 0 || Boolean(base.variantLabel?.trim())
  const labels = new Set()
  const codes = new Set()
  const barcodes = new Set()
  const all = [{ label: base.variantLabel, code: base.code, barcode: base.barcode, price: String(base.price) }, ...rows]
  all.forEach((row, index) => {
    const field = (key) => index ? `variants[${index}].${key}` : key
    const label = row.label.trim().normalize('NFC').toLocaleLowerCase('vi')
    if (needsVariant && (!label || label.length > 100)) errors[field('variantLabel')] = 'Nhập tên biến thể, tối đa 100 ký tự.'
    else if (labels.has(label)) errors[field('variantLabel')] = 'Tên biến thể đã có trong danh sách.'
    labels.add(label)
    if (!/^\d+(\.\d{1,2})?$/.test(row.price.trim()) || !Number.isFinite(Number(row.price)) || Number(row.price) <= 0 || Number(row.price) >= 1e12) {
      errors[field('price')] = 'Giá phải lớn hơn 0, tối đa 12 chữ số nguyên và 2 chữ số thập phân.'
    }
    for (const [key, seen, max] of [['code', codes, 50], ['barcode', barcodes, 100]]) {
      const value = (row[key] || '').trim().toUpperCase()
      if (value.length > max) errors[field(key)] = `Tối đa ${max} ký tự.`
      else if (value && seen.has(value)) errors[field(key)] = 'Mã đã có trong danh sách.'
      if (value) seen.add(value)
    }
  })
  return errors
}

export function variantRequests(base, rows) {
  return [base, ...rows.map((row) => ({ ...base, code: row.code.trim().toUpperCase() || null,
    barcode: row.barcode.trim() || null, variantLabel: row.label.trim(), price: Number(row.price) }))]
}
