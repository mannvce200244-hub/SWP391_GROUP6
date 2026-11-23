function normalizeKey(value) {
  return String(value || '').trim().normalize('NFC').toLocaleLowerCase('vi')
}

export function buildAttributeGroups(variants = []) {
  const list = Array.isArray(variants) ? variants : []
  const sample = list.find((item) => item?.option1Name && item?.option1Value)
  if (!sample) return { structured: false, option1Name: '', option2Name: '', option1Values: [], option2Values: [] }

  const option1Name = sample.option1Name.trim()
  const option2Sample = list.find((item) => item?.option2Name && item?.option2Value)
  const option2Name = option2Sample ? option2Sample.option2Name.trim() : ''

  const opt1Map = new Map()
  const opt2Map = new Map()
  for (const item of list) {
    if (item?.option1Value) {
      const k1 = normalizeKey(item.option1Value)
      if (!opt1Map.has(k1)) opt1Map.set(k1, item.option1Value.trim())
    }
    if (option2Name && item?.option2Value) {
      const k2 = normalizeKey(item.option2Value)
      if (!opt2Map.has(k2)) opt2Map.set(k2, item.option2Value.trim())
    }
  }

  if (opt1Map.size === 0) return { structured: false, option1Name: '', option2Name: '', option1Values: [], option2Values: [] }

  return {
    structured: true,
    option1Name,
    option2Name,
    option1Values: Array.from(opt1Map.values()),
    option2Values: Array.from(opt2Map.values()),
  }
}

export function findVariantByOptions(variants = [], option1Value, option2Value = '') {
  const k1 = normalizeKey(option1Value)
  const k2 = normalizeKey(option2Value)
  return variants.find((item) => {
    if (normalizeKey(item?.option1Value) !== k1) return false
    if (!k2) return !normalizeKey(item?.option2Value)
    return normalizeKey(item?.option2Value) === k2
  }) || null
}

export function selectVariantOption(variants = [], currentVariant, dimension, nextValue) {
  const targetKey = normalizeKey(nextValue)
  if (dimension === 1) {
    const exact = currentVariant?.option2Value
      ? findVariantByOptions(variants, nextValue, currentVariant.option2Value)
      : findVariantByOptions(variants, nextValue, '')
    if (exact) return exact
    const matches = variants.filter((item) => normalizeKey(item?.option1Value) === targetKey)
    return matches.find((item) => (item.stockQuantity ?? 0) > 0) || matches[0] || null
  }
  const exact = currentVariant?.option1Value
    ? findVariantByOptions(variants, currentVariant.option1Value, nextValue)
    : null
  if (exact) return exact
  const matches = variants.filter((item) => normalizeKey(item?.option2Value) === targetKey)
  return matches.find((item) => (item.stockQuantity ?? 0) > 0) || matches[0] || null
}

export function optionAvailability(variants = [], currentVariant, dimension, candidateValue) {
  const candidateKey = normalizeKey(candidateValue)
  const hasOption2 = variants.some((item) => Boolean(item?.option2Name && item?.option2Value))
  if (dimension === 1) {
    const anyMatches = variants.filter((item) => normalizeKey(item?.option1Value) === candidateKey)
    const paired = hasOption2 && currentVariant?.option2Value
      ? findVariantByOptions(variants, candidateValue, currentVariant.option2Value)
      : anyMatches[0] || null
    return {
      anyExists: anyMatches.length > 0,
      anyInStock: anyMatches.some((item) => (item.stockQuantity ?? 0) > 0),
      exists: Boolean(paired),
      inStock: Boolean(paired && (paired.stockQuantity ?? 0) > 0),
      variant: paired,
    }
  }
  const anyMatches = variants.filter((item) => normalizeKey(item?.option2Value) === candidateKey)
  const paired = currentVariant?.option1Value
    ? findVariantByOptions(variants, currentVariant.option1Value, candidateValue)
    : anyMatches[0] || null
  return {
    anyExists: anyMatches.length > 0,
    anyInStock: anyMatches.some((item) => (item.stockQuantity ?? 0) > 0),
    exists: Boolean(paired),
    inStock: Boolean(paired && (paired.stockQuantity ?? 0) > 0),
    variant: paired,
  }
}

export function buildVariantMatrix(option1Values = [], option2Values = [], existingRows = [], defaultPrice = '') {
  const clean1 = uniqueNormalized(option1Values)
  const clean2 = uniqueNormalized(option2Values)
  const existingByKey = new Map(existingRows.map((row) => [matrixRowKey(row.option1Value, row.option2Value), row]))
  const rows = []
  if (clean1.length === 0) return rows
  if (clean2.length === 0) {
    for (const v1 of clean1) {
      const key = matrixRowKey(v1, '')
      const prev = existingByKey.get(key)
      rows.push({
        id: prev?.id || key,
        option1Value: v1,
        option2Value: '',
        label: v1,
        price: prev?.price ?? defaultPrice,
        code: prev?.code ?? '',
        barcode: prev?.barcode ?? '',
      })
    }
    return rows
  }
  for (const v1 of clean1) {
    for (const v2 of clean2) {
      const key = matrixRowKey(v1, v2)
      const prev = existingByKey.get(key)
      rows.push({
        id: prev?.id || key,
        option1Value: v1,
        option2Value: v2,
        label: `${v1} · ${v2}`,
        price: prev?.price ?? defaultPrice,
        code: prev?.code ?? '',
        barcode: prev?.barcode ?? '',
      })
    }
  }
  return rows
}

export function matrixRowKey(option1Value, option2Value = '') {
  return `${normalizeKey(option1Value)}||${normalizeKey(option2Value)}`
}

export function buildMissingVariantMatrix(
  option1Values = [],
  option2Values = [],
  existingVariants = [],
  draftRows = [],
  defaultPrice = '',
) {
  const existingKeys = new Set()
  for (const item of existingVariants || []) {
    if (item?.option1Value) {
      existingKeys.add(matrixRowKey(item.option1Value, item.option2Value || ''))
    }
  }
  const full = buildVariantMatrix(option1Values, option2Values, draftRows, defaultPrice)
  return full.filter((row) => !existingKeys.has(matrixRowKey(row.option1Value, row.option2Value)))
}

function uniqueNormalized(values) {
  const seen = new Set()
  const out = []
  for (const raw of values || []) {
    const trimmed = String(raw || '').trim().normalize('NFC')
    if (!trimmed) continue
    const key = trimmed.toLocaleLowerCase('vi')
    if (!seen.has(key)) {
      seen.add(key)
      out.push(trimmed)
    }
  }
  return out
}
