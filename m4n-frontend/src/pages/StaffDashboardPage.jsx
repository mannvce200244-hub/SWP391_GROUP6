import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import {
  IconInstrument,
  IconUser,
  IconLock,
  IconStore,
  IconChevronRight,
} from '../components/ui/Icons.jsx'

function StaffDashboardPage() {
  const { user } = useAuth()

  const staffModules = [
    {
      title: 'Tra cứu danh mục sản phẩm',
      description: 'Kiểm tra thông số kỹ thuật, âm sắc, chất liệu và nghệ nhân để tư vấn khách.',
      path: CUSTOMER_ROUTES.products,
      Icon: IconInstrument,
      badge: 'Sản phẩm',
    },
    {
      title: 'Hồ sơ nhân viên',
      description: 'Cập nhật số điện thoại và thông tin liên lạc nội bộ của bạn.',
      path: CUSTOMER_ROUTES.profile,
      Icon: IconUser,
      badge: 'Cá nhân',
    },
    {
      title: 'Bảo mật ca làm việc',
      description: 'Đổi mật khẩu định kỳ và quản trị phiên đăng nhập an toàn.',
      path: CUSTOMER_ROUTES.security,
      Icon: IconLock,
      badge: 'Bảo mật',
    },
    {
      title: 'Trang chủ Cửa hàng',
      description: 'Xem trải nghiệm website dưới góc nhìn của khách hàng mua sắm.',
      path: CUSTOMER_ROUTES.home,
      Icon: IconStore,
      badge: 'Website',
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-surface rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-jade">BÀN LÀM VIỆC ONLINE</span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink font-sans">
            Xin chào, {user?.fullName || 'Nhân viên'}
          </h2>
          <p className="text-sm text-muted">
            Khu vực thao tác và quản lý dành cho nhân viên bán hàng trực tuyến M4N.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col px-4 py-2 rounded-xl bg-canvas border border-border text-xs">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Tài khoản</span>
            <span className="font-bold text-ink mt-0.5">{user?.email}</span>
          </div>
          <div className="flex flex-col px-4 py-2 rounded-xl bg-canvas border border-border text-xs">
            <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Vai trò</span>
            <span className="font-bold text-jade mt-0.5">Nhân viên trực tuyến</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-base font-bold text-ink">Chức năng làm việc</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {staffModules.map((item) => {
            const ItemIcon = item.Icon
            return (
              <button
                key={item.path}
                type="button"
                className="flex flex-col rounded-2xl bg-surface border border-border p-6 shadow-xs hover:shadow-md hover:border-border-strong transition-all duration-200 text-left group cursor-pointer"
                onClick={() => navigateTo(item.path)}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-ink group-hover:text-jade group-hover:bg-jade-soft transition-colors">
                    <ItemIcon size={22} />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-surface-secondary text-muted uppercase tracking-wider">{item.badge}</span>
                </div>
                <h4 className="text-base font-bold text-ink group-hover:text-jade transition-colors mb-1">{item.title}</h4>
                <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-4">{item.description}</p>
                <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-jade w-full">
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

export default StaffDashboardPage
