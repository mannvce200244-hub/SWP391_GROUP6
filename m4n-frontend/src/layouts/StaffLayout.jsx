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

function StaffLayout({ children, pathname }) {
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
        message: 'Đã đăng xuất khỏi ca làm việc nhân viên.',
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
        { label: 'Bàn làm việc', path: CUSTOMER_ROUTES.staff, Icon: IconDashboard },
      ],
    },
    {
      title: 'VẬN HÀNH & KHO',
      items: [
        { label: 'Kho & Tra cứu nhạc cụ', path: CUSTOMER_ROUTES.products, Icon: IconInstrument },
        { label: 'Website khách hàng', path: CUSTOMER_ROUTES.home, Icon: IconStore },
      ],
    },
    {
      title: 'TÀI KHOẢN',
      items: [
        { label: 'Hồ sơ cá nhân', path: CUSTOMER_ROUTES.profile, Icon: IconUser },
        { label: 'Bảo mật tài khoản', path: CUSTOMER_ROUTES.security, Icon: IconLock },
      ],
    },
  ]

  const allNavItems = navSections.flatMap((s) => s.items)
  const currentNavItem = allNavItems.find((item) => item.path === pathname)
  const pageTitle = currentNavItem ? currentNavItem.label : 'Bàn làm việc Online Staff'

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

      {/* Charcoal TailAdmin-Grade Sidebar for Staff */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#111315] border-r border-[#22262A] flex flex-col transition-all duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 shadow-xl`}
        aria-label="Thanh điều hướng nhân viên"
      >
        {/* Sidebar Brand Header */}
        <div className={`h-16 px-4 border-b border-[#22262A] flex items-center justify-between ${sidebarCollapsed ? 'justify-center' : ''}`}>
          <div
            className={`flex items-center gap-3 cursor-pointer group min-w-0 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}
            onClick={() => {
              if (sidebarCollapsed) {
                setSidebarCollapsed(false)
              } else {
                navigateTo(CUSTOMER_ROUTES.staff)
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (sidebarCollapsed) setSidebarCollapsed(false)
                else navigateTo(CUSTOMER_ROUTES.staff)
              }
            }}
            title={sidebarCollapsed ? 'Nhấn để mở rộng thanh bên' : 'M4N Staff'}
          >
            {/* Deep Jade monogram badge for Staff */}
            <div className="w-9 h-9 rounded-xl bg-[#1F6B5A] text-white flex items-center justify-center font-extrabold text-sm tracking-wider shadow-md group-hover:bg-[#154b3f] transition-colors shrink-0">
              M4N
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-none min-w-0">
                <span className="text-white font-bold tracking-tight text-base font-sans truncate">
                  M4N Staff
                </span>
                <span className="text-[10px] text-[#2EA083] font-bold tracking-widest uppercase mt-0.5">
                  ONLINE STAFF
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
              title="Thu gọn thanh điều hướng"
              aria-label="Thu gọn thanh điều hướng"
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
              className="w-full py-2 rounded-xl bg-[#16181A] hover:bg-zinc-800 text-zinc-400 hover:text-[#2EA083] border border-[#272B30] flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
              title="Mở rộng thanh điều hướng"
              aria-label="Mở rộng thanh điều hướng"
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
                        ? 'text-white bg-[#1F6B5A]/25 font-semibold shadow-xs border border-[#1F6B5A]/40'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigateTo(item.path)
                    }}
                  >
                    {/* Active accent indicator */}
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-[#1F6B5A]" />
                    )}

                    <span
                      className={`${
                        isActive
                          ? 'text-[#2EA083]'
                          : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    >
                      <ItemIcon size={18} />
                    </span>

                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-3 border-t border-[#22262A]">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80 ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-[#1F6B5A] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.fullName || 'Nhân viên'}
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {user?.email || 'staff@m4n.vn'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Workspace with TailAdmin-Grade Topbar */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Topbar */}
        <header className="h-16 bg-white border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Left: Mobile Toggle & Page Title / Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-xl text-zinc-600 hover:text-ink hover:bg-zinc-100 transition-colors cursor-pointer"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu di động"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Title and Context */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <span>Nhân viên</span>
                <span>/</span>
                <span className="text-ink font-semibold">{pageTitle}</span>
              </div>
            </div>
          </div>

          {/* Right: Operational Status, Storefront Link, Profile Dropdown */}
          <div className="flex items-center gap-3">
            {/* System Status Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ca trực: Đang trực tuyến</span>
            </div>

            {/* Shortcut to Customer Storefront */}
            <button
              type="button"
              onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-zinc-50 hover:bg-zinc-100 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer"
              title="Mở giao diện khách hàng mua sắm"
            >
              <span>Xem Website ↗</span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer text-left"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-xl bg-[#1F6B5A] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-bold text-ink leading-tight">
                    {user?.fullName || 'Nhân viên Online'}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium">
                    {user?.role || 'ONLINE_STAFF'}
                  </span>
                </div>
                <IconChevronDown size={14} className="text-zinc-400" />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-border shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                  role="menu"
                >
                  <div className="px-4 py-2.5 border-b border-border/80 bg-zinc-50/60 flex flex-col mb-1 text-xs">
                    <strong className="text-ink truncate font-bold">
                      {user?.fullName || 'Nhân viên'}
                    </strong>
                    <span className="text-zinc-500 truncate mt-0.5">{user?.email}</span>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider text-[#1F6B5A]">
                      Nhân viên tư vấn
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink hover:bg-zinc-100 hover:text-[#1F6B5A] transition-colors w-full text-left cursor-pointer"
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
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-ink hover:bg-zinc-100 hover:text-[#1F6B5A] transition-colors w-full text-left cursor-pointer"
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
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <IconLogOut size={16} />
                    <span>Đăng xuất ca trực</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default StaffLayout
