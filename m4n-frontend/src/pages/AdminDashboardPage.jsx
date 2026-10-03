import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import {
  IconInstrument,
  IconUser,
  IconLock,
  IconStore,
  IconChevronRight,
} from '../components/ui/Icons.jsx'

function AdminDashboardPage() {
  const { user } = useAuth()

  const quickActions = [
    {
      title: 'Danh mục sản phẩm',
      description: 'Tra cứu kho nhạc cụ truyền thống, nhóm nhạc cụ và nghệ nhân.',
      path: CUSTOMER_ROUTES.products,
      Icon: IconInstrument,
      badge: 'Sản phẩm',
    },
    {
      title: 'Cửa hàng trực tuyến',
      description: 'Xem giao diện mua sắm công khai dưới góc độ khách hàng.',
      path: CUSTOMER_ROUTES.home,
      Icon: IconStore,
      badge: 'Bán lẻ',
    },
    {
      title: 'Hồ sơ cá nhân',
      description: 'Xem và cập nhật họ tên, số điện thoại và thông tin quản trị viên.',
      path: CUSTOMER_ROUTES.profile,
      Icon: IconUser,
      badge: 'Cá nhân',
    },
    {
      title: 'Bảo mật tài khoản',
      description: 'Thay đổi mật khẩu đăng nhập và quản trị các phiên hoạt động.',
      path: CUSTOMER_ROUTES.security,
      Icon: IconLock,
      badge: 'Bảo mật',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-brand">TỔNG QUAN HỆ THỐNG</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
            Xin chào, {user?.fullName || 'Quản trị viên'}
          </h2>
          <p className="text-sm text-muted">
            Quản lý các hoạt động và điều hướng chức năng của hệ thống M4N.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col px-4 py-2 rounded-xl bg-canvas border border-border text-xs">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Trạng thái</span>
            <span className="font-bold text-jade mt-0.5">Đang hoạt động</span>
          </div>
          <div className="flex flex-col px-4 py-2 rounded-xl bg-canvas border border-border text-xs">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Phân quyền</span>
            <span className="font-bold text-ink mt-0.5">Quản trị viên (ADMIN)</span>
          </div>
        </div>
      </div>

      {/* Module Shortcuts Grid */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-ink">Chức năng khả dụng</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => {
            const ActionIcon = action.Icon
            return (
              <button
                key={action.path}
                type="button"
                className="flex flex-col rounded-2xl bg-surface border border-border p-6 shadow-xs hover:shadow-md hover:border-border-strong transition-all duration-200 text-left group cursor-pointer"
                onClick={() => navigateTo(action.path)}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-ink group-hover:text-brand group-hover:bg-brand-soft transition-colors">
                    <ActionIcon size={22} />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-surface-secondary text-muted uppercase tracking-wider">{action.badge}</span>
                </div>
                <h4 className="text-base font-bold text-ink group-hover:text-brand transition-colors mb-1">{action.title}</h4>
                <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-4">{action.description}</p>
                <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-brand w-full">
                  <span>Truy cập</span>
                  <IconChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
