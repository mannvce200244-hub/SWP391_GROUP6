import { useEffect, useEffectEvent, useRef, useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import LoadingState from '../../components/ui/LoadingState.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import useToast from '../../components/ui/useToast.js'
import posMomoService from '../../services/posMomoService.js'
import { getInvoice } from '../../services/posService.js'
import { formatCurrencyVND } from '../../utils/currency.js'

export default function PosMomoPaymentPanel({ id, onClose, onNewSale, onInvoice }) {
  const { addToast } = useToast()
  const [payment, setPayment] = useState(null)
  const [error, setError] = useState('')
  const [missing, setMissing] = useState(false)
  const [busy, setBusy] = useState(true)
  const [retry, setRetry] = useState(0)
  const [cancelOpen, setCancelOpen] = useState(false)
  const pending = useRef(false)
  const finished = payment?.invoiceId || payment?.status === 'FAILED' || payment?.refundStatus === 'SUCCEEDED'
  const failedWithoutCharge = payment?.status === 'FAILED' && payment.refundStatus === 'NONE' && !payment.invoiceId
  const leaveFailedPayment = useEffectEvent(() => {
    onClose()
    addToast({ message: 'Thanh toán MoMo không thành công. Bạn có thể thử lại hoặc chọn tiền mặt.', type: 'error' })
  })

  useEffect(() => {
    if (failedWithoutCharge && !busy) leaveFailedPayment()
  }, [failedWithoutCharge, busy])

  useEffect(() => {
    let active = true
    pending.current = true
    posMomoService.getStatus(id)
      .then(async (status) => {
        if (!active) return
        setPayment(status)
        if (!status.invoiceId && status.refundStatus !== 'SUCCEEDED' && status.status !== 'FAILED') {
          status = await posMomoService.reconcile(id)
          if (!active) return
          setPayment(status)
          setError('')
        }
        if (status.invoiceId) {
          const invoice = await getInvoice(status.invoiceId)
          if (active) onInvoice(invoice)
        }
      })
      .catch((err) => { if (active) { setError(err.message); setMissing(err.status === 404 || err.status === 403) } })
      .finally(() => { if (active) { pending.current = false; setBusy(false) } })
    return () => { active = false }
  }, [id, retry, onInvoice])

  // IPN may arrive after the initial check, including a cancellation at MoMo.
  useEffect(() => {
    if (finished || missing) return undefined
    let active = true
    let timer
    async function refresh() {
      if (!active) return
      if (!pending.current) {
        pending.current = true
        try {
          const status = await posMomoService.getStatus(id)
          if (!active) return
          setPayment(status)
          setError('')
          if (status.invoiceId) {
            const invoice = await getInvoice(status.invoiceId)
            if (active) onInvoice(invoice)
          }
        } catch (err) {
          if (active) { setError(err.message || 'Chưa cập nhật được giao dịch. Vui lòng kiểm tra lại.'); setMissing(err.status === 404 || err.status === 403) }
        } finally { pending.current = false }
      }
      if (active) timer = setTimeout(refresh, 5000)
    }
    timer = setTimeout(refresh, 5000)
    return () => { active = false; clearTimeout(timer) }
  }, [id, finished, missing, onInvoice])

  async function check() {
    if (pending.current || busy) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const result = await posMomoService.reconcile(id)
      setPayment(result)
      if (result.invoiceId) onInvoice(await getInvoice(result.invoiceId))
    } catch (err) { setError(err.message || 'Chưa xác minh được MoMo. Vui lòng kiểm tra lại.') }
    finally { pending.current = false; setBusy(false) }
  }

  async function cancelBill() {
    if (pending.current || busy) return
    pending.current = true
    setBusy(true)
    setError('')
    try {
      const result = await posMomoService.cancel(id)
      setPayment(result)
      if (result.cancelRequested && !result.invoiceId) onNewSale()
      else setError('Chưa xác nhận hủy hóa đơn. Vui lòng kiểm tra lại giao dịch.')
    } catch (err) { setError(err.message || 'Chưa xác nhận được yêu cầu hủy. Vui lòng kiểm tra lại trạng thái.') }
    finally { pending.current = false; setBusy(false); setCancelOpen(false) }
  }

  if (failedWithoutCharge) return null

  return (
    <section aria-label="Giao dịch MoMo POS" className="space-y-4 rounded-xl border border-border bg-white p-5" aria-busy={busy}>
      <div>
        <h2 className="text-lg font-semibold text-ink">Thanh toán MoMo tại quầy</h2>
        <p className="mt-1 break-all font-mono text-xs text-muted">{id}</p>
      </div>
      {payment && <>
        <p className="text-2xl font-semibold text-ink tabular-nums">{formatCurrencyVND(payment.amount)}</p>
        <p role="status" className="text-sm leading-relaxed text-secondary">{payment.message}</p>
      </>}
      {busy && <LoadingState message="Đang kiểm tra giao dịch…" />}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        {payment?.paymentUrl && !finished && !payment.cancelRequested && <Button disabled={busy} onClick={() => {
          try { posMomoService.open(payment) } catch (err) { setError(err.message) }
        }}>Mở cổng thẻ MoMo</Button>}
        {payment && !finished && <Button variant="secondary" disabled={busy} onClick={check}>
          {payment.refundStatus === 'FAILED' ? 'Thử lại hoàn tiền' : payment.refundStatus === 'PENDING' ? 'Kiểm tra hoàn tiền' : 'Kiểm tra giao dịch'}
        </Button>}
        {error && !missing && <Button variant="secondary" disabled={busy} onClick={() => { if (pending.current) return; setBusy(true); setError(''); setRetry((n) => n + 1) }}>Tải lại trạng thái</Button>}
        {(finished || missing) && !payment?.cancelRequested && <Button variant="secondary" disabled={busy} onClick={onClose}>{payment?.invoiceId ? 'Tạo hóa đơn mới' : 'Quay lại nhập hóa đơn'}</Button>}
        {(finished || payment?.cancelRequested) && !payment?.invoiceId && <Button disabled={busy} onClick={onNewSale}>Tạo hóa đơn mới</Button>}
        {payment && !finished && !payment.cancelRequested && <Button variant="danger" disabled={busy} onClick={() => setCancelOpen(true)}>Hủy hóa đơn</Button>}
      </div>
      {!finished && !missing && <p className="text-xs text-muted">Chỉ giao hàng khi hệ thống đã xuất hóa đơn. Không thu thêm tiền khi kết quả MoMo chưa rõ.</p>}
      <ConfirmDialog isOpen={cancelOpen} title="Hủy hóa đơn MoMo đang chờ?"
        description="Hóa đơn này sẽ không xuất và POS sẽ mở hóa đơn mới. Nếu MoMo đã thu tiền hoặc báo thu tiền sau đó, hệ thống sẽ yêu cầu hoàn tiền toàn phần. Bạn có thể kiểm tra kết quả tại mục Lịch sử giao dịch."
        confirmLabel="Hủy hóa đơn" cancelLabel="Tiếp tục kiểm tra" isLoading={busy}
        onConfirm={cancelBill} onCancel={() => setCancelOpen(false)} />
    </section>
  )
}
