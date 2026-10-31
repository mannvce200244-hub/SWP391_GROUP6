import { useEffect, useRef, useState } from 'react'
import { CircleAlert } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import orderService from '../../services/orderService.js'
import paymentService from '../../services/paymentService.js'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'
import RouterLink from '../../routes/RouterLink.jsx'
import { getCustomerCancellation } from './orderPresentation.js'

export default function CustomerOrderCancelDialog({ order, onClose, onCancelled }) {
  const [detail, setDetail] = useState(null)
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [reason, setReason] = useState('')
  const [checking, setChecking] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [retry, setRetry] = useState(0)
  const submitting = useRef(false)
  const dialogRef = useDialogFocus(true, onClose, cancelling)
  const errorRef = useRef(null)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    let active = true
    Promise.all([orderService.getOrderDetail(order.id), paymentService.getStatus(order.id)]).then(([fresh, paymentStatus]) => {
      if (active) { setDetail(fresh); setPayment(paymentStatus) }
    }).catch((err) => {
      if (active) setError(err.message || 'Không thể kiểm tra điều kiện hủy. Vui lòng thử lại.')
    }).finally(() => {
      if (active) setChecking(false)
    })
    return () => { active = false }
  }, [order.id, retry])

  const cancellation = detail ? getCustomerCancellation(detail, payment) : null

  async function handleConfirm(event) {
    event.preventDefault()
    if (!cancellation?.canCancel || submitting.current) return
    submitting.current = true
    setCancelling(true)
    try {
      const fresh = await orderService.customerCancelOrder(order.id, reason.trim())
      if (fresh.status === 'CANCELLED') {
        onCancelled(fresh)
      } else {
        setDetail(fresh)
        setPayment(await paymentService.getStatus(order.id))
      }
    } catch (err) {
      // Re-read eligibility before offering another attempt; payment/status may have changed.
      setDetail(null)
      setError(err.message || 'Không thể hủy đơn hàng. Vui lòng kiểm tra lại trạng thái đơn.')
    } finally {
      submitting.current = false
      setCancelling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <form ref={dialogRef} onSubmit={handleConfirm} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" aria-describedby="cancel-order-description" className="w-full max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto overscroll-contain bg-white rounded-3xl shadow-2xl border border-border p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-surface-secondary text-rose-600 flex items-center justify-center">
          <CircleAlert size={24} aria-hidden="true" />
        </div>
        <div aria-live="polite">
          <h3 id="cancel-order-title" className="text-lg font-bold text-ink">
            {cancellation?.title || 'Kiểm tra điều kiện hủy đơn'}
          </h3>
          <p className="text-xs font-semibold text-ink mt-2 break-all">{order.orderCode}</p>
          <p id="cancel-order-description" className="text-sm text-muted mt-2 leading-relaxed">
            {checking ? 'Đang kiểm tra trạng thái đơn hàng và thanh toán…' : cancellation?.description || 'Cần kiểm tra trạng thái mới nhất trước khi hủy đơn.'}
          </p>
        </div>
        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="text-sm text-danger">{error}</p>}
        {cancellation?.canCancel && payment?.refundStatus !== 'PENDING' && (
          <div className="space-y-1.5">
            <label htmlFor="cancelReason" className="block text-sm font-bold text-ink">Lý do hủy (tùy chọn)</label>
            <textarea id="cancelReason" name="reason" maxLength={500} disabled={cancelling} rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ví dụ: Muốn chọn mẫu nhạc cụ khác…" className="w-full p-2.5 rounded-xl text-sm bg-surface-secondary border border-border focus-visible:outline-2 focus-visible:outline-brand resize-y" />
          </div>
        )}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button type="button" variant="quiet" onClick={onClose} disabled={cancelling} data-dialog-initial-focus>
            {cancellation?.canCancel && payment?.refundStatus !== 'PENDING' ? 'Giữ đơn hàng' : 'Đóng'}
          </Button>
          {error && <Button type="button" onClick={() => {
            dialogRef.current?.querySelector('[data-dialog-initial-focus]')?.focus()
            setError('')
            setChecking(true)
            setRetry((value) => value + 1)
          }}>Kiểm tra lại</Button>}
          {cancellation && !cancellation.canCancel && detail.status === 'PENDING_CONFIRMATION' && ['MOMO', 'VNPAY'].includes(detail.paymentMethod) && !detail.isPaid && (
            <RouterLink onClick={onClose} className="inline-flex items-center min-h-11 px-4 text-sm font-semibold text-brand underline rounded-lg focus-visible:outline-2 focus-visible:outline-brand" href={`${CUSTOMER_ROUTES.paymentReturn}?orderId=${encodeURIComponent(order.id)}`}>Kiểm tra thanh toán</RouterLink>
          )}
          {cancellation?.canCancel && <Button type="submit" variant="danger" loading={cancelling} loadingLabel={cancellation.processingLabel || 'Đang hủy…'}>{cancellation.confirmLabel || 'Xác nhận hủy đơn'}</Button>}
        </div>
      </form>
    </div>
  )
}
