import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import EditorialEyebrow from '../components/common/EditorialEyebrow.jsx'
import {
  IconInstrument,
  IconUser,
  IconLock,
  IconStore,
  IconShield,
  IconPackage,
  IconChevronRight,
} from '../components/ui/Icons.jsx'

function AdminDashboardPage() {
  const { user } = useAuth()

  // Key performance & status metrics
  const stats = [
    {
      title: 'Kho Nhạc cụ',
      metric: '24+ Mẫu',
      desc: 'Nhạc cụ Dây · Hơi · Gõ',
      badge: 'Đa dạng',
      Icon: IconInstrument,
      iconColor: 'bg-brand-soft border-brand-border text-brand',
      path: CUSTOMER_ROUTES.adminInstruments,
    },
    {
      title: 'Cửa hàng Online',
      metric: 'Sẵn sàng',
      desc: 'Đang mở bán trực tuyến',
      badge: 'Bán lẻ',
      Icon: IconStore,
      iconColor: 'bg-emerald-50 border-emerald-200 text-emerald-600',
      path: CUSTOMER_ROUTES.adminStore,
    },
    {
      title: 'Làng nghề & Nghệ nhân',
      metric: '06 Đối tác',
      desc: 'Làng Đào Xá, Trúc Sơn,...',
      badge: 'Nguồn gốc',
      Icon: IconPackage,
      iconColor: 'bg-surface-secondary border-border text-ink',
      path: CUSTOMER_ROUTES.adminInstruments,
    },
    {
      title: 'An toàn Hệ thống',
      metric: 'Được bảo vệ',
      desc: 'Xác thực JWT & Phân quyền',
      badge: 'Bảo mật',
      Icon: IconShield,
      iconColor: 'bg-surface-secondary border-border-strong text-ink',
      path: CUSTOMER_ROUTES.adminSecurity,
    },
  ]

  // Main management navigation modules
  const quickActions = [
    {
      title: 'Danh mục nhạc cụ',
      description: 'Quản lý kho nhạc cụ truyền thống, cập nhật số lượng tồn, giá bán và nghệ nhân chế tác.',
      path: CUSTOMER_ROUTES.adminInstruments,
      Icon: IconInstrument,
      badge: 'Kho & Danh mục',
      tagColor: 'bg-brand-soft text-brand border-brand-border',
      iconBox: 'bg-brand-soft text-brand group-hover:bg-brand group-hover:text-white',
    },
    {
      title: 'Cửa hàng trực tuyến',
      description: 'Quản lý trạng thái mở bán, tiếp nhận và điều phối các đơn hàng đặt trực tuyến.',
      path: CUSTOMER_ROUTES.adminStore,
      Icon: IconStore,
      badge: 'Bán lẻ & Mua sắm',
      tagColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBox: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    },
    {
      title: 'Hồ sơ cá nhân',
      description: 'Xem và cập nhật thông tin cá nhân, chức vụ và quyền hạn của quản trị viên.',
      path: CUSTOMER_ROUTES.adminProfile,
      Icon: IconUser,
      badge: 'Thông tin cá nhân',
      tagColor: 'bg-surface-secondary text-ink border-border',
      iconBox: 'bg-surface-secondary text-ink group-hover:bg-ink group-hover:text-white',
    },
    {
      title: 'Bảo mật tài khoản',
      description: 'Thay đổi mật khẩu quản trị, cài đặt xác thực 2 bước và quản lý phiên máy trạm.',
      path: CUSTOMER_ROUTES.adminSecurity,
      Icon: IconLock,
      badge: 'An ninh & Mật khẩu',
      tagColor: 'bg-surface-secondary text-ink border-border-strong',
      iconBox: 'bg-surface-secondary text-ink group-hover:bg-ink group-hover:text-white',
    },
  ]

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* Modern Welcome Banner */}
      <div className="bg-gradient-to-r from-surface via-surface to-brand-soft/30 rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative overflow-hidden">
        {/* Subtle decorative motif */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-brand-soft/50 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col gap-2 relative z-10 max-w-2xl">
          <EditorialEyebrow label="Tổng quan hệ thống quản trị M4N" />

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink font-sans">
            Xin chào, <span className="text-brand">{user?.fullName || 'Quản trị viên'}</span>
          </h2>

          <p className="text-sm sm:text-base text-muted leading-relaxed">
            Trung tâm kiểm soát, vận hành và quản trị dữ liệu nhạc cụ truyền thống Việt Nam.
          </p>
        </div>

        {/* Live System Status Badges */}
        <div className="flex flex-wrap gap-2.5 relative z-10">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border shadow-2xs text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider leading-none">Trạng thái</span>
              <span className="font-bold text-jade mt-0.5 leading-tight">Đang hoạt động</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border shadow-2xs text-xs">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider leading-none">Phân quyền</span>
              <span className="font-bold text-ink mt-0.5 leading-tight">Quản trị viên (ADMIN)</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {stats.map((stat) => {
          const StatIcon = stat.Icon
          return (
            <div
              key={stat.title}
              onClick={() => navigateTo(stat.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigateTo(stat.path)
              }}
              className="flex items-start justify-between p-5 rounded-2xl bg-surface border border-border shadow-xs hover:shadow-md hover:border-brand/30 hover:-translate-y-0.5 transition-all cursor-pointer group"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-muted">{stat.title}</span>
                <p className="text-xl sm:text-2xl font-extrabold text-ink font-sans tracking-tight group-hover:text-brand transition-colors">
                  {stat.metric}
                </p>
                <span className="text-xs text-muted/80 mt-1">{stat.desc}</span>
              </div>
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform ${stat.iconColor}`}>
                <StatIcon size={22} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Action Modules Grid */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink tracking-tight">Chức năng quản trị khả dụng</h3>
          <span className="text-xs font-semibold text-muted">4 phân hệ chính</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {quickActions.map((action) => {
            const ActionIcon = action.Icon
            return (
              <button
                key={action.path}
                type="button"
                className="flex flex-col rounded-2xl bg-surface border border-border p-6 shadow-xs hover:shadow-lg hover:border-brand/40 hover:-translate-y-1 transition-all duration-300 text-left group cursor-pointer"
                onClick={() => navigateTo(action.path)}
              >
                {/* Header row with Icon and Badge */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-2xs ${action.iconBox}`}>
                    <ActionIcon size={24} />
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${action.tagColor}`}>
                    {action.badge}
                  </span>
                </div>

                {/* Content */}
                <h4 className="text-base sm:text-lg font-bold text-ink group-hover:text-brand transition-colors mb-1.5">
                  {action.title}
                </h4>
                <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-6">
                  {action.description}
                </p>

                {/* Footer Action */}
                <div className="mt-auto pt-3 border-t border-border/70 flex items-center justify-between text-xs font-bold text-brand w-full">
                  <span>Truy cập chức năng</span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <IconChevronRight size={15} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Operational Architecture & System Standards Notice */}
      <div className="rounded-2xl bg-surface border border-border p-6 sm:p-7 shadow-xs flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="flex flex-col gap-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-brand" />
            <h4 className="text-sm font-bold text-ink uppercase tracking-wider">
              Quy chuẩn Vận hành M4N
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            Hệ thống M4N áp dụng kiến trúc Thin Controllers và đồng bộ thời gian thực: Tồn kho chỉ được trừ khi xác nhận đơn hàng thành công, bảo mật xác thực máy chủ và bảo toàn thông tin văn hóa truyền thống.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-secondary text-ink hover:text-brand text-xs font-bold border border-border transition-colors cursor-pointer"
            onClick={() => navigateTo(CUSTOMER_ROUTES.adminInstruments)}
          >
            <IconPackage size={15} />
            <span>Quản lý Kho Nhạc cụ</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand text-white hover:bg-brand-hover text-xs font-bold transition-all shadow-xs cursor-pointer"
            onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
          >
            <IconStore size={15} />
            <span>Mở Trang Khách hàng</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage

