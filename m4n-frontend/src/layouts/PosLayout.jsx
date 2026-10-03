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

function PosLayout({ children }) {
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
          <div
            className="cursor-pointer flex items-center"
            role="button"
            tabIndex={0}
            onClick={() => navigateTo(CUSTOMER_ROUTES.pos)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigateTo(CUSTOMER_ROUTES.pos)
            }}
          >
            <BrandLogo />
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-ochre-soft text-ochre tracking-wider uppercase">THU NGÂN SHOWROOM</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border text-xs font-semibold text-ink">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Terminal 01 · Sẵn sàng</span>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer text-left"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-8 h-8 rounded-full bg-ochre-soft text-ochre font-bold text-sm flex items-center justify-center border border-ochre-border">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'P'}
            </div>
            <span className="text-xs font-semibold text-ink hidden sm:inline">{user?.fullName || 'Thu ngân'}</span>
            <IconChevronDown size={14} className="text-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-border shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95" role="menu">
              <div className="px-3.5 py-2 border-b border-border/60 bg-surface-secondary/40 flex flex-col mb-1 text-xs">
                <strong className="text-ink truncate">{user?.fullName || 'Thu ngân'}</strong>
                <span className="text-muted truncate">{user?.email}</span>
              </div>
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-ochre transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false)
                  navigateTo(CUSTOMER_ROUTES.profile)
                }}
              >
                <IconUser size={16} />
                <span>Hồ sơ nhân viên</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-ochre transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={() => {
                  setDropdownOpen(false)
                  navigateTo(CUSTOMER_ROUTES.security)
                }}
              >
                <IconLock size={16} />
                <span>Bảo mật ca trực</span>
              </button>
              <div className="my-1 border-t border-border" />
              <button
                type="button"
                className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-brand hover:bg-brand-soft transition-colors w-full text-left cursor-pointer"
                role="menuitem"
                onClick={handleLogout}
              >
                <IconLogOut size={16} />
                <span>Đăng xuất ca làm việc</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
    </div>
  )
}

export default PosLayout
