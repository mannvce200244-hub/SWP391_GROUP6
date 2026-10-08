import { useEffect, useState, useMemo, useCallback } from 'react'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import useToast from '../../components/ui/useToast.js'
import orderService from '../../services/orderService.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import {
  IconArrowRight,
  IconChevronRight,
  IconClose,
  IconInstrument,
  IconPackage,
  IconAlertCircle,
} from '../../components/ui/Icons.jsx'

const STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả đơn' },
  { id: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'OUT_OF_STOCK_WAITING', label: 'Chờ xử lý tồn kho' },
  { id: 'COMPLETED', label: 'Đã hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
]

function getStatusBadge(status) {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return {
        label: 'Chờ xác nhận',
        className: 'text-amber-700 bg-amber-50 border-amber-200',
      }
    case 'CONFIRMED':
      return {
        label: 'Đã xác nhận',
        className: 'text-teal-700 bg-teal-50 border-teal-200',
      }
    case 'OUT_OF_STOCK_WAITING':
      return {
        label: 'Chờ xử lý tồn kho',
        className: 'text-orange-700 bg-orange-50 border-orange-200',
      }
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        className: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      }
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        className: 'text-rose-700 bg-rose-50 border-rose-200',
      }
    default:
      return {
        label: status || 'Chờ xử lý',
        className: 'text-slate-700 bg-slate-50 border-slate-200',
      }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

function CustomerOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('ALL')

  // Detail Modal state
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Cancel Modal state
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await orderService.getMyOrders()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      addToast({
        message: err.message || 'Không thể tải danh sách đơn hàng',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const data = await orderService.getMyOrders()
        if (active) {
          setOrders(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (active) {
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
  }, [addToast])

  const handleOpenDetail = async (orderId) => {
    setSelectedOrderId(orderId)
    setDetailLoading(true)
    try {
      const data = await orderService.getOrderDetail(orderId)
      setOrderDetail(data)
    } catch (err) {
      addToast({
        message: err.message || 'Không thể tải chi tiết đơn hàng',
        type: 'error',
      })
      setSelectedOrderId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCloseDetail = () => {
    setSelectedOrderId(null)
    setOrderDetail(null)
  }

  // Open self-cancel modal (Strictly for PENDING_CONFIRMATION)
  const handleOpenCancel = (order, e) => {
    if (e) e.stopPropagation()
    setCancelModalOrder(order)
    setCancelReason('')
  }

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return

    try {
      setCancelling(true)
      await orderService.customerCancelOrder(cancelModalOrder.id, cancelReason)
      addToast({
        message: `Đã hủy đơn hàng ${cancelModalOrder.orderCode} thành công`,
        type: 'success',
      })
      setCancelModalOrder(null)
      // Refresh list and detail
      await fetchOrders()
      if (selectedOrderId === cancelModalOrder.id) {
        const fresh = await orderService.getOrderDetail(cancelModalOrder.id)
        setOrderDetail(fresh)
      }
    } catch (err) {
      addToast({
        message: err.message || 'Không thể hủy đơn hàng',
        type: 'error',
      })
    } finally {
      setCancelling(false)
    }
  }

  const filteredOrders = useMemo(() => {
    if (activeFilter === 'ALL') return orders
    return orders.filter((o) => o.status === activeFilter)
  }, [orders, activeFilter])

  return (
    <AccountLayout activeTab="orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink font-sans">
                Đơn hàng của tôi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-soft text-brand border border-brand-border">
                {orders.length} đơn
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
            <IconArrowRight size={13} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => {
            const isActive = activeFilter === tab.id
            const count =
              tab.id === 'ALL'
                ? orders.length
                : orders.filter((o) => o.status === tab.id).length

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none flex items-center gap-2 ${
                  isActive
                    ? 'bg-brand text-white shadow-sm shadow-brand/20'
                    : 'bg-white text-muted hover:text-ink hover:bg-surface-secondary border border-border/80'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-secondary text-subtle'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-32 rounded-2xl bg-white border border-border/70 p-6 animate-pulse space-y-3"
              >
                <div className="h-4 w-40 bg-surface-secondary rounded" />
                <div className="h-4 w-60 bg-surface-secondary rounded" />
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl bg-white border border-border/80 p-12 text-center shadow-xs space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary text-subtle flex items-center justify-center mx-auto">
              <IconPackage size={26} />
            </div>
            <h3 className="text-lg font-black text-ink">
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
              <IconArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status)
              const isPending = order.status === 'PENDING_CONFIRMATION'

              return (
                <div
                  key={order.id}
                  onClick={() => handleOpenDetail(order.id)}
                  className="rounded-2xl bg-white border border-border/80 p-5 sm:p-6 shadow-xs hover:border-brand/40 hover:shadow-sm transition-all cursor-pointer space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-black text-ink">
                        {order.orderCode}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}
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
                        <span className="text-[11px] text-muted block">Tổng thanh toán</span>
                        <span className="text-base font-black text-brand font-sans">
                          {order.finalAmountDisplay}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenCancel(order, e)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                          >
                            Hủy đơn
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenDetail(order.id)}
                          className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-border/60 text-ink text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Chi tiết</span>
                          <IconChevronRight size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-surface-secondary/40">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-black text-ink font-mono">
                    {orderDetail?.orderCode || 'Chi tiết đơn hàng'}
                  </h3>
                  {orderDetail && (
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(orderDetail.status).className}`}>
                      {getStatusBadge(orderDetail.status).label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Ngày đặt: {formatDate(orderDetail?.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-9 h-9 rounded-xl text-muted hover:text-ink hover:bg-surface-secondary flex items-center justify-center cursor-pointer transition-all"
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {detailLoading ? (
                <div className="py-12 text-center text-muted">Đang tải chi tiết đơn hàng...</div>
              ) : orderDetail ? (
                <>
                  {/* Status Timeline */}
                  <div className="p-4 rounded-2xl bg-surface-secondary/50 border border-border/70 space-y-3">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                      Tiến độ đơn hàng
                    </h4>

                    {orderDetail.status === 'CANCELLED' ? (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                        Đơn hàng này đã bị hủy.
                      </div>
                    ) : orderDetail.status === 'OUT_OF_STOCK_WAITING' ? (
                      <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium">
                        Sản phẩm hiện đang tạm hết tồn kho sẵn sàng. Đơn hàng chuyển sang hàng đợi chế tác/nhập kho từ làng nghề.
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 text-center pt-2">
                        {/* Step 1 */}
                        <div className="space-y-1">
                          <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center mx-auto text-xs font-bold">
                            ✓
                          </div>
                          <span className="font-bold text-ink block text-[11px]">Đã đặt hàng</span>
                        </div>
                        {/* Step 2 */}
                        <div className="space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                            orderDetail.status === 'CONFIRMED' || orderDetail.status === 'COMPLETED'
                              ? 'bg-brand text-white'
                              : 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
                          }`}>
                            {orderDetail.status === 'CONFIRMED' || orderDetail.status === 'COMPLETED' ? '✓' : '2'}
                          </div>
                          <span className="font-bold text-ink block text-[11px]">Chờ xác nhận</span>
                        </div>
                        {/* Step 3 */}
                        <div className="space-y-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                            orderDetail.status === 'COMPLETED'
                              ? 'bg-emerald-600 text-white'
                              : orderDetail.status === 'CONFIRMED'
                              ? 'bg-teal-600 text-white'
                              : 'bg-surface-secondary text-muted'
                          }`}>
                            {orderDetail.status === 'COMPLETED' ? '✓' : '3'}
                          </div>
                          <span className="font-bold text-ink block text-[11px]">
                            {orderDetail.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã xác nhận'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer Information Snapshot */}
                  <div className="space-y-2 p-4 rounded-2xl bg-white border border-border/80">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] pb-2 border-b border-border/60">
                      Thông tin giao nhận
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-muted">
                      <div>Người nhận: <strong className="text-ink">{orderDetail.customerName}</strong></div>
                      <div>Số điện thoại: <strong className="text-ink">{orderDetail.customerPhone}</strong></div>
                      <div className="col-span-2">Email: {orderDetail.customerEmail}</div>
                      <div className="col-span-2">Địa chỉ: {orderDetail.shippingAddress}</div>
                      {orderDetail.notes && (
                        <div className="col-span-2 text-ink italic">Ghi chú: {orderDetail.notes}</div>
                      )}
                    </div>
                  </div>

                  {/* Purchased Items List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                      Danh sách nhạc cụ ({orderDetail.items?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {orderDetail.items?.map((it) => (
                        <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/30 border border-border/60">
                          <div className="w-12 h-12 rounded-lg bg-surface-secondary overflow-hidden shrink-0">
                            {it.imageUrl ? (
                              <img src={it.imageUrl} alt={it.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-subtle">
                                <IconInstrument size={18} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-ink line-clamp-1">{it.productName}</h5>
                            <span className="text-[11px] text-muted">Mã: {it.productCode} &bull; SL: {it.quantity}</span>
                          </div>
                          <div className="text-right font-bold text-ink">
                            {it.lineTotalDisplay}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Calculation Breakdown */}
                  <div className="space-y-2 p-4 rounded-2xl bg-surface-secondary/40 border border-border/70">
                    <div className="flex justify-between text-muted">
                      <span>Tạm tính tiền hàng:</span>
                      <span className="font-bold text-ink">{orderDetail.totalAmountDisplay}</span>
                    </div>

                    {orderDetail.voucherCode && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Voucher ({orderDetail.voucherCode}):</span>
                        <span className="font-bold">-{orderDetail.discountAmountDisplay}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-muted">
                      <span>Phương thức thanh toán:</span>
                      <span className="font-medium text-ink">{orderDetail.paymentMethod}</span>
                    </div>

                    <div className="flex justify-between text-muted">
                      <span>Trạng thái thanh toán:</span>
                      <span className={`font-bold ${orderDetail.isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {orderDetail.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex justify-between items-baseline">
                      <span className="text-sm font-black text-ink">Tổng thanh toán:</span>
                      <span className="text-lg font-black text-brand font-sans">{orderDetail.finalAmountDisplay}</span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-border/60 bg-white flex items-center justify-between">
              {orderDetail?.canCustomerCancel && (
                <button
                  type="button"
                  onClick={() => handleOpenCancel(orderDetail)}
                  className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy đơn hàng này
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseDetail}
                className="ml-auto px-5 py-2.5 rounded-xl bg-charcoal hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <IconAlertCircle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-black text-ink">
                Xác nhận hủy đơn hàng?
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Đơn hàng <strong>{cancelModalOrder.orderCode}</strong> đang ở trạng thái <em>Chờ xác nhận</em> và chưa tiến hành khấu trừ tồn kho. Quý khách có chắc chắn muốn hủy đơn không?
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cancelReason" className="block text-xs font-bold text-ink">
                Lý do hủy (Tùy chọn):
              </label>
              <textarea
                id="cancelReason"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Đổi ý muốn chọn mẫu nhạc cụ khác..."
                className="w-full p-2.5 rounded-xl text-xs bg-surface-secondary/40 border border-border/80 focus:border-brand focus:bg-white focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                disabled={cancelling}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-ink hover:bg-surface-secondary transition-all cursor-pointer"
              >
                Giữ đơn hàng
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  )
}

export default CustomerOrdersPage
