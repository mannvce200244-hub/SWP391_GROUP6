import useDialogFocus from '../hooks/useDialogFocus.js'
import { useState } from 'react'
import {
  CUSTOMER_ROUTES,
  navigateTo,
  matchAdminInstrumentDetailPath,
} from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'
import NotificationBell from '../components/common/NotificationBell.jsx'
import {
  LayoutDashboard,
  Store,
  UserRound,
  LogOut,
  Menu,
  ExternalLink,
  ChevronsLeft,
  ChevronsRight,
  X,
  Layers,
  MapPin,
  Boxes,
  ClipboardList,
  Receipt,
  TicketPercent,
  Users,
  BookOpen,
} from 'lucide-react'
import { IconInstrument } from '../components/ui/Icons.jsx'
import useToast from '../components/ui/useToast.js'
import BrandLogo from '../components/common/BrandLogo.jsx'
import RouterLink from '../routes/RouterLink.jsx'

function AdminLayout({ children, pathname }) {
  const { user, logout } = useAuth()
  const { addToast } = useToast()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const sidebarRef = useDialogFocus(mobileMenuOpen, () => setMobileMenuOpen(false))

  const handleLogout = async () => {
    try {
      await logout()
      addToast({
        message: 'Đã đăng xuất khỏi tài khoản Quản trị.',
        type: 'info',
      })
      navigateTo(CUSTOMER_ROUTES.login)
    } catch (error) {
      addToast({ message: error.message || 'Không thể đăng xuất. Vui lòng thử lại.', type: 'error' })
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
      ],
    },
    {
      title: 'NỘI DUNG',
      items: [{ label: 'Bài viết & Hướng dẫn', path: CUSTOMER_ROUTES.adminArticles, Icon: BookOpen }],
    },
    {
      title: 'BÁN HÀNG',
      items: [
        { label: 'Đơn hàng online', path: CUSTOMER_ROUTES.adminOrders, Icon: ClipboardList },
        { label: 'Hóa đơn (POS)', path: CUSTOMER_ROUTES.adminInvoices, Icon: Receipt },
        { label: 'Voucher', path: CUSTOMER_ROUTES.adminVouchers, Icon: TicketPercent },
        { label: 'Giá & vận chuyển', path: CUSTOMER_ROUTES.adminPricing, Icon: TicketPercent },
      ],
    },
    {
      title: 'HỆ THỐNG',
      items: [
        {
          label: 'Quản lý người dùng',
          path: CUSTOMER_ROUTES.adminUsers,
          Icon: Users,
        },
      ],
    },
  ]

  const isInstrumentDetail = Boolean(matchAdminInstrumentDetailPath(pathname))

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
  } else if (pathname === CUSTOMER_ROUTES.adminArticles) {
    pageTitle = 'Quản lý Bài viết & Hướng dẫn'
  } else if (pathname === CUSTOMER_ROUTES.adminInventory) {
    pageTitle = 'Quản lý Kho hàng'
  } else if (pathname === CUSTOMER_ROUTES.adminOrders) {
    pageTitle = 'Quản lý Đơn hàng Online'
  } else if (pathname === CUSTOMER_ROUTES.adminInvoices) {
    pageTitle = 'Hóa đơn bán tại quầy (POS)'
  } else if (pathname === CUSTOMER_ROUTES.adminVouchers) {
    pageTitle = 'Quản lý Mã giảm giá (Voucher)'
  } else if (pathname === CUSTOMER_ROUTES.adminUsers) {
    pageTitle = 'Quản lý Người dùng & Phân quyền'
  } else if (pathname === CUSTOMER_ROUTES.adminProfile) {
    pageTitle = 'Hồ sơ cá nhân'
  } else if (pathname === CUSTOMER_ROUTES.adminSecurity) {
    pageTitle = 'Bảo mật tài khoản'
  }

  return (
    <div className="min-h-screen flex bg-[#F6F7F8] text-[#17191B]">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Charcoal TailAdmin-Grade Persistent Sidebar */}
      <aside ref={sidebarRef} tabIndex={-1}
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-border flex flex-col transition-[width,transform] duration-200 ease-in-out ${
          mobileMenuOpen ? 'visible translate-x-0' : 'invisible lg:visible -translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64 shadow-xl`}
        aria-label="Thanh điều hướng chính"
      >
        {/* Sidebar Brand Header */}
        <div
          className={`h-16 px-4 border-b border-border flex items-center justify-between ${
            sidebarCollapsed ? 'justify-center' : ''
          }`}
        >
          <RouterLink
            href={CUSTOMER_ROUTES.home}
            className={`flex items-center gap-3 cursor-pointer group min-w-0 ${
              sidebarCollapsed ? 'justify-center w-full' : ''
            } rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A62F25]`}
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Về trang chủ"
            title="Về trang chủ"
          >
            <BrandLogo collapsed={sidebarCollapsed} />
          </RouterLink>

          {/* Desktop collapse toggle on sidebar header */}
          {!sidebarCollapsed && (
            <button
              type="button"
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-xl text-secondary hover:text-ink hover:bg-[#F6F7F8] border border-border transition-colors cursor-pointer shrink-0"
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
            className="lg:hidden p-1.5 rounded-lg text-secondary hover:text-ink hover:bg-[#F6F7F8] transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* If collapsed on desktop: show expand button right below the header */}
        {sidebarCollapsed && (
          <div className="hidden lg:flex justify-center p-2 border-b border-border">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(false)}
              className="w-full py-2 rounded-xl bg-white hover:bg-[#F6F7F8] text-secondary hover:text-[#A62F25] border border-border flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
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
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-secondary mb-1">
                  {section.title}
                </span>
              ) : (
                <div className="h-2" />
              )}

              {section.items.map((item) => {
                const isActive =
                  pathname === item.path ||
                  (item.path === CUSTOMER_ROUTES.adminInstruments && isInstrumentDetail)

                const ItemIcon = item.Icon
                return (
                  <button
                    key={item.path}
                    type="button"
                    aria-label={item.label} title={sidebarCollapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-[color,background-color,border-color,box-shadow] group motion-reduce:transition-none ${
                      isActive
                        ? 'border-[#A62F25]/35 bg-[#F6F7F8] text-ink shadow-xs'
                        : 'border-transparent text-secondary hover:bg-[#F6F7F8] hover:text-ink'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                    onClick={() => {
                      setMobileMenuOpen(false)
                      navigateTo(item.path)
                    }}
                  >
                    {/* Active emerald indicator bar */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#A62F25]"
                        aria-hidden="true"
                      />
                    )}

                    <ItemIcon
                      size={19}
                      className={`shrink-0 transition-transform group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none ${
                        isActive ? 'text-[#A62F25]' : 'text-secondary group-hover:text-ink'
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

        {/* Sidebar Footer: User Profile and Logout */}
        <div className="p-3 border-t border-border bg-[#F6F7F8]">
          <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-white border border-border ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#F6F7F8] text-[#A62F25] font-bold text-xs flex items-center justify-center border border-[#A62F25]/40 shrink-0">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold text-white truncate leading-tight">
                    {user?.fullName || 'Quản trị viên'}
                  </span>
                  <span className="text-xs text-secondary truncate">
                    {user?.email || 'admin@m4n.vn'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className={`mt-2 flex min-h-10 w-full items-center rounded-xl border border-transparent text-secondary transition-colors hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400 cursor-pointer ${
              sidebarCollapsed ? 'justify-center px-0' : 'gap-2.5 px-3 text-left text-xs font-semibold'
            }`}
            onClick={handleLogout}
            title={sidebarCollapsed ? 'Đăng xuất' : undefined}
            aria-label="Đăng xuất"
          >
            <LogOut size={17} className="shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span>Đăng xuất</span>}
          </button>
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
              <button type="button"
                className="text-sm font-medium text-secondary hover:text-[#17191B] cursor-pointer transition-colors"
                onClick={() => navigateTo(CUSTOMER_ROUTES.admin)}
              >
                M4N Back Office
              </button>
              <span className="text-secondary text-xs">/</span>
              <h1 className="font-bold text-[#17191B] text-base tracking-tight">
                {pageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Storefront shortcut, System Status, Notifications */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Storefront Link Shortcut */}
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E8EB] bg-[#FFFFFF] text-sm font-medium text-[#17191B] hover:text-[#A62F25] hover:bg-[#F6F7F8] hover:border-[#CDD2D5] transition-colors cursor-pointer shadow-2xs"
              onClick={() => navigateTo(CUSTOMER_ROUTES.home)}
              title="Xem cửa hàng khách hàng"
            >
              <Store size={16} className="text-secondary" />
              <span>Xem Cửa hàng</span>
              <ExternalLink size={14} className="text-secondary" />
            </button>

            <NotificationBell />
          </div>
        </header>

        {/* Main Content Surface */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
