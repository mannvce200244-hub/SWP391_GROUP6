import { useEffect, useState } from 'react'
import productVariantService from '../../services/productVariantService.js'
import adminProductService from '../../services/adminProductService.js'
import { formatCurrencyVND } from '../../utils/currency.js'

export default function ProductVariantPicker({ product, onSelect, purchasing = false, admin = false, disabled = false }) {
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState(null)
  const family = product.variantGroup || `sku:${product.id}`
  const current = state?.page === page && state?.retry === retry && state?.family === family
  useEffect(() => {
    let active = true
    const request = admin ? adminProductService.listVariants(product.id, page) : productVariantService.list(product.id, page)
    request.then((data) => {
      if (active) setState({ page, retry, family, data })
    }).catch((error) => { if (active) setState({ page, retry, family, error: error.message }) })
    return () => { active = false }
  }, [product.id, family, page, retry, admin])
  return (
    <div className="min-w-0 space-y-2" aria-busy={!current}>
      <p className="text-sm font-semibold text-ink">Chọn biến thể</p>
      {!current ? <p role="status" className="text-sm text-muted">Đang tải biến thể…</p> : state.error ? (
        <div role="alert" className="text-sm text-danger">{state.error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Thử lại</button></div>
      ) : <>
        <div className="flex flex-wrap gap-2">
          {state.data.content.map((variant) => <button key={variant.id} type="button" aria-pressed={variant.id === product.id}
            disabled={disabled || (purchasing && variant.stockQuantity <= 0)} onClick={() => onSelect(variant)}
            className={`min-h-11 min-w-0 max-w-full rounded-xl border bg-white px-3 py-2 text-left text-sm hover:border-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 ${variant.id === product.id ? 'border-brand text-brand' : 'border-border text-ink'}`}>
            <span className="block break-words font-semibold">{variant.variantLabel || variant.name}</span>
            <span className="block text-xs">{formatCurrencyVND(variant.price)} · {variant.stockQuantity > 0 ? `Còn ${variant.stockQuantity}` : 'Hết hàng'}</span>
          </button>)}
        </div>
        {state.data.totalPages > 1 && <div className="flex items-center gap-3 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}>Trước</button>
          <span>{page + 1}/{state.data.totalPages}</span>
          <button type="button" disabled={page >= state.data.totalPages - 1} onClick={() => setPage((value) => value + 1)}>Sau</button>
        </div>}
      </>}
    </div>
  )
}
