import { useState, useEffect, useCallback } from 'react'
import useToast from '../../components/ui/useToast.js'
import orderService from '../../services/orderService.js'
import {
  IconClose,
  IconSearch,
  IconEye,
  IconAlertCircle,
  IconInstrument,
} from '../../components/ui/Icons.jsx'

const ADMIN_STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả' },
  { id: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
  { id: 'CONFIRMED', label: 'Đã xác nhận' },
  { id: 'OUT_OF_STOCK_WAITING', label: 'Chờ xử lý tồn kho' },
  { id: 'COMPLETED', label: 'Hoàn thành' },
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
        label: 'Đã xác nhận (Đã trừ kho)',
        className: 'text-teal-700 bg-teal-50 border-teal-200',
      }
    case 'OUT_OF_STOCK_WAITING':
      return {
        label: 'Chờ xử lý tồn kho',
        className: 'text-orange-700 bg-orange-50 border-orange-200',
      }
    case 'COMPLETED':
      return {
        label: 'Hoàn thành',
        className: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      }
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        className: 'text-rose-700 bg-rose-50 border-rose-200',
      }
    default:
      return {
        label: status || 'Không xác định',
        className: 'text-zinc-600 bg-zinc-50 border-zinc-200',
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

function AdminStorePage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Order detail drawer / modal
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Processing state
  const [actionLoadingId, setActionLoadingId] = useState(null)

  // Cancel dialog state
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const queryStatus = statusFilter === 'ALL' ? null : statusFilter
      const res = await orderService.getAdminOrders({
        status: queryStatus,
        search: keyword.trim() || null,
        page,
        size: 15,
      })

      if (res && res.content) {
        setOrders(res.content)
        setTotalPages(res.totalPages || 1)
      } else if (Array.isArray(res)) {
        setOrders(res)
        setTotalPages(1)
      } else {
        setOrders([])
      }
    } catch (err) {
      addToast({
        message: err.message || 'Không thể tải danh sách đơn hàng',
        type: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, keyword, page, addToast])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        const queryStatus = statusFilter === 'ALL' ? null : statusFilter
        const res = await orderService.getAdminOrders({
          status: queryStatus,
          search: keyword.trim() || null,
          page,
          size: 15,
        })

        if (active) {
          if (res && res.content) {
            setOrders(res.content)
            setTotalPages(res.totalPages || 1)
          } else if (Array.isArray(res)) {
            setOrders(res)
            setTotalPages(1)
          } else {
            setOrders([])
          }
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
  }, [statusFilter, keyword, page, addToast])

  const handleOpenDetail = async (orderId) => {
    setSelectedOrderId(orderId)
    setDetailLoading(true)
    try {
      const data = await orderService.getAdminOrderDetail(orderId)
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

  // Confirm Order (Atomic Stock Check & Deduction)
  const handleConfirmOrder = async (orderId, e) => {
    if (e) e.stopPropagation()
    try {
      setActionLoadingId(orderId)
      const result = await orderService.confirmOrder(orderId)

      if (result.newStatus === 'CONFIRMED') {
        addToast({
          message: `Xác nhận thành công đơn hàng ${result.orderCode}. Tồn kho đã được trừ an toàn.`,
          type: 'success',
        })
      } else if (result.newStatus === 'OUT_OF_STOCK_WAITING') {
        addToast({
          message: result.message || 'Tồn kho không đủ, đơn chuyển sang trạng thái chờ xử lý tồn kho.',
          type: 'warning',
        })
      }

      await fetchOrders()
      if (selectedOrderId === orderId) {
        const fresh = await orderService.getAdminOrderDetail(orderId)
        setOrderDetail(fresh)
      }
    } catch (err) {
      addToast({
        message: err.message || 'Không thể xác nhận đơn hàng',
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Complete Order
  const handleCompleteOrder = async (orderId, e) => {
    if (e) e.stopPropagation()
    try {
      setActionLoadingId(orderId)
      await orderService.completeOrder(orderId)
      addToast({
        message: `Đơn hàng #${orderId} đã được đánh dấu HOÀN THÀNH.`,
        type: 'success',
      })
      await fetchOrders()
      if (selectedOrderId === orderId) {
        const fresh = await orderService.getAdminOrderDetail(orderId)
        setOrderDetail(fresh)
      }
    } catch (err) {
      addToast({
        message: err.message || 'Không thể hoàn tất đơn hàng',
        type: 'error',
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  // Open staff cancel dialog
  const handleOpenCancelDialog = (order, e) => {
    if (e) e.stopPropagation()
    setCancelModalOrder(order)
    setCancelReason('')
  }

  const handleConfirmStaffCancel = async () => {
    if (!cancelModalOrder) return
    try {
      setCancelling(true)
      await orderService.staffCancelOrder(cancelModalOrder.id, cancelReason)
      addToast({
        message: `Đã hủy đơn hàng ${cancelModalOrder.orderCode}. Nếu đơn đã xác nhận trước đó, tồn kho đã được hoàn trả.`,
        type: 'success',
      })
      setCancelModalOrder(null)
      await fetchOrders()
      if (selectedOrderId === cancelModalOrder.id) {
        const fresh = await orderService.getAdminOrderDetail(cancelModalOrder.id)
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

  // Statistics
  const pendingCount = orders.filter((o) => o.status === 'PENDING_CONFIRMATION').length
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length
  const outOfStockCount = orders.filter((o) => o.status === 'OUT_OF_STOCK_WAITING').length

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-border p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
              Vận hành & Kênh Bán Lẻ M4N
            </span>
            <span className="text-zinc-300">/</span>
            <span className="text-xs text-muted font-medium">Xử lý đơn hàng trực tuyến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
            Quản lý & Duyệt Đơn hàng Online
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Quy trình xác nhận đơn hàng, kiểm tra tồn kho nguyên tử (BR-INVENTORY-01), và hoàn tất đơn hàng.
          </p>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Chờ xác nhận (Chưa trừ kho)</span>
            <p className="text-2xl font-extrabold text-amber-600">{pendingCount} đơn</p>
            <span className="text-xs text-amber-600 font-semibold mt-0.5">Cần kiểm tra tồn kho & duyệt</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 font-bold">
            ⏳
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Đã xác nhận (Đã trừ kho)</span>
            <p className="text-2xl font-extrabold text-teal-600">{confirmedCount} đơn</p>
            <span className="text-xs text-teal-600 font-semibold mt-0.5">Sẵn sàng đóng gói hoàn tất</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shrink-0 font-bold">
            ✓
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Chờ xử lý tồn kho</span>
            <p className="text-2xl font-extrabold text-orange-600">{outOfStockCount} đơn</p>
            <span className="text-xs text-orange-600 font-semibold mt-0.5">Hết hàng khi duyệt đơn</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 font-bold">
            ⚠️
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {ADMIN_STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(0)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#0D9488] text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-ink hover:bg-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <IconSearch size={15} />
          </span>
          <input
            type="text"
            placeholder="Tìm mã đơn, tên hoặc SĐT..."
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value)
              setPage(0)
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F5F7FA] border border-border text-xs text-ink focus:outline-hidden focus:border-[#0D9488]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-[#F8FAFC] text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Mã đơn & Thời gian</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Số lượng</th>
                <th className="py-3.5 px-4 text-right">Tổng tiền & TT</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted text-xs">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  const isPending = order.status === 'PENDING_CONFIRMATION'
                  const isConfirmed = order.status === 'CONFIRMED'
                  const isOutOfStock = order.status === 'OUT_OF_STOCK_WAITING'
                  const isActionLoading = actionLoadingId === order.id

                  return (
                    <tr key={order.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Order Code & Time */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span
                            className="font-bold text-ink font-mono hover:text-[#0D9488] transition-colors cursor-pointer"
                            onClick={() => handleOpenDetail(order.id)}
                          >
                            {order.orderCode}
                          </span>
                          <span className="text-xs text-zinc-400 mt-0.5 font-mono">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink text-xs sm:text-sm">
                            {order.customerName}
                          </span>
                          <span className="text-xs text-muted">
                            {order.customerPhone}
                          </span>
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="py-3.5 px-4 text-xs font-semibold text-zinc-700">
                        {order.itemCount} sản phẩm
                      </td>

                      {/* Total Amount & Payment */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-extrabold text-ink text-sm font-sans">
                            {order.finalAmountDisplay}
                          </span>
                          <span className="text-[11px] text-muted">
                            {order.paymentMethod}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Confirm Button for PENDING_CONFIRMATION or OUT_OF_STOCK_WAITING */}
                          {(isPending || isOutOfStock) && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={(e) => handleConfirmOrder(order.id, e)}
                              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                              title="Kiểm tra tồn kho và xác nhận đơn"
                            >
                              {isActionLoading ? 'Đang kiểm kho...' : 'Xác nhận đơn'}
                            </button>
                          )}

                          {/* Complete Button for CONFIRMED */}
                          {isConfirmed && (
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={(e) => handleCompleteOrder(order.id, e)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs"
                              title="Đánh dấu hoàn thành đơn hàng"
                            >
                              {isActionLoading ? 'Đang lưu...' : 'Hoàn tất'}
                            </button>
                          )}

                          {/* Cancel Button for non-final orders */}
                          {order.status !== 'COMPLETED' && order.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenCancelDialog(order, e)}
                              className="px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-bold transition-all cursor-pointer"
                              title="Hủy đơn hàng"
                            >
                              Hủy
                            </button>
                          )}

                          {/* View Detail Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(order.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-ink hover:bg-zinc-100 transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <IconEye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted text-xs">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-muted">
            <span>Trang {page + 1} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 cursor-pointer"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 cursor-pointer"
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Order Detail Modal */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/60 flex items-center justify-between bg-zinc-50">
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
                  Thời gian đặt: {formatDate(orderDetail?.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-9 h-9 rounded-xl text-muted hover:text-ink hover:bg-zinc-100 flex items-center justify-center cursor-pointer transition-all"
              >
                <IconClose size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {detailLoading ? (
                <div className="py-12 text-center text-muted">Đang tải dữ liệu đơn hàng...</div>
              ) : orderDetail ? (
                <>
                  {/* Recipient Information */}
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-border/70 space-y-2">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-[11px] pb-1 border-b border-border/60">
                      Thông tin người nhận & Địa chỉ giao
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-muted">
                      <div>Khách hàng: <strong className="text-ink">{orderDetail.customerName}</strong></div>
                      <div>Số điện thoại: <strong className="text-ink">{orderDetail.customerPhone}</strong></div>
                      <div className="col-span-2">Email: {orderDetail.customerEmail}</div>
                      <div className="col-span-2">Địa chỉ: {orderDetail.shippingAddress}</div>
                      {orderDetail.notes && (
                        <div className="col-span-2 text-ink italic">Ghi chú: {orderDetail.notes}</div>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-ink uppercase tracking-wider text-[11px]">
                      Danh sách nhạc cụ đặt mua ({orderDetail.items?.length || 0})
                    </h4>
                    <div className="space-y-2">
                      {orderDetail.items?.map((it) => (
                        <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-border/80">
                          <div className="w-12 h-12 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                            {it.imageUrl ? (
                              <img src={it.imageUrl} alt={it.productName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <IconInstrument size={18} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-ink line-clamp-1">{it.productName}</h5>
                            <span className="text-[11px] text-muted font-mono">Mã: {it.productCode} &bull; Số lượng: {it.quantity}</span>
                          </div>
                          <div className="text-right font-bold text-ink">
                            {it.lineTotalDisplay}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary & Voucher */}
                  <div className="space-y-2 p-4 rounded-2xl bg-zinc-50 border border-border/70">
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
                      <span className="text-lg font-black text-[#0D9488] font-sans">{orderDetail.finalAmountDisplay}</span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-border/60 bg-white flex items-center justify-between gap-3">
              {orderDetail?.status === 'PENDING_CONFIRMATION' && (
                <button
                  type="button"
                  onClick={() => handleConfirmOrder(orderDetail.id)}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
                >
                  Xác nhận đơn & Trừ tồn kho
                </button>
              )}

              {orderDetail?.status === 'CONFIRMED' && (
                <button
                  type="button"
                  onClick={() => handleCompleteOrder(orderDetail.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  Hoàn thành đơn hàng
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseDetail}
                className="ml-auto px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Cancel Order Confirmation Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-border p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <IconAlertCircle size={24} />
            </div>

            <div>
              <h3 className="text-lg font-black text-ink">
                Hủy đơn hàng {cancelModalOrder.orderCode}?
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {cancelModalOrder.status === 'CONFIRMED'
                  ? 'Đơn hàng này đã được xác nhận và trừ tồn kho. Khi bạn hủy, số lượng tồn kho sẽ được tự động hoàn trả lại kho hàng.'
                  : 'Đơn hàng này chưa trừ tồn kho. Bạn có chắc chắn muốn hủy đơn không?'}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="staffCancelReason" className="block text-xs font-bold text-ink">
                Lý do hủy đơn:
              </label>
              <textarea
                id="staffCancelReason"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ví dụ: Khách gọi điện yêu cầu hủy, không liên lạc được..."
                className="w-full p-2.5 rounded-xl text-xs bg-zinc-50 border border-border text-ink focus:outline-hidden resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                disabled={cancelling}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-ink transition-all cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={handleConfirmStaffCancel}
                disabled={cancelling}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStorePage
