function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function validatePrice(value, errorMessage) {
  if (value === '') {
    return null
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return errorMessage
  }

  return null
}

function validateProductFilters(filters) {
  const normalizedFilters = {
    keyword: normalizeText(filters.keyword),
    group: normalizeText(filters.group),
    artisan: normalizeText(filters.artisan),
    craftVillage: normalizeText(filters.craftVillage),
    minPrice: normalizeText(filters.minPrice),
    maxPrice: normalizeText(filters.maxPrice),
  }
  const errors = {}

  const minPriceError = validatePrice(
    normalizedFilters.minPrice,
    'Giá từ phải là số lớn hơn hoặc bằng 0.',
  )
  const maxPriceError = validatePrice(
    normalizedFilters.maxPrice,
    'Giá đến phải là số lớn hơn hoặc bằng 0.',
  )

  if (minPriceError) {
    errors.minPrice = minPriceError
  }

  if (maxPriceError) {
    errors.maxPrice = maxPriceError
  }

  if (
    !minPriceError &&
    !maxPriceError &&
    normalizedFilters.minPrice !== '' &&
    normalizedFilters.maxPrice !== '' &&
    Number(normalizedFilters.minPrice) > Number(normalizedFilters.maxPrice)
  ) {
    errors.maxPrice = 'Giá đến phải lớn hơn hoặc bằng giá từ.'
  }

  return { errors, normalizedFilters }
}

export default validateProductFilters
