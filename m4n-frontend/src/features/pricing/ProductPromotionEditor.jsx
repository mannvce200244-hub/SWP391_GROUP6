import { useRef, useState } from 'react'
import pricingService from '../../services/pricingService.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import ProductPromotionProducts from './ProductPromotionProducts.jsx'
import VoucherDateTimeField from '../admin/VoucherDateTimeField.jsx'
import { minimumVoucherEnd, validateVoucherPeriod } from '../admin/voucherPeriod.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'

const localTime = (value) => { if (!value) return ''; const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19) }

export default function ProductPromotionEditor({ promotion, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ name: promotion?.name || '', products: promotion?.products || [], discountPercent: promotion ? String(Number((Number(promotion.discountRate) * 100).toFixed(2))) : '', isActive: promotion?.isActive ?? true, validFrom: localTime(promotion?.validFrom), validUntil: localTime(promotion?.validUntil) }))
  const [baseline, setBaseline] = useState(() => promotion?.createdAt || new Date().toISOString())
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const pending = useRef(false)
  const original = useRef(form)
  const requestClose = () => {
    if (pending.current) return
    if (JSON.stringify(form) !== JSON.stringify(original.current)) setDiscardOpen(true)
    else onClose()
  }
  const dialog = useDialogFocus(true, requestClose, busy)
  const change = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: null })) }

  async function save(event) {
    event.preventDefault()
    if (pending.current) return
    const fields = {}
    if (!form.name.trim() || form.name.trim().length > 150) fields.name = 'Nhập tên chương trình, tối đa 150 ký tự.'
    if (!form.products.length) fields.products = 'Chọn ít nhất một sản phẩm để áp dụng.'
    if (!/^\d+(\.\d{1,2})?$/.test(form.discountPercent) || Number(form.discountPercent) > 100) fields.discountRate = 'Mức giảm từ 0 đến 100%, tối đa 2 chữ số thập phân.'
    const dates = {}
    for (const field of ['validFrom', 'validUntil']) {
      if (event.currentTarget.elements.namedItem(field)?.validity.badInput) fields[field] = 'Nhập đầy đủ ngày và giờ.'
      else if (form[field] === original.current[field]) dates[field] = promotion?.[field] ?? null
      else if (!form[field]) dates[field] = null
      else if (!Number.isFinite(new Date(form[field]).getTime())) fields[field] = 'Ngày giờ không hợp lệ.'
      else dates[field] = new Date(form[field]).toISOString()
    }
    const creationTime = promotion?.createdAt || new Date().toISOString()
    if (!promotion) setBaseline(creationTime)
    const periodError = validateVoucherPeriod(creationTime, dates.validFrom, dates.validUntil)
    if (periodError) fields.validUntil = periodError
    setErrors(fields)
    if (Object.keys(fields).length) {
      const focusIds = { name: 'promotion-name', products: 'promotion-product-search', discountRate: 'promotion-rate', validFrom: 'promotion-validFrom', validUntil: 'promotion-validUntil' }
      document.getElementById(focusIds[Object.keys(fields)[0]])?.focus()
      return
    }
    pending.current = true
    setBusy(true)
    setError('')
    const data = { name: form.name.trim(), familyIds: form.products.map((product) => product.familyId), discountRate: Number((Number(form.discountPercent) / 100).toFixed(4)), isActive: form.isActive, ...dates }
    try {
      if (promotion) await pricingService.updatePromotion(promotion.id, { ...data, expectedVersion: promotion.version })
      else await pricingService.createPromotion(data)
      onSaved()
    } catch (err) {
      if (!promotion) setBaseline(new Date().toISOString())
      const fieldErrors = err.fieldErrors || {}
      if (err.message?.includes('Thời gian kết thúc')) fieldErrors.validUntil = err.message
      setErrors(fieldErrors)
      requestAnimationFrame(() => dialog.current?.querySelector('[aria-invalid="true"], [role="alert"]')?.focus())
      setError(err.status === 409 ? 'Chương trình đã thay đổi. Đóng và mở lại để xem bản mới.' : err.message || 'Không thể lưu chương trình.') }
    finally { pending.current = false; setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
      <div ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="promotion-title" className="bg-white border border-border rounded-xl p-6 w-full max-w-xl max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain">
        <h2 id="promotion-title" className="text-lg font-semibold mb-4">{promotion ? 'Sửa chương trình' : 'Tạo chương trình giảm sản phẩm'}</h2>
        <form onSubmit={save} noValidate className="space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <Input id="promotion-name" label="Tên chương trình" required maxLength={150} value={form.name} error={errors.name} onChange={(event) => change('name', event.target.value)} />
            <ProductPromotionProducts value={form.products} onChange={(products) => change('products', products)} error={errors.products || errors.familyIds} />
            <Input id="promotion-rate" label="Mức giảm (%)" required type="number" min="0" max="100" step="0.01" value={form.discountPercent} error={errors.discountRate} helperText="Nếu trùng chương trình, chỉ áp mức giảm cao nhất." onChange={(event) => change('discountPercent', event.target.value)} />
            <div className="grid sm:grid-cols-2 gap-3">
              <VoucherDateTimeField name="validFrom" label="Bắt đầu" value={form.validFrom} hint="Để trống để áp dụng ngay."
                invalid={Boolean(errors.validFrom)} describedBy={errors.validFrom ? 'promotion-period-error' : undefined}
                onChange={(value) => { change('validFrom', value); if (!promotion) setBaseline(new Date().toISOString()) }} />
              <VoucherDateTimeField name="validUntil" label="Kết thúc" value={form.validUntil} hint="Để trống nếu không giới hạn."
                invalid={Boolean(errors.validUntil)} describedBy={errors.validUntil ? 'promotion-period-error' : undefined}
                minimum={new Date(Math.ceil(minimumVoucherEnd(baseline, form.validFrom) / 60000) * 60000).toISOString()}
                onChange={(value) => change('validUntil', value)} />
            </div>
            <p className="text-xs text-muted">Nếu đặt hạn kết thúc, thời gian phải cách lúc tạo ban đầu và lúc bắt đầu ít nhất 1 giờ.</p>
            {(errors.validFrom || errors.validUntil) && <p id="promotion-period-error" role="alert" className="text-sm text-danger">{errors.validFrom || errors.validUntil}</p>}
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
