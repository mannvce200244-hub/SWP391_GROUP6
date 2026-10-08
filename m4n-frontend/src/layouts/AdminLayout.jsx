import { useState, useRef, useEffect } from 'react'
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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

  const navSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        { label: 'Dashboard', path: CUSTOMER_ROUTES.admin, Icon: IconDashboard },
      ],
    },
    {
      title: 'SẢN PHẨM & KHO',
      items: [
        { label: 'Nhạc cụ & Tồn kho', path: CUSTOMER_ROUTES.adminInstruments, Icon: IconInstrument },
      ],
    },
    {
      title: 'VẬN HÀNH',
      items: [
        { label: 'Đơn hàng & Cửa hàng', path: CUSTOMER_ROUTES.adminStore, Icon: IconStore },
      ],
    },
    {
      title: 'HỆ THỐNG',
      items: [
        { label: 'Hồ sơ cá nhân', path: CUSTOMER_ROUTES.adminProfile, Icon: IconUser },
        { label: 'Bảo mật tài khoản', path: CUSTOMER_ROUTES.adminSecurity, Icon: IconLock },
      ],
    },
  ]

  const allNavItems = navSections.flatMap((s) => s.items)
  const currentNavItem = allNavItems.find((item) => item.path === pathname)
  const pageTitle = currentNavItem ? currentNavItem.label : 'Dashboard Quản trị'

  return (
    <div className="min-h-screen flex bg-[#F5F7FA] text-[#17191B]">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Charcoal TailAdmin-Grade Persistent Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#111315] border-r border-[#22262A] flex flex-col transition-all duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 shadow-xl`}
        aria-label="Thanh điều hướng chính"
      >
        {/* Sidebar Brand Header */}
        <div className={`h-16 px-4 border-b border-[#22262A] flex items-center justify-between ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div
            className={`flex items-center gap-3 cursor-pointer group min-w-0 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}
            onClick={() => {
              if (sidebarCollapsed) {
                setSidebarCollapsed(false)
              } else {
                navigateTo(CUSTOMER_ROUTES.admin)
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (sidebarCollapsed) setSidebarCollapsed(false)
                else navigateTo(CUSTOMER_ROUTES.admin)
              }
            }}
            title={sidebarCollapsed ? 'Nhấn để mở rộng thanh bên' : 'M4N Admin'}
          >
            {/* Emerald green monogram badge */}
            <div className="w-9 h-9 rounded-xl bg-[#0D9488] text-white flex items-center justify-center font-extrabold text-sm tracking-wider shadow-md group-hover:bg-[#0F766E] transition-colors shrink-0">
              M4N
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="text-white font-bold tracking-tight text-base font-sans truncate">
                  M4N Admin
                </span>
                <span className="text-[10px] text-zinc-400 font-semibold tracking-widest uppercase mt-0.5">
                  BACK OFFICE
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle on sidebar header */}
          {!sidebarCollapsed && (
            <button
              type="button"
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 border border-[#272B30] transition-colors cursor-pointer shrink-0"
              onClick={() => setSidebarCollapsed(true)}
              title="Thu gọn menu điều hướng"
              aria-label="Thu gọn menu điều hướng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
          >
            ✕
          </button>
        </div>

        {/* If collapsed on desktop: show expand button right below the header */}
        {sidebarCollapsed && (
          <div className="hidden lg:flex justify-center p-2 border-b border-[#22262A]">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="w-full py-2 rounded-xl bg-[#16181A] hover:bg-zinc-800 text-zinc-400 hover:text-[#0D9488] border border-[#272B30] flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
              title="Mở rộng menu điều hướng"
              aria-label="Mở rộng menu điều hướng"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 flex flex-col gap-5 overflow-y-auto overflow-x-hidden">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              {!sidebarCollapsed ? (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  {section.title}
                </span>
              ) : (
                <div className="h-2" />
              )}

              {section.items.map((item) => {
                const isActive = pathname === item.path
                const ItemIcon = item.Icon
                return (
                  <button
                    key={item.path}
                    type="button"
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left cursor-pointer group ${
                      isActive
                        ? 'text-white bg-[#0D9488]/20 font-semibold shadow-xs border border-[#0D9488]/35'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigateTo(item.path)
                    }}
                  >
                    {/* Active emerald indicator bar */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#0D9488]"
                        aria-hidden="true"
                      />
                    )}

                    <ItemIcon
                      size={19}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? 'text-[#0D9488]' : 'text-zinc-400 group-hover:text-white'
                      }`}
                    />

                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer: Compact User Profile Card */}
        <div className="p-3 border-t border-[#22262A] bg-[#0E1012]">
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#16181A] border border-[#272B30]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#0D9488]/25 text-[#0D9488] font-bold text-xs flex items-center justify-center border border-[#0D9488]/40 shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate leading-tight">
                    {user?.fullName || 'Quản trị viên'}
                  </span>
                  <span className="text-[10px] text-zinc-400 truncate">
                    {user?.email || 'admin@m4n.vn'}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-[#0D9488] hover:bg-zinc-800/80 transition-colors shrink-0 cursor-pointer"
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
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-[#FFFFFF] border-b border-[#E5E8EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs backdrop-blur-md">
          {/* Left: Mobile Trigger, Breadcrumb & Title */}
          <div className="flex items-center gap-3">
            {/* Mobile drawer trigger */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-[#17191B] hover:bg-[#F2F4F5] text-lg leading-none cursor-pointer border border-[#E5E8EB]"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Mở menu điều hướng"
            >
              ☰
            </button>

            {/* Breadcrumb & Page Title */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className="text-xs font-semibold text-zinc-400 hover:text-[#17191B] cursor-pointer transition-colors"
                onClick={() => navigateTo(CUSTOMER_ROUTES.admin)}
              >
                M4N Back Office
              </span>
              <span className="text-zinc-300 text-xs">/</span>
              <h1 className="font-bold text-[#17191B] text-sm sm:text-base tracking-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Storefront shortcut & Profile Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Storefront Link Shortcut */}
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-xs font-semibold text-[#17191B] hover:text-[#0D9488] hover:bg-[#F6F7F8] hover:border-[#CDD2D5] transition-colors cursor-pointer shadow-2xs"
              onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
              title="Xem cửa hàng khách hàng"
            >
              <IconStore size={14} className="text-zinc-400" />
              <span>Xem Cửa hàng</span>
              <span className="text-[10px] text-zinc-400">↗</span>
            </button>

            {/* System Status Pill */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống: Sẵn sàng</span>
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#F2F4F5] border border-transparent hover:border-[#E5E8EB] transition-colors cursor-pointer text-left"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-[#0D9488]/15 text-[#0D9488] font-bold text-xs flex items-center justify-center border border-[#0D9488]/30 shadow-2xs">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-xs font-bold text-[#17191B] truncate max-w-[120px]">
                    {user?.fullName || 'Quản trị viên'}
                  </span>
                  <span className="text-[10px] text-[#0D9488] font-semibold">ADMIN</span>
                </div>
                <IconChevronDown size={14} className="text-zinc-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-60 bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-xl py-2 z-50 animate-in fade-in zoom-in-95"
                  role="menu"
                >
                  <div className="px-4 py-2.5 border-b border-[#E5E8EB] bg-[#F6F7F8]/80 flex flex-col mb-1 text-xs">
                    <strong className="text-[#17191B] text-sm truncate">
                      {user?.fullName || 'Quản trị viên'}
                    </strong>
                    <span className="text-zinc-500 truncate">{user?.email}</span>
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 self-start">
                      Quản trị viên (ADMIN)
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17191B] hover:bg-[#F2F4F5] hover:text-[#0D9488] transition-colors w-full text-left cursor-pointer"
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
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#17191B] hover:bg-[#F2F4F5] hover:text-[#0D9488] transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigateTo(CUSTOMER_ROUTES.adminSecurity)
                    }}
                  >
                    <IconLock size={16} />
                    <span>Bảo mật tài khoản</span>
                  </button>

                  <div className="my-1 border-t border-[#E5E8EB]" />

                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer"
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

        {/* Main Content Surface */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
