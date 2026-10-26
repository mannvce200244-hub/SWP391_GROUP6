import { useState, useEffect, useCallback } from 'react'
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
  Clock,
  AlertTriangle,
  Package,
  FileText,
  Copy,
  Check,
  Printer,
  Tag,
  MessageSquare,
  RotateCcw,
  MapPin,
  Truck,
  PackageCheck,
} from 'lucide-react'
import { IconInstrument } from '../../components/ui/Icons.jsx'
import { isSafeMediaUrl } from '../../features/catalog/productMedia.js'

const ADMIN_STATUS_TABS = [
  { id: 'ALL', label: 'Tất cả', countKey: 'ALL' },
  { id: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận', countKey: 'PENDING_CONFIRMATION' },
  { id: 'CONFIRMED', label: 'Đã xác nhận', countKey: 'CONFIRMED' },
  { id: 'OUT_OF_STOCK_WAITING', label: 'Chờ xử lý tồn kho', countKey: 'OUT_OF_STOCK_WAITING' },
  { id: 'SHIPPING', label: 'Đang giao', countKey: 'SHIPPING' },
  { id: 'DELIVERED', label: 'Đã giao', countKey: 'DELIVERED' },
  { id: 'COMPLETED', label: 'Hoàn thành', countKey: 'COMPLETED' },
  { id: 'CANCELLED', label: 'Đã hủy', countKey: 'CANCELLED' },
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả thanh toán' },
  { value: 'PAID', label: 'Đã thanh toán' },
  { value: 'UNPAID', label: 'Chưa thanh toán' },
]

const PAYMENT_METHOD_OPTIONS = [
  { value: 'ALL', label: 'Tất cả phương thức' },
  { value: 'COD', label: 'COD' },
  { value: 'ONLINE', label: 'Trực tuyến' },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản' },
]

const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})

function getStatusBadge(status) {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return { label: 'Chờ xác nhận', className: 'text-amber-800 bg-amber-50 border-amber-200' }
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', className: 'text-teal-700 bg-teal-50 border-teal-200' }
    case 'OUT_OF_STOCK_WAITING':
      return { label: 'Chờ xử lý tồn kho', className: 'text-orange-800 bg-orange-50 border-orange-200' }
    case 'SHIPPING':
      return { label: 'Đang giao hàng', className: 'text-blue-700 bg-blue-50 border-blue-200' }
    case 'DELIVERED':
      return { label: 'Đã giao hàng', className: 'text-violet-700 bg-violet-50 border-violet-200' }
    case 'COMPLETED':
      return { label: 'Hoàn thành', className: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    case 'CANCELLED':
      return { label: 'Đã hủy', className: 'text-rose-700 bg-rose-50 border-rose-200' }
    default:
      return { label: status || 'Không xác định', className: 'text-zinc-600 bg-[#F6F7F8] border-[#CDD2D5]' }
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? dateStr : ORDER_DATE_FORMATTER.format(date)
}

function getPaymentMethodBadge(method) {
  if (!method) return { label: 'Chưa rõ', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
  const m = String(method).toUpperCase()
  if (m === 'COD') {
    return { label: 'COD', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' }
  }
  if (m.includes('NAPAS') || m.includes('QR')) {
    return { label: 'QR Napas', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  }
  if (m.includes('CHUYỂN KHOẢN') || m.includes('TRANSFER') || m === 'BANK_TRANSFER') {
    return { label: 'Chuyển khoản', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  }
  if (m === 'ONLINE') {
    return { label: 'Trực tuyến', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  }
  return { label: method, className: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
}

function getShortAddress(address) {
  if (!address) return 'Chưa có địa chỉ'
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ')
  }
  return address
}

export default function AdminOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [keyword, setKeyword] = useState(
    () => new URLSearchParams(window.location.search).get('search') || '',
  )
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusCounts, setStatusCounts] = useState({})

  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const [printSlipOrder, setPrintSlipOrder] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  // Fetch status counts for KPI cards & status tabs
  useEffect(() => {
    let active = true
    orderService
      .getOrderStatusCounts()
      .then((counts) => {
        if (active && counts) {
          setStatusCounts(counts)
        }
      })
      .catch(() => {
        // Non-blocking fallback
      })
    return () => {
      active = false
    }
  }, [refreshKey])

  // Fetch paginated orders
  useEffect(() => {
    let active = true
    const queryStatus = statusFilter === 'ALL' ? null : statusFilter
    const queryIsPaid =
      paymentStatusFilter === 'PAID' ? true : paymentStatusFilter === 'UNPAID' ? false : null
    const queryPaymentMethod = paymentMethodFilter === 'ALL' ? null : paymentMethodFilter

    orderService
      .getAdminOrders({
        status: queryStatus,
        isPaid: queryIsPaid,
        paymentMethod: queryPaymentMethod,
        search: keyword.trim() || null,
        page,
        size: 15,
      })
      .then((res) => {
        if (active) {
          if (res && res.content) {
            setOrders(res.content)
            setTotalPages(res.totalPages || 1)
            setTotalElements(res.totalElements || 0)
          } else if (Array.isArray(res)) {
            setOrders(res)
            setTotalPages(1)
            setTotalElements(res.length)
          } else {
            setOrders([])
            setTotalElements(0)
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
  }, [statusFilter, paymentStatusFilter, paymentMethodFilter, keyword, page, refreshKey, addToast])

  const reloadOrders = useCallback(() => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }, [])

  const resetAllFilters = () => {
    setStatusFilter('ALL')
    setPaymentStatusFilter('ALL')
    setPaymentMethodFilter('ALL')
    setKeyword('')
    setPage(0)
  }

  const hasActiveFilters =
    statusFilter !== 'ALL' ||
    paymentStatusFilter !== 'ALL' ||
    paymentMethodFilter !== 'ALL' ||
    keyword.trim() !== ''

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

  const getOrderReference = (orderId) => {
    const matchingOrder = orderDetail?.id === orderId
      ? orderDetail
      : orders.find((order) => order.id === orderId)
    return matchingOrder?.orderCode || `#${orderId}`
  }

  const handleConfirm = async (orderId) => {
    const orderReference = getOrderReference(orderId)
    setActionLoadingId(orderId)
    try {
      const result = await orderService.confirmOrder(orderId)
      if (result.stockDeducted) {
        addToast({
          message: `Đơn ${orderReference}: ${result.message || 'đã được xác nhận và cập nhật tồn kho.'}`,
          type: 'success',
        })
      } else {
        addToast({
          message: `Đơn ${orderReference}: ${result.message || 'không đủ tồn kho để xác nhận.'}`,
          type: 'warning',
          duration: 5000,
        })
      }
      reloadOrders()
      if (selectedOrderId === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể xác nhận đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleRetryConfirmation = async (orderId) => {
    const orderReference = getOrderReference(orderId)
    setActionLoadingId(orderId)
    try {
      const result = await orderService.retryOrderConfirmation(orderId)
      addToast({
        message: `Đơn ${orderReference}: ${result.message || (result.stockDeducted
          ? 'Đã xác nhận lại đơn hàng.'
          : 'Tồn kho vẫn chưa đủ để xác nhận đơn hàng.')}`,
        type: result.stockDeducted ? 'success' : 'warning',
        duration: result.stockDeducted ? 3500 : 5000,
      })
      reloadOrders()
      if (selectedOrderId === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể thử xác nhận lại đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleStartShipping = async (orderId) => {
    const orderReference = getOrderReference(orderId)
    setActionLoadingId(orderId)
    try {
      await orderService.markOrderShipping(orderId)
      addToast({ message: `Đơn ${orderReference} đã chuyển sang Đang giao hàng.`, type: 'success' })
      reloadOrders()
      if (selectedOrderId === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể bắt đầu giao đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleMarkDelivered = async (orderId) => {
    const orderReference = getOrderReference(orderId)
    setActionLoadingId(orderId)
    try {
      await orderService.markOrderDelivered(orderId)
      addToast({ message: `Đơn ${orderReference} đã được ghi nhận là Đã giao hàng.`, type: 'success' })
      reloadOrders()
      if (selectedOrderId === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể xác nhận đã giao đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleCancelSubmit = async () => {
    if (!cancelModalOrder) return
    const cancelledOrderId = cancelModalOrder.id
    const orderReference = cancelModalOrder.orderCode || `#${cancelledOrderId}`
    setCancelling(true)
    try {
      await orderService.staffCancelOrder(cancelledOrderId, cancelReason.trim())
      setCancelModalOrder(null)
      setCancelReason('')
      addToast({ message: `Đơn ${orderReference} đã được hủy thành công.`, type: 'success' })
      reloadOrders()
      if (selectedOrderId === cancelledOrderId) {
        openDetail(cancelledOrderId)
      }
    } catch (err) {
      addToast({
        message: `Không thể hủy đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      setCancelling(false)
    }
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      addToast({ message: `Đã sao chép: ${text}`, type: 'success' })
      setTimeout(() => setCopiedKey(null), 2000)
    }).catch(() => {
      addToast({ message: 'Không thể sao chép vào bộ nhớ tạm.', type: 'error' })
    })
  }

  const copyShippingDispatchInfo = (order) => {
    if (!order) return
    const codAmount =
      !order.isPaid && order.paymentMethod === 'COD'
        ? order.finalAmountDisplay || formatCurrencyVND(order.finalAmount)
        : '0 ₫ (Đã thanh toán)'
    const dispatchText = [
      `[M4N NHẠC CỤ] THÔNG TIN GIAO HÀNG`,
      `Mã đơn: ${order.orderCode || `#${order.id}`}`,
      `Người nhận: ${order.customerName || '—'}`,
      `SĐT: ${order.customerPhone || '—'}`,
      `Địa chỉ: ${order.shippingAddress || '—'}`,
      `Tiền thu hộ (COD): ${codAmount}`,
      order.notes ? `Ghi chú: ${order.notes}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    navigator.clipboard.writeText(dispatchText).then(() => {
      addToast({ message: 'Đã sao chép thông tin vận đơn giao hàng!', type: 'success' })
    }).catch(() => {
      addToast({ message: 'Sao chép thất bại.', type: 'error' })
    })
  }

  const openPrintSlip = async (orderId, fallbackOrder) => {
    if (orderDetail && orderDetail.id === orderId) {
      setPrintSlipOrder(orderDetail)
    } else {
      try {
        const fullDetail = await orderService.getAdminOrderDetail(orderId)
        setPrintSlipOrder(fullDetail)
      } catch {
        setPrintSlipOrder(fallbackOrder)
      }
    }
  }

  const pendingCount = statusCounts.PENDING_CONFIRMATION ?? 0
  const outOfStockCount = statusCounts.OUT_OF_STOCK_WAITING ?? 0
  const confirmedCount = statusCounts.CONFIRMED ?? 0
  const totalAllCount = statusCounts.ALL ?? totalElements

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#17191B] tracking-tight">Quản lý đơn hàng Online</h1>
          <p className="text-xs text-secondary mt-0.5">
            Theo dõi, kiểm tra tồn kho nhạc cụ, duyệt đơn và điều phối giao hàng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-secondary" aria-live="polite">
            Hiển thị <span className="font-semibold text-[#17191B] tabular-nums">{totalElements}</span> đơn phù hợp
          </p>
          <button
            type="button"
            onClick={reloadOrders}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E3E6E8] bg-white text-xs font-medium text-secondary hover:text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
            title="Làm mới danh sách"
          >
            <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Confirmation Card */}
        <button
          type="button"
          onClick={() => { setStatusFilter('PENDING_CONFIRMATION'); setPage(0) }}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'PENDING_CONFIRMATION'
              ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white border-[#E3E6E8] hover:border-amber-300 hover:bg-[#F6F7F8]/60 shadow-2xs'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Cần duyệt ngay</p>
            <p className="text-xl font-bold text-[#17191B] tabular-nums mt-0.5">{pendingCount}</p>
            <p className="text-[11px] text-secondary">Chờ duyệt kho</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
            <Clock size={18} />
          </div>
        </button>

        {/* Out of Stock Waiting Card */}
        <button
          type="button"
          onClick={() => { setStatusFilter('OUT_OF_STOCK_WAITING'); setPage(0) }}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'OUT_OF_STOCK_WAITING'
              ? 'bg-orange-50/50 border-orange-300 ring-2 ring-orange-400/20 shadow-xs'
              : 'bg-white border-[#E3E6E8] hover:border-orange-300 hover:bg-[#F6F7F8]/60 shadow-2xs'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-800">Chờ xử lý kho</p>
            <p className="text-xl font-bold text-[#17191B] tabular-nums mt-0.5">{outOfStockCount}</p>
            <p className="text-[11px] text-secondary">Hết hàng tồn</p>
          </div>
          <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-700">
            <AlertTriangle size={18} />
          </div>
        </button>

        {/* Confirmed / Packing Card */}
        <button
          type="button"
          onClick={() => { setStatusFilter('CONFIRMED'); setPage(0) }}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'CONFIRMED'
              ? 'bg-teal-50/50 border-teal-300 ring-2 ring-teal-400/20 shadow-xs'
              : 'bg-white border-[#E3E6E8] hover:border-teal-300 hover:bg-[#F6F7F8]/60 shadow-2xs'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Đã duyệt / Chuẩn bị</p>
            <p className="text-xl font-bold text-[#17191B] tabular-nums mt-0.5">{confirmedCount}</p>
            <p className="text-[11px] text-secondary">Sẵn sàng gửi hàng</p>
          </div>
          <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700">
            <Package size={18} />
          </div>
        </button>

        {/* Total Orders Card */}
        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setPage(0) }}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ALL' && !hasActiveFilters
              ? 'bg-[#F6F7F8] border-[#CDD2D5] ring-2 ring-[#17191B]/10 shadow-xs'
              : 'bg-white border-[#E3E6E8] hover:border-[#CDD2D5] hover:bg-[#F6F7F8]/60 shadow-2xs'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">Tổng đơn</p>
            <p className="text-xl font-bold text-[#17191B] tabular-nums mt-0.5">{totalAllCount}</p>
            <p className="text-[11px] text-secondary">Mọi trạng thái</p>
          </div>
          <div className="p-2 rounded-lg bg-[#F6F7F8] border border-[#E3E6E8] text-[#17191B]">
            <FileText size={18} />
          </div>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 flex-wrap border-b border-[#E3E6E8] pb-2.5">
        {ADMIN_STATUS_TABS.map((tab) => {
          const count = statusCounts[tab.countKey]
          const isSelected = statusFilter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => { setStatusFilter(tab.id); setPage(0) }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/20 ${
                isSelected
                  ? 'bg-[#17191B] text-white border-[#17191B] shadow-2xs'
                  : 'bg-white text-secondary border-[#E3E6E8] hover:text-[#17191B] hover:bg-[#F6F7F8]'
              }`}
            >
              <span>{tab.label}</span>
              {count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[11px] font-semibold tabular-nums ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : tab.id === 'PENDING_CONFIRMATION' && count > 0
                        ? 'bg-amber-100 text-amber-800'
                        : tab.id === 'OUT_OF_STOCK_WAITING' && count > 0
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-[#F2F4F5] text-secondary'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search & Compact Secondary Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-center">
        {/* Search input */}
        <div className="relative lg:col-span-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            name="orderSearch"
            aria-label="Tìm đơn hàng"
            autoComplete="off"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(0) }}
            placeholder="Tìm mã đơn, tên khách, SĐT…"
            className="w-full pl-8.5 pr-8 py-2 rounded-lg border border-[#E3E6E8] bg-white text-xs text-[#17191B] placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/15 focus-visible:border-[#A62F25]/40 transition-colors shadow-2xs"
          />
          {keyword && (
            <button
              type="button"
              aria-label="Xóa từ khóa tìm kiếm"
              onClick={() => { setKeyword(''); setPage(0) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Payment Status Select */}
        <div className="lg:col-span-3">
          <select
            value={paymentStatusFilter}
            onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(0) }}
            aria-label="Lọc theo tình trạng thanh toán"
            className="w-full px-2.5 py-2 rounded-lg border border-[#E3E6E8] bg-white text-xs text-[#17191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/15 focus-visible:border-[#A62F25]/40 transition-colors cursor-pointer shadow-2xs"
          >
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Payment Method Select */}
        <div className="lg:col-span-2">
          <select
            value={paymentMethodFilter}
            onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(0) }}
            aria-label="Lọc theo phương thức thanh toán"
            className="w-full px-2.5 py-2 rounded-lg border border-[#E3E6E8] bg-white text-xs text-[#17191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/15 focus-visible:border-[#A62F25]/40 transition-colors cursor-pointer shadow-2xs"
          >
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        <div className="lg:col-span-1 flex justify-end">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              title="Đặt lại toàn bộ bộ lọc"
              className="inline-flex items-center justify-center p-2 rounded-lg border border-[#E3E6E8] bg-white text-secondary hover:text-rose-600 hover:bg-rose-50/50 transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Orders Table - Streamlined & High-Efficiency */}
      {loading ? (
        <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#E3E6E8]" role="status">
          <div className="w-6 h-6 border-2 border-[#A62F25] border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-xs text-secondary font-medium">Đang tải danh sách đơn hàng…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-xl border border-[#E3E6E8] shadow-2xs">
          <IconInstrument size={40} className="mx-auto text-zinc-300 mb-2.5" />
          <p className="text-sm font-semibold text-[#17191B]">Không tìm thấy đơn hàng nào</p>
          <p className="text-xs text-secondary mt-0.5">Hãy thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-3 px-3.5 py-1.5 rounded-lg bg-white border border-[#E3E6E8] text-xs font-medium text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E3E6E8] overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-xs text-left">
              <thead>
                <tr className="border-b border-[#E3E6E8] bg-[#F6F7F8] text-[#17191B]">
                  <th className="px-3.5 py-2.5 font-semibold w-36">Đơn hàng</th>
                  <th className="px-3.5 py-2.5 font-semibold w-40">Khách hàng</th>
                  <th className="px-3.5 py-2.5 font-semibold min-w-[260px]">Nhạc cụ đặt mua</th>
                  <th className="px-3.5 py-2.5 font-semibold w-44">Giao đến</th>
                  <th className="px-3.5 py-2.5 font-semibold w-36">Thanh toán</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right w-32">Tổng thu</th>
                  <th className="px-3.5 py-2.5 font-semibold text-center w-32">Trạng thái</th>
                  <th className="px-3.5 py-2.5 font-semibold text-right w-28">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2F4F5]">
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  const payMethod = getPaymentMethodBadge(order.paymentMethod)
                  const hasDiscount = Boolean(order.discountAmount && Number(order.discountAmount) > 0)
                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-[#F6F7F8]/60 transition-colors group"
                    >
                      {/* Column 1: Order Code & Date */}
                      <td className="px-3.5 py-3 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#17191B]" translate="no">
                            {order.orderCode || `#${order.id}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.orderCode, `code-${order.id}`)}
                            title="Sao chép mã đơn"
                            className="text-zinc-400 hover:text-[#17191B] transition-colors cursor-pointer"
                          >
                            {copiedKey === `code-${order.id}` ? (
                              <Check size={11} className="text-emerald-600" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-secondary whitespace-nowrap">
                            {formatDate(order.createdAt)}
                          </span>
                          {order.voucherCode && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#A62F25] bg-[#FBEDEC] px-1 py-0.2 rounded border border-[#F7D7D4]"
                              title={`Voucher áp dụng: ${order.voucherCode}`}
                            >
                              <Tag size={9} />
                              {order.voucherCode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Customer info (Streamlined: Name + Phone only) */}
                      <td className="px-3.5 py-3 align-middle min-w-0">
                        <p className="font-semibold text-[#17191B] truncate" title={order.customerName || undefined}>
                          {order.customerName || '—'}
                        </p>
                        {order.customerPhone && (
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-secondary">
                            <a
                              href={`tel:${order.customerPhone}`}
                              className="font-mono hover:text-[#A62F25] hover:underline"
                              title="Bấm để gọi"
                            >
                              {order.customerPhone}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.customerPhone, `phone-${order.id}`)}
                              title="Sao chép SĐT"
                              className="text-zinc-400 hover:text-[#17191B] cursor-pointer"
                            >
                              {copiedKey === `phone-${order.id}` ? (
                                <Check size={10} className="text-emerald-600" />
                              ) : (
                                <Copy size={10} />
                              )}
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Products (Primary focus) & Customer Note Pill */}
                      <td className="px-3.5 py-3 align-middle min-w-0">
                        <div className="flex items-center gap-2.5">
                          <div className="relative w-8 h-8 rounded-lg bg-[#F6F7F8] border border-[#E3E6E8] flex items-center justify-center text-zinc-400 shrink-0 overflow-hidden">
                            <IconInstrument size={16} />
                            {isSafeMediaUrl(order.imageUrl) && (
                              <img
                                src={order.imageUrl}
                                alt=""
                                width={32}
                                height={32}
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.hidden = true
                                }}
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p
                                className="font-semibold text-xs text-[#17191B] truncate max-w-xs"
                                title={order.itemsSummary || undefined}
                              >
                                {order.itemsSummary || `${order.itemCount || 0} sản phẩm`}
                              </p>
                              {order.notes && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-semibold cursor-help shrink-0"
                                  title={`Ghi chú từ khách: ${order.notes}`}
                                >
                                  <MessageSquare size={10} className="text-amber-700 shrink-0" />
                                  <span>Ghi chú</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-secondary mt-0.5">
                              {order.itemCount || 1} sản phẩm
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Delivery Location (Concise short address) */}
                      <td className="px-3.5 py-3 align-middle min-w-0">
                        <div
                          className="flex items-center gap-1 text-secondary hover:text-[#17191B] cursor-help"
                          title={`Địa chỉ đầy đủ: ${order.shippingAddress || 'Chưa có'}`}
                        >
                          <MapPin size={12} className="shrink-0 text-zinc-400" />
                          <span className="truncate">{getShortAddress(order.shippingAddress)}</span>
                        </div>
                      </td>

                      {/* Column 5: Payment (Compact Method Badge + Status Indicator) */}
                      <td className="px-3.5 py-3 align-middle">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap ${payMethod.className}`}
                          >
                            {payMethod.label}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium whitespace-nowrap ${
                              order.isPaid ? 'text-emerald-700 font-semibold' : 'text-zinc-500'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                order.isPaid ? 'bg-emerald-600' : 'bg-zinc-400'
                              }`}
                            />
                            {order.isPaid ? 'Đã thu' : 'Chưa thu'}
                          </span>
                        </div>
                      </td>

                      {/* Column 6: Total Amount (Clean bold text, no trailing bug) */}
                      <td className="px-3.5 py-3 align-middle text-right font-bold text-xs text-[#17191B] tabular-nums">
                        <div>{order.finalAmountDisplay || formatCurrencyVND(order.finalAmount)}</div>
                        {hasDiscount ? (
                          <div className="text-[10px] font-normal text-rose-600 tabular-nums mt-0.5">
                            Giảm -{order.discountAmountDisplay || formatCurrencyVND(order.discountAmount)}
                          </div>
                        ) : null}
                      </td>

                      {/* Column 7: Status Badge */}
                      <td className="px-3.5 py-3 align-middle text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      {/* Column 8: Actions */}
                      <td className="px-3.5 py-3 align-middle text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Detail Button */}
                          <button
                            type="button"
                            title="Xem chi tiết đơn hàng"
                            aria-label={`Xem chi tiết đơn ${order.orderCode || order.id}`}
                            onClick={() => openDetail(order.id)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-[#17191B] hover:bg-[#F2F4F5] transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Print Slip Button */}
                          <button
                            type="button"
                            title="In phiếu đóng gói & giao hàng"
                            aria-label={`In phiếu đơn ${order.orderCode || order.id}`}
                            onClick={() => openPrintSlip(order.id, order)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 hover:text-[#17191B] hover:bg-[#F2F4F5] transition-colors cursor-pointer"
                          >
                            <Printer size={14} />
                          </button>

                          {/* Confirm Order Button */}
                          {order.status === 'PENDING_CONFIRMATION' && (
                            <button
                              type="button"
                              title="Xác nhận & trừ kho"
                              aria-label={`Xác nhận đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleConfirm(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-teal-600 hover:bg-teal-50 hover:text-teal-700 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <CircleCheck size={15} className={actionLoadingId === order.id ? 'animate-spin' : ''} />
                            </button>
                          )}

                          {order.status === 'OUT_OF_STOCK_WAITING' && (
                            <button
                              type="button"
                              title="Thử xác nhận lại"
                              aria-label={`Thử xác nhận lại đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleRetryConfirmation(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-amber-700 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <RotateCcw size={14} className={actionLoadingId === order.id ? 'animate-spin' : ''} />
                            </button>
                          )}

                          {/* Start Shipping Button */}
                          {order.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              title="Bắt đầu giao hàng"
                              aria-label={`Bắt đầu giao đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleStartShipping(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <Truck size={15} className={actionLoadingId === order.id ? 'animate-pulse' : ''} />
                            </button>
                          )}

                          {order.status === 'SHIPPING' && (
                            <button
                              type="button"
                              title="Xác nhận đã giao hàng"
                              aria-label={`Xác nhận đã giao đơn ${order.orderCode || order.id}`}
                              disabled={actionLoadingId === order.id}
                              onClick={() => handleMarkDelivered(order.id)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-colors cursor-pointer disabled:opacity-40"
                            >
                              <PackageCheck size={15} className={actionLoadingId === order.id ? 'animate-pulse' : ''} />
                            </button>
                          )}

                          {/* Cancel Order Button */}
                          {(order.status === 'PENDING_CONFIRMATION' ||
                            order.status === 'CONFIRMED' ||
                            order.status === 'OUT_OF_STOCK_WAITING') && (
                            <button
                              type="button"
                              title="Hủy đơn hàng"
                              aria-label={`Hủy đơn ${order.orderCode || order.id}`}
                              onClick={() => setCancelModalOrder(order)}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                            >
                              <X size={14} />
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

          {/* Pagination Controls */}
          {orders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E3E6E8] bg-white">
              <span className="text-xs text-secondary">
                Hiển thị <strong>{orders.length}</strong> / <strong>{totalElements}</strong> đơn hàng · Trang <strong className="text-[#17191B]">{page + 1}</strong> / {totalPages || 1}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Trang đơn hàng trước"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6E8] text-xs font-medium hover:bg-[#F6F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <ChevronLeft size={13} /> Trước
                </button>
                <span className="px-2 text-xs font-semibold text-[#17191B]">
                  Trang {page + 1} / {totalPages || 1}
                </span>
                <button
                  type="button"
                  aria-label="Trang đơn hàng tiếp theo"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E3E6E8] text-xs font-medium hover:bg-[#F6F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Sau <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedOrderId(null)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="relative w-full max-w-2xl bg-white shadow-2xl border-l border-[#E3E6E8] flex flex-col h-full overscroll-contain"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#E3E6E8] bg-[#F6F7F8]">
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="order-detail-title" className="text-lg font-bold text-[#17191B]">
                    Đơn hàng {orderDetail?.orderCode || `#${selectedOrderId}`}
                  </h2>
                  {orderDetail?.orderCode && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(orderDetail.orderCode, 'drawer-code')}
                      title="Sao chép mã đơn"
                      className="text-zinc-400 hover:text-[#17191B] cursor-pointer"
                    >
                      {copiedKey === 'drawer-code' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  )}
                </div>
                <p className="text-xs text-secondary mt-0.5">
                  Ngày đặt: {formatDate(orderDetail?.createdAt)}
                  {orderDetail?.updatedAt && ` · Cập nhật: ${formatDate(orderDetail.updatedAt)}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {orderDetail && (
                  <button
                    type="button"
                    onClick={() => openPrintSlip(orderDetail.id, orderDetail)}
                    title="In phiếu đơn hàng"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E3E6E8] bg-white text-xs font-medium text-[#17191B] hover:bg-[#F6F7F8] cursor-pointer shadow-2xs"
                  >
                    <Printer size={14} /> In phiếu
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Đóng chi tiết đơn hàng"
                  onClick={() => setSelectedOrderId(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#E3E6E8] text-zinc-500 hover:text-[#17191B] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-7 h-7 border-2 border-[#A62F25] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-sm text-secondary">Đang tải chi tiết đơn hàng…</span>
                </div>
              ) : orderDetail ? (
                <>
                  {/* Status & Key Meta Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F6F7F8] p-3.5 rounded-xl border border-[#E3E6E8]">
                    <div>
                      <span className="text-xs text-secondary block font-medium">Trạng thái</span>
                      <div className="mt-1">
                        {(() => {
                          const b = getStatusBadge(orderDetail.status)
                          return (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${b.className}`}>
                              {b.label}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-secondary block font-medium">Thanh toán</span>
                      <p className="mt-1 text-xs font-semibold text-[#17191B]">
                        {orderDetail.paymentMethod === 'COD' ? 'Thu COD' : 'Trực tuyến'}
                      </p>
                      <span className={`text-[11px] font-medium ${orderDetail.isPaid ? 'text-emerald-700' : 'text-secondary'}`}>
                        {orderDetail.isPaid ? '✓ Đã thanh toán' : '○ Chưa thanh toán'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-secondary block font-medium">Số sản phẩm</span>
                      <p className="mt-1 text-xs font-bold text-[#17191B] tabular-nums">
                        {orderDetail.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0} món
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-secondary block font-medium">Tổng tiền</span>
                      <p className="mt-1 text-xs font-bold text-[#A62F25] tabular-nums">
                        {orderDetail.finalAmountDisplay || formatCurrencyVND(orderDetail.finalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Customer Information & Delivery Details */}
                  <div className="rounded-xl border border-[#E3E6E8] bg-white p-4 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#F2F4F5] pb-2.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#17191B]">
                        Thông tin giao nhận
                      </h3>
                      <button
                        type="button"
                        onClick={() => copyShippingDispatchInfo(orderDetail)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#A62F25] hover:underline cursor-pointer"
                      >
                        <Copy size={12} /> Sao chép thông tin vận đơn
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-secondary">Họ tên khách hàng</span>
                        <p className="font-semibold text-[#17191B] mt-0.5">{orderDetail.customerName || '—'}</p>
                      </div>
                      <div>
                        <span className="text-xs text-secondary">Số điện thoại</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <a href={`tel:${orderDetail.customerPhone}`} className="font-semibold text-[#17191B] hover:text-[#A62F25]">
                            {orderDetail.customerPhone || '—'}
                          </a>
                          {orderDetail.customerPhone && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(orderDetail.customerPhone, 'drawer-phone')}
                              title="Sao chép SĐT"
                              className="text-zinc-400 hover:text-[#17191B] cursor-pointer"
                            >
                              {copiedKey === 'drawer-phone' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-secondary">Email liên hệ</span>
                        <p className="text-xs text-[#17191B] mt-0.5">{orderDetail.customerEmail || '—'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-xs text-secondary">Địa chỉ giao hàng chi tiết</span>
                        <p className="font-medium text-[#17191B] mt-0.5 break-words">
                          {orderDetail.shippingAddress || 'Chưa có địa chỉ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Notes Alert Box */}
                  {orderDetail.notes && (
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-950">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                        <MessageSquare size={14} className="text-amber-700" />
                        Ghi chú từ khách hàng:
                      </div>
                      <p className="text-sm font-medium break-words pl-5">{orderDetail.notes}</p>
                    </div>
                  )}

                  {/* Order Items List with Thumbnails */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#17191B]">
                      Danh sách nhạc cụ & sản phẩm
                    </h3>
                    <div className="border border-[#E3E6E8] rounded-xl overflow-hidden divide-y divide-[#F2F4F5] bg-white">
                      {orderDetail.items && orderDetail.items.length > 0 ? (
                        orderDetail.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3.5 p-3 hover:bg-[#F6F7F8]/40 transition-colors">
                            {/* Product Thumbnail */}
                            <div className="relative w-13 h-13 rounded-lg overflow-hidden border border-[#E3E6E8] bg-[#F6F7F8] shrink-0 flex items-center justify-center">
                              <IconInstrument size={22} className="text-zinc-400" />
                              {isSafeMediaUrl(item.imageUrl) && (
                                <img
                                  src={item.imageUrl}
                                  alt={item.productName}
                                  width={52}
                                  height={52}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.hidden = true
                                  }}
                                />
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-[#17191B] truncate">{item.productName}</p>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-secondary">
                                {item.productCode && (
                                  <span className="font-mono text-zinc-500 bg-[#F6F7F8] px-1.5 py-0.2 rounded border border-[#E3E6E8]">
                                    {item.productCode}
                                  </span>
                                )}
                                <span>Số lượng: <strong className="text-[#17191B]">x{item.quantity}</strong></span>
                                <span>·</span>
                                <span>{item.priceDisplay || formatCurrencyVND(item.price)}</span>
                              </div>
                            </div>

                            {/* Line Total */}
                            <div className="text-right shrink-0">
                              <span className="font-bold text-sm text-[#17191B] tabular-nums">
                                {item.lineTotalDisplay || formatCurrencyVND(item.lineTotal)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-secondary">Không có sản phẩm nào.</div>
                      )}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  <div className="bg-[#F6F7F8] rounded-xl p-4 space-y-2 text-sm border border-[#E3E6E8]">
                    <div className="flex justify-between text-secondary">
                      <span>Tạm tính hàng hóa</span>
                      <span className="tabular-nums font-medium text-[#17191B]">
                        {orderDetail.totalAmountDisplay || formatCurrencyVND(orderDetail.totalAmount)}
                      </span>
                    </div>
                    {orderDetail.discountAmount > 0 && (
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Tag size={12} /> Giảm giá khuyến mại {orderDetail.voucherCode ? `(${orderDetail.voucherCode})` : ''}
                        </span>
                        <span className="tabular-nums">
                          -{orderDetail.discountAmountDisplay || formatCurrencyVND(orderDetail.discountAmount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base text-[#17191B] pt-2 border-t border-[#E3E6E8]">
                      <span>Tổng thanh toán</span>
                      <span className="tabular-nums text-[#A62F25]">
                        {orderDetail.finalAmountDisplay || formatCurrencyVND(orderDetail.finalAmount)}
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Drawer Action Footer */}
            {orderDetail && (
              <div className="p-4 border-t border-[#E3E6E8] bg-white flex items-center justify-between gap-3">
                <div>
                  <button
                    type="button"
                    onClick={() => openPrintSlip(orderDetail.id, orderDetail)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E3E6E8] bg-white text-[#17191B] hover:bg-[#F6F7F8] transition-colors cursor-pointer"
                  >
                    <Printer size={14} /> In phiếu giao hàng
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Cancel Button */}
                  {(orderDetail.status === 'PENDING_CONFIRMATION' ||
                    orderDetail.status === 'CONFIRMED' ||
                    orderDetail.status === 'OUT_OF_STOCK_WAITING') && (
                    <button
                      type="button"
                      onClick={() => setCancelModalOrder(orderDetail)}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Hủy đơn
                    </button>
                  )}

                  {/* Confirm Button */}
                  {orderDetail.status === 'PENDING_CONFIRMATION' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === orderDetail.id}
                      onClick={() => handleConfirm(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <CircleCheck size={15} className={actionLoadingId === orderDetail.id ? 'animate-spin' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang duyệt kho…' : 'Xác nhận đơn hàng'}
                    </button>
                  )}

                  {orderDetail.status === 'OUT_OF_STOCK_WAITING' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === orderDetail.id}
                      onClick={() => handleRetryConfirmation(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <RotateCcw size={15} className={actionLoadingId === orderDetail.id ? 'animate-spin' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang kiểm tra kho…' : 'Thử xác nhận lại'}
                    </button>
                  )}

                  {/* Shipping workflow */}
                  {orderDetail.status === 'CONFIRMED' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === orderDetail.id}
                      onClick={() => handleStartShipping(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <Truck size={15} className={actionLoadingId === orderDetail.id ? 'animate-pulse' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang cập nhật…' : 'Bắt đầu giao hàng'}
                    </button>
                  )}

                  {orderDetail.status === 'SHIPPING' && (
                    <button
                      type="button"
                      disabled={actionLoadingId === orderDetail.id}
                      onClick={() => handleMarkDelivered(orderDetail.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-violet-700 text-white hover:bg-violet-800 disabled:opacity-60 transition-colors cursor-pointer shadow-xs"
                    >
                      <PackageCheck size={15} className={actionLoadingId === orderDetail.id ? 'animate-pulse' : ''} />
                      {actionLoadingId === orderDetail.id ? 'Đang cập nhật…' : 'Xác nhận đã giao'}
                    </button>
                  )}

                  {orderDetail.status === 'DELIVERED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-lg">
                      <Clock size={14} /> Chờ khách xác nhận đã nhận hàng
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setCancelModalOrder(null)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" className="relative bg-white rounded-2xl border border-[#E3E6E8] shadow-xl w-full max-w-md p-6 space-y-4 overscroll-contain">
            <h2 id="cancel-order-title" className="text-lg font-bold text-[#17191B]">
              Hủy đơn hàng {cancelModalOrder.orderCode || `#${cancelModalOrder.id}`}
            </h2>
            <p className="text-xs text-secondary">
              Nếu đơn đã xác nhận, thao tác này sẽ hoàn trả lại số lượng tồn kho cho các sản phẩm trong đơn.
            </p>
            <div>
              <label htmlFor="cancelReason" className="block text-sm font-medium text-[#17191B] mb-1">
                Lý do hủy đơn
              </label>
              <textarea
                id="cancelReason"
                name="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                placeholder="Nhập lý do nhân viên hủy đơn (vd: Khách đổi ý, hết hàng không thể nhập thêm)…"
                className="w-full px-3 py-2.5 rounded-lg border border-[#E3E6E8] bg-white text-sm text-[#17191B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A62F25]/15 focus-visible:border-[#A62F25]/40 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-white border border-[#E3E6E8] text-[#17191B] hover:bg-[#F6F7F8] cursor-pointer transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={cancelling}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                {cancelling ? 'Đang hủy…' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Packing Slip Modal */}
      {printSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E3E6E8] shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overscroll-contain">
            {/* Modal Actions Header */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#E3E6E8] bg-[#F6F7F8] rounded-t-2xl">
              <span className="text-sm font-semibold text-[#17191B] flex items-center gap-1.5">
                <Printer size={16} className="text-[#A62F25]" /> Xem trước phiếu đóng gói & giao hàng
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#17191B] text-white text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Printer size={14} /> In ngay
                </button>
                <button
                  type="button"
                  onClick={() => setPrintSlipOrder(null)}
                  className="p-1.5 text-zinc-400 hover:text-[#17191B] rounded-lg hover:bg-[#E3E6E8] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Print Slip Document Body */}
            <div className="p-8 overflow-y-auto space-y-6 text-[#17191B]" id="printable-slip">
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b-2 border-[#17191B] pb-4">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#17191B]">M4N</h2>
                  <p className="text-xs text-secondary mt-0.5">Tinh hoa Nhạc cụ Dân tộc Việt Nam</p>
                  <p className="text-[11px] text-secondary">Website: m4n.vn · Hotline: 1900 6868</p>
                </div>
                <div className="text-right">
                  <h3 className="text-base font-bold uppercase tracking-wider text-[#A62F25]">
                    PHIẾU ĐÓNG GÓI & GIAO HÀNG
                  </h3>
                  <p className="font-mono text-xs font-bold mt-1 text-[#17191B]">
                    {printSlipOrder.orderCode || `#${printSlipOrder.id}`}
                  </p>
                  <p className="text-xs text-secondary mt-0.5">
                    Ngày in: {formatDate(new Date().toISOString())}
                  </p>
                </div>
              </div>

              {/* Recipient & Order Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-[#F6F7F8] p-4 rounded-xl border border-[#E3E6E8]">
                <div>
                  <span className="text-secondary font-semibold block uppercase tracking-wider text-[10px]">
                    Người nhận hàng
                  </span>
                  <p className="text-sm font-bold mt-1 text-[#17191B]">{printSlipOrder.customerName || '—'}</p>
                  <p className="font-medium text-secondary mt-0.5">SĐT: {printSlipOrder.customerPhone || '—'}</p>
                  <p className="mt-1 text-secondary leading-relaxed">
                    Đ/c: {printSlipOrder.shippingAddress || '—'}
                  </p>
                </div>
                <div>
                  <span className="text-secondary font-semibold block uppercase tracking-wider text-[10px]">
                    Chi tiết thanh toán
                  </span>
                  <p className="font-semibold text-secondary mt-1">
                    Hình thức: {getPaymentMethodBadge(printSlipOrder.paymentMethod).label}
                  </p>
                  <p className={`font-bold mt-0.5 ${printSlipOrder.isPaid ? 'text-emerald-700' : 'text-amber-800'}`}>
                    Tình trạng: {printSlipOrder.isPaid ? 'ĐÃ THANH TOÁN ONLINE' : 'THU TIỀN KHI GIAO (COD)'}
                  </p>
                  {printSlipOrder.notes && (
                    <p className="mt-2 p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                      Ghi chú: {printSlipOrder.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-xs text-left border border-[#E3E6E8]">
                  <thead>
                    <tr className="bg-[#F6F7F8] border-b border-[#E3E6E8] text-[#17191B]">
                      <th className="p-2.5 font-bold w-10 text-center">STT</th>
                      <th className="p-2.5 font-bold">Mặt hàng nhạc cụ</th>
                      <th className="p-2.5 font-bold w-16 text-center">Số lượng</th>
                      <th className="p-2.5 font-bold w-24 text-right">Đơn giá</th>
                      <th className="p-2.5 font-bold w-28 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E6E8]">
                    {printSlipOrder.items && printSlipOrder.items.length > 0 ? (
                      printSlipOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 text-center text-secondary">{idx + 1}</td>
                          <td className="p-2.5">
                            <p className="font-semibold text-[#17191B]">{it.productName}</p>
                            {it.productCode && (
                              <span className="font-mono text-[11px] text-zinc-500">Mã: {it.productCode}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-bold text-[#17191B]">{it.quantity}</td>
                          <td className="p-2.5 text-right tabular-nums text-secondary">
                            {it.priceDisplay || formatCurrencyVND(it.price)}
                          </td>
                          <td className="p-2.5 text-right font-semibold tabular-nums text-[#17191B]">
                            {it.lineTotalDisplay || formatCurrencyVND(it.lineTotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-3 text-center text-secondary">
                          {printSlipOrder.itemsSummary || 'Chi tiết đơn hàng'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[#E3E6E8] bg-[#F6F7F8]">
                      <td colSpan={3} className="p-2.5 font-medium text-secondary text-right">Tạm tính:</td>
                      <td colSpan={2} className="p-2.5 text-right tabular-nums font-semibold">
                        {printSlipOrder.totalAmountDisplay || formatCurrencyVND(printSlipOrder.totalAmount)}
                      </td>
                    </tr>
                    {printSlipOrder.discountAmount > 0 && (
                      <tr className="bg-[#F6F7F8] text-rose-600">
                        <td colSpan={3} className="p-2.5 font-medium text-right">
                          Giảm giá voucher {printSlipOrder.voucherCode ? `(${printSlipOrder.voucherCode})` : ''}:
                        </td>
                        <td colSpan={2} className="p-2.5 text-right tabular-nums font-semibold">
                          -{printSlipOrder.discountAmountDisplay || formatCurrencyVND(printSlipOrder.discountAmount)}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-[#F6F7F8] border-t-2 border-[#17191B] text-[#17191B] font-bold">
                      <td colSpan={3} className="p-2.5 text-sm text-right">TỔNG THU (COD):</td>
                      <td colSpan={2} className="p-2.5 text-right text-base text-[#A62F25] tabular-nums">
                        {printSlipOrder.isPaid
                          ? '0 ₫ (ĐÃ THANH TOÁN)'
                          : printSlipOrder.finalAmountDisplay || formatCurrencyVND(printSlipOrder.finalAmount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signature section */}
              <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs text-secondary">
                <div>
                  <p className="font-semibold text-[#17191B]">Người lập phiếu</p>
                  <p className="italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
                <div>
                  <p className="font-semibold text-[#17191B]">Nhân viên giao nhận</p>
                  <p className="italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
                <div>
                  <p className="font-semibold text-[#17191B]">Người nhận hàng</p>
                  <p className="italic text-[11px] mt-0.5">(Ký, họ tên)</p>
                  <div className="h-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
