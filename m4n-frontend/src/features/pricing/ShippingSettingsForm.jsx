import { useEffect, useRef, useState } from 'react'
import pricingService from '../../services/pricingService.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'

export default function ShippingSettingsForm() {
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [retry, setRetry] = useState(0)
  const [hasEdits, setHasEdits] = useState(false)
  const [reloadConfirm, setReloadConfirm] = useState(false)
  const pending = useRef(false)

  useEffect(() => {
    let active = true
    pricingService.getShippingSettings().then((settings) => {
      if (active) { setForm(settings); setError(''); setErrors({}); setMessage(''); setHasEdits(false) }
    }).catch((err) => { if (active) setError(err.message || 'Không thể tải cấu hình vận chuyển.') })
    return () => { active = false }
  }, [retry])

  const change = (field, value) => { setForm((current) => ({ ...current, [field]: value })); setErrors((current) => ({ ...current, [field]: null })); setMessage(''); setHasEdits(true) }
  const reload = () => { setReloadConfirm(false); setRetry((value) => value + 1) }

  async function save(event) {
    event.preventDefault()
    if (pending.current || !form) return
    const fields = {}
    const rate = String(form.ratePerKg)
    const threshold = String(form.freeShippingThreshold ?? '')
    if (!/^\d+(\.\d{1,2})?$/.test(rate) || Number(rate) > 999999999999.99) fields.ratePerKg = 'Đơn giá không âm, tối đa 999.999.999.999,99đ và 2 chữ số thập phân.'
    if (form.freeShippingEnabled && (!/^\d+$/.test(threshold) || Number(threshold) > 9999999999999)) fields.freeShippingThreshold = 'Ngưỡng phải là số nguyên từ 0 đến 9.999.999.999.999đ.'
    setErrors(fields)
    if (Object.keys(fields).length) { document.getElementById(`shipping-${Object.keys(fields)[0]}`)?.focus(); return }
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const result = await pricingService.updateShippingSettings({ enabled: form.enabled, ratePerKg: Number(rate), freeShippingEnabled: form.freeShippingEnabled, freeShippingThreshold: form.freeShippingEnabled ? Number(threshold) : null, expectedVersion: form.version })
      setForm(result)
      setHasEdits(false)
      setMessage('Đã lưu cấu hình. Các đơn đã tạo giữ nguyên phí vận chuyển.')
    } catch (err) {
      setErrors(err.fieldErrors || {})
      setError(err.status === 409 ? 'Cấu hình đã được người khác sửa. Tải bản mới trước khi lưu lại.' : err.message || 'Không thể lưu cấu hình.')
    } finally { pending.current = false; setBusy(false) }
  }

  return (
    <section className="bg-white border border-border rounded-xl p-5 space-y-4">
      <h2 className="text-lg font-semibold">Phí vận chuyển online</h2>
      <p className="text-sm text-muted">Phí = tổng kg × đơn giá/kg + phụ phí cồng kềnh theo số lượng. Thiết lập khối lượng tính cước và phụ phí trong từng sản phẩm trước khi bật. POS luôn có phí 0đ.</p>
      {!form && !error ? <LoadingState message="Đang tải cấu hình…" /> : form && <form onSubmit={save} noValidate className="space-y-4">
        <fieldset disabled={busy} className="space-y-4">
          <label className="flex items-center gap-3 text-sm min-h-11"><input type="checkbox" checked={form.enabled} onChange={(event) => change('enabled', event.target.checked)} />Bật tính phí vận chuyển</label>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input id="shipping-ratePerKg" type="number" min="0" max="999999999999.99" step="0.01" label="Đơn giá / kg (đ)" required value={form.ratePerKg} error={errors.ratePerKg} helperText="Ví dụ 15.000đ/kg; mức phí do bạn cấu hình." onChange={(event) => change('ratePerKg', event.target.value)} />
            <Input id="shipping-freeShippingThreshold" type="number" min="0" max="9999999999999" step="1" label="Ngưỡng miễn phí tiền hàng (đ)" disabled={!form.freeShippingEnabled} required={form.freeShippingEnabled} value={form.freeShippingThreshold ?? ''} error={errors.freeShippingThreshold} helperText="Tính trên tiền hàng sau giảm theo sản phẩm, trước voucher đơn." onChange={(event) => change('freeShippingThreshold', event.target.value)} />
          </div>
          <label className="flex items-center gap-3 text-sm min-h-11"><input type="checkbox" checked={form.freeShippingEnabled} onChange={(event) => change('freeShippingEnabled', event.target.checked)} />Miễn phí tự động khi đạt ngưỡng</label>
          <Button type="submit" loading={busy} loadingLabel="Đang lưu…">Lưu cấu hình</Button>
        </fieldset>
      </form>}
      {error && <ErrorState message={error} onRetry={busy ? undefined : () => { if (hasEdits) setReloadConfirm(true); else reload() }} />}
      {message && <p role="status" className="text-sm text-jade">{message}</p>}
      <ConfirmDialog isOpen={reloadConfirm} title="Tải lại cấu hình?" description="Các thay đổi chưa lưu sẽ được thay bằng cấu hình hiện tại trên hệ thống." confirmLabel="Bỏ thay đổi và tải lại" cancelLabel="Tiếp tục sửa" onConfirm={reload} onCancel={() => setReloadConfirm(false)} />
    </section>
  )
}
