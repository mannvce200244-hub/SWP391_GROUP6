import { useEffect, useState } from 'react'
import adminProductService from '../../services/adminProductService.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'

export default function ProductPromotionProducts({ value, onChange, error }) {
  const [keyword, setKeyword] = useState('')
  const [query, setQuery] = useState({ keyword: '', page: 0 })
  const [result, setResult] = useState({ loading: true, data: null, error: '' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    adminProductService.listProducts({ ...query, groupVariants: true, isActive: true, size: 8 }).then((data) => {
      if (active) setResult({ loading: false, data, error: '' })
    }).catch((failure) => { if (active) setResult({ loading: false, data: null, error: failure.message || 'Không thể tìm sản phẩm.' }) })
    return () => { active = false }
  }, [query, retry])
  const search = () => { setResult((old) => ({ ...old, loading: true })); setQuery({ keyword: keyword.trim(), page: 0 }) }
  const selected = new Map(value.map((item) => [item.familyId, item]))
  const toggle = (item) => onChange(selected.has(item.familyId) ? value.filter((target) => target.familyId !== item.familyId)
    : [...value, { familyId: item.familyId, name: item.familyName || item.name }])
  const page = (offset) => { setResult((old) => ({ ...old, loading: true })); setQuery((old) => ({ ...old, page: old.page + offset })) }

  return <fieldset className="min-w-0 rounded-lg border border-border p-3 space-y-3" aria-describedby="promotion-products-help promotion-products-error">
    <legend className="px-1 text-sm font-semibold">Sản phẩm áp dụng *</legend>
    <p id="promotion-products-help" className="text-xs text-muted">Tích chọn nhiều sản phẩm. Ưu đãi áp dụng cho các biến thể của sản phẩm đã chọn.</p>
    <Input id="promotion-product-search" name="productSearch" label="Tìm sản phẩm" value={keyword} maxLength={200}
      onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); search() } }} />
    <Button variant="secondary" onClick={search} disabled={result.loading}>Tìm sản phẩm</Button>
    <p aria-live="polite" className="text-sm font-medium">Đã chọn {value.length} sản phẩm</p>
    {value.length > 0 && <ul className="flex flex-wrap gap-2">{value.map((item) => <li key={item.familyId} className="max-w-full rounded border border-border bg-surface-secondary px-2 py-1 text-sm">
      <span className="break-words">{item.name}</span><button type="button" aria-label={`Bỏ chọn ${item.name}`} onClick={() => toggle(item)}
        className="ml-2 min-h-11 px-2 text-brand underline focus-visible:outline-2 focus-visible:outline-brand">Bỏ chọn</button>
    </li>)}</ul>}
    {result.loading ? <p role="status" className="text-sm text-muted">Đang tải sản phẩm…</p>
      : result.error ? <p role="alert" className="text-sm text-danger">{result.error} <button type="button" className="underline" onClick={() => { setResult((old) => ({ ...old, loading: true })); setRetry((old) => old + 1) }}>Thử lại</button></p>
        : !result.data?.content.length ? <p role="status" className="text-sm text-muted">Không có sản phẩm phù hợp.</p>
          : <ul className="max-h-56 overflow-y-auto">{result.data.content.map((item) => <li key={item.familyId || item.id}>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 border-b border-border py-2 text-sm">
              <input type="checkbox" name="promotionProducts" value={item.familyId || ''} disabled={!item.familyId}
                checked={selected.has(item.familyId)} onChange={() => toggle(item)} className="h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">{item.familyName || item.name}{item.variantCount > 1 && <span className="block text-xs text-muted">{item.variantCount} biến thể</span>}</span>
            </label>
          </li>)}</ul>}
    {!result.loading && result.data?.totalPages > 1 && <div className="flex items-center justify-between gap-2 text-sm">
      <Button variant="quiet" size="sm" disabled={query.page === 0} onClick={() => page(-1)}>Trước</Button>
      <span>Trang {query.page + 1} / {result.data.totalPages}</span>
      <Button variant="quiet" size="sm" disabled={query.page + 1 >= result.data.totalPages} onClick={() => page(1)}>Sau</Button>
    </div>}
    <p id="promotion-products-error" role={error ? 'alert' : undefined} className="text-sm text-danger">{error || ''}</p>
  </fieldset>
}
