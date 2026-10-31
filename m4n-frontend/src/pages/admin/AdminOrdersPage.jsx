import AdminOrderTable from '../../features/orders/AdminOrderTable.jsx'
import AdminOrderDetailDialog from '../../features/orders/AdminOrderDetailDialog.jsx'
import OrderPackingSlip from '../../features/orders/OrderPackingSlip.jsx'
import useDialogFocus from '../../hooks/useDialogFocus.js'
import { useState, useEffect, useCallback, useRef } from 'react'
import useToast from '../../components/ui/useToast.js'
import orderService from '../../services/orderService.js'
import { formatCurrencyVND } from '../../utils/currency.js'
import { X, Search, Clock, AlertTriangle, Package, FileText, RotateCcw } from 'lucide-react'

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

export default function AdminOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL')
  const [keyword, setKeyword] = useState(
    () => new URLSearchParams(window.location.search).get('search') || '',
  )
  const [page, setPage] = useState(0)
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [statusCounts, setStatusCounts] = useState({})
  const [countsError, setCountsError] = useState(false)
  const selectedIdRef = useRef(null)
  const detailRequest = useRef(0)
  const actionPending = useRef(false)
  const printPending = useRef(false)
  const copyTimeout = useRef(null)

  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [cancelModalOrder, setCancelModalOrder] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const [printSlipOrder, setPrintSlipOrder] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  const closeDetail = () => {
    selectedIdRef.current = null
    detailRequest.current += 1
    setSelectedOrderId(null)
  }
  const closeCancel = () => {
    if (actionPending.current) return
    setCancelModalOrder(null)
    setCancelReason('')
  }
  const cancelDialogRef = useDialogFocus(Boolean(cancelModalOrder), closeCancel, cancelling)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 250)
    return () => clearTimeout(timer)
  }, [keyword])

  useEffect(() => () => {
    detailRequest.current += 1
    clearTimeout(copyTimeout.current)
  }, [])

  // Fetch status counts for KPI cards & status tabs
  useEffect(() => {
    let active = true
    orderService
      .getOrderStatusCounts()
      .then((counts) => {
        if (active && counts) {
          setStatusCounts(counts)
          setCountsError(false)
        }
      })
      .catch(() => {
        if (active) setCountsError(true)
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

    async function loadOrders() {
      setLoading(true)
      setListError('')
      return orderService.getAdminOrders({
        status: queryStatus,
        isPaid: queryIsPaid,
        paymentMethod: queryPaymentMethod,
        search: debouncedKeyword.trim() || null,
        page,
        size: 15,
      })
    }
    loadOrders()
      .then((res) => {
        if (active) {
          if (res && res.content) {
            if (page > 0 && page >= res.totalPages) {
              setPage(Math.max(0, res.totalPages - 1))
              return
            }
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
          setListError(err.message || 'Không thể tải danh sách đơn hàng.')
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [statusFilter, paymentStatusFilter, paymentMethodFilter, debouncedKeyword, page, refreshKey])

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
    const request = ++detailRequest.current
    selectedIdRef.current = orderId
    setSelectedOrderId(orderId)
    setDetailLoading(true)
    setOrderDetail(null)
    try {
      const detail = await orderService.getAdminOrderDetail(orderId)
      if (request === detailRequest.current) setOrderDetail(detail)
    } catch (err) {
      if (request === detailRequest.current) {
        addToast({ message: err.message || 'Không thể tải chi tiết đơn hàng.', type: 'error' })
        closeDetail()
      }
    } finally {
      if (request === detailRequest.current) setDetailLoading(false)
    }
  }

  const getOrderReference = (orderId) => {
    const matchingOrder = orderDetail?.id === orderId
      ? orderDetail
      : orders.find((order) => order.id === orderId)
    return matchingOrder?.orderCode || `#${orderId}`
  }

  const handleConfirm = async (orderId) => {
    if (actionPending.current) return
    actionPending.current = true
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
      if (selectedIdRef.current === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể xác nhận đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      actionPending.current = false
      setActionLoadingId(null)
    }
  }

  const handleRetryConfirmation = async (orderId) => {
    if (actionPending.current) return
    actionPending.current = true
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
      if (selectedIdRef.current === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể thử xác nhận lại đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      actionPending.current = false
      setActionLoadingId(null)
    }
  }

  const handleStartShipping = async (orderId) => {
    if (actionPending.current) return
    actionPending.current = true
    const orderReference = getOrderReference(orderId)
    setActionLoadingId(orderId)
    try {
      await orderService.markOrderShipping(orderId)
      addToast({ message: `Đơn ${orderReference} đã chuyển sang Đang giao hàng.`, type: 'success' })
      reloadOrders()
      if (selectedIdRef.current === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể bắt đầu giao đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      actionPending.current = false
      setActionLoadingId(null)
    }
  }

  const handleMarkDelivered = async (orderId) => {
    if (actionPending.current) return
    actionPending.current = true
    const orderReference = getOrderReference(orderId)
    setActionLoadingId(orderId)
    try {
      await orderService.markOrderDelivered(orderId)
      addToast({ message: `Đơn ${orderReference} đã được ghi nhận là Đã giao hàng.`, type: 'success' })
      reloadOrders()
      if (selectedIdRef.current === orderId) openDetail(orderId)
    } catch (err) {
      addToast({
        message: `Không thể xác nhận đã giao đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      actionPending.current = false
      setActionLoadingId(null)
    }
  }

  const handleCancelSubmit = async () => {
    if (!cancelModalOrder || actionPending.current || cancelReason.trim().length > 500) return
    actionPending.current = true
    setActionLoadingId(cancelModalOrder.id)
    const cancelledOrderId = cancelModalOrder.id
    const orderReference = cancelModalOrder.orderCode || `#${cancelledOrderId}`
    setCancelling(true)
    try {
      await orderService.staffCancelOrder(cancelledOrderId, cancelReason.trim())
      setCancelModalOrder(null)
      setCancelReason('')
      addToast({ message: `Đơn ${orderReference} đã được hủy thành công.`, type: 'success' })
      reloadOrders()
      if (selectedIdRef.current === cancelledOrderId) {
        openDetail(cancelledOrderId)
      }
    } catch (err) {
      addToast({
        message: `Không thể hủy đơn ${orderReference}. ${err.message || 'Vui lòng thử lại.'}`,
        type: 'error',
        duration: 5000,
      })
    } finally {
      actionPending.current = false
      setActionLoadingId(null)
      setCancelling(false)
    }
  }

  const copyToClipboard = (text, key) => {
    if (!text) return
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key)
      addToast({ message: `Đã sao chép: ${text}`, type: 'success' })
      clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopiedKey(null), 2000)
    }).catch(() => {
      addToast({ message: 'Không thể sao chép vào bộ nhớ tạm.', type: 'error' })
    })
  }

  const copyShippingDispatchInfo = (order) => {
    if (!order) return
    const codAmount =
      !order.isPaid && order.paymentMethod === 'COD'
        ? order.finalAmountDisplay || formatCurrencyVND(order.finalAmount)
        : order.isPaid ? '0 ₫ (Đã thanh toán)' : 'Chưa xác minh thanh toán'
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

  const openPrintSlip = async (orderId) => {
    if (printPending.current) return
    if (orderDetail && orderDetail.id === orderId) {
      setPrintSlipOrder(orderDetail)
    } else {
      printPending.current = true
      try {
        const fullDetail = await orderService.getAdminOrderDetail(orderId)
        setPrintSlipOrder(fullDetail)
      } catch (error) {
        addToast({ message: error.message || 'Không thể tải phiếu giao hàng. Vui lòng thử lại.', type: 'error' })
      } finally {
        printPending.current = false
      }
    }
  }

  const pendingCount = countsError ? '—' : statusCounts.PENDING_CONFIRMATION ?? '—'
  const outOfStockCount = countsError ? '—' : statusCounts.OUT_OF_STOCK_WAITING ?? '—'
  const confirmedCount = countsError ? '—' : statusCounts.CONFIRMED ?? '—'
  const totalAllCount = countsError ? '—' : statusCounts.ALL ?? '—'

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
            aria-label="Làm mới danh sách" title="Làm mới danh sách"
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
              ? 'bg-[#F6F7F8] border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
              : 'bg-white border-[#E3E6E8] hover:border-amber-300 hover:bg-[#F6F7F8]/60 shadow-2xs'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Cần duyệt ngay</p>
            <p className="text-xl font-bold text-[#17191B] tabular-nums mt-0.5">{pendingCount}</p>
            <p className="text-[11px] text-secondary">Chờ duyệt kho</p>
          </div>
          <div className="p-2 rounded-lg bg-[#F6F7F8] border border-amber-200 text-amber-700">
            <Clock size={18} />
          </div>
        </button>

        {/* Out of Stock Waiting Card */}
        <button
          type="button"
          onClick={() => { setStatusFilter('OUT_OF_STOCK_WAITING'); setPage(0) }}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'OUT_OF_STOCK_WAITING'
              ? 'bg-[#F6F7F8] border-orange-300 ring-2 ring-orange-400/20 shadow-xs'
              : 'bg-white border-[#E3E6E8] hover:border-orange-300 hover:bg-[#F6F7F8]/60 shadow-2xs'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-800">Chờ xử lý kho</p>
            <p className="text-xl font-bold text-[#17191B] tabular-nums mt-0.5">{outOfStockCount}</p>
            <p className="text-[11px] text-secondary">Hết hàng tồn</p>
          </div>
          <div className="p-2 rounded-lg bg-[#F6F7F8] border border-orange-200 text-orange-700">
            <AlertTriangle size={18} />
          </div>
        </button>

        {/* Confirmed / Packing Card */}
        <button
          type="button"
          onClick={() => { setStatusFilter('CONFIRMED'); setPage(0) }}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
            statusFilter === 'CONFIRMED'
              ? 'bg-[#F6F7F8] border-teal-300 ring-2 ring-teal-400/20 shadow-xs'
              : 'bg-white border-[#E3E6E8] hover:border-teal-300 hover:bg-[#F6F7F8]/60 shadow-2xs'
          }`}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">Đã duyệt / Chuẩn bị</p>
            <p className="text-xl font-bold text-[#17191B] tabular-nums mt-0.5">{confirmedCount}</p>
            <p className="text-[11px] text-secondary">Sẵn sàng gửi hàng</p>
          </div>
          <div className="p-2 rounded-lg bg-[#F6F7F8] border border-teal-200 text-teal-700">
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
                        ? 'bg-[#F6F7F8] text-amber-800'
                        : tab.id === 'OUT_OF_STOCK_WAITING' && count > 0
                          ? 'bg-[#F6F7F8] text-orange-800'
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
              aria-label="Đặt lại toàn bộ bộ lọc" title="Đặt lại toàn bộ bộ lọc"
              className="inline-flex items-center justify-center p-2 rounded-lg border border-[#E3E6E8] bg-white text-secondary hover:text-rose-600 hover:bg-[#F6F7F8] transition-colors cursor-pointer shadow-2xs"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      </div>

      {listError ? (
        <div role="alert" className="rounded-xl border border-border bg-white p-6 text-sm text-ink">
          <p>{listError}</p>
          <button type="button" onClick={reloadOrders} className="mt-3 underline text-brand">Thử lại</button>
        </div>
      ) : <AdminOrderTable
        orders={orders}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        resetAllFilters={resetAllFilters}
        copyToClipboard={copyToClipboard}
        copiedKey={copiedKey}
        openDetail={openDetail}
        openPrintSlip={openPrintSlip}
        actionLoadingId={actionLoadingId}
        handleConfirm={handleConfirm}
        handleRetryConfirmation={handleRetryConfirmation}
        handleStartShipping={handleStartShipping}
        handleMarkDelivered={handleMarkDelivered}
        setCancelModalOrder={setCancelModalOrder}
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        setPage={setPage}
      />}

      <AdminOrderDetailDialog
        selectedOrderId={selectedOrderId}
        orderDetail={orderDetail}
        detailLoading={detailLoading}
        copiedKey={copiedKey}
        copyToClipboard={copyToClipboard}
        copyShippingDispatchInfo={copyShippingDispatchInfo}
        openPrintSlip={openPrintSlip}
        actionLoadingId={actionLoadingId}
        handleConfirm={handleConfirm}
        handleRetryConfirmation={handleRetryConfirmation}
        handleStartShipping={handleStartShipping}
        handleMarkDelivered={handleMarkDelivered}
        setCancelModalOrder={setCancelModalOrder}
        onClose={closeDetail}
        onPaymentUpdated={(orderId) => { setRefreshKey((value) => value + 1); openDetail(orderId) }}
      />

      {/* Cancel Reason Modal */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={closeCancel} aria-hidden="true" />
          <div ref={cancelDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" className="relative bg-white rounded-2xl border border-[#E3E6E8] shadow-xl w-full max-w-md p-6 space-y-4 overscroll-contain">
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
                maxLength={500}
                disabled={cancelling}
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
                onClick={closeCancel}
                disabled={cancelling}
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

      <OrderPackingSlip
        printSlipOrder={printSlipOrder}
        onClose={() => setPrintSlipOrder(null)}
      />

    </div>
  )
}
