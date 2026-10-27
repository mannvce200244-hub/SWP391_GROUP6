import { useEffect, useRef, useState } from 'react'
import paymentService from '../services/paymentService.js'
import Button from '../components/ui/Button.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'

const PAYMENT_LABELS = { NONE: 'Chưa bắt đầu', PENDING: 'Chờ xác minh', SUCCEEDED: 'Đã thanh toán', FAILED: 'Thanh toán chưa thành công' }
const REFUND_LABELS = { NONE: 'Chưa hoàn tiền', PENDING: 'Đang xác minh hoàn tiền', SUCCEEDED: 'Đã hoàn tiền', FAILED: 'Hoàn tiền chưa thành công' }

export default function PaymentReturnPage() {
  const [orderId] = useState(() => new URLSearchParams(window.location.search).get('orderId'))
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [retry, setRetry] = useState(0)
  const pending = useRef(false)
  const validId = /^[1-9]\d*$/.test(orderId || '')

  useEffect(() => {
    let active = true
    if (!validId) return
    paymentService.getStatus(orderId)
      .then((result) => { if (active) { setStatus(result); setError('') } })
      .catch((err) => { if (active) setError(err.message || 'Không thể kiểm tra thanh toán.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [orderId, retry, validId])

  async function handleAction(action) {
    if (pending.current) return
    pending.current = true
    setBusy(action)
    setActionError('')
    try {
      if (action === 'pay') {
        const url = await paymentService.start(orderId)
        window.location.assign(url)
      } else {
        setStatus(await paymentService.reconcile(orderId))
      }
    } catch (err) {
      setActionError(err.message || 'Chưa xác minh được giao dịch. Hãy kiểm tra lại trạng thái trước khi thanh toán tiếp.')
      setRetry((value) => value + 1)
    } finally {
      pending.current = false
      setBusy('')
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 sm:py-16 space-y-6">
      <h1 className="text-2xl font-bold text-ink">Kiểm tra thanh toán</h1>
      <p className="text-sm text-muted">Trạng thái được tải từ hệ thống. Thanh toán VNPay chỉ được ghi nhận sau khi backend xác minh kết quả; đơn vẫn cần nhân viên xác nhận tồn kho và xử lý.</p>
      {!validId ? <ErrorState message="Thiếu mã đơn hàng hợp lệ." />
        : loading ? <LoadingState message="Đang kiểm tra thanh toán…" />
          : (
            <div className="bg-white border border-border rounded-xl p-6 space-y-4">
              {status && <>
                <h2 className="font-semibold">Đơn hàng #{status.orderId}</h2>
                <dl className="text-sm space-y-2">
                  <div className="flex justify-between gap-4"><dt>Thanh toán</dt><dd className="font-semibold">{status.paymentMethod === 'COD' ? status.isPaid ? 'Đã thanh toán COD' : 'Thanh toán khi nhận hàng' : PAYMENT_LABELS[status.status] || 'Cần kiểm tra'}</dd></div>
                  {status.refundStatus !== 'NONE' && <div className="flex justify-between gap-4"><dt>Hoàn tiền</dt><dd>{REFUND_LABELS[status.refundStatus] || 'Cần kiểm tra'}</dd></div>}
                </dl>
                <p role="status" className="text-sm text-muted">{status.message}</p>
                {status.paymentExpiresAt && status.status === 'PENDING' && <p className="text-xs text-muted">Hạn phiên thanh toán: {new Date(status.paymentExpiresAt).toLocaleString('vi-VN')}</p>}
                <div className="flex flex-wrap gap-3">
                  {status.canPay && <Button loading={busy === 'pay'} disabled={Boolean(busy)} onClick={() => handleAction('pay')}>Thanh toán qua VNPay</Button>}
                  {status.paymentMethod === 'VNPAY' && status.status === 'PENDING' && <Button variant="secondary" loading={busy === 'reconcile'} disabled={Boolean(busy)} onClick={() => handleAction('reconcile')}>Xác minh với VNPay</Button>}
                  <Button variant="quiet" disabled={Boolean(busy)} onClick={() => { setLoading(true); setRetry((value) => value + 1) }}>Tải lại trạng thái</Button>
                </div>
              </>}
              {error && <ErrorState message={error} onRetry={() => { setLoading(true); setRetry((value) => value + 1) }} />}
              {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
            </div>
          )}
      <Button variant="secondary" disabled={Boolean(busy)} onClick={() => navigateTo(CUSTOMER_ROUTES.orders)}>Về Đơn hàng của tôi</Button>
    </section>
  )
}
