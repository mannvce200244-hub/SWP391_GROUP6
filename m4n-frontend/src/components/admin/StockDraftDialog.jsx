import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { importStock, issueStock } from '../../services/inventoryService.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

export default function StockDraftDialog({ product, type, onClose, onCreated }) {
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const errorRef = useRef(null)
  const dialogRef = useDialogFocus(true, onClose, busy)
  const isReceipt = type === 'RECEIPT'
  const action = isReceipt ? 'nhập' : 'xuất'

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const count = Number(quantity)
    const nextErrors = {}
    if (!quantity.trim() || !Number.isInteger(count) || count < 1 || count > 2147483647) {
      nextErrors.quantity = 'Số lượng phải là số nguyên từ 1 đến 2.147.483.647.'
    }
    if (!isReceipt && !reason.trim()) nextErrors.reason = 'Vui lòng nhập lý do xuất kho.'
    if (reason.trim().length > 500) nextErrors.reason = 'Lý do không quá 500 ký tự.'
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => dialogRef.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      const draft = isReceipt
        ? await importStock(product.productId, { quantity: count, notes: reason.trim() })
        : await issueStock(product.productId, { quantity: count, reason: reason.trim() })
      onCreated(draft)
    } catch (failure) {
      setErrors({ quantity: failure.fieldErrors?.quantity, reason: failure.fieldErrors?.reason || failure.fieldErrors?.notes })
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
          <h3 id="stock-draft-title" className="text-lg font-semibold text-ink">Tạo phiếu {action} kho</h3>
          <Button variant="ghost" size="sm" disabled={busy} onClick={onClose} aria-label="Đóng hộp thoại tạo phiếu kho"><X size={18} aria-hidden="true" /></Button>
        </div>
        <p className="text-sm break-words"><strong>{product.productName}</strong> · <span translate="no">{product.productCode}</span></p>
        <p id="stock-draft-description" className="text-sm text-muted">Phiếu được lưu ở trạng thái chờ xác nhận. Tồn kho chỉ thay đổi khi xác nhận phiếu.</p>
        {error && <p role="alert" ref={errorRef} tabIndex={-1} className="text-sm text-danger focus-visible:outline focus-visible:outline-danger">{error}</p>}
        <Input id="stock-draft-quantity" name="quantity" label={`Số lượng ${action}`} required type="number" inputMode="numeric"
          autoComplete="off" min={1} max={2147483647} step={1} value={quantity} onChange={(event) => setQuantity(event.target.value)}
          error={errors.quantity} disabled={busy} data-dialog-initial-focus />
        <Input id="stock-draft-reason" name="reason" label={isReceipt ? 'Ghi chú (tùy chọn)' : 'Lý do xuất kho'} required={!isReceipt}
          autoComplete="off" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} error={errors.reason} disabled={busy} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" disabled={busy} onClick={onClose}>Đóng</Button>
          <Button type="submit" loading={busy} loadingLabel="Đang tạo phiếu…">Tạo phiếu {action}</Button>
        </div>
      </form>
    </div>
  )
}
