import { useState, useRef, useEffect } from 'react'
import BrandLogo from '../components/common/BrandLogo.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'
import {
  UserRound,
  Lock,
  LogOut,
  ChevronDown,
  History,
  ShoppingCart,
} from 'lucide-react'
import useToast from '../components/ui/useToast.js'

function PosLayout({ children, pathname }) {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      addToast({
        message: 'Đã kết thúc ca trực thu ngân.',
        type: 'info',
      })
      navigateTo(CUSTOMER_ROUTES.login)
    } catch {
      navigateTo(CUSTOMER_ROUTES.login)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex cursor-pointer items-center"
            onClick={() => navigateTo(CUSTOMER_ROUTES.pos)}
            aria-label="Về màn hình bán hàng POS"
          >
            <BrandLogo />
          </button>
          <span className="hidden px-2 py-0.5 text-xs font-semibold rounded bg-surface-secondary text-ink border border-border tracking-wide uppercase lg:inline">THU NGÂN SHOWROOM</span>
        </div>

        <nav className="hidden sm:flex items-center gap-1 rounded-lg border border-border bg-surface-secondary p-1" aria-label="Điều hướng POS">
          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.pos)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${pathname === CUSTOMER_ROUTES.pos ? 'bg-white text-brand shadow-xs' : 'text-secondary hover:text-ink'}`}
          >
            <ShoppingCart size={14} aria-hidden="true" /> Bán hàng
          </button>
          <button
            type="button"
            onClick={() => navigateTo(CUSTOMER_ROUTES.posHistory)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${pathname === CUSTOMER_ROUTES.posHistory ? 'bg-white text-brand shadow-xs' : 'text-secondary hover:text-ink'}`}
          >
            <History size={14} aria-hidden="true" /> Lịch sử giao dịch
          </button>
        </nav>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer text-left"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-surface-secondary text-ink font-bold text-sm flex items-center justify-center border border-border">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <span className="text-xs font-semibold text-ink hidden sm:inline">{user?.fullName || 'Thu ngân'}</span>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-border shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95" role="menu">
              <div className="px-3.5 py-2 border-b border-border/60 bg-surface-secondary/40 flex flex-col mb-1 text-xs">
                <strong className="text-ink truncate">{user?.fullName || 'Thu ngân'}</strong>
                <span className="text-muted truncate">{user?.email}</span>
              </div>
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] font-medium text-ink hover:bg-surface-secondary hover:text-brand transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false)
                  navigateTo(CUSTOMER_ROUTES.profile)
                }}
              >
                <UserRound size={16} aria-hidden="true" />
                <span>Hồ sơ nhân viên</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] font-medium text-ink hover:bg-surface-secondary hover:text-brand transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false)
                  navigateTo(CUSTOMER_ROUTES.security)
                }}
              >
                <Lock size={16} aria-hidden="true" />
                <span>Bảo mật ca trực</span>
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-[13.5px] font-medium text-brand hover:bg-brand-soft transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={handleLogout}
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Đăng xuất ca làm việc</span>
              </button>
            </div>
          )}
        </div>
      </header>

 feature/product-master-data
      <nav className="grid grid-cols-2 border-b border-border bg-white p-2 sm:hidden" aria-label="Điều hướng POS trên thiết bị di động">
        <button
          type="button"
          onClick={() => navigateTo(CUSTOMER_ROUTES.pos)}
          className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold ${pathname === CUSTOMER_ROUTES.pos ? 'bg-brand-soft text-brand' : 'text-secondary'}`}
        >
          <ShoppingCart size={15} aria-hidden="true" /> Bán hàng
        </button>
        <button
          type="button"
          onClick={() => navigateTo(CUSTOMER_ROUTES.posHistory)}
          className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold ${pathname === CUSTOMER_ROUTES.posHistory ? 'bg-brand-soft text-brand' : 'text-secondary'}`}
        >
          <History size={15} aria-hidden="true" /> Lịch sử giao dịch
        </button>
      </nav>

=======
 main
      <main className="flex-1 p-3 sm:p-4 lg:p-5 w-full min-w-0">{children}</main>
    </div>
  )
}

export default PosLayout
