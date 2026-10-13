import useAuth from '../features/auth/useAuth.js'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import {
  IconInstrument,
  IconUser,
  IconLock,
  IconStore,
  IconChevronRight,
  IconPackage,
  IconCheck,
  IconAlertCircle,
} from '../components/ui/Icons.jsx'

function StaffDashboardPage() {
  const { user } = useAuth()

  const staffModules = [
    {
      title: 'Tra cứu danh mục sản phẩm',
      description: 'Kiểm tra thông số kỹ thuật, âm sắc, chất liệu và nghệ nhân để tư vấn khách mua đàn.',
      path: CUSTOMER_ROUTES.products,
      Icon: IconInstrument,
      badge: 'Kho di sản',
      accentColor: 'text-[#1F6B5A]',
      accentBg: 'bg-emerald-50',
    },
    {
      title: 'Xem website mua sắm',
      description: 'Trải nghiệm giao diện và quy trình đặt hàng dưới góc nhìn của khách hàng trực tuyến.',
      path: CUSTOMER_ROUTES.home,
      Icon: IconStore,
      badge: 'Khách hàng',
      accentColor: 'text-[#0D9488]',
      accentBg: 'bg-teal-50',
    },
    {
      title: 'Hồ sơ nhân viên',
      description: 'Cập nhật số điện thoại và thông tin liên lạc nội bộ của bạn trong hệ thống.',
      path: CUSTOMER_ROUTES.profile,
      Icon: IconUser,
      badge: 'Cá nhân',
      accentColor: 'text-sky-600',
      accentBg: 'bg-sky-50',
    },
    {
      title: 'Bảo mật ca làm việc',
      description: 'Đổi mật khẩu định kỳ và quản trị phiên đăng nhập an toàn theo tiêu chuẩn bảo mật.',
      path: CUSTOMER_ROUTES.security,
      Icon: IconLock,
      badge: 'Bảo mật',
      accentColor: 'text-indigo-600',
      accentBg: 'bg-indigo-50',
    },
  ]

  const operationalGuidelines = [
    {
      title: 'Quy chuẩn đóng gói & Bảo hiểm nhạc cụ',
      desc: 'Mọi nhạc cụ dây (Đàn Tranh, Đàn Bầu, Đàn Nguyệt) đều phải bọc 3 lớp chống sốc và kèm phiếu bảo hành nghệ nhân.',
    },
    {
      title: 'Tư vấn nhiệt độ & Độ ẩm bảo quản gỗ',
      desc: 'Nhắc khách hàng giữ đàn ở độ ẩm 50%–65%, tránh ánh nắng trực tiếp hoặc để quá gần luồng gió điều hòa mạnh.',
    },
    {
      title: 'Chính sách thẩm định âm sắc làng nghề',
      desc: 'Khách hàng được hỗ trợ đổi trả trong 7 ngày nếu âm sắc không đạt chuẩn hoặc có vết nứt vỡ do vận chuyển.',
    },
  ]

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Greeting & Shift Status Banner */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F6B5A]">
              Bàn Làm Việc Online
            </span>
            <span className="text-zinc-300">/</span>
            <span className="text-xs text-muted font-medium">Bán lẻ & Tư vấn di sản</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
            Xin chào, {user?.fullName || 'Nhân viên'}
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Khu vực thao tác và quản lý danh mục dành cho nhân viên bán lẻ trực tuyến M4N.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col px-4 py-2 rounded-xl bg-[#F5F7FA] border border-border text-xs">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              Tài khoản ca trực
            </span>
            <span className="font-bold text-ink mt-0.5 font-mono">{user?.email}</span>
          </div>
          <div className="flex flex-col px-4 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
              Trạng thái
            </span>
            <span className="font-bold text-[#1F6B5A] mt-0.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Đang trong ca trực
            </span>
          </div>
        </div>
      </div>

      {/* Staff Operational Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Kênh hỗ trợ online</span>
            <p className="text-2xl font-extrabold text-[#1F6B5A]">Sẵn sàng</p>
            <span className="text-xs text-emerald-700 font-medium mt-0.5">Tiếp nhận yêu cầu tư vấn</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-[#1F6B5A] flex items-center justify-center shrink-0">
            <IconCheck size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Mẫu nhạc cụ hiển thị</span>
            <p className="text-2xl font-extrabold text-ink">8 mẫu di sản</p>
            <span className="text-xs text-zinc-500 mt-0.5">Làng Đào Xá, Trúc Sơn, Đọi Tam</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 flex items-center justify-center shrink-0">
            <IconPackage size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Cảnh báo tồn kho</span>
            <p className="text-2xl font-extrabold text-amber-600">3 mẫu</p>
            <span className="text-xs text-amber-600 font-medium mt-0.5">Lưu ý trước khi chốt đơn</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <IconAlertCircle size={20} />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-border shadow-xs flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Phiên đăng nhập</span>
            <p className="text-2xl font-extrabold text-ink">Bảo mật cao</p>
            <span className="text-xs text-zinc-500 mt-0.5">Xác thực token JWT an toàn</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <IconLock size={20} />
          </div>
        </div>
      </div>

      {/* Quick Action Modules */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-ink">Chức năng làm việc nội bộ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {staffModules.map((item) => {
            const ItemIcon = item.Icon
            return (
              <button
                key={item.path}
                type="button"
                className="flex flex-col rounded-2xl bg-white border border-border p-5 shadow-xs hover:shadow-md hover:border-zinc-300 transition-all duration-200 text-left group cursor-pointer"
                onClick={() => navigateTo(item.path)}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className={`w-10 h-10 rounded-xl ${item.accentBg} ${item.accentColor} flex items-center justify-center transition-colors`}>
                    <ItemIcon size={20} />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-zinc-100 text-zinc-600 uppercase tracking-wider">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-ink group-hover:text-[#1F6B5A] transition-colors mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-4">
                  {item.description}
                </p>
                <div className="mt-auto pt-3 border-t border-border/80 flex items-center justify-between text-xs font-semibold text-[#1F6B5A] w-full">
                  <span>Mở chức năng</span>
                  <IconChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Guidelines & Cultural Knowledge Section */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#1F6B5A] flex items-center justify-center font-bold text-xs">
            📖
          </span>
          <h2 className="text-base font-bold text-ink">
            Quy chuẩn tư vấn & Lưu ý nhạc cụ truyền thống
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operationalGuidelines.map((g, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-[#F5F7FA] border border-border flex flex-col gap-1.5">
              <span className="text-xs font-bold text-ink">{g.title}</span>
              <p className="text-xs text-muted leading-relaxed">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StaffDashboardPage
