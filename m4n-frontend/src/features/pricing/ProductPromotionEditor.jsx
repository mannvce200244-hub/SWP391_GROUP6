import { useEffect, useRef, useState } from 'react'
import adminProductService from '../../services/adminProductService.js'
import pricingService from '../../services/pricingService.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'

const localTime = (value) => { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19) }

export default function ProductPromotionEditor({ promotion, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ name: promotion?.name || '', productId: promotion?.productId || '', discountPercent: promotion ? String(Number((Number(promotion.discountRate) * 100).toFixed(2))) : '', isActive: promotion?.isActive ?? true, validFrom: localTime(promotion?.validFrom), validUntil: localTime(promotion?.validUntil) }))
  const [productName, setProductName] = useState(promotion?.productName || '')
  const [keyword, setKeyword] = useState('')
  const [searchState, setSearchState] = useState({ items: [], loading: false, searched: false })
  const [error, setError] = useState('')
  const [searchError, setSearchError] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const pending = useRef(false)
  const original = useRef(form)
  const searchSequence = useRef(0)
  useEffect(() => () => { searchSequence.current += 1 }, [])
  const requestClose = () => {
    if (pending.current) return
    if (JSON.stringify(form) !== JSON.stringify(original.current)) setDiscardOpen(true)
    else onClose()
  }
  const dialog = useDialogFocus(true, requestClose, busy)
  const change = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: null })) }

  async function search() {
    if (searchState.loading) return
    const sequence = ++searchSequence.current
    setSearchState((current) => ({ ...current, loading: true }))
    setSearchError('')
    try {
      const result = await adminProductService.listProducts({ keyword, isActive: true, size: 8 })
      if (sequence === searchSequence.current) setSearchState({ items: result.content, loading: false, searched: true })
    } catch (err) {
      if (sequence !== searchSequence.current) return
      setSearchError(err.message || 'Không thể tìm sản phẩm.')
      setSearchState((current) => ({ ...current, loading: false }))
    }
  }

  async function save(event) {
    event.preventDefault()
    if (pending.current) return
    const fields = {}
    if (!form.name.trim() || form.name.trim().length > 150) fields.name = 'Nhập tên chương trình, tối đa 150 ký tự.'
    if (!form.productId) fields.productId = 'Chọn sản phẩm để áp dụng.'
    if (!/^\d+(\.\d{1,2})?$/.test(form.discountPercent) || Number(form.discountPercent) > 100) fields.discountRate = 'Mức giảm từ 0 đến 100%, tối đa 2 chữ số thập phân.'
    const dates = {}
    for (const field of ['validFrom', 'validUntil']) {
      if (form[field] === original.current[field]) dates[field] = promotion?.[field] ?? null
      else if (!form[field]) dates[field] = null
      else if (!Number.isFinite(new Date(form[field]).getTime())) fields[field] = 'Ngày giờ không hợp lệ.'
      else dates[field] = new Date(form[field]).toISOString()
    }
    if (dates.validFrom && dates.validUntil && new Date(dates.validUntil) <= new Date(dates.validFrom)) fields.validUntil = 'Kết thúc phải sau bắt đầu.'
    setErrors(fields)
    if (Object.keys(fields).length) {
      const focusIds = { name: 'promotion-name', productId: 'promotion-product-search', discountRate: 'promotion-rate', validFrom: 'promotion-start', validUntil: 'promotion-end' }
      document.getElementById(focusIds[Object.keys(fields)[0]])?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    setError('')
    const data = { name: form.name.trim(), productId: Number(form.productId), discountRate: Number((Number(form.discountPercent) / 100).toFixed(4)), isActive: form.isActive, ...dates }
    try {
      if (promotion) await pricingService.updatePromotion(promotion.id, { ...data, expectedVersion: promotion.version })
      else await pricingService.createPromotion(data)
      onSaved()
    } catch (err) { setErrors(err.fieldErrors || {}); setError(err.status === 409 ? 'Chương trình đã thay đổi. Đóng và mở lại để xem bản mới.' : err.message || 'Không thể lưu chương trình.') }
    finally { pending.current = false; setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="promotion-title" className="bg-white border border-border rounded-xl p-6 w-full max-w-xl max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain">
        <h2 id="promotion-title" className="text-lg font-semibold mb-4">{promotion ? 'Sửa chương trình' : 'Tạo chương trình giảm sản phẩm'}</h2>
        <form onSubmit={save} noValidate className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <Input id="promotion-name" label="Tên chương trình" required maxLength={150} value={form.name} error={errors.name} onChange={(event) => change('name', event.target.value)} />
            <div className="border border-border rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold">Sản phẩm *: {productName ? `${productName} · #${form.productId}` : 'Chưa chọn'}</p>
              <Input id="promotion-product-search" label="Tìm sản phẩm đang bán" value={keyword} maxLength={200} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); search() } }} />
              <Button variant="secondary" onClick={search} loading={searchState.loading} loadingLabel="Đang tìm…">Tìm sản phẩm</Button>
              {searchError && <p role="alert" className="text-sm text-danger">{searchError}</p>}
              {searchState.searched && !searchState.items.length && <p role="status" className="text-sm text-muted">Không có kết quả.</p>}
              <ul className="max-h-40 overflow-y-auto">{searchState.items.map((item) => <li key={item.id}><button type="button" onClick={() => { change('productId', item.id); setProductName(item.name) }} className="min-h-11 text-left w-full border-b border-border text-sm" aria-pressed={form.productId === item.id}>{item.name} · {item.code}</button></li>)}</ul>
              {errors.productId && <p role="alert" className="text-sm text-danger">{errors.productId}</p>}
            </div>
            <Input id="promotion-rate" label="Mức giảm (%)" required type="number" min="0" max="100" step="0.01" value={form.discountPercent} error={errors.discountRate} helperText="Nếu trùng chương trình, chỉ áp mức giảm cao nhất." onChange={(event) => change('discountPercent', event.target.value)} />
            <div className="grid sm:grid-cols-2 gap-3">
              <Input id="promotion-start" type="datetime-local" step="1" label="Bắt đầu (tùy chọn)" value={form.validFrom} error={errors.validFrom} onChange={(event) => change('validFrom', event.target.value)} />
              <Input id="promotion-end" type="datetime-local" step="1" label="Kết thúc (tùy chọn)" value={form.validUntil} error={errors.validUntil} onChange={(event) => change('validUntil', event.target.value)} />
            </div>
            <label className="flex items-center gap-3 min-h-11 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => change('isActive', event.target.checked)} />Bật chương trình</label>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex justify-end gap-3"><Button variant="quiet" onClick={requestClose}>Đóng</Button><Button type="submit" loading={busy} loadingLabel="Đang lưu…">Lưu chương trình</Button></div>
          </fieldset>
        </form>
      </div>
      <ConfirmDialog isOpen={discardOpen} title="Bỏ thay đổi chương trình?" description="Thay đổi chưa lưu sẽ bị mất." confirmLabel="Bỏ thay đổi" onCancel={() => setDiscardOpen(false)} onConfirm={onClose} />
    </div>
  )
}
