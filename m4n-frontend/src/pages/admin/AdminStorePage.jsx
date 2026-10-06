import { useState, useMemo } from 'react'
import EditorialEyebrow from '../../components/common/EditorialEyebrow.jsx'
import useToast from '../../components/ui/useToast.js'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'
import prodDanTranh from '../../assets/images/prod-dan-tranh.jpg'
import prodDanBau from '../../assets/images/prod-dan-bau.jpg'
import prodDanNguyet from '../../assets/images/prod-dan-nguyet.jpg'
import prodSaoTruc from '../../assets/images/prod-sao-truc.jpg'

import {
  IconStore,
  IconClose,
  IconSearch,
  IconCreditCard,
  IconPackage,
  IconEye,
} from '../../components/ui/Icons.jsx'

const INITIAL_ORDERS = [
  {
    id: 'ORD-2026-089',
    orderNumber: '#M4N-2026-089',
    createdAt: '17/09/2026 21:40',
    customer: {
      fullName: 'Trần Hoài Nam',
      phone: '0912 345 678',
      email: 'nam.tran@gmail.com',
      address: 'Số 45 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    },
    items: [
      {
        name: 'Đàn Tranh 19 Dây Gỗ Cẩm Lai',
        sku: 'TRN-CL-19',
        price: 14500000,
        quantity: 1,
        image: prodDanTranh,
      },
    ],
    totalAmount: 14500000,
    paymentMethod: 'Chuyển khoản QR Napas',
    isPaid: true,
    status: 'PENDING', // PENDING, CRAFTING, SHIPPING, COMPLETED, CANCELLED
    notes: 'Yêu cầu khắc tên nghệ nhân lên thành đàn.',
  },
  {
    id: 'ORD-2026-088',
    orderNumber: '#M4N-2026-088',
    createdAt: '17/09/2026 19:15',
    customer: {
      fullName: 'Lê Thuỳ Dung',
      phone: '0988 765 432',
      email: 'thuydung.le@outlook.com',
      address: '228 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    },
    items: [
      {
        name: 'Đàn Nguyệt Gỗ Trắc Cần Dài',
        sku: 'NGY-TT-02',
        price: 11200000,
        quantity: 1,
        image: prodDanNguyet,
      },
    ],
    totalAmount: 11200000,
    paymentMethod: 'Thanh toán COD khi nhận',
    isPaid: false,
    status: 'CRAFTING',
    notes: 'Giao giờ hành chính, bọc chống sốc kỹ.',
  },
  {
    id: 'ORD-2026-087',
    orderNumber: '#M4N-2026-087',
    createdAt: '17/09/2026 14:30',
    customer: {
      fullName: 'Nguyễn Thành Long',
      phone: '0903 112 233',
      email: 'long.nt@edu.vn',
      address: 'Học viện Âm nhạc Quốc gia, Đống Đa, Hà Nội',
    },
    items: [
      {
        name: 'Sáo Trúc Tone Đô (C5) Trúc Già',
        sku: 'SAO-DN-C5',
        price: 1250000,
        quantity: 3,
        image: prodSaoTruc,
      },
    ],
    totalAmount: 3750000,
    paymentMethod: 'Chuyển khoản QR Napas',
    isPaid: true,
    status: 'SHIPPING',
    notes: 'Đơn hàng cho khoa Nhạc cụ truyền thống.',
  },
  {
    id: 'ORD-2026-086',
    orderNumber: '#M4N-2026-086',
    createdAt: '16/09/2026 10:20',
    customer: {
      fullName: 'Phạm Văn Minh',
      phone: '0977 889 900',
      email: 'minhpham@gmail.com',
      address: '15 Trần Phú, TP. Đà Nẵng',
    },
    items: [
      {
        name: 'Đàn Bầu Gỗ Mun Thân Liền',
        sku: 'BAU-MT-01',
        price: 9800000,
        quantity: 1,
        image: prodDanBau,
      },
    ],
    totalAmount: 9800000,
    paymentMethod: 'Chuyển khoản QR Napas',
    isPaid: true,
    status: 'COMPLETED',
    notes: 'Khách hàng rất hài lòng với chất lượng âm sắc.',
  },
  {
    id: 'ORD-2026-085',
    orderNumber: '#M4N-2026-085',
    createdAt: '15/09/2026 16:45',
    customer: {
      fullName: 'Hoàng Quốc Việt',
      phone: '0934 567 890',
      email: 'viet.hq@yahoo.com',
      address: 'Phường Vỹ Dạ, TP. Huế',
    },
    items: [
      {
        name: 'Đàn Tranh 19 Dây Gỗ Cẩm Lai',
        sku: 'TRN-CL-19',
        price: 14500000,
        quantity: 1,
        image: prodDanTranh,
      },
    ],
    totalAmount: 14500000,
    paymentMethod: 'Thanh toán COD khi nhận',
    isPaid: false,
    status: 'CANCELLED',
    notes: 'Khách đổi ý muốn đặt phiên bản cẩn ốc xà cừ cao cấp hơn.',
  },
]

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

function AdminStorePage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState(INITIAL_ORDERS)
  const [isStoreOpen, setIsStoreOpen] = useState(true)
  const [storeNotice, setStoreNotice] = useState(
    'Miễn phí vận chuyển bảo hiểm toàn quốc cho các đơn đặt đàn thủ công cao cấp.',
  )
  const [noticeEditing, setNoticeEditing] = useState(false)
  const [tempNotice, setTempNotice] = useState(storeNotice)

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [keyword, setKeyword] = useState('')

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter
      const matchKeyword =
        !keyword.trim() ||
        order.orderNumber.toLowerCase().includes(keyword.toLowerCase()) ||
        order.customer.fullName.toLowerCase().includes(keyword.toLowerCase()) ||
        order.customer.phone.includes(keyword.trim())

      return matchStatus && matchKeyword
    })
  }, [orders, statusFilter, keyword])

  // Statistics
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length
  const craftingCount = orders.filter((o) => o.status === 'CRAFTING').length
  const shippingCount = orders.filter((o) => o.status === 'SHIPPING').length
  const totalRevenue = orders
    .filter((o) => o.status === 'COMPLETED' || o.status === 'SHIPPING')
    .reduce((sum, o) => sum + o.totalAmount, 0)

  // Handlers
  const handleUpdateStatus = (orderId, newStatus) => {
    const statusTitles = {
      CRAFTING: 'Đang nghệ nhân chế tác',
      SHIPPING: 'Đang vận chuyển',
      COMPLETED: 'Đã giao & Hoàn thành',
      CANCELLED: 'Đã hủy đơn',
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    )

    addToast({
      message: `Đơn hàng đã được chuyển sang trạng thái "${statusTitles[newStatus]}".`,
      type: 'success',
    })

    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => ({ ...prev, status: newStatus }))
    }
  }

  const handleToggleStore = () => {
    const nextState = !isStoreOpen
    setIsStoreOpen(nextState)
    addToast({
      message: nextState
        ? 'Cửa hàng trực tuyến đã được mở lại cho khách mua sắm.'
        : 'Cửa hàng trực tuyến đã tạm ngưng nhận đơn mới (Bảo trì).',
      type: nextState ? 'success' : 'warning',
    })
  }

  const handleSaveNotice = () => {
    setStoreNotice(tempNotice)
    setNoticeEditing(false)
    addToast({
      message: 'Đã cập nhật banner thông báo cửa hàng trực tuyến.',
      type: 'info',
    })
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface rounded-2xl border border-border p-6 shadow-xs">
        <div className="flex flex-col gap-1.5">
          <EditorialEyebrow label="Vận hành & Bán lẻ trực tuyến" />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
            Cửa hàng Trực tuyến M4N
          </h2>
          <p className="text-sm text-muted">
            Kiểm soát kênh mua sắm online, điều phối đơn đặt nhạc cụ và quy trình chế tác giao nhận.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-ink hover:text-brand hover:bg-surface-secondary text-sm font-semibold transition-all cursor-pointer"
          >
            <IconStore size={16} />
            <span>Mở Trang Khách Hàng ↗</span>
          </button>
        </div>
      </div>

      {/* Store Operations Status Widget */}
      <div className="bg-gradient-to-r from-surface via-surface to-brand-soft/20 rounded-2xl border border-border p-5 sm:p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-2xs ${
              isStoreOpen
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                isStoreOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-ink">Trạng thái Cửa hàng Trực tuyến</h3>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                  isStoreOpen
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isStoreOpen ? 'Đang mở bán' : 'Tạm dừng bảo trì'}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              {isStoreOpen
                ? 'Khách hàng có thể truy cập, chọn nhạc cụ và tiến hành đặt hàng trực tuyến bình thường.'
                : 'Trang mua sắm đang tạm khóa giỏ hàng và thanh toán để kiểm kê bảo trì.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleStore}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
            isStoreOpen
              ? 'bg-surface-secondary text-ink hover:text-rose-600 hover:bg-rose-50 border border-border'
              : 'bg-brand text-white hover:bg-brand-hover'
          }`}
        >
          {isStoreOpen ? 'Chuyển sang chế độ bảo trì' : 'Mở lại cửa hàng online'}
        </button>
      </div>

      {/* Storefront Announcement Bar Config */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center font-bold text-xs shrink-0">
            📢
          </span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase text-muted tracking-wider">
              Thông điệp Banner Trang Chủ
            </span>
            {noticeEditing ? (
              <input
                type="text"
                value={tempNotice}
                onChange={(e) => setTempNotice(e.target.value)}
                className="mt-1 px-3 py-1.5 text-xs bg-canvas border border-brand rounded-lg text-ink focus:outline-hidden"
              />
            ) : (
              <p className="text-xs font-semibold text-ink truncate mt-0.5">
                {storeNotice}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {noticeEditing ? (
            <>
              <button
                type="button"
                onClick={() => setNoticeEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-ink cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveNotice}
                className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-bold hover:bg-brand-hover cursor-pointer"
              >
                Lưu banner
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempNotice(storeNotice)
                setNoticeEditing(true)
              }}
              className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-secondary text-xs font-semibold text-ink cursor-pointer"
            >
              Chỉnh sửa banner
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Đơn hàng mới chờ duyệt</span>
          <p className="text-2xl font-extrabold text-amber-600">{pendingCount} đơn</p>
          <span className="text-xs text-amber-600/90 font-medium mt-1">Cần xác nhận sớm</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Đang nghệ nhân chế tác</span>
          <p className="text-2xl font-extrabold text-brand">{craftingCount} đơn</p>
          <span className="text-xs text-muted/70 mt-1">Tại Làng Đào Xá, Trúc Sơn</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Đang trên đường giao</span>
          <p className="text-2xl font-extrabold text-sky-600">{shippingCount} đơn</p>
          <span className="text-xs text-muted/70 mt-1">Vận chuyển chống sốc</span>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs flex flex-col gap-1">
          <span className="text-xs font-semibold text-muted">Doanh số hoàn tất & đang giao</span>
          <p className="text-2xl font-extrabold text-ink">{formatVND(totalRevenue)}</p>
          <span className="text-xs text-emerald-600 font-medium mt-1">Giao dịch thành công</span>
        </div>
      </div>

      {/* Order Filters & Search */}
      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Tất cả' },
            { id: 'PENDING', label: 'Chờ duyệt' },
            { id: 'CRAFTING', label: 'Đang chế tác' },
            { id: 'SHIPPING', label: 'Đang giao' },
            { id: 'COMPLETED', label: 'Hoàn thành' },
            { id: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-brand text-white shadow-2xs'
                  : 'text-muted hover:text-ink hover:bg-surface-secondary'
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
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-canvas border border-border text-xs text-ink focus:outline-hidden focus:border-brand"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 bg-surface-secondary/50 text-[11px] font-bold text-muted uppercase tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Mã đơn & Thời gian</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Nhạc cụ đặt mua</th>
                <th className="py-3.5 px-4 text-right">Tổng tiền & TT</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-surface-secondary/40 transition-colors">
                      {/* Order Code & Time */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-ink font-mono hover:text-brand transition-colors cursor-pointer" onClick={() => setSelectedOrder(order)}>
                            {order.orderNumber}
                          </span>
                          <span className="text-xs text-muted mt-0.5">
                            {order.createdAt}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-ink">
                            {order.customer.fullName}
                          </span>
                          <span className="text-xs text-muted font-mono mt-0.5">
                            {order.customer.phone}
                          </span>
                        </div>
                      </td>

                      {/* Instruments */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-xs">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="text-xs text-ink font-medium line-clamp-1">
                              • {item.name} <span className="text-muted">(x{item.quantity})</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Amount & Payment */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-ink">
                            {formatVND(order.totalAmount)}
                          </span>
                          <span
                            className={`text-[11px] font-semibold mt-0.5 ${
                              order.isPaid ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {order.isPaid ? '✓ Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {order.status === 'PENDING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Chờ duyệt
                          </span>
                        )}
                        {order.status === 'CRAFTING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-soft text-brand border border-brand-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                            Đang chế tác
                          </span>
                        )}
                        {order.status === 'SHIPPING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                            Đang giao
                          </span>
                        )}
                        {order.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Hoàn thành
                          </span>
                        )}
                        {order.status === 'CANCELLED' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            Đã hủy
                          </span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {order.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'CRAFTING')}
                              className="px-2.5 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover text-xs font-bold shadow-2xs transition-all cursor-pointer"
                              title="Duyệt đơn và chuyển nghệ nhân chế tác"
                            >
                              Duyệt đơn
                            </button>
                          )}
                          {order.status === 'CRAFTING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}
                              className="px-2.5 py-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                              title="Chuyển sang giao hàng"
                            >
                              Giao hàng
                            </button>
                          )}
                          {order.status === 'SHIPPING' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
                              title="Xác nhận hoàn tất đơn hàng"
                            >
                              Hoàn tất
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-secondary border border-transparent hover:border-border transition-colors cursor-pointer"
                            title="Xem chi tiết đơn hàng"
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
                  <td colSpan={6} className="py-12 text-center text-muted">
                    Không tìm thấy đơn hàng nào khớp với yêu cầu lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Order Details */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-surface rounded-2xl border border-border w-full max-w-2xl shadow-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center">
                  <IconPackage size={20} />
                </span>
                <div>
                  <h3 className="text-base font-bold text-ink">
                    Chi tiết đơn hàng {selectedOrder.orderNumber}
                  </h3>
                  <span className="text-xs text-muted">{selectedOrder.createdAt}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-secondary cursor-pointer"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-6 text-sm">
              {/* Customer & Shipping Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-canvas border border-border">
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Thông tin khách hàng
                  </span>
                  <span className="font-bold text-ink">{selectedOrder.customer.fullName}</span>
                  <span className="text-xs text-muted">{selectedOrder.customer.phone}</span>
                  <span className="text-xs text-muted">{selectedOrder.customer.email}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    Địa chỉ nhận nhạc cụ
                  </span>
                  <p className="text-xs text-ink leading-relaxed">{selectedOrder.customer.address}</p>
                  <span className="text-[11px] text-brand font-semibold mt-1">
                    Ghi chú: {selectedOrder.notes || 'Không có ghi chú'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-3">
                <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                  Nhạc cụ trong đơn hàng
                </span>
                <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between gap-3 bg-surface">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-ink text-xs sm:text-sm">{item.name}</span>
                          <span className="text-xs text-muted font-mono">{item.sku}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-bold text-ink">{formatVND(item.price)}</span>
                        <span className="block text-xs text-muted">Số lượng: x{item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment details */}
              <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <IconCreditCard size={18} className="text-muted" />
                  <span className="text-muted">Phương thức:</span>
                  <strong className="text-ink">{selectedOrder.paymentMethod}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Tổng thanh toán:</span>
                  <span className="text-lg font-extrabold text-brand">
                    {formatVND(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Change Status Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted">Cập nhật nhanh:</span>
                  {selectedOrder.status !== 'CRAFTING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CRAFTING')}
                      className="px-2.5 py-1 rounded-lg bg-brand-soft text-brand text-xs font-bold border border-brand-border hover:bg-brand hover:text-white transition-all cursor-pointer"
                    >
                      Đang chế tác
                    </button>
                  )}
                  {selectedOrder.status !== 'SHIPPING' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPING')}
                      className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200 hover:bg-sky-600 hover:text-white transition-all cursor-pointer"
                    >
                      Giao hàng
                    </button>
                  )}
                  {selectedOrder.status !== 'COMPLETED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'COMPLETED')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all cursor-pointer"
                    >
                      Hoàn tất
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-surface-secondary text-ink hover:bg-border text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStorePage
