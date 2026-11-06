import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import adminUserService from '../../services/adminUserService.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'

const DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Ho_Chi_Minh',
})

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date)
}

export default function CustomerOrderHistory({ customerId }) {
  const [orders, setOrders] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadOrders() {
      setLoading(true)
      setError('')
      try {
        const result = await adminUserService.getCustomerOrderHistory(customerId, { page, size: 5 })
        if (!active) return
        setOrders(result?.content || [])
        setTotalPages(result?.totalPages || 1)
        setTotalElements(result?.totalElements || 0)
      } catch (requestError) {
        if (!active) return
        setError(requestError.message || 'Không thể tải lịch sử đơn hàng.')
        setOrders([])
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOrders()

    return () => {
      active = false
    }
  }, [customerId, page])

  const viewOrder = (orderCode) => {
    navigateTo(`${CUSTOMER_ROUTES.adminOrders}?search=${encodeURIComponent(orderCode)}`)
  }

  return (
    <section className="mt-6 border-t border-border pt-5" aria-labelledby="customer-order-history-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 id="customer-order-history-title" className="text-xs font-bold uppercase tracking-wider text-secondary">Lịch sử đơn hàng</h3>
          <p className="mt-1 text-xs text-muted">{totalElements} đơn hàng của khách hàng</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border bg-surface-secondary p-4 text-center text-xs text-muted" role="status">Đang tải đơn hàng…</div>
      ) : error ? (
        <div className="rounded-lg border border-danger-border bg-danger-soft p-4 text-xs text-danger" role="alert">{error}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface-secondary p-4 text-center text-xs text-muted">Khách hàng chưa có đơn hàng.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-surface-secondary uppercase tracking-wide text-secondary">
              <tr>
                <th className="px-3 py-2.5">Mã đơn</th>
                <th className="px-3 py-2.5">Ngày tạo</th>
                <th className="px-3 py-2.5">Trạng thái</th>
                <th className="px-3 py-2.5 text-right">Thành tiền</th>
                <th className="px-3 py-2.5 text-right">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2.5 font-semibold text-ink">{order.orderCode}</td>
                  <td className="px-3 py-2.5 text-secondary">{formatDate(order.createdAt)}</td>
                  <td className="px-3 py-2.5 text-secondary">{order.statusLabel || order.status}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">{order.finalAmountDisplay}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => viewOrder(order.orderCode)}
                      className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-brand hover:bg-brand-soft"
                    >
                      Xem đơn <ExternalLink size={13} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2">
          <button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0} className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold text-ink hover:bg-surface-secondary disabled:opacity-40">
            <ChevronLeft size={13} aria-hidden="true" /> Trước
          </button>
          <span className="text-xs text-muted">{page + 1}/{totalPages}</span>
          <button type="button" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1} className="inline-flex h-8 items-center gap-1 rounded-md border border-border px-2 text-xs font-semibold text-ink hover:bg-surface-secondary disabled:opacity-40">
            Sau <ChevronRight size={13} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  )
}
