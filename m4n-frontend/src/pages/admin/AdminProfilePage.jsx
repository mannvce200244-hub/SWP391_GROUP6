import { useState } from 'react'
import useAuth from '../../features/auth/useAuth.js'
import useToast from '../../components/ui/useToast.js'
import {
  IconUser,
  IconCheck,
  IconShield,
  IconPackage,
  IconStore,
  IconCreditCard,
} from '../../components/ui/Icons.jsx'

function AdminProfilePage() {
  const { user } = useAuth()
  const { addToast } = useToast()

  const [formData, setFormData] = useState({
    fullName: user?.fullName || 'Nguyễn Quang Minh',
    email: user?.email || 'admin@m4n.vn',
    phone: '0908 123 456',
    department: 'Ban Điều Hành & Vận Hành Kho Di Sản',
    position: 'Trưởng ban Vận hành Hệ thống',
    bio: 'Phụ trách toàn bộ quy trình tiếp nhận nhạc cụ di sản từ nghệ nhân làng nghề Đào Xá, Trúc Sơn và quản lý kênh bán lẻ trực tuyến M4N.',
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
      addToast({
        message: 'Đã lưu và cập nhật thông tin hồ sơ quản trị viên thành công.',
        type: 'success',
      })
    }, 400)
  }

  const permissions = [
    {
      title: 'Quản lý kho & Danh mục di sản',
      desc: 'Toàn quyền thêm mới, chỉnh sửa thông số kỹ thuật, cập nhật giá và tồn kho nhạc cụ.',
      Icon: IconPackage,
      status: 'Toàn quyền',
    },
    {
      title: 'Điều phối đơn hàng trực tuyến',
      desc: 'Tiếp nhận đơn hàng online, phê duyệt yêu cầu chế tác và điều phối vận chuyển bảo hiểm.',
      Icon: IconStore,
      status: 'Toàn quyền',
    },
    {
      title: 'Xác nhận thanh toán & Đối soát',
      desc: 'Theo dõi dòng tiền chuyển khoản QR, COD và phê duyệt hóa đơn nhạc cụ.',
      Icon: IconCreditCard,
      status: 'Toàn quyền',
    },
    {
      title: 'An ninh & Phân quyền nhân viên',
      desc: 'Cấp quyền truy cập cho nhân viên trực tuyến (Staff), nhân viên POS và giám sát an ninh.',
      Icon: IconShield,
      status: 'Toàn quyền',
    },
  ]

  const recentActivities = [
    { time: '17/09/2026 21:42', action: 'Cập nhật tồn kho nhạc cụ Đàn Tranh 19 Dây (TRN-CL-19)' },
    { time: '17/09/2026 19:20', action: 'Phê duyệt đơn hàng #M4N-2026-088 và chuyển nghệ nhân chế tác' },
    { time: '17/09/2026 14:35', action: 'Đăng nhập thành công từ máy trạm Chrome (IP: 192.168.1.10)' },
    { time: '16/09/2026 09:10', action: 'Cập nhật giá bán niêm yết Đàn Bầu Mun Thân Liền' },
  ]

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-5xl">
      {/* Header Section */}
      <div className="flex flex-col gap-1 bg-white rounded-2xl border border-border p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0D9488]">
            Hệ thống Quản trị M4N
          </span>
          <span className="text-zinc-300">/</span>
          <span className="text-xs text-muted font-medium">Hồ sơ cá nhân</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight font-sans">
          Hồ sơ Cá nhân Quản trị viên
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Thông tin nhận diện tài khoản, bộ phận công tác và thẩm quyền vận hành hệ thống nhạc cụ M4N.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-teal-50 border-2 border-teal-200 text-[#0D9488] flex items-center justify-center font-bold text-3xl shadow-sm shrink-0">
          {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'A'}
        </div>

        <div className="flex flex-col gap-1 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-ink">{formData.fullName}</h2>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#0D9488] text-white uppercase tracking-wider">
              ADMINISTRATOR
            </span>
          </div>

          <p className="text-sm text-zinc-500 font-medium">{formData.email}</p>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Tài khoản đang hoạt động
            </span>
            <span>•</span>
            <span>Bộ phận: {formData.department}</span>
          </div>
        </div>
      </div>

      {/* Main Form and Permissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left 2 Cols: Edit Profile Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 sm:p-7 shadow-xs">
          <h3 className="text-base font-bold text-ink mb-5 pb-3 border-b border-border flex items-center gap-2">
            <IconUser size={18} className="text-[#0D9488]" />
            <span>Thông tin chi tiết quản trị viên</span>
          </h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Email quản trị (Định danh)
                </label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-100 border border-border text-zinc-400 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Số điện thoại nội bộ
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Vị trí công tác
                </label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] font-medium"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Ban / Bộ phận phụ trách
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Ghi chú trách nhiệm công việc
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="px-3.5 py-2.5 rounded-xl bg-[#F5F7FA] border border-border text-ink focus:outline-hidden focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488] leading-relaxed font-normal"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0D9488] hover:bg-[#0F766E] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <IconCheck size={16} />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Permissions & Responsibilities */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs flex flex-col gap-4">
            <h3 className="text-base font-bold text-ink pb-2 border-b border-border flex items-center gap-2">
              <IconShield size={18} className="text-[#0D9488]" />
              <span>Thẩm quyền Quản trị (Admin)</span>
            </h3>

            <div className="flex flex-col gap-3">
              {permissions.map((perm, idx) => {
                const PermIcon = perm.Icon
                return (
                  <div key={idx} className="p-3 rounded-xl bg-[#F5F7FA] border border-border flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PermIcon size={15} className="text-[#0D9488]" />
                        <span className="text-xs font-bold text-ink">{perm.title}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {perm.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed mt-0.5">{perm.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activity Log Mini Widget */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-xs flex flex-col gap-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Nhật ký hoạt động gần đây
            </h4>
            <div className="flex flex-col gap-2.5 divide-y divide-border/60">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex flex-col gap-0.5 text-xs">
                  <span className="text-[10px] text-zinc-400 font-mono">{act.time}</span>
                  <span className="text-ink font-medium leading-snug">{act.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProfilePage
