export function variantFormErrors(base, rows, requireVariant = false, { allowUnnamedBase = false } = {}) {
  const errors = {}
  const needsVariant = requireVariant || rows.length > 0 || Boolean(base.variantLabel?.trim())
  const labels = new Set()
  const codes = new Set()
  const barcodes = new Set()
  const all = [{ label: base.variantLabel, code: base.code, barcode: base.barcode, price: String(base.price) }, ...rows]
  all.forEach((row, index) => {
    const field = (key) => index ? `variants[${index}].${key}` : key
    const label = row.label.trim().normalize('NFC').toLocaleLowerCase('vi')
    const needsLabel = index > 0 || (needsVariant && !allowUnnamedBase)
    if ((needsLabel && !label) || label.length > 100) errors[field('variantLabel')] = 'Nhập tên biến thể, tối đa 100 ký tự.'
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

export function classificationAssignmentErrors(siblings, firstAssignments, secondAssignments, useOption2) {
  const errors = {}
  const seen = new Set()
  for (const sku of siblings) {
    const first = (firstAssignments[sku.id] || '').trim().normalize('NFC')
    const second = useOption2 ? (secondAssignments[sku.id] || '').trim().normalize('NFC') : ''
    if (!first || first.length > 48) errors[`option1Assignments[${sku.id}]`] = 'Nhập giá trị nhóm 1 cho SKU này, tối đa 48 ký tự.'
    if (useOption2 && (!second || second.length > 48)) errors[`option2Assignments[${sku.id}]`] = 'Nhập giá trị nhóm 2 cho SKU này, tối đa 48 ký tự.'
    if (first && (!useOption2 || second)) {
      const key = (useOption2 ? `${first} · ${second}` : first).toLocaleLowerCase('vi')
      if (seen.has(key)) errors[`option1Assignments[${sku.id}]`] = 'Tổ hợp biến thể bị trùng. Chọn giá trị khác cho SKU này.'
      seen.add(key)
    }
  }
  return errors
}

export function matrixFormErrors(
  { option1Name = '', option2Name = '', useOption2 = false },
  matrixRows = [],
  { firstRowTopLevel = false, existingCombos = null } = {},
) {
  const errors = {}
  const n1 = option1Name.trim().normalize('NFC')
  const n2 = useOption2 ? option2Name.trim().normalize('NFC') : ''
  if (!n1 || n1.length > 48) errors.option1Name = 'Nhập tên nhóm phân loại 1 (tối đa 48 ký tự), ví dụ: Chất liệu.'
  if (useOption2) {
    if (!n2 || n2.length > 48) errors.option2Name = 'Nhập tên nhóm phân loại 2 (tối đa 48 ký tự), ví dụ: Số dây.'
    else if (n1 && n1.toLocaleLowerCase('vi') === n2.toLocaleLowerCase('vi')) {
      errors.option2Name = 'Hai nhóm phân loại không được trùng tên.'
    }
  }
  if (!matrixRows.length) {
    errors.variantMatrix = 'Thêm ít nhất 1 giá trị phân loại để tạo tổ hợp biến thể.'
    return errors
  }
  const existingSet = existingCombos ? new Set(existingCombos) : null
  const seenLabels = new Set()
  const seenCodes = new Set()
  const seenBarcodes = new Set()
  matrixRows.forEach((row, index) => {
    const field = (key) => (firstRowTopLevel && index === 0 ? key : `variants[${index}].${key}`)
    const v1 = (row.option1Value || '').trim().normalize('NFC')
    const v2 = useOption2 ? (row.option2Value || '').trim().normalize('NFC') : ''
    if (!v1 || v1.length > 48) errors[field('option1Value')] = `Nhập ${n1 || 'giá trị phân loại 1'} (tối đa 48 ký tự).`
    if (useOption2 && (!v2 || v2.length > 48)) errors[field('option2Value')] = `Nhập ${n2 || 'giá trị phân loại 2'} (tối đa 48 ký tự).`
    const combined = (useOption2 ? `${v1} · ${v2}` : v1).toLocaleLowerCase('vi')
    const hasCompleteValues = Boolean(v1) && (!useOption2 || Boolean(v2))
    if (hasCompleteValues) {
      if (existingSet?.has(combined)) errors[field('variantLabel')] = 'Tổ hợp biến thể này đã tồn tại trên hệ thống.'
      else if (seenLabels.has(combined)) errors[field('variantLabel')] = 'Tổ hợp biến thể bị trùng trong danh sách.'
      seenLabels.add(combined)
    }

    const priceStr = String(row.price ?? '').trim()
    if (!/^\d+(\.\d{1,2})?$/.test(priceStr) || !Number.isFinite(Number(priceStr)) || Number(priceStr) <= 0 || Number(priceStr) >= 1e12) {
      errors[field('price')] = 'Giá phải lớn hơn 0, tối đa 12 chữ số nguyên và 2 chữ số thập phân.'
    }
    for (const [key, seen, max] of [['code', seenCodes, 50], ['barcode', seenBarcodes, 100]]) {
      const val = (row[key] || '').trim().toUpperCase()
      if (val.length > max) errors[field(key)] = `Tối đa ${max} ký tự.`
      else if (val && seen.has(val)) errors[field(key)] = 'Mã đã có trong danh sách.'
      if (val) seen.add(val)
    }
  })
  return errors
}

export function matrixVariantRequests(base, { option1Name = '', option2Name = '', useOption2 = false }, matrixRows = []) {
  const n1 = option1Name.trim()
  const n2 = useOption2 && option2Name.trim() ? option2Name.trim() : null
  return matrixRows.map((row) => {
    const v1 = row.option1Value.trim()
    const v2 = n2 ? row.option2Value.trim() : null
    return {
      ...base,
      code: row.code.trim().toUpperCase() || null,
      barcode: row.barcode.trim() || null,
      price: Number(row.price),
      option1Name: n1,
      option2Name: n2,
      option1Value: v1,
      option2Value: v2,
      variantLabel: v2 ? `${v1} · ${v2}` : v1,
    }
  })
}
