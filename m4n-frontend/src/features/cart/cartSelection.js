import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

export function cartCheckoutUrl(ids) {
  const search = `?${new URLSearchParams({ cartItemIds: ids.join(',') })}`
  const result = parseCartCheckout(search)
  if (result.error) throw new Error(result.error)
  return `${CUSTOMER_ROUTES.checkout}${search}`
}

export function cartSelectionError(ids) {
  if (ids.length > 100) return 'Mỗi lần thanh toán tối đa 100 sản phẩm. Vui lòng bỏ chọn bớt sản phẩm.'
  if (!ids.length || ids.some((id) => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length) {
    return 'Vui lòng chọn ít nhất một sản phẩm hợp lệ để thanh toán.'
  }
  return ''
}

export function parseCartCheckout(search) {
  const params = new URLSearchParams(search)
  const raw = params.get('cartItemIds') || ''
  const ids = raw.split(',').map(Number)
  if (params.getAll('cartItemIds').length !== 1 || !/^[1-9]\d*(,[1-9]\d*)*$/.test(raw)) {
    return { cartItemIds: [], error: 'Vui lòng quay lại giỏ hàng và chọn sản phẩm cần thanh toán.' }
  }
  const error = cartSelectionError(ids)
  return { cartItemIds: error ? [] : ids, error }
}

export function reconcileCartSelection(current, owner, items) {
  const currentIds = items.map((item) => item.id)
  if (!owner) return { owner: null, selectedIds: [], knownIds: [] }
  if (current.owner !== owner) return { owner, selectedIds: currentIds, knownIds: currentIds }

  const availableIds = new Set(currentIds)
  const knownIds = new Set(current.knownIds)
  const selectedIds = current.selectedIds
    .filter((id) => availableIds.has(id))
    .concat(currentIds.filter((id) => !knownIds.has(id)))
  const unchanged = selectedIds.length === current.selectedIds.length
    && selectedIds.every((id, index) => id === current.selectedIds[index])
    && currentIds.length === current.knownIds.length
    && currentIds.every((id, index) => id === current.knownIds[index])
  return unchanged ? current : { owner, selectedIds, knownIds: currentIds }
}

