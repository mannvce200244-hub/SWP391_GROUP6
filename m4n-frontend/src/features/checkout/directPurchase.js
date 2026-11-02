import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function positiveInteger(value, maximum = Number.MAX_SAFE_INTEGER) {
  return /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) <= maximum
}

export function directCheckoutUrl(productId, quantity) {
  if (!positiveInteger(productId) || !positiveInteger(quantity, 2147483647)) {
    throw new Error('Sản phẩm hoặc số lượng mua không hợp lệ.')
  }
  return `${CUSTOMER_ROUTES.checkout}?${new URLSearchParams({ productId: String(productId), quantity: String(quantity) })}`
}

export function parseDirectPurchase(search) {
  const params = new URLSearchParams(search)
  if (!params.has('productId') && !params.has('quantity')) return { directPurchase: null, error: '' }
  const productId = params.get('productId')
  const quantity = params.get('quantity')
  if (params.getAll('productId').length !== 1 || params.getAll('quantity').length !== 1
      || params.has('cartItemIds')
      || !positiveInteger(productId) || !positiveInteger(quantity, 2147483647)) {
    return { directPurchase: null, error: 'Thông tin mua trực tiếp không hợp lệ. Vui lòng chọn lại sản phẩm.' }
  }
  return { directPurchase: { productId: Number(productId), quantity: Number(quantity) }, error: '' }
}
