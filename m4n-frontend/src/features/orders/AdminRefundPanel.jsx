import { useEffect, useRef, useState } from 'react'
import paymentService from '../../services/paymentService.js'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import { formatCurrencyVND } from '../../utils/currency.js'

export default function AdminRefundPanel({ order, onUpdated }) {
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState('')
  const [reason, setReason] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [retry, setRetry] = useState(0)
  const pending = useRef(false)

  useEffect(() => {
    let active = true
    paymentService.getStatus(order.id)
      .then((result) => { if (active) { setStatus(result); setError('') } })
      .catch((err) => { if (active) setError(err.message || 'Không thể tải trạng thái VNPay.') })
    return () => { active = false }
  }, [order.id, retry])

  async function handleAction(action) {
    if (pending.current) return
    pending.current = true
    setBusy(action)
    setActionError('')
    try {
      const result = action === 'refund'
        ? await paymentService.refund(order.id, reason.trim())
        : action === 'refundReconcile'
          ? await paymentService.reconcileRefund(order.id)
          : await paymentService.reconcile(order.id)
      setStatus(result)
      setConfirmOpen(false)
      if (result.refundStatus === 'SUCCEEDED' || result.status === 'SUCCEEDED') onUpdated?.(order.id)
    } catch (err) {
      setActionError(err.message || 'Chưa xác minh được giao dịch. Đối soát trước khi thử lại.')
      setConfirmOpen(false)
      setRetry((value) => value + 1)
    } finally {
      pending.current = false
      setBusy('')
    }
  }

  return (
    <section className="border border-border rounded-xl bg-white p-4 space-y-3">
      <h3 className="text-sm font-semibold">Giao dịch VNPay</h3>
      {!status && !error && <p className="text-xs text-muted" role="status">Đang kiểm tra giao dịch…</p>}
      {status && <>
        <p role="status" className="text-sm text-muted">{status.message}</p>
        {status.canRefund && <>
          <Input id={`refund-reason-${order.id}`} label="Lý do hoàn tiền" required maxLength={500} value={reason} disabled={Boolean(busy)} onChange={(event) => setReason(event.target.value)} />
          <p className="text-xs text-muted">Hoàn toàn bộ {formatCurrencyVND(order.finalAmount)}. Chỉ hủy đơn sau khi VNPay xác nhận hoàn tiền thành công.</p>
          <Button disabled={Boolean(busy) || !reason.trim()} onClick={() => setConfirmOpen(true)}>Hoàn tiền toàn phần</Button>
        </>}
        <div className="flex flex-wrap gap-2">
          {status.refundStatus === 'PENDING' && <Button variant="secondary" loading={busy === 'refundReconcile'} disabled={Boolean(busy)} onClick={() => handleAction('refundReconcile')}>Đối soát hoàn tiền</Button>}
          {status.status === 'PENDING' && <Button variant="secondary" loading={busy === 'paymentReconcile'} disabled={Boolean(busy)} onClick={() => handleAction('paymentReconcile')}>Đối soát thanh toán</Button>}
          <Button variant="quiet" disabled={Boolean(busy)} onClick={() => setRetry((value) => value + 1)}>Tải lại</Button>
        </div>
      </>}
      {error && <p role="alert" className="text-sm text-danger">{error} <button type="button" className="underline" disabled={Boolean(busy)} onClick={() => setRetry((value) => value + 1)}>Thử lại</button></p>}
      {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
      <ConfirmDialog isOpen={confirmOpen} title="Xác nhận hoàn tiền toàn phần" description={`Gửi yêu cầu hoàn ${formatCurrencyVND(order.finalAmount)} cho đơn ${order.orderCode}. Lý do: ${reason.trim()}`} confirmLabel="Gửi yêu cầu hoàn tiền" isLoading={busy === 'refund'} onConfirm={() => handleAction('refund')} onCancel={() => setConfirmOpen(false)} />
    </section>
  )
}
