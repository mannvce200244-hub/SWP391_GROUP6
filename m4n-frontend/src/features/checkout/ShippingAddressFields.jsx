import { useEffect, useState } from 'react'
import shippingService from '../../services/shippingService.js'
import Input from '../../components/ui/Input.jsx'
import FormField from '../../components/ui/FormField.jsx'
import Button from '../../components/ui/Button.jsx'

export default function ShippingAddressFields({ value, onChange, disabled }) {
  const [provinces, setProvinces] = useState([])
  const [wards, setWards] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [retry, setRetry] = useState(0)
  const [loadedProvince, setLoadedProvince] = useState(null)

  useEffect(() => {
    let active = true
    shippingService.getProvinces().then((rows) => { if (active) setProvinces(rows) })
      .catch((failure) => { if (active) setError(failure.message || 'Không thể tải tỉnh/thành.') })
    return () => { active = false }
  }, [retry])

  useEffect(() => {
    let active = true
    if (!value.provinceId) return () => { active = false }
    const timer = setTimeout(() => {
      setLoading(true)
      setError('')
      shippingService.getWards(value.provinceId).then((rows) => {
        if (active) { setWards(rows); setLoadedProvince(value.provinceId) }
      }).catch((failure) => { if (active) setError(failure.message || 'Không thể tải phường/xã.') })
        .finally(() => { if (active) setLoading(false) })
    }, 0)
    return () => { active = false; clearTimeout(timer) }
  }, [value.provinceId, retry])

  const selectClass = 'w-full p-3 rounded-lg text-sm bg-white text-ink border border-control-border focus-visible:outline-2 focus-visible:outline-brand'
  return <section className="rounded-[28px] bg-white border border-border p-6 sm:p-7 space-y-4">
    <h2 className="text-base font-bold text-ink">Địa chỉ giao hàng</h2>
    <p className="text-sm text-muted">Chọn tỉnh/thành và phường/xã theo địa chỉ hành chính hiện hành để tính phí GHN.</p>
    {error && <div role="alert" className="text-sm text-danger">{error}
      <Button type="button" variant="secondary" disabled={disabled} onClick={() => setRetry((count) => count + 1)}>Tải lại địa chỉ</Button>
    </div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField id="shipping-province" label="Tỉnh / Thành phố" required>
        <select id="shipping-province" name="provinceId" value={value.provinceId || ''} className={selectClass}
          disabled={disabled || provinces.length === 0} required onChange={(event) => {
            setWards([])
            setLoadedProvince(null)
            setLoading(false)
            setError('')
            onChange({ provinceId: Number(event.target.value) || null, wardId: null, streetAddress: value.streetAddress })
          }}>
          <option value="">Chọn tỉnh / thành phố</option>
          {provinces.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </FormField>
      <FormField id="shipping-ward" label="Phường / Xã" required>
        <select id="shipping-ward" name="wardId" value={value.wardId || ''} className={selectClass} required
          disabled={disabled || loading || loadedProvince !== value.provinceId || !value.provinceId}
          onChange={(event) => onChange({ ...value, wardId: Number(event.target.value) || null })}>
          <option value="">{loading ? 'Đang tải…' : 'Chọn phường / xã'}</option>
          {(loadedProvince === value.provinceId ? wards : []).map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
        </select>
      </FormField>
    </div>
    <Input id="shipping-street" name="streetAddress" label="Số nhà, tên đường, địa chỉ chi tiết"
      autoComplete="street-address" maxLength={200} required disabled={disabled} value={value.streetAddress}
      onChange={(event) => onChange({ ...value, streetAddress: event.target.value })} />
    {(!value.wardId || !value.streetAddress.trim()) && <p role="status" className="text-sm text-muted">Hoàn tất địa chỉ để xem tổng thanh toán.</p>}
  </section>
}
