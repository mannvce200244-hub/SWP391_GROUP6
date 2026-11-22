import { useEffect, useRef, useState } from 'react'
import productVariantService from '../../services/productVariantService.js'
import adminProductService from '../../services/adminProductService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { Plus } from 'lucide-react'

export default function ProductVariantPicker({ product, onSelect, onAdd, purchasing = false, admin = false, disabled = false, initialPage = null }) {
  const [inspectedId, setInspectedId] = useState(null)
  const [page, setPage] = useState(0)
  const [retry, setRetry] = useState(0)
  const [state, setState] = useState(null)
  const family = product.familyId != null ? `product:${product.familyId}` : product.variantGroup || `sku:${product.id}`
  const useInitialPage = Boolean(initialPage) && page === 0 && retry === 0
  const current = useInitialPage || (state?.page === page && state?.retry === retry && state?.family === family && state?.admin === admin)
  const reusePage = useInitialPage || ((admin || purchasing) && current)
  const data = useInitialPage ? initialPage : state?.data
  const error = useInitialPage ? null : state?.error
  const requestRef = useRef(null)
  useEffect(() => {
    if (reusePage) return undefined
    let active = true
    const key = JSON.stringify([admin, product.id, family, page, retry])
    if (requestRef.current?.key !== key) {
      requestRef.current = { key, promise: admin ? adminProductService.listVariants(product.id, page) : productVariantService.list(product.id, page) }
    }
    requestRef.current.promise.then((data) => {
      if (active) setState({ page, retry, family, admin, data })
    }).catch((error) => { if (active) setState({ page, retry, family, admin, error: error.message }) })
    return () => { active = false }
  }, [product.id, family, page, retry, admin, reusePage])
  return (
    <div className="min-w-0 space-y-2" aria-busy={!current}>
      <p className="text-sm font-semibold text-ink">{purchasing ? 'Các tone / biến thể' : 'Chọn biến thể'}</p>
      {!current ? <p role="status" className="text-sm text-muted">Đang tải biến thể…</p> : error ? (
        <div role="alert" className="text-sm text-danger">{error} <button type="button" onClick={() => setRetry((value) => value + 1)} className="underline">Thử lại</button></div>
      ) : <>
        <div className="flex flex-wrap gap-2">
          {data.content.map((variant) => {
            const displayed = admin && variant.id === product.id ? product : variant
            const price = admin ? displayed.originalPrice ?? displayed.price : displayed.price
            const details = <><span className="block break-words font-semibold">{displayed.variantLabel || 'Mặc định'}</span>
              <span className="block text-xs">{formatCurrencyVND(price)}{admin ? ' niêm yết' : ''} · {displayed.stockQuantity > 0 ? `Còn ${displayed.stockQuantity}` : 'Hết hàng'}</span></>
            if (purchasing) return <div key={variant.id}
              className={`flex min-w-0 max-w-full items-center gap-1 rounded-xl border bg-white p-1 text-sm ${(inspectedId ?? product.id) === variant.id ? 'border-brand text-brand' : 'border-border text-ink'}`}>
              <button type="button" aria-label={`Xem ${variant.name}`} aria-pressed={(inspectedId ?? product.id) === variant.id}
                disabled={disabled} onClick={() => setInspectedId(variant.id)}
                className="min-h-11 min-w-0 rounded-lg px-2 py-1 text-left hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40">{details}</button>
              <button type="button" aria-label={`Thêm ${variant.name} vào hóa đơn`} disabled={disabled || variant.stockQuantity <= 0}
                onClick={() => { setInspectedId(variant.id); onAdd(variant) }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-brand hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40"><Plus size={18} aria-hidden="true" /></button>
            </div>
            return <button key={variant.id} type="button" aria-pressed={variant.id === product.id}
            disabled={disabled} onClick={() => onSelect(variant)}
            className={`min-h-11 min-w-0 max-w-full rounded-xl border bg-white px-3 py-2 text-left text-sm hover:border-brand focus-visible:outline-2 focus-visible:outline-brand disabled:opacity-40 ${variant.id === product.id ? 'border-brand text-brand' : 'border-border text-ink'}`}>
            {details}
          </button>})}
        </div>
        {data.totalPages > 1 && <div className="flex items-center gap-3 text-sm">
          <button type="button" disabled={disabled || page === 0} onClick={() => setPage((value) => value - 1)}>Trước</button>
          <span>{page + 1}/{data.totalPages}</span>
          <button type="button" disabled={disabled || page >= data.totalPages - 1} onClick={() => setPage((value) => value + 1)}>Sau</button>
        </div>}
      </>}
    </div>
  )
}
