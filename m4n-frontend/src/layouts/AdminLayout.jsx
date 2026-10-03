import { useState, useRef, useEffect } from 'react'
import BrandLogo from '../components/common/BrandLogo.jsx'
import { CUSTOMER_ROUTES, navigateTo } from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'
import {
  IconDashboard,
  IconInstrument,
  IconStore,
  IconUser,
  IconLock,
  IconLogOut,
  IconChevronDown,
} from '../components/ui/Icons.jsx'
import useToast from '../components/ui/useToast.js'

function AdminLayout({ children, pathname }) {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
        message: 'Đã đăng xuất khỏi tài khoản Quản trị.',
        type: 'info',
      })
      navigateTo(CUSTOMER_ROUTES.login)
    } catch {
      navigateTo(CUSTOMER_ROUTES.login)
    }
  }

  const navItems = [
    { label: 'Tổng quan hệ thống', path: CUSTOMER_ROUTES.admin, Icon: IconDashboard },
    { label: 'Danh mục nhạc cụ', path: CUSTOMER_ROUTES.products, Icon: IconInstrument },
    { label: 'Cửa hàng trực tuyến', path: CUSTOMER_ROUTES.home, Icon: IconStore },
    { label: 'Hồ sơ cá nhân', path: CUSTOMER_ROUTES.profile, Icon: IconUser },
    { label: 'Bảo mật tài khoản', path: CUSTOMER_ROUTES.security, Icon: IconLock },
  ]

  const getPageTitle = () => {
    const current = navItems.find((item) => item.path === pathname)
    return current ? current.label : 'Trung tâm Quản trị'
  }

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Light Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 px-6 border-b border-border/70 flex items-center justify-between">
          <div
            className="cursor-pointer flex items-center"
            role="button"
            tabIndex={0}
            onClick={() => navigateTo(CUSTOMER_ROUTES.admin)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigateTo(CUSTOMER_ROUTES.admin)
            }}
          >
            <BrandLogo />
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-brand-soft text-brand tracking-wider">ADMIN</span>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto" aria-label="Điều hướng quản trị">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted/80">QUẢN TRỊ VIÊN</div>
          {navItems.map((item) => {
            const isActive = pathname === item.path
            const ItemIcon = item.Icon
            return (
              <button
                key={item.path}
                type="button"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left cursor-pointer ${
                  isActive
                    ? 'font-semibold bg-brand-soft text-brand'
                    : 'font-medium text-ink hover:text-brand hover:bg-surface-secondary'
                }`}
                onClick={() => {
                  setMobileMenuOpen(false)
                  navigateTo(item.path)
                }}
              >
                <ItemIcon size={18} className="shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border/70">
          <button
            type="button"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-brand hover:bg-brand-soft transition-colors w-full text-left cursor-pointer"
            onClick={handleLogout}
          >
            <IconLogOut size={18} className="shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-ink hover:bg-surface-secondary text-lg leading-none cursor-pointer"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Mở danh mục điều hướng"
            >
              ☰
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted font-medium">M4N Admin</span>
              <span className="text-muted/60">/</span>
              <h1 className="font-bold text-ink text-base">{getPageTitle()}</h1>
            </div>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer text-left"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-brand-soft text-brand font-bold text-sm flex items-center justify-center border border-brand-border">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-xs font-bold text-ink">
                  {user?.fullName || 'Quản trị viên'}
                </span>
                <span className="text-[10px] text-muted mt-0.5">Quản trị</span>
              </div>
              <IconChevronDown size={14} className="text-muted" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface rounded-xl border border-border shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95" role="menu">
                <div className="px-3.5 py-2 border-b border-border/60 bg-surface-secondary/40 flex flex-col mb-1 text-xs">
                  <strong className="text-ink truncate">{user?.fullName || 'Quản trị viên'}</strong>
                  <span className="text-muted truncate">{user?.email}</span>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-brand transition-colors w-full text-left cursor-pointer"
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
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-brand transition-colors w-full text-left cursor-pointer"
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
