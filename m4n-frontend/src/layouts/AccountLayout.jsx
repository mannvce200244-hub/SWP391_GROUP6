import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'
import {
  IconUser,
  IconLock,
  IconDashboard,
  IconPackage,
  IconCreditCard,
  IconLogOut,
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

  // Only display badge for privileged roles; never show giant CUSTOMER badge
  const isPrivileged = user?.role && user.role !== 'CUSTOMER'
  const roleLabel = isPrivileged ? roleLabels[user.role] || user.role : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <aside className="lg:col-span-4 bg-surface rounded-2xl border border-border p-6 shadow-xs flex flex-col gap-6">
          <div className="flex items-center gap-4 pb-6 border-b border-border/60">
            <div className="w-14 h-14 rounded-full bg-brand-soft text-brand font-bold text-xl flex items-center justify-center shrink-0 border border-brand-border" aria-hidden="true">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <h2 className="text-base font-bold text-ink truncate">{user?.fullName || 'Tài khoản M4N'}</h2>
              <p className="text-xs text-muted truncate">{user?.email}</p>
              {roleLabel && (
                <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-brand-soft text-brand self-start">{roleLabel}</span>
              )}
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 list-none p-0 m-0" aria-label="Điều hướng tài khoản">
            <button
              type="button"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors w-full text-left cursor-pointer ${
                activeTab === 'profile'
                  ? 'font-semibold bg-brand-soft text-brand'
                  : 'font-medium text-ink hover:text-brand hover:bg-surface-secondary'
              }`}
              onClick={() => navigateTo(CUSTOMER_ROUTES.profile)}
            >
              <IconUser size={18} className="shrink-0" />
              <span>Hồ sơ cá nhân</span>
            </button>

            <button
              type="button"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm transition-colors w-full text-left cursor-pointer ${
                activeTab === 'security'
                  ? 'font-semibold bg-brand-soft text-brand'
                  : 'font-medium text-ink hover:text-brand hover:bg-surface-secondary'
              }`}
              onClick={() => navigateTo(CUSTOMER_ROUTES.security)}
            >
              <IconLock size={18} className="shrink-0" />
              <span>Bảo mật tài khoản</span>
            </button>

            {user?.role === 'ADMIN' && (
              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-ink hover:text-brand hover:bg-surface-secondary transition-colors w-full text-left cursor-pointer"
                onClick={() => navigateTo(CUSTOMER_ROUTES.admin)}
              >
                <IconDashboard size={18} className="shrink-0" />
                <span>Bàn làm việc Quản trị</span>
              </button>
            )}

            {user?.role === 'ONLINE_STAFF' && (
              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-ink hover:text-brand hover:bg-surface-secondary transition-colors w-full text-left cursor-pointer"
                onClick={() => navigateTo(CUSTOMER_ROUTES.staff)}
              >
                <IconPackage size={18} className="shrink-0" />
                <span>Bàn làm việc Nhân viên</span>
              </button>
            )}

            {user?.role === 'POS_STAFF' && (
              <button
                type="button"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-ink hover:text-brand hover:bg-surface-secondary transition-colors w-full text-left cursor-pointer"
                onClick={() => navigateTo(CUSTOMER_ROUTES.pos)}
              >
                <IconCreditCard size={18} className="shrink-0" />
                <span>Giao diện Thu ngân POS</span>
              </button>
            )}

            <div className="my-2 border-t border-border" role="separator" />

            <button
              type="button"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-brand hover:bg-brand-soft transition-colors w-full text-left cursor-pointer"
              onClick={handleLogout}
            >
              <IconLogOut size={18} className="shrink-0" />
              <span>Đăng xuất</span>
            </button>
          </nav>
        </aside>

        <section className="lg:col-span-8">
          {children}
        </section>
      </div>
    </div>
  )
}

export default AccountLayout
