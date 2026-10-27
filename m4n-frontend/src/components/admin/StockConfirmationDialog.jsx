import { useRef, useState } from 'react'
import { X } from 'lucide-react'
import { confirmStockDocument } from '../../services/inventoryService.js'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import Button from '../ui/Button.jsx'
import Input from '../ui/Input.jsx'

export default function StockConfirmationDialog({ document, onClose, onConfirmed, onStale }) {
  const [rejected, setRejected] = useState('0')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const errorRef = useRef(null)
  const dialogRef = useDialogFocus(true, onClose, busy)
  const isReceipt = document.type === 'RECEIPT'
  const rejectedCount = Number(rejected)
  const validCount = rejected.trim() && Number.isInteger(rejectedCount) && rejectedCount >= 0 && rejectedCount <= document.quantity

  async function submit(event) {
    event.preventDefault()
    if (busy) return
    const nextErrors = {}
    if (isReceipt && !validCount) nextErrors.rejectedQuantity = `Số lượng bị loại phải là số nguyên từ 0 đến ${document.quantity}.`
    if (isReceipt && rejectedCount > 0 && !reason.trim()) nextErrors.rejectionReason = 'Vui lòng nhập lý do loại hàng.'
    if (reason.trim().length > 500) nextErrors.rejectionReason = 'Lý do không quá 500 ký tự.'
    setErrors(nextErrors)
    setError('')
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => dialogRef.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setBusy(true)
    try {
      const confirmed = await confirmStockDocument(document.id, isReceipt
        ? { rejectedQuantity: rejectedCount, rejectionReason: rejectedCount > 0 ? reason.trim() : '' }
        : {})
      onConfirmed(confirmed)
    } catch (failure) {
      setErrors(failure.fieldErrors || {})
      setError(failure.message || 'Không thể xác nhận phiếu. Vui lòng thử lại.')
      if (failure.status === 409) onStale()
      requestAnimationFrame(() => errorRef.current?.focus())
    } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <form onSubmit={submit} noValidate role="dialog" aria-modal="true" aria-labelledby="stock-confirm-title" tabIndex={-1} ref={dialogRef}
        className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-xl border border-border bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 id="stock-confirm-title" className="text-lg font-semibold text-ink">Xác nhận phiếu {isReceipt ? 'nhập' : 'xuất'} #{document.id}</h3>
          <Button variant="ghost" size="sm" disabled={busy} onClick={onClose} aria-label="Đóng hộp thoại xác nhận phiếu"><X size={18} aria-hidden="true" /></Button>
        </div>
        <p className="text-sm break-words"><strong>{document.productName}</strong> · <span translate="no">{document.productCode}</span></p>
        <p className="text-sm tabular-nums">Số lượng trên phiếu: <strong>{document.quantity.toLocaleString('vi-VN')}</strong></p>
        <p className="text-sm text-muted break-words">Lý do: {document.reason}</p>
        {error && <p role="alert" ref={errorRef} tabIndex={-1} className="text-sm text-danger focus-visible:outline focus-visible:outline-danger">{error}</p>}
        {isReceipt ? <>
          <Input id="stock-rejected-quantity" name="rejectedQuantity" label="Số lượng không đạt chất lượng" required type="number"
            autoComplete="off" inputMode="numeric" min={0} max={document.quantity} step={1} value={rejected} onChange={(event) => setRejected(event.target.value)}
            error={errors.rejectedQuantity} disabled={busy} data-dialog-initial-focus />
          <Input id="stock-rejection-reason" name="rejectionReason" label={rejectedCount > 0 ? 'Lý do loại hàng' : 'Lý do loại hàng (tùy chọn)'}
            required={rejectedCount > 0} autoComplete="off" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} error={errors.rejectionReason} disabled={busy} />
          <p className="rounded-lg bg-[#F6F7F8] p-3 text-sm tabular-nums" role="status">
            Nhập vào tồn kho bán được: <strong>{validCount ? (document.quantity - rejectedCount).toLocaleString('vi-VN') : '—'}</strong>.
            {' '}Hàng bị loại không được cộng vào tồn kho.
          </p>
        </> : <p className="rounded-lg bg-[#F6F7F8] p-3 text-sm">Xác nhận sẽ trừ toàn bộ {document.quantity.toLocaleString('vi-VN')} sản phẩm. Hệ thống kiểm tra lại tồn kho hiện tại trước khi xuất.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" disabled={busy} onClick={onClose} data-dialog-initial-focus={!isReceipt || undefined}>Đóng</Button>
          <Button type="submit" loading={busy} loadingLabel="Đang xác nhận…">Xác nhận phiếu</Button>
        </div>
      </form>
    </div>
  )
}
