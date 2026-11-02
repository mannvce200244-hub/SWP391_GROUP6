import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { importStock } from '../../services/inventoryService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

export default function StockDraftDialog({ product, onClose, onCreated }) {
  const [quantity, setQuantity] = useState('')
  const [unitCost, setUnitCost] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const errorRef = useRef(null)
  const dialogRef = useDialogFocus(true, onClose, busy)
  const action = 'nhập'
  const count = Number(quantity)
  const cost = Number(unitCost)
  const validQuantity = quantity.trim() !== '' && Number.isInteger(count) && count > 0 && count <= 2147483647
  const validCost = unitCost.trim() !== '' && Number.isSafeInteger(cost) && cost >= 0 && cost <= 9999999999

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const nextErrors = {}
    if (!validQuantity) {
      nextErrors.quantity = 'Số lượng phải là số nguyên từ 1 đến 2.147.483.647.'
    }
    if (!validCost) {
      nextErrors.unitCost = 'Đơn giá nhập phải là số đồng nguyên từ 0 đến 9.999.999.999.'
    }
    if (reason.trim().length > 500) nextErrors.reason = 'Lý do không quá 500 ký tự.'
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => dialogRef.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      const draft = await importStock(product.productId, { quantity: count, unitCost: cost, notes: reason.trim() })
      onCreated(draft)
    } catch (failure) {
      setErrors({ ...failure.fieldErrors, reason: failure.fieldErrors?.notes })
      setError(failure.message || 'Không thể tạo phiếu kho. Vui lòng thử lại.')
      requestAnimationFrame(() => errorRef.current?.focus())
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="stock-draft-title"
        aria-describedby="stock-draft-description" tabIndex={-1} ref={dialogRef}
        className="w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-border bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 id="stock-draft-title" className="text-lg font-semibold text-ink">Nhập thêm hàng theo lô</h3>
          <Button variant="ghost" size="sm" disabled={busy} onClick={onClose} aria-label="Đóng hộp thoại tạo phiếu kho"><X size={18} aria-hidden="true" /></Button>
        </div>
        <p className="text-sm break-words"><strong>{product.productName}</strong> · <span translate="no">{product.productCode}</span></p>
        <p id="stock-draft-description" className="text-sm text-muted">Mỗi phiếu ghi nhận một lô của sản phẩm này. Sau kiểm nhận QC, chỉ hàng đạt chất lượng được cộng vào kho và tính tiền.</p>
        {error && <p role="alert" ref={errorRef} tabIndex={-1} className="text-sm text-danger focus-visible:outline focus-visible:outline-danger">{error}</p>}
        <Input id="stock-draft-quantity" name="quantity" label={`Số lượng ${action}`} required type="number" inputMode="numeric"
          autoComplete="off" min={1} max={2147483647} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)}
          error={errors.quantity} disabled={busy} data-dialog-initial-focus />
        <Input id="stock-draft-unit-cost" name="unitCost" label="Đơn giá nhập (đồng / sản phẩm)" required type="number" inputMode="numeric"
          autoComplete="off" min={0} max={9999999999} step={1} value={unitCost} onChange={(event) => setUnitCost(event.target.value)} error={errors.unitCost} disabled={busy} />
        <p className="rounded-lg bg-surface-secondary p-3 text-sm" aria-live="polite">Tiền lô dự kiến: <strong>{validQuantity && validCost ? formatCurrencyVND(BigInt(count) * BigInt(cost)) : '—'}</strong>. Tiền thực nhận được tính lại sau QC.</p>
        <Input id="stock-draft-reason" name="reason" label="Ghi chú lô hàng (tùy chọn)"
          autoComplete="off" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} error={errors.reason} disabled={busy} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" disabled={busy} onClick={onClose}>Đóng</Button>
          <Button type="submit" loading={busy} loadingLabel="Đang tạo phiếu…">Tạo phiếu {action}</Button>
        </div>
      </form>
    </div>
  )
}
