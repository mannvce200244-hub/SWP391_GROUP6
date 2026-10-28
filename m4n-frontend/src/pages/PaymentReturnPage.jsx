import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, CircleAlert, Clock3, RotateCw } from 'lucide-react'
import paymentService, { paymentReturnOrderId } from '../services/paymentService.js'
import orderService from '../services/orderService.js'
import { getPaymentPresentation } from '../features/checkout/paymentPresentation.js'
import Button from '../components/ui/Button.jsx'
import LoadingState from '../components/ui/LoadingState.jsx'
import ErrorState from '../components/ui/ErrorState.jsx'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import { formatCurrencyVND } from '../utils/currency.js'

const STATUS_ICONS = { success: Check, pending: Clock3, warning: CircleAlert }
const STATUS_COLORS = { success: 'text-emerald-700', pending: 'text-brand', warning: 'text-danger' }

export default function PaymentReturnPage() {
  const [orderId] = useState(() => paymentReturnOrderId(window.location.search))
  const [status, setStatus] = useState(null)
  const [order, setOrder] = useState(null)
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
    Promise.all([paymentService.getReturnStatus(orderId), orderService.getOrderDetail(orderId)])
      .then(([payment, detail]) => {
        if (active) { setStatus(payment); setOrder(detail); setError(''); setActionError('') }
      })
      .catch((err) => { if (active) setError(err.message || 'Không thể kiểm tra thanh toán. Vui lòng thử lại.') })
      .finally(() => { if (active) { setLoading(false); setBusy('') } })
    return () => { active = false }
  }, [orderId, retry, validId])

  async function handleAction(action) {
    if (pending.current || busy) return
    pending.current = true
    setBusy(action)
    setActionError('')
    try {
      if (action === 'pay') {
        const url = await paymentService.start(orderId, status.paymentMethod)
        window.location.assign(url)
      } else {
        setStatus(await paymentService.reconcile(orderId))
      }
    } catch (err) {
      setActionError(err.message || 'Chưa xác minh được giao dịch. Vui lòng kiểm tra lại trước khi thanh toán tiếp.')
    } finally {
      pending.current = false
      setBusy('')
    }
  }

  function handleRefresh() {
    if (busy || pending.current) return
    setBusy('refresh')
    setRetry((value) => value + 1)
  }

  const presentation = status ? getPaymentPresentation(status, order) : null
  const StatusIcon = presentation ? STATUS_ICONS[presentation.tone] : Clock3
  const onlinePending = status?.status === 'PENDING' && ['MOMO', 'VNPAY'].includes(status.paymentMethod)
  const canPay = status?.canPay && !actionError && !error && !status.isPaid
  const needsRefresh = status && (presentation?.tone !== 'success' || error || actionError)
  const paymentMethod = status?.paymentMethod === 'MOMO' ? 'Thẻ quốc tế qua MoMo' : status?.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng' : 'VNPay'

  return (
    <section aria-label="Kết quả thanh toán" className="mx-auto max-w-[680px] px-4 py-10 sm:px-6 sm:py-16">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {!validId ? <ErrorState title="Không tìm thấy đơn hàng" message="Liên kết thiếu mã đơn hàng hợp lệ. Vui lòng kiểm tra trong Đơn hàng của tôi." />
          : loading ? <div className="min-h-96 flex items-center justify-center"><LoadingState message="Đang kiểm tra thanh toán…" /></div>
            : !status ? <ErrorState title="Chưa thể kiểm tra thanh toán" message={error || 'Vui lòng thử lại sau ít phút.'} onRetry={handleRefresh} />
              : <>
                <div className="px-6 pt-8 pb-7 text-center sm:px-10 sm:pt-10" role="status" aria-live="polite">
                  <div className={`mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-border bg-surface-secondary ${STATUS_COLORS[presentation.tone]}`}>
                    <StatusIcon size={30} strokeWidth={1.7} aria-hidden="true" />
                  </div>
                  <h1 className="text-2xl text-ink sm:text-3xl leading-tight">{presentation.title}</h1>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">{presentation.description}</p>
                </div>
                <div className="mx-6 border-y border-border py-6 sm:mx-10">
                  <p className="text-center text-xs text-muted">{status.refundStatus === 'SUCCEEDED' ? 'Số tiền đã hoàn' : 'Tổng thanh toán'}</p>
                  <p className="mt-2 text-center text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">{formatCurrencyVND(order.finalAmount)}</p>
                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                      <dt className="shrink-0 text-muted">Mã đơn hàng</dt>
                      <dd className="max-w-[28ch] font-mono text-xs leading-relaxed text-ink break-all sm:max-w-none sm:text-right">{order.orderCode}</dd>
                    </div>
                    <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-6">
                      <dt className="shrink-0 text-muted">Phương thức</dt>
                      <dd className="font-medium text-ink sm:text-right">{paymentMethod}</dd>
                    </div>
                  </dl>
                </div>
                <div className="space-y-4 px-6 py-6 sm:px-10">
                  {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                  {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
                  {(canPay || onlinePending || needsRefresh) && <div className="flex flex-wrap justify-center gap-3">
                    {canPay && <Button loading={busy === 'pay'} disabled={Boolean(busy)} onClick={() => handleAction('pay')}>Thanh toán qua {status.paymentMethod === 'MOMO' ? 'MoMo' : 'VNPay'}</Button>}
                    {onlinePending && <Button variant="secondary" loading={busy === 'reconcile'} disabled={Boolean(busy)} onClick={() => handleAction('reconcile')}>Kiểm tra giao dịch</Button>}
                    {needsRefresh && !onlinePending && <Button variant="secondary" loading={busy === 'refresh'} disabled={Boolean(busy)} onClick={handleRefresh}><RotateCw size={16} aria-hidden="true" />Kiểm tra lại</Button>}
                  </div>}
                  <RouterLink href={CUSTOMER_ROUTES.orders} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                    Xem đơn hàng của tôi <ArrowRight size={16} aria-hidden="true" />
                  </RouterLink>
                  <RouterLink href={CUSTOMER_ROUTES.products} className="flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-muted transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">Tiếp tục mua sắm</RouterLink>
                </div>
              </>}
      </div>
      {(!validId || (!loading && !status)) && <RouterLink href={CUSTOMER_ROUTES.orders} className="mt-5 flex min-h-11 items-center justify-center text-sm font-semibold text-brand underline">Về Đơn hàng của tôi</RouterLink>}
    </section>
  )
}
