import { useEffect, useState } from 'react'
import productVariantService from '../../services/productVariantService.js'
import { formatCurrencyVND } from '../../utils/currency.js'

export default function ProductVariantPicker({ product, onSelect, purchasing = false }) {
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState(null)
  const current = state?.page === page && state?.retry === retry && state?.productId === product.id
  useEffect(() => {
    let active = true
    productVariantService.list(product.id, page).then((data) => {
      if (active) setState({ page, retry, productId: product.id, data })
    }).catch((error) => { if (active) setState({ page, retry, productId: product.id, error: error.message }) })
    return () => { active = false }
  }, [product.id, page, retry])
  return (
    <div className="min-w-0 space-y-2" aria-busy={!current}>
      <p className="text-sm font-semibold text-ink">Chọn biến thể</p>
      {!current ? <p role="status" className="text-sm text-muted">Đang tải biến thể…</p> : state.error ? (
        <div role="alert" className="text-sm text-danger">{state.error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Thử lại</button></div>
      ) : <>
        <div className="flex flex-wrap gap-2">
          {state.data.content.map((variant) => <button key={variant.id} type="button" aria-pressed={variant.id === product.id}
            disabled={purchasing && variant.stockQuantity <= 0} onClick={() => onSelect(variant)}
            className={`min-h-11 rounded-xl border bg-white px-3 py-2 text-left text-sm hover:border-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 ${variant.id === product.id ? 'border-brand text-brand' : 'border-border text-ink'}`}>
            <span className="block font-semibold">{variant.variantLabel || variant.name}</span>
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
