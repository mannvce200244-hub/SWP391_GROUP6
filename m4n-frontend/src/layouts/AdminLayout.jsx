import { useState, useRef, useEffect } from 'react'
import {
  CUSTOMER_ROUTES,
  navigateTo,
  matchAdminInstrumentDetailPath,
  ROUTE_CHANGE_EVENT,
} from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'
import notificationService from '../services/notificationService.js'
import {
  LayoutDashboard,
  Store,
  UserRound,
  Lock,
  LogOut,
  ChevronDown,
  Menu,
  ExternalLink,
  ChevronsLeft,
  ChevronsRight,
  X,
  Layers,
  MapPin,
  Boxes,
  PackagePlus,
  ClipboardList,
  Receipt,
  TicketPercent,
  Users,
  UserCog,
  Shield,
  Bell,
  Check,
} from 'lucide-react'
import { IconInstrument } from '../components/ui/Icons.jsx'
import useToast from '../components/ui/useToast.js'
import BrandLogo from '../components/common/BrandLogo.jsx'

function AdminLayout({ children, pathname }) {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const dropdownRef = useRef(null)

  // Notifications
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const notificationRef = useRef(null)

  // Track search query parameter (for ?tab=customers etc.)
  const [activeSearch, setActiveSearch] = useState(() =>
    typeof window !== 'undefined' ? window.location.search : ''
  )

  useEffect(() => {
    const handleUrlChange = () => {
      setActiveSearch(window.location.search)
    }
    window.addEventListener('popstate', handleUrlChange)
    window.addEventListener(ROUTE_CHANGE_EVENT, handleUrlChange)
    return () => {
      window.removeEventListener('popstate', handleUrlChange)
      window.removeEventListener(ROUTE_CHANGE_EVENT, handleUrlChange)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    notificationService
      .getUnreadCount()
      .then((count) => {
        if (mounted) setUnreadCount(count || 0)
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggleNotifications = async () => {
    const nextState = !notificationsOpen
    setNotificationsOpen(nextState)
    if (nextState) {
      setLoadingNotifications(true)
      try {
        const data = await notificationService.getRecentNotifications()
        setNotifications(Array.isArray(data) ? data : data?.content || [])
      } catch {
        setNotifications([])
      } finally {
        setLoadingNotifications(false)
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead()
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })))
      addToast({ message: 'Đã đánh dấu tất cả thông báo là đã đọc.', type: 'info' })
    } catch (err) {
      addToast({ message: err.message || 'Lỗi khi cập nhật thông báo.', type: 'error' })
    }
  }

  const handleMarkNotificationRead = async (notif) => {
    if (notif.read || notif.isRead) return
    try {
      await notificationService.markAsRead(notif.id)
      setUnreadCount((c) => Math.max(0, c - 1))
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true, isRead: true } : n))
      )
    } catch {
      // ignore
    }
  }

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
        { label: 'Dashboard', path: CUSTOMER_ROUTES.admin, Icon: LayoutDashboard },
      ],
    },
    {
      title: 'SẢN PHẨM & KHO',
      items: [
        { label: 'Sản phẩm', path: CUSTOMER_ROUTES.adminInstruments, Icon: IconInstrument },
        { label: 'Danh mục nhạc cụ', path: CUSTOMER_ROUTES.adminCategories, Icon: Layers },
        { label: 'Nghệ nhân', path: CUSTOMER_ROUTES.adminArtisans, Icon: UserRound },
        { label: 'Làng nghề', path: CUSTOMER_ROUTES.adminCraftVillages, Icon: MapPin },
        { label: 'Kho hàng', path: CUSTOMER_ROUTES.adminInventory, Icon: Boxes },
        { label: 'Nhập kho', path: CUSTOMER_ROUTES.adminStockImport, Icon: PackagePlus },
      ],
    },
    {
      title: 'BÁN HÀNG',
      items: [
        { label: 'Đơn hàng online', path: CUSTOMER_ROUTES.adminOrders, Icon: ClipboardList },
        { label: 'Hóa đơn (POS)', path: CUSTOMER_ROUTES.adminInvoices, Icon: Receipt },
        { label: 'Voucher', path: CUSTOMER_ROUTES.adminVouchers, Icon: TicketPercent },
      ],
    },
    {
      title: 'QUẢN LÝ NGƯỜI DÙNG',
      items: [
        {
          label: 'Khách hàng',
          path: `${CUSTOMER_ROUTES.adminUsers}?tab=customers`,
          matchPath: CUSTOMER_ROUTES.adminUsers,
          tabParam: 'customers',
          Icon: Users,
        },
        {
          label: 'Nhân viên',
          path: `${CUSTOMER_ROUTES.adminUsers}?tab=staff`,
          matchPath: CUSTOMER_ROUTES.adminUsers,
          tabParam: 'staff',
          Icon: UserCog,
        },
        {
          label: 'Tất cả tài khoản',
          path: CUSTOMER_ROUTES.adminUsers,
          matchPath: CUSTOMER_ROUTES.adminUsers,
          tabParam: 'all',
          Icon: Shield,
        },
      ],
    },
  ]

  const isInstrumentDetail = Boolean(matchAdminInstrumentDetailPath(pathname))
  const searchParams = new URLSearchParams(activeSearch)
  const currentTab = searchParams.get('tab')

  let pageTitle = 'Dashboard Quản trị'
  if (isInstrumentDetail) {
    pageTitle = 'Chi tiết sản phẩm'
  } else if (pathname === CUSTOMER_ROUTES.adminInstruments) {
    pageTitle = 'Quản lý Sản phẩm'
  } else if (pathname === CUSTOMER_ROUTES.adminCategories) {
    pageTitle = 'Danh mục nhạc cụ'
  } else if (pathname === CUSTOMER_ROUTES.adminArtisans) {
    pageTitle = 'Quản lý Nghệ nhân'
  } else if (pathname === CUSTOMER_ROUTES.adminCraftVillages) {
    pageTitle = 'Quản lý Làng nghề truyền thống'
  } else if (pathname === CUSTOMER_ROUTES.adminInventory) {
    pageTitle = 'Quản lý Kho hàng'
  } else if (pathname === CUSTOMER_ROUTES.adminStockImport) {
    pageTitle = 'Nhập kho sản phẩm'
  } else if (pathname === CUSTOMER_ROUTES.adminOrders) {
    pageTitle = 'Quản lý Đơn hàng Online'
  } else if (pathname === CUSTOMER_ROUTES.adminInvoices) {
    pageTitle = 'Hóa đơn bán tại quầy (POS)'
  } else if (pathname === CUSTOMER_ROUTES.adminVouchers) {
    pageTitle = 'Quản lý Mã giảm giá (Voucher)'
  } else if (pathname === CUSTOMER_ROUTES.adminUsers) {
    if (currentTab === 'customers') pageTitle = 'Quản lý Khách hàng'
    else if (currentTab === 'staff') pageTitle = 'Quản lý Nhân sự & Phân quyền'
    else pageTitle = 'Quản lý Tài khoản & Phân quyền'
  } else if (pathname === CUSTOMER_ROUTES.adminProfile) {
    pageTitle = 'Hồ sơ cá nhân'
  } else if (pathname === CUSTOMER_ROUTES.adminSecurity) {
    pageTitle = 'Bảo mật tài khoản'
  }

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
        <div
          className={`h-16 px-4 border-b border-[#22262A] flex items-center justify-between ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <div
            className={`flex items-center gap-3 cursor-pointer group min-w-0 ${
              sidebarCollapsed ? 'justify-center w-full' : ''
            }`}
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
            <BrandLogo variant="dark" collapsed={sidebarCollapsed} />
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
              <ChevronsLeft size={16} />
            </button>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={18} />
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
              <ChevronsRight size={16} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 flex flex-col gap-5 overflow-y-auto overflow-x-hidden">
          {navSections.map((section) => (
            <div key={section.title} className="flex flex-col gap-1">
              {!sidebarCollapsed ? (
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1">
                  {section.title}
                </span>
              ) : (
                <div className="h-2" />
              )}

              {section.items.map((item) => {
                const isUserRoute = item.matchPath === CUSTOMER_ROUTES.adminUsers
                let isActive = false
                if (isUserRoute) {
                  if (pathname === CUSTOMER_ROUTES.adminUsers) {
                    if (item.tabParam === 'customers') {
                      isActive = currentTab === 'customers'
                    } else if (item.tabParam === 'staff') {
                      isActive = currentTab === 'staff'
                    } else if (item.tabParam === 'all') {
                      isActive = !currentTab || (currentTab !== 'customers' && currentTab !== 'staff')
                    }
                  }
                } else {
                  isActive =
                    pathname === item.path ||
                    (item.path === CUSTOMER_ROUTES.adminInstruments && isInstrumentDetail)
                }

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
                  <span className="text-xs text-zinc-400 truncate">
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
              <LogOut size={16} />
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
              className="lg:hidden p-2 rounded-xl text-[#17191B] hover:bg-[#F2F4F5] leading-none cursor-pointer border border-[#E5E8EB] flex items-center justify-center"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Mở menu điều hướng"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb & Page Title */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className="text-sm font-medium text-secondary hover:text-[#17191B] cursor-pointer transition-colors"
                onClick={() => navigateTo(CUSTOMER_ROUTES.admin)}
              >
                M4N Back Office
              </span>
              <span className="text-zinc-300 text-xs">/</span>
              <h1 className="font-bold text-[#17191B] text-base tracking-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Storefront shortcut, Notifications, Profile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storefront Link Shortcut */}
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-sm font-medium text-[#17191B] hover:text-[#0D9488] hover:bg-[#F6F7F8] hover:border-[#CDD2D5] transition-colors cursor-pointer shadow-2xs"
              onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
              title="Xem cửa hàng khách hàng"
            >
              <Store size={16} className="text-secondary" />
              <span>Xem Cửa hàng</span>
              <ExternalLink size={14} className="text-secondary" />
            </button>

            {/* System Status Pill */}
            <div className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Hệ thống: Sẵn sàng</span>
            </div>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                className="relative p-2 rounded-xl text-zinc-600 hover:text-[#17191B] hover:bg-[#F2F4F5] border border-transparent hover:border-[#E5E8EB] transition-colors cursor-pointer"
                onClick={handleToggleNotifications}
                title="Thông báo hệ thống"
                aria-label="Thông báo hệ thống"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse shadow-sm">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#FFFFFF] rounded-2xl border border-[#E5E8EB] shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95"
                  role="region"
                  aria-label="Danh sách thông báo"
                >
                  <div className="px-4 py-2.5 border-b border-[#E5E8EB] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#17191B]">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#0D9488] hover:text-[#0F766E] font-medium transition-colors flex items-center gap-1"
                      >
                        <Check size={13} />
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100 text-xs">
                    {loadingNotifications ? (
                      <div className="py-8 text-center text-zinc-400">
                        <div className="w-5 h-5 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p>Đang tải thông báo...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center text-zinc-400">
                        <Bell className="w-8 h-8 mx-auto mb-1 text-zinc-300 stroke-[1.5]" />
                        <p className="text-zinc-600 font-medium">Không có thông báo nào</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isRead = n.read || n.isRead
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleMarkNotificationRead(n)}
                            className={`p-3.5 cursor-pointer transition-colors hover:bg-zinc-50 flex items-start gap-2.5 ${
                              !isRead ? 'bg-[#F0FDF4]/60' : ''
                            }`}
                          >
                            <span
                              className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                !isRead ? 'bg-[#0D9488]' : 'bg-transparent'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium ${!isRead ? 'text-zinc-900 font-semibold' : 'text-zinc-700'}`}>
                                {n.title || n.message || 'Thông báo mới'}
                              </p>
                              {n.title && n.message && (
                                <p className="text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                                  {n.message}
                                </p>
                              )}
                              <span className="text-[11px] text-zinc-400 mt-1 block">
                                {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
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
                  <span className="text-xs text-[#0D9488] font-medium">
                    {user?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN'}
                  </span>
                </div>
                <ChevronDown size={14} className="text-zinc-400" />
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
                    <span className="inline-block mt-1.5 px-2 py-0.5 text-xs font-medium rounded-md bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 self-start">
                      {user?.role === 'SUPER_ADMIN' ? 'Super Admin (SUPER_ADMIN)' : 'Quản trị viên (ADMIN)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-[#17191B] hover:bg-[#F2F4F5] hover:text-[#0D9488] transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigateTo(CUSTOMER_ROUTES.adminProfile)
                    }}
                  >
                    <UserRound size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-[#17191B] hover:bg-[#F2F4F5] hover:text-[#0D9488] transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={() => {
                      setDropdownOpen(false)
                      navigateTo(CUSTOMER_ROUTES.adminSecurity)
                    }}
                  >
                    <Lock size={16} />
                    <span>Bảo mật tài khoản</span>
                  </button>

                  <div className="my-1 border-t border-[#E5E8EB]" />

                  <button
                    type="button"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13.5px] font-medium text-rose-600 hover:bg-rose-50 transition-colors w-full text-left cursor-pointer"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
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
