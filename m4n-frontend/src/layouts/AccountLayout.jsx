import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'
import {
  IconUser,
  IconShield,
  IconLogOut,
  IconPackage,
  IconChevronRight,
} from '../components/ui/Icons.jsx'
import useToast from '../components/ui/useToast.js'

function AccountLayout({ children, activeTab = 'profile' }) {
  const { user, logout } = useAuth()
  const { addToast } = useToast()

  const handleLogout = async () => {
    try {
      await logout()
      addToast({
        message: 'Đã đăng xuất khỏi tài khoản an toàn.',
        type: 'info',
      })
      navigateTo(CUSTOMER_ROUTES.login)
    } catch {
      navigateTo(CUSTOMER_ROUTES.login)
    }
  }

  const roleLabels = {
    ADMIN: 'Quản trị viên',
    ONLINE_STAFF: 'Nhân viên Online',
    POS_STAFF: 'Nhân viên Showroom POS',
  }

  const isPrivileged = user?.role && user.role !== 'CUSTOMER'
  const roleLabel = isPrivileged ? roleLabels[user.role] || user.role : null

  const getInitials = (name) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className="w-full bg-surface-secondary/40 min-h-[calc(100vh-80px)] py-8 sm:py-12">
      {/* Main Content Layout */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:gap-8 items-start">
          
          {/* Left Sidebar Menu */}
          <aside className="w-full shrink-0 lg:w-72">
            <div className="rounded-[28px] bg-white border border-border/80 p-4 shadow-sm space-y-4">
              
              {/* User Identity Mini Card */}
              <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border/60 flex items-center gap-3.5">
                <div
                  className="w-13 h-13 rounded-full flex items-center justify-center shrink-0 font-black text-lg bg-brand text-white shadow-sm ring-4 ring-brand-soft select-none"
                  aria-hidden="true"
                >
                  {getInitials(user?.fullName || user?.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink truncate font-sans">
                    {user?.fullName || 'Tài khoản M4N'}
                  </p>
                  <p className="text-xs text-muted truncate mt-0.5" title={user?.email}>
                    {user?.email}
                  </p>
                  {roleLabel ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-soft text-brand border border-brand-border mt-1.5">
                      {roleLabel}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white text-muted border border-border mt-1.5">
                      Thành viên M4N
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1.5" aria-label="Điều hướng tài khoản">
                <button
                  type="button"
                  className={`group relative flex min-h-12 items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'profile'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-muted hover:text-ink hover:bg-surface-secondary/80'
                  }`}
                  onClick={() => navigateTo(CUSTOMER_ROUTES.profile)}
                >
                  <span className="flex items-center gap-3">
                    <IconUser
                      size={18}
                      className={activeTab === 'profile' ? 'text-white' : 'text-subtle group-hover:text-ink'}
                    />
                    <span>Hồ sơ cá nhân</span>
                  </span>
                  <IconChevronRight
                    size={16}
                    className={`transition-transform ${
                      activeTab === 'profile' ? 'text-white' : 'text-subtle opacity-50 group-hover:opacity-100'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  className={`group relative flex min-h-12 items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-muted hover:text-ink hover:bg-surface-secondary/80'
                  }`}
                  onClick={() => navigateTo(CUSTOMER_ROUTES.security)}
                >
                  <span className="flex items-center gap-3">
                    <IconShield
                      size={18}
                      className={activeTab === 'security' ? 'text-white' : 'text-subtle group-hover:text-ink'}
                    />
                    <span>Bảo mật & Mật khẩu</span>
                  </span>
                  <IconChevronRight
                    size={16}
                    className={`transition-transform ${
                      activeTab === 'security' ? 'text-white' : 'text-subtle opacity-50 group-hover:opacity-100'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  className={`group relative flex min-h-12 items-center justify-between gap-3 rounded-[18px] px-4 py-3 text-left text-sm font-bold transition-all cursor-pointer ${
                    activeTab === 'orders'
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'text-muted hover:text-ink hover:bg-surface-secondary/80'
                  }`}
                  onClick={() => navigateTo(CUSTOMER_ROUTES.orders)}
                >
                  <span className="flex items-center gap-3">
                    <IconPackage
                      size={18}
                      className={activeTab === 'orders' ? 'text-white' : 'text-subtle group-hover:text-ink'}
                    />
                    <span>Đơn hàng của tôi</span>
                  </span>
                  <IconChevronRight
                    size={16}
                    className={`transition-transform ${
                      activeTab === 'orders' ? 'text-white' : 'text-subtle opacity-50 group-hover:opacity-100'
                    }`}
                  />
                </button>
              </nav>

              {/* Logout Action */}
              <div className="pt-2 border-t border-border/80">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2.5 px-4 py-3 text-sm font-bold rounded-[18px] text-muted hover:text-brand hover:bg-brand-soft border border-border/80 hover:border-brand-border transition-all w-full cursor-pointer"
                  onClick={handleLogout}
                >
                  <IconLogOut size={16} className="shrink-0" />
                  <span>Đăng xuất tài khoản</span>
                </button>
              </div>

            </div>
          </aside>

          {/* Right Main Content Card */}
          <main className="flex-1 w-full min-w-0 rounded-[32px] border border-border/80 bg-white p-6 sm:p-10 shadow-sm relative overflow-hidden">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}

export default AccountLayout
