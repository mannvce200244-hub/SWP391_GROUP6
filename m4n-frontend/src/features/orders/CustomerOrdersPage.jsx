import { useState } from 'react'
import AccountLayout from '../../layouts/AccountLayout.jsx'
import {
  IconPackage,
  IconCheck,
  IconArrowRight,
  IconChevronRight,
  IconInstrument,
} from '../../components/ui/Icons.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../../routes/customerRoutes.js'

// Realistic craft instruments order demonstration data
const DEMO_ORDERS = [
  {
    id: 'ord-8812',
    orderCode: 'M4N-2026-8812',
    createdAt: '16/09/2026',
    status: 'PROCESSING',
    statusLabel: 'Đang hoàn thiện chế tác',
    statusColor: 'text-brand bg-brand-soft border-brand-border',
    totalAmount: 4850000,
    items: [
      {
        id: 'item-1',
        title: 'Đàn Tranh 19 Dây Gỗ Cẩm Lai Khảm Trai Di Sản',
        village: 'Làng nghề nhạc cụ Đào Xá (Hà Nội)',
        artisan: 'Nghệ nhân Ưu tú Nguyễn Văn Nam',
        quantity: 1,
        price: 4850000,
      },
    ],
  },
  {
    id: 'ord-7419',
    orderCode: 'M4N-2026-7419',
    createdAt: '28/08/2026',
    status: 'COMPLETED',
    statusLabel: 'Đã giao hàng thành công',
    statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    totalAmount: 1300000,
    items: [
      {
        id: 'item-2',
        title: 'Sáo Trúc Hun Khói 10 Lỗ Chuyên Nghiệp',
        village: 'Làng nghề trúc hun khói Xuân Lai (Bắc Ninh)',
        artisan: 'Nghệ nhân Bùi Tuấn Kiệt',
        quantity: 2,
        price: 650000,
      },
    ],
  },
  {
    id: 'ord-6104',
    orderCode: 'M4N-2026-6104',
    createdAt: '12/07/2026',
    status: 'COMPLETED',
    statusLabel: 'Đã giao hàng thành công',
    statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    totalAmount: 3200000,
    items: [
      {
        id: 'item-3',
        title: 'Đàn Bầu Bầu Thật Gỗ Mun Cổ Truyền',
        village: 'Làng nghề Chàng Sơn (Hà Nội)',
        artisan: 'Nghệ nhân Trần Đình Hưng',
        quantity: 1,
        price: 3200000,
      },
    ],
  },
]

const TABS = [
  { id: 'ALL', label: 'Tất cả đơn' },
  { id: 'PROCESSING', label: 'Đang chế tác & vận chuyển' },
  { id: 'COMPLETED', label: 'Đã hoàn thành' },
  { id: 'CANCELLED', label: 'Đã hủy' },
]

function CustomerOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('ALL')

  const filteredOrders = DEMO_ORDERS.filter((order) => {
    if (activeFilter === 'ALL') return true
    return order.status === activeFilter
  })

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  return (
    <AccountLayout activeTab="orders">
      <div className="space-y-6">
        
        {/* Orders Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-ink font-sans">
                Đơn hàng của tôi
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-soft text-brand border border-brand-border">
                {DEMO_ORDERS.length} đơn
              </span>
            </div>
            <p className="text-sm text-muted mt-1">
              Theo dõi tiến độ chế tác thủ công, nghiệm thu âm thanh và lộ trình giao nhận nhạc cụ.
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
          {TABS.map((tab) => {
            const isActive = activeFilter === tab.id
            const count =
              tab.id === 'ALL'
                ? DEMO_ORDERS.length
                : DEMO_ORDERS.filter((o) => o.status === tab.id).length

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer select-none flex items-center gap-2 ${
                  isActive
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'bg-surface-secondary/70 text-muted hover:text-ink hover:bg-surface-secondary border border-border/70'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white text-subtle border border-border/60'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="rounded-[24px] border border-border/80 bg-white p-5 sm:p-6 shadow-2xs hover:border-brand-border hover:shadow-md transition-all duration-200 space-y-4"
              >
                {/* Order Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-ink tracking-wide">
                      #{order.orderCode}
                    </span>
                    <span className="text-xs text-subtle">·</span>
                    <span className="text-xs text-muted">
                      Ngày đặt: {order.createdAt}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${order.statusColor}`}
                  >
                    {order.status === 'PROCESSING' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    )}
                    {order.status === 'COMPLETED' && (
                      <IconCheck size={13} className="text-emerald-700" />
                    )}
                    <span>{order.statusLabel}</span>
                  </span>
                </div>

                {/* Items List in this Order */}
                <div className="space-y-3">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-surface-secondary/40 border border-border/50"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand-border">
                          <IconInstrument size={20} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-ink truncate">
                            {item.title}
                          </h4>
                          <p className="text-xs text-muted truncate mt-0.5">
                            {item.artisan} · {item.village}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-ink">
                          {formatVND(item.price)}
                        </p>
                        <p className="text-xs text-subtle mt-0.5">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Footer Actions & Total */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-muted">Tổng giá trị đơn hàng:</span>
                    <span className="text-base sm:text-lg font-black text-brand font-sans">
                      {formatVND(order.totalAmount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
                      className="px-4 py-2 text-xs font-bold rounded-xl text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer border border-border"
                    >
                      Đặt chế tác lại
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-brand hover:bg-brand-hover shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Theo dõi tiến độ</span>
                      <IconChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="rounded-[28px] border border-dashed border-border p-12 text-center bg-surface-secondary/30 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-brand-soft text-brand flex items-center justify-center mb-4 border border-brand-border">
              <IconPackage size={32} />
            </div>
            <h3 className="text-lg font-bold text-ink mb-1">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-xs text-muted max-w-sm mb-6">
              Bạn chưa có đơn đặt làm hoặc mua nhạc cụ nào trong trạng thái này. Khám phá các tuyệt tác nhạc cụ được chế tác bởi nghệ nhân di sản.
            </p>
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-2xl bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md shadow-brand/20 transition-all cursor-pointer"
            >
              <span>Xem bộ sưu tập nhạc cụ</span>
              <IconArrowRight size={14} />
            </button>
          </div>
        )}

      </div>
    </AccountLayout>
  )
}

export default CustomerOrdersPage
