import useAuth from '../features/auth/useAuth.js'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import {
  ChevronRight,
  Package,
  MessageCircle,
  Search,
} from 'lucide-react'

function StaffDashboardPage() {
  const { user } = useAuth()

  const quickActions = [
    {
      title: 'Đơn hàng online',
      description: 'Xem, xác nhận và xử lý đơn hàng trực tuyến từ khách hàng.',
      path: CUSTOMER_ROUTES.staffOrders,
      Icon: Package,
      accentColor: 'text-[#1F6B5A]',
      accentBg: 'bg-emerald-50',
    },
    {
      title: 'Hỗ trợ khách hàng',
      description: 'Tiếp nhận và phản hồi tin nhắn hỗ trợ từ khách hàng.',
      path: CUSTOMER_ROUTES.staffChat,
      Icon: MessageCircle,
      accentColor: 'text-sky-600',
      accentBg: 'bg-sky-50',
    },
    {
      title: 'Tra cứu sản phẩm',
      description: 'Tra cứu thông tin sản phẩm để hỗ trợ xử lý đơn và tư vấn.',
      path: CUSTOMER_ROUTES.staffProducts,
      Icon: Search,
      accentColor: 'text-indigo-600',
      accentBg: 'bg-indigo-50',
    },
  ]

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Greeting & Shift Status Banner */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F6B5A]">
              Bàn Làm Việc Online
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight font-sans">
            Xin chào, {user?.fullName || 'Nhân viên'}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Tổng hợp công việc và truy cập nhanh các chức năng vận hành.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col px-4 py-2 rounded-xl bg-[#F6F7F8] border border-border text-xs">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Tài khoản ca trực
            </span>
            <span className="font-bold text-ink mt-0.5 font-mono">{user?.email}</span>
          </div>
          <div className="flex flex-col px-4 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
              Trạng thái
            </span>
            <span className="font-bold text-[#1F6B5A] mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đang trong ca trực
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Modules */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-ink">Chức năng vận hành</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quickActions.map((item) => {
            const ItemIcon = item.Icon
            return (
              <RouterLink
                key={item.path}
                href={item.path}
                className="flex flex-col rounded-2xl bg-white border border-border p-5 shadow-xs hover:shadow-md hover:border-zinc-300 transition-[border-color,box-shadow] duration-200 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${item.accentBg} ${item.accentColor} flex items-center justify-center transition-colors`}>
                    <ItemIcon size={20} />
                  </div>
                </div>
                <h3 className="text-sm font-bold text-ink group-hover:text-[#1F6B5A] transition-colors mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-4">
                  {item.description}
                </p>
                <div className="mt-auto pt-3 border-t border-border/80 flex items-center justify-between text-xs font-semibold text-[#1F6B5A] w-full">
                  <span>Mở chức năng</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </RouterLink>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StaffDashboardPage
