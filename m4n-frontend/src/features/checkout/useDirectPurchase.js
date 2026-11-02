import { useEffect, useMemo, useState } from 'react'
import productService from '../../services/productService.js'
import { ROUTE_CHANGE_EVENT } from '../../routes/customerRoutes.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { directCheckoutUrl, parseDirectPurchase } from './directPurchase.js'
import { getFirstProductImage } from '../catalog/productMedia.js'
import useCheckoutSearch from './useCheckoutSearch.js'

export default function useDirectPurchase() {
  const search = useCheckoutSearch()
  const { directPurchase, error: inputError } = useMemo(() => parseDirectPurchase(search), [search])
  const [retry, setRetry] = useState(0)
  const [result, setResult] = useState(null)
  const productId = directPurchase?.productId
  const requestKey = `${productId}:${retry}`

  useEffect(() => {
    if (!productId) return
    let active = true
    productService.getProductById(productId).then((product) => {
      if (active) setResult({ requestKey, product, error: product ? '' : 'Sản phẩm hiện không còn kinh doanh. Vui lòng chọn sản phẩm khác.' })
    }).catch((error) => {
      if (active) setResult({ requestKey, product: null, error: error.message || 'Không thể tải sản phẩm đặt mua.' })
    })
    return () => { active = false }
  }, [productId, requestKey])

  const current = result?.requestKey === requestKey ? result : null
  const product = current?.product
  const items = product && directPurchase ? [{
    productId: product.id,
    productName: product.name,
    quantity: directPurchase.quantity,
    imageUrl: getFirstProductImage(product.media)?.url,
    unitPriceDisplay: product.priceDisplay || formatCurrencyVND(product.price),
    subtotalDisplay: formatCurrencyVND(Number(product.price) * directPurchase.quantity),
  }] : []

  function setQuantity(quantity) {
    window.history.replaceState(null, '', directCheckoutUrl(productId, quantity))
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT))
  }

  return {
    directPurchase,
    items,
    loading: Boolean(directPurchase && !current),
    error: inputError || current?.error || '',
    retry: () => setRetry((count) => count + 1),
    setQuantity,
  }
}
