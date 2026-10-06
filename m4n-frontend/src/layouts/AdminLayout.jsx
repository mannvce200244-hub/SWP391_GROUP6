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

  const primaryNav = [
    { label: 'Tổng quan hệ thống', path: CUSTOMER_ROUTES.admin, Icon: IconDashboard },
    { label: 'Danh mục nhạc cụ', path: CUSTOMER_ROUTES.adminInstruments, Icon: IconInstrument },
    { label: 'Cửa hàng trực tuyến', path: CUSTOMER_ROUTES.adminStore, Icon: IconStore },
  ]

  const accountNav = [
    { label: 'Hồ sơ cá nhân', path: CUSTOMER_ROUTES.adminProfile, Icon: IconUser },
    { label: 'Bảo mật tài khoản', path: CUSTOMER_ROUTES.adminSecurity, Icon: IconLock },
  ]

  const allNav = [...primaryNav, ...accountNav]

  const getPageTitle = () => {
    const current = allNav.find((item) => item.path === pathname)
    return current ? current.label : 'Trung tâm Quản trị'
  }

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modern Light Sidebar */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} shadow-xs`}>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-border/80 flex items-center justify-between">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-brand-soft text-brand border border-brand-border/80 tracking-wider">
            ADMIN
          </span>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-3.5 flex flex-col gap-6 overflow-y-auto" aria-label="Điều hướng quản trị">
          {/* Section 1: Operations */}
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted/70 mb-1">
              ĐIỀU HÀNH & KHO
            </span>
            {primaryNav.map((item) => {
              const isActive = pathname === item.path
              const ItemIcon = item.Icon
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full text-left cursor-pointer group ${
                    isActive
                      ? 'font-bold bg-brand-soft text-brand shadow-2xs border border-brand-border/60'
                      : 'font-medium text-ink hover:text-brand hover:bg-surface-secondary'
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigateTo(item.path)
                  }}
                >
                  <ItemIcon size={18} className={`shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-brand' : 'text-muted group-hover:text-brand'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand ml-auto shrink-0" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Section 2: Account & Security */}
          <div className="flex flex-col gap-1">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted/70 mb-1">
              TÀI KHOẢN QUẢN TRỊ
            </span>
            {accountNav.map((item) => {
              const isActive = pathname === item.path
              const ItemIcon = item.Icon
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all w-full text-left cursor-pointer group ${
                    isActive
                      ? 'font-bold bg-brand-soft text-brand shadow-2xs border border-brand-border/60'
                      : 'font-medium text-ink hover:text-brand hover:bg-surface-secondary'
                  }`}
                  onClick={() => {
                    setMobileMenuOpen(false)
                    navigateTo(item.path)
                  }}
                >
                  <ItemIcon size={18} className={`shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-brand' : 'text-muted group-hover:text-brand'}`} />
                  <span className="truncate">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand ml-auto shrink-0" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        </nav>

        {/* Sidebar Bottom Profile Widget */}
        <div className="p-3 border-t border-border/80 bg-surface-secondary/40">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface border border-border/70 shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand font-bold text-xs flex items-center justify-center border border-brand-border shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-ink truncate leading-tight">
                  {user?.fullName || 'Quản trị viên'}
                </span>
                <span className="text-[10px] text-muted truncate">admin@m4n.vn</span>
              </div>
            </div>
            <button
              type="button"
              className="p-1.5 rounded-lg text-muted hover:text-brand hover:bg-brand-soft transition-colors shrink-0 cursor-pointer"
              onClick={handleLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <IconLogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Stage */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs backdrop-blur-md">
          {/* Left: Breadcrumbs & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-ink hover:bg-surface-secondary text-lg leading-none cursor-pointer border border-border"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Mở menu điều hướng"
            >
              ☰
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs font-semibold text-muted hover:text-ink cursor-pointer" onClick={() => navigateTo(CUSTOMER_ROUTES.admin)}>
                M4N Admin
              </span>
              <span className="text-muted/50 text-xs">/</span>
              <h1 className="font-bold text-ink text-sm sm:text-base tracking-tight">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Right: Quick actions & Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Storefront Link Shortcut */}
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-ink hover:text-brand hover:bg-surface-secondary transition-colors cursor-pointer"
              onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
              title="Xem cửa hàng khách hàng"
            >
              <IconStore size={14} className="text-muted" />
              <span>Xem Cửa hàng</span>
              <span className="text-[10px] text-muted">↗</span>
            </button>

            {/* System Status Pill */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-jade-soft border border-jade-border text-jade text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống: Sẵn sàng</span>
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-secondary border border-transparent hover:border-border transition-colors cursor-pointer text-left"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-brand-soft text-brand font-bold text-xs flex items-center justify-center border border-brand-border shadow-2xs">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-bold text-ink truncate max-w-[120px]">
                    {user?.fullName || 'Quản trị viên'}
                  </span>
                  <span className="text-[10px] text-brand font-semibold">ADMIN</span>
                </div>
                <IconChevronDown size={14} className="text-muted" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-surface rounded-2xl border border-border shadow-xl py-2 z-50 animate-in fade-in zoom-in-95" role="menu">
                  <div className="px-4 py-2.5 border-b border-border/70 bg-surface-secondary/50 flex flex-col mb-1 text-xs">
                    <strong className="text-ink text-sm truncate">{user?.fullName || 'Quản trị viên'}</strong>
                    <span className="text-muted truncate">{user?.email}</span>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-brand-soft text-brand self-start">
                      Quản trị viên (ADMIN)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-brand transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigateTo(CUSTOMER_ROUTES.adminProfile)
                    }}
                  >
                    <IconUser size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink hover:bg-surface-secondary hover:text-brand transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigateTo(CUSTOMER_ROUTES.adminSecurity)
                    }}
                  >
                    <IconLock size={16} />
                    <span>Bảo mật tài khoản</span>
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-brand hover:bg-brand-soft transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <IconLogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

