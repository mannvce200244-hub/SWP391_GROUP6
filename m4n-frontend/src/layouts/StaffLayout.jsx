import { useState, useRef, useEffect } from 'react'
import BrandLogo from '../components/common/BrandLogo.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'
import {
  IconUser,
  IconLock,
  IconLogOut,
  IconChevronDown,
} from '../components/ui/Icons.jsx'
import useToast from '../components/ui/useToast.js'

function StaffLayout({ children, pathname }) {
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
        message: 'Đã đăng xuất khỏi phiên làm việc nhân viên.',
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
          <div
            className="cursor-pointer flex items-center"
            role="button"
            tabIndex={0}
            onClick={() => navigateTo(CUSTOMER_ROUTES.staff)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigateTo(CUSTOMER_ROUTES.staff)
            }}
          >
            <BrandLogo />
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-jade-soft text-jade tracking-wider uppercase">NHÂN VIÊN ONLINE</span>
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="Điều hướng nhân viên">
          <button
            type="button"
            className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
              pathname === CUSTOMER_ROUTES.staff
                ? 'font-semibold bg-jade-soft text-jade'
                : 'font-medium text-ink hover:text-jade hover:bg-surface-secondary'
            }`}
            onClick={() => navigateTo(CUSTOMER_ROUTES.staff)}
          >
            Bàn làm việc
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-ink hover:text-jade hover:bg-surface-secondary transition-colors cursor-pointer"
            onClick={() => navigateTo(CUSTOMER_ROUTES.products)}
          >
            Kho nhạc cụ
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-ink hover:text-jade hover:bg-surface-secondary transition-colors cursor-pointer"
            onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
          >
            Xem website
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
            <div className="w-8 h-8 rounded-full bg-jade-soft text-jade font-bold text-sm flex items-center justify-center border border-jade-border">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            <span className="text-xs font-semibold text-ink hidden sm:inline">{user?.fullName || 'Nhân viên'}</span>
            <IconChevronDown size={14} className="text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-border shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95" role="menu">
              <div className="px-3.5 py-2 border-b border-border/60 bg-surface-secondary/40 flex flex-col mb-1 text-xs">
                <strong className="text-ink truncate">{user?.fullName || 'Nhân viên'}</strong>
                <span className="text-muted truncate">{user?.email}</span>
              </div>
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-jade transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false)
                  navigateTo(CUSTOMER_ROUTES.profile)
                }}
              >
                <IconUser size={16} />
                <span>Hồ sơ cá nhân</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-jade transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false)
                  navigateTo(CUSTOMER_ROUTES.security)
                }}
              >
                <IconLock size={16} />
                <span>Bảo mật tài khoản</span>
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-brand hover:bg-brand-soft transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={handleLogout}
              >
                <IconLogOut size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  )
}

export default StaffLayout
