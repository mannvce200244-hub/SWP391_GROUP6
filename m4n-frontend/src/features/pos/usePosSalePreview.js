import { useEffect, useState } from 'react'
import { previewSale } from '../../services/posService.js'

export default function usePosSalePreview(items, voucherCode) {
  const key = JSON.stringify({ items: items.map(({ productId, quantity }) => ({ productId, quantity })), voucherCode })
  const [preview, setPreview] = useState({ key: '', data: null, error: '' })
  const [inputKey, setInputKey] = useState(key)
  const [retryKey, setRetryKey] = useState(0)

  // Returning to a previous bill must request current prices and stock again.
  if (inputKey !== key) {
    setInputKey(key)
    setPreview({ key: '', data: null, error: '' })
  }

  useEffect(() => {
    const request = JSON.parse(key)
    if (!request.items.length) return undefined
    let active = true
    const timer = setTimeout(() => {
      previewSale(request).then((data) => {
        if (active) setPreview({ key, data, error: '' })
      }).catch((error) => {
        if (active) setPreview({ key, data: null, error: error.message || 'Không thể tính hóa đơn. Vui lòng thử lại.' })
      })
    }, 150)
    return () => { active = false; clearTimeout(timer) }
  }, [key, retryKey])

  return {
    data: preview.key === key ? preview.data : null,
    error: preview.key === key ? preview.error : '',
    loading: Boolean(items.length && (preview.key !== key || (!preview.data && !preview.error))),
    retry: () => { setPreview({ key: '', data: null, error: '' }); setRetryKey((value) => value + 1) },
  }
}
