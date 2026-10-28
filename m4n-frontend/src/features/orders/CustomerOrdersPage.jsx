import { useEffect, useState, useRef } from 'react'
import Pagination from '../catalog/Pagination.jsx'
import ErrorState from '../../components/ui/ErrorState.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import CustomerOrderDetailDialog from './CustomerOrderDetailDialog.jsx'
import CustomerOrderCancelDialog from './CustomerOrderCancelDialog.jsx'
import { formatDate, getStatusBadge } from './orderPresentation.js'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import useToast from '../../components/ui/useToast.js'
import orderService from '../../services/orderService.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import {
  ArrowRight,
  ChevronRight,
  Package,
} from 'lucide-react'

const ORDERS_PER_PAGE = 10

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả đơn' },
  { id: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'OUT_OF_STOCK_WAITING', label: 'Chờ xử lý tồn kho' },
  { id: 'SHIPPING', label: 'Đang giao' },
  { id: 'DELIVERED', label: 'Đã giao' },
  { id: 'COMPLETED', label: 'Đã hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
]

function CustomerOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [reloadSequence, setReloadSequence] = useState(0)
  const [activeFilter, setActiveFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  // Detail Modal state
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Cancel Modal state
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [receiveModalOrder, setReceiveModalOrder] = useState(null)
  const [receivingOrderId, setReceivingOrderId] = useState(null)
  const detailSequence = useRef(0)
  const ordersSummaryRef = useRef(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setLoadError(null)
        const data = await orderService.getMyOrders({ page: currentPage - 1, size: ORDERS_PER_PAGE, status: activeFilter })
        if (active) {
          if (!Array.isArray(data?.content)) throw new Error('Không thể đọc danh sách đơn hàng. Vui lòng thử lại.')
          const lastPage = Math.max(1, data.totalPages)
          if (currentPage > lastPage) {
            setCurrentPage(lastPage)
            return
          }
          setOrders(data.content)
          setTotalPages(data.totalPages)
          setTotalOrders(data.totalElements)
        }
      } catch (err) {
        if (active) {
          setLoadError(err.message || 'Không thể tải danh sách đơn hàng.')
          addToast({
            message: err.message || 'Không thể tải danh sách đơn hàng',
            type: 'error',
          })
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [addToast, reloadSequence, currentPage, activeFilter])

  const handlePageChange = (page) => {
    if (loading || page === currentPage || page < 1 || page > totalPages) return
    setLoading(true)
    setCurrentPage(page)
    ordersSummaryRef.current?.focus({ preventScroll: true })
    ordersSummaryRef.current?.scrollIntoView({ block: 'start' })
  }

  const handleOpenDetail = async (orderId) => {
    const requestId = ++detailSequence.current
    setSelectedOrderId(orderId)
    setOrderDetail(null)
    setDetailLoading(true)
    try {
      const data = await orderService.getOrderDetail(orderId)
      if (requestId === detailSequence.current) setOrderDetail(data)
    } catch (err) {
      if (requestId !== detailSequence.current) return
      addToast({
        message: err.message || 'Không thể tải chi tiết đơn hàng',
        type: 'error',
      })
      setSelectedOrderId(null)
    } finally {
      if (requestId === detailSequence.current) setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    detailSequence.current += 1
    setSelectedOrderId(null)
    setOrderDetail(null)
  }

  const handleOpenCancel = (order, event) => {
    event?.stopPropagation()
    if (order.status !== 'PENDING_CONFIRMATION') return
    setCancelModalOrder(order)
  }

  const handleCancelled = (fresh) => {
    setOrders((current) => current.map((order) => order.id === fresh.id ? { ...order, ...fresh } : order))
    setOrderDetail((current) => current?.id === fresh.id ? fresh : current)
    addToast({ message: `Đã hủy đơn hàng ${fresh.orderCode} thành công`, type: 'success' })
    setCancelModalOrder(null)
    setReloadSequence((current) => current + 1)
  }

  const handleOpenReceiveConfirmation = (order, event) => {
    if (event) event.stopPropagation()
    if (order.status !== 'DELIVERED' || receivingOrderId) return
    setReceiveModalOrder(order)
  }

  const handleConfirmReceived = async () => {
    const order = receiveModalOrder
    if (!order || receivingOrderId) return

    try {
      setReceivingOrderId(order.id)
      const fresh = await orderService.confirmReceived(order.id)
      setOrders((current) => current.map((item) => item.id === fresh.id ? { ...item, ...fresh } : item))
      addToast({
        message: `Cảm ơn bạn đã xác nhận nhận đơn ${order.orderCode}.`,
        type: 'success',
      })
      setOrderDetail((current) => current?.id === order.id ? fresh : current)
      setReceiveModalOrder(null)
      setReloadSequence((current) => current + 1)
    } catch (err) {
      addToast({
        message: err.message || 'Không thể xác nhận đã nhận hàng',
        type: 'error',
      })
    } finally {
      setReceivingOrderId(null)
    }
  }

  return (
    <AccountLayout activeTab="orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
                Đơn hàng của tôi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-soft text-brand border border-brand-border">
                {totalOrders} đơn
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted mt-1">
              Theo dõi tiến độ chế tác thủ công, xác nhận tồn kho và quy trình giao nhận nhạc cụ.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
            className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:underline cursor-pointer"
          >
            <span>Khám phá nhạc cụ mới</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = activeFilter === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  if (activeFilter === tab.id) return
                  setLoading(true)
                  setActiveFilter(tab.id)
                  setCurrentPage(1)
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none flex items-center gap-2 ${
                  isActive
                    ? 'bg-brand text-white shadow-sm shadow-brand/20'
                    : 'bg-white text-muted hover:text-ink hover:bg-surface-secondary border border-border/80'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {totalOrders > 0 && !loadError && (
          <p ref={ordersSummaryRef} tabIndex={-1} role="status"
            className="scroll-mt-28 text-sm text-muted tabular-nums">
            {loading ? 'Đang tải danh sách đơn hàng…'
              : `Hiển thị ${(currentPage - 1) * ORDERS_PER_PAGE + 1}–${Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)} trong ${totalOrders} đơn hàng · ${ORDERS_PER_PAGE} đơn/trang`}
          </p>
        )}

        {/* Content */}
        <section aria-label="Danh sách đơn hàng" aria-busy={loading}>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-32 rounded-2xl bg-white border border-border/70 p-6 animate-pulse motion-reduce:animate-none space-y-3"
                >
                  <div className="h-4 w-40 bg-surface-secondary rounded" />
                  <div className="h-4 w-60 bg-surface-secondary rounded" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <ErrorState message={loadError} onRetry={() => setReloadSequence((current) => current + 1)} />
          ) : orders.length === 0 ? (
            <div className="rounded-3xl bg-white border border-border/80 p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-surface-secondary text-subtle flex items-center justify-center mx-auto">
                <Package size={26} />
              </div>
              <h3 className="text-lg font-bold text-ink">
                {activeFilter === 'ALL'
                  ? 'Quý khách chưa có đơn hàng nào'
                  : 'Không có đơn hàng nào trong mục này'}
              </h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                Các tác phẩm nhạc cụ sau khi quý khách đặt mua sẽ hiển thị trạng thái và lộ trình giao nhận tại đây.
              </p>
              <button
                type="button"
                onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand/20 transition-all cursor-pointer"
              >
                <span>Xem danh mục nhạc cụ</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const badge = getStatusBadge(order.status)
                const isPending = order.status === 'PENDING_CONFIRMATION'
                const canConfirmReceived = order.status === 'DELIVERED'

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl bg-white border border-border/80 p-5 sm:p-6 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/50">
                      <div className="flex min-w-0 flex-wrap items-center gap-3">
                        <span className="break-all font-mono text-sm font-bold text-ink">
                          {order.orderCode}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-xs text-muted">
                        <p>
                          Người nhận: <strong className="text-ink">{order.customerName}</strong> ({order.customerPhone})
                        </p>
                        <p className="line-clamp-1">
                          Địa chỉ: {order.shippingAddress}
                        </p>
                        <p>
                          Hình thức: <span className="font-medium text-ink">{order.paymentMethod}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        <div className="text-right">
                          <span className="text-xs text-muted block">Tổng thanh toán</span>
                          <span className="text-base font-bold text-brand font-sans">
                            {order.finalAmountDisplay}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isPending && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenCancel(order, e)}
                              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-surface-secondary text-xs font-bold transition-all cursor-pointer"
                            >
                              Hủy đơn
                            </button>
                          )}

                          {canConfirmReceived && (
                            <button
                              type="button"
                              disabled={receivingOrderId === order.id}
                              onClick={(event) => handleOpenReceiveConfirmation(order, event)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {receivingOrderId === order.id ? 'Đang xác nhận…' : 'Đã nhận được hàng'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order.id)}
                            className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-border/60 text-ink text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>Chi tiết</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

            </div>
          )}
        </section>
        {totalOrders > 0 && !loadError && (
          <div className="border-t border-border pt-4">
            <p className="text-center text-sm text-muted tabular-nums">
              Trang {currentPage} / {Math.max(1, totalPages)}
            </p>
            <Pagination className="pt-3! pb-0!" currentPage={currentPage}
              totalPages={Math.max(1, totalPages)} showSinglePage disabled={loading}
              onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      <CustomerOrderDetailDialog
        isOpen={Boolean(selectedOrderId)}
        order={orderDetail}
        loading={detailLoading}
        onClose={handleCloseDetail}
        onCancel={handleOpenCancel}
        onReceive={handleOpenReceiveConfirmation}
        receivingOrderId={receivingOrderId}
      />
      <ConfirmDialog
        isOpen={Boolean(receiveModalOrder)}
        title="Xác nhận đã nhận được hàng?"
        description={receiveModalOrder ? `Chỉ xác nhận khi bạn đã nhận và kiểm tra đủ sản phẩm trong đơn ${receiveModalOrder.orderCode}. Sau bước này đơn hàng hoàn tất và có thể được đánh giá.` : ''}
        confirmLabel="Tôi đã nhận đủ hàng"
        cancelLabel="Để tôi kiểm tra lại"
        variant="primary"
        isLoading={Boolean(receivingOrderId)}
        onConfirm={handleConfirmReceived}
        onCancel={() => setReceiveModalOrder(null)}
      />
      {cancelModalOrder && (
        <CustomerOrderCancelDialog
          order={cancelModalOrder}
          onClose={() => setCancelModalOrder(null)}
          onCancelled={handleCancelled}
        />
      )}
    </AccountLayout>
  )
}

export default CustomerOrdersPage



