import { useState, useEffect } from 'react'
import useToast from '../../components/ui/useToast.js'
import orderService from '../../services/orderService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import {
  X,
  Search,
  Eye,
  CircleCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { IconInstrument } from '../../components/ui/Icons.jsx'

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
      return { label: 'Chờ xác nhận', className: 'text-amber-700 bg-amber-50 border-amber-200' }
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', className: 'text-teal-700 bg-teal-50 border-teal-200' }
    case 'OUT_OF_STOCK_WAITING':
      return { label: 'Chờ xử lý tồn kho', className: 'text-orange-700 bg-orange-50 border-orange-200' }
    case 'COMPLETED':
      return { label: 'Hoàn thành', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    case 'CANCELLED':
      return { label: 'Đã hủy', className: 'text-rose-700 bg-rose-50 border-rose-200' }
    default:
      return { label: status || 'Không xác định', className: 'text-zinc-600 bg-zinc-50 border-zinc-200' }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

export default function AdminOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    let active = true
    const queryStatus = statusFilter === 'ALL' ? null : statusFilter
    orderService
      .getAdminOrders({
        status: queryStatus,
        search: keyword.trim() || null,
        page,
        size: 15,
      })
      .then((res) => {
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
          setLoading(false)
        }
      })
      .catch((err) => {
        if (active) {
          addToast({ message: err.message || 'Không thể tải danh sách đơn hàng.', type: 'error' })
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [statusFilter, keyword, page, refreshKey, addToast])

  const reloadOrders = () => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  const openDetail = async (orderId) => {
    setSelectedOrderId(orderId)
    setDetailLoading(true)
    setOrderDetail(null)
    try {
      const detail = await orderService.getAdminOrderDetail(orderId)
      setOrderDetail(detail)
    } catch (err) {
      addToast({ message: err.message || 'Không thể tải chi tiết đơn hàng.', type: 'error' })
      setSelectedOrderId(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleConfirm = async (orderId) => {
    setActionLoadingId(orderId)
    try {
      const result = await orderService.confirmOrder(orderId)
      if (result.success) {
        addToast({ message: result.message || 'Đã xác nhận đơn hàng.', type: 'success' })
      } else {
        addToast({ message: result.message || 'Không đủ tồn kho.', type: 'error' })
      }
      reloadOrders()
      if (selectedOrderId === orderId) openDetail(orderId)
    } catch (err) {
      addToast({ message: err.message || 'Xác nhận đơn hàng thất bại.', type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleComplete = async (orderId) => {
    setActionLoadingId(orderId)
    try {
      await orderService.completeOrder(orderId)
      addToast({ message: 'Đã hoàn thành đơn hàng.', type: 'success' })
      reloadOrders()
      if (selectedOrderId === orderId) openDetail(orderId)
    } catch (err) {
      addToast({ message: err.message || 'Hoàn thành đơn hàng thất bại.', type: 'error' })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancelSubmit = async () => {
    if (!cancelModalOrder) return
    setCancelling(true)
    try {
      await orderService.staffCancelOrder(cancelModalOrder.id, cancelReason.trim())
      addToast({ message: 'Đã hủy đơn hàng.', type: 'success' })
      setCancelModalOrder(null)
      setCancelReason('')
      reloadOrders()
      if (selectedOrderId === cancelModalOrder.id) setSelectedOrderId(null)
    } catch (err) {
      addToast({ message: err.message || 'Hủy đơn hàng thất bại.', type: 'error' })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#17191B]">Đơn hàng online</h2>
        <p className="text-sm text-secondary mt-0.5">Quản lý và xử lý đơn hàng từ khách hàng</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
            placeholder="Tìm theo mã đơn, tên khách…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 transition-colors"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ADMIN_STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setStatusFilter(tab.id); setPage(0) }}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-[#17191B] text-white border-[#17191B]'
                  : 'bg-white text-secondary border-[#E3E6E8] hover:bg-[#F6F7F8]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-7 h-7 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-secondary">Đang tải đơn hàng…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-[#E3E6E8]">
          <IconInstrument size={40} className="mx-auto text-zinc-300 mb-3" />
          <p className="text-sm text-secondary">Không có đơn hàng nào.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E6E8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E3E6E8] bg-[#F6F7F8]">
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Mã đơn</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Khách hàng</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Tổng tiền</th>
                  <th className="text-center px-4 py-3 font-semibold text-[#17191B]">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#17191B]">Ngày đặt</th>
                  <th className="text-right px-4 py-3 font-semibold text-[#17191B]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  return (
                    <tr key={order.id} className="border-b border-[#F2F4F5] hover:bg-[#F6F7F8]/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#17191B]">#{order.id}</td>
                      <td className="px-4 py-3 text-[#17191B]">{order.customerName || order.shippingName || '—'}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {order.formattedFinalAmount || formatCurrencyVND(order.finalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-secondary text-xs">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Xem chi tiết"
                            onClick={() => openDetail(order.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0D9488] hover:bg-teal-50 transition-colors cursor-pointer"
                          >
                            <Eye size={15} />
                          </button>
                          {order.status === 'PENDING_CONFIRMATION' && (
                            <button
                              type="button"
                              title="Xác nhận"
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleConfirm(order.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <CircleCheck size={15} />
                            </button>
                          )}
                          {order.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              title="Hoàn thành"
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleComplete(order.id)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <CircleCheck size={15} />
                            </button>
                          )}
                          {(order.status === 'PENDING_CONFIRMATION' || order.status === 'CONFIRMED' || order.status === 'OUT_OF_STOCK_WAITING') && (
                            <button
                              type="button"
                              title="Hủy đơn"
                              onClick={() => setCancelModalOrder(order)}
                              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <X size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#E3E6E8]">
              <span className="text-xs text-secondary">Trang {page + 1} / {totalPages}</span>
              <div className="flex gap-1.5">
                <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="p-1.5 rounded-lg border border-[#E3E6E8] hover:bg-[#F6F7F8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg border border-[#E3E6E8] hover:bg-[#F6F7F8] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSelectedOrderId(null)} aria-hidden="true" />
          <div className="relative w-full max-w-lg bg-white shadow-2xl border-l border-[#E3E6E8] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#17191B]">Chi tiết đơn hàng #{selectedOrderId}</h3>
              <button type="button" onClick={() => setSelectedOrderId(null)} className="p-1 rounded-lg hover:bg-[#F6F7F8] cursor-pointer">
                <X size={18} className="text-zinc-400" />
              </button>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orderDetail ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-secondary">Trạng thái</span><div className="mt-1">{(() => { const b = getStatusBadge(orderDetail.status); return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${b.className}`}>{b.label}</span> })()}</div></div>
                  <div><span className="text-secondary">Ngày đặt</span><p className="mt-1 font-medium">{formatDate(orderDetail.createdAt)}</p></div>
                  <div><span className="text-secondary">Khách hàng</span><p className="mt-1 font-medium">{orderDetail.customerName || orderDetail.shippingName || '—'}</p></div>
                  <div><span className="text-secondary">SĐT</span><p className="mt-1 font-medium">{orderDetail.shippingPhone || '—'}</p></div>
                </div>
                {orderDetail.shippingAddress && (
                  <div className="text-sm"><span className="text-secondary">Địa chỉ giao</span><p className="mt-1">{orderDetail.shippingAddress}</p></div>
                )}
                {orderDetail.items && orderDetail.items.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-[#17191B] mb-2">Sản phẩm</h4>
                    <div className="border border-[#E3E6E8] rounded-lg overflow-hidden">
                      {orderDetail.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between px-3 py-2.5 border-b border-[#F2F4F5] last:border-b-0 text-sm">
                          <div>
                            <p className="font-medium text-[#17191B]">{item.productName}</p>
                            <p className="text-xs text-secondary">x{item.quantity} · {item.formattedUnitPrice || formatCurrencyVND(item.unitPrice)}</p>
                          </div>
                          <span className="font-semibold tabular-nums">{item.formattedLineAmount || formatCurrencyVND(item.lineAmount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-[#F6F7F8] rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-secondary">Tạm tính</span><span>{orderDetail.formattedSubtotal || formatCurrencyVND(orderDetail.subtotal)}</span></div>
                  {orderDetail.discount > 0 && <div className="flex justify-between"><span className="text-secondary">Giảm giá</span><span className="text-rose-600">-{orderDetail.formattedDiscount || formatCurrencyVND(orderDetail.discount)}</span></div>}
                  <div className="flex justify-between font-bold text-[#17191B] pt-1 border-t border-[#E3E6E8]"><span>Tổng cộng</span><span>{orderDetail.formattedFinalAmount || formatCurrencyVND(orderDetail.finalAmount)}</span></div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setCancelModalOrder(null)} aria-hidden="true" />
          <div className="relative bg-white rounded-2xl border border-[#E3E6E8] shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#17191B]">Hủy đơn hàng #{cancelModalOrder.id}</h3>
            <div>
              <label className="block text-sm font-medium text-[#17191B] mb-1">Lý do hủy</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Nhập lý do hủy đơn…"
                className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] focus:outline-none focus:ring-2 focus:ring-[#A62F25]/15 focus:border-[#A62F25]/40 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCancelModalOrder(null)} className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-[#E3E6E8] text-[#17191B] hover:bg-[#F6F7F8] cursor-pointer transition-colors">Đóng</button>
              <button type="button" onClick={handleCancelSubmit} disabled={cancelling} className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors">
                {cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
