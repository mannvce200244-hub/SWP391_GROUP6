import { useEffect, useRef, useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import BrandLogo from './BrandLogo.jsx'
import useAuth from '../../features/auth/useAuth.js'
import useCart from '../../features/cart/useCart.js'
import {
  CUSTOMER_ROUTES,
  isProductPath,
  navigateTo,
} from '../../routes/customerRoutes.js'
import {
  IconUser,
  IconLock,
  IconDashboard,
  IconPackage,
  IconCreditCard,
  IconLogOut,
} from '../ui/Icons.jsx'

const ROLE_LABELS = Object.freeze({
  CUSTOMER: 'Khách hàng',
  ONLINE_STAFF: 'Nhân viên trực tuyến',
  POS_STAFF: 'Nhân viên POS',
  ADMIN: 'Quản trị viên',
})

function SiteHeader({ pathname }) {
  const { user, isAuthenticated, logout } = useAuth()
  const { cartItemCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const accountMenuRef = useRef(null)

  const isHomeRoute = pathname === CUSTOMER_ROUTES.home
  const isCatalogRoute = isProductPath(pathname)
  const isArtisansRoute =
    pathname === CUSTOMER_ROUTES.artisans ||
    pathname.startsWith(`${CUSTOMER_ROUTES.artisans}/`)

  const closeMobileMenu = () => setMobileMenuOpen(false)
  const closeAccountMenu = () => setAccountMenuOpen(false)

  // Track scroll position for header elevation
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 12)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountMenuOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        setMobileMenuOpen(false)
      }
    }

    if (accountMenuOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen, mobileMenuOpen])

  const handleLogout = async () => {
    closeAccountMenu()
    closeMobileMenu()
    await logout()
    navigateTo(CUSTOMER_ROUTES.login)
  }

  const roleName = user?.role ? (ROLE_LABELS[user.role] || user.role) : ''

  return (
    <header className={`sticky top-0 z-40 w-full transition-all duration-200 ${isScrolled ? 'bg-surface/95 backdrop-blur-md shadow-xs border-b border-border' : 'bg-surface border-b border-border/80'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <RouterLink
          aria-label="M4N - Trang chủ Nhạc cụ truyền thống"
          className="flex items-center shrink-0"
          href={CUSTOMER_ROUTES.home}
          onClick={closeMobileMenu}
        >
          <BrandLogo />
        </RouterLink>

        {/* Center: Main Navigation */}
        <nav aria-label="Điều hướng chính" className="hidden md:flex items-center gap-1">
          <ul className="flex items-center gap-1 list-none m-0 p-0">
            <li>
              <RouterLink
                aria-current={isHomeRoute ? 'page' : undefined}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                  isHomeRoute
                    ? 'text-brand font-semibold bg-brand-soft/60'
                    : 'text-ink hover:text-brand hover:bg-surface-secondary font-medium'
                }`}
                href={CUSTOMER_ROUTES.home}
              >
                Trang chủ
              </RouterLink>
            </li>
            <li>
              <RouterLink
                aria-current={isCatalogRoute ? 'page' : undefined}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                  isCatalogRoute
                    ? 'text-brand font-semibold bg-brand-soft/60'
                    : 'text-ink hover:text-brand hover:bg-surface-secondary font-medium'
                }`}
                href={CUSTOMER_ROUTES.products}
              >
                Sản phẩm
              </RouterLink>
            </li>
            <li>
              <RouterLink
                aria-current={isArtisansRoute ? 'page' : undefined}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                  isArtisansRoute
                    ? 'text-brand font-semibold bg-brand-soft/60'
                    : 'text-ink hover:text-brand hover:bg-surface-secondary font-medium'
                }`}
                href={CUSTOMER_ROUTES.artisans}
              >
                Nghệ nhân & Làng nghề
              </RouterLink>
            </li>
          </ul>
        </nav>

        {/* Right: Commerce utility actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <RouterLink
            aria-label="Tìm kiếm sản phẩm"
            className="inline-flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-lg text-ink hover:text-brand hover:bg-surface-secondary text-sm font-medium transition-colors cursor-pointer"
            href={CUSTOMER_ROUTES.products}
            onClick={closeMobileMenu}
            title="Tìm kiếm sản phẩm"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5 shrink-0"
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="hidden lg:inline text-xs font-medium">Tìm kiếm</span>
          </RouterLink>

          <RouterLink
            aria-label={`Giỏ hàng (${cartItemCount} sản phẩm)`}
            className="inline-flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-lg text-ink hover:text-brand hover:bg-surface-secondary text-sm font-medium transition-colors cursor-pointer relative"
            href={CUSTOMER_ROUTES.products}
            onClick={closeMobileMenu}
            title="Giỏ hàng"
          >
            <span className="relative flex items-center">
              <svg
                aria-hidden="true"
                className="w-5 h-5 shrink-0"
                fill="none"
                height="20"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem] px-1 text-[10px] font-bold text-white bg-brand rounded-full" aria-hidden="true">
                  {cartItemCount}
                </span>
              )}
            </span>
            <span className="hidden lg:inline text-xs font-medium ml-1">Giỏ hàng</span>
          </RouterLink>

          {/* Account action / Dropdown */}
          <div className="relative" ref={accountMenuRef}>
            {isAuthenticated && user ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-lg text-ink hover:text-brand hover:bg-surface-secondary text-sm font-medium transition-colors cursor-pointer"
                onClick={() => setAccountMenuOpen((prev) => !prev)}
                aria-expanded={accountMenuOpen}
                aria-label={`Tài khoản: ${user.fullName || user.email}`}
                title={user.fullName || user.email}
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  height="20"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="20"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:inline text-xs font-medium max-w-[100px] truncate">
                  {user.fullName ? user.fullName.split(' ').pop() : 'Tài khoản'}
                </span>
              </button>
            ) : (
              <RouterLink
                aria-label="Tài khoản / Đăng nhập"
                className="inline-flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-lg text-ink hover:text-brand hover:bg-surface-secondary text-sm font-medium transition-colors cursor-pointer"
                href={CUSTOMER_ROUTES.login}
                onClick={closeMobileMenu}
                title="Đăng nhập"
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5 shrink-0"
                  fill="none"
                  height="20"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="20"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="hidden sm:inline text-xs font-medium">Đăng nhập</span>
              </RouterLink>
            )}

            {/* Desktop Account Menu Dropdown */}
            {accountMenuOpen && isAuthenticated && user && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-xl border border-border shadow-lg py-2 z-50 animate-in fade-in zoom-in-95" role="menu">
                <div className="px-4 py-2.5 border-b border-border/60 bg-surface-secondary/40 mb-1">
                  <p className="text-sm font-semibold text-ink truncate">{user.fullName || 'Người dùng M4N'}</p>
                  <p className="text-xs text-muted truncate">{user.email}</p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[11px] font-semibold rounded-md bg-brand-soft text-brand">{roleName}</span>
                </div>

                <ul className="list-none p-0 m-0">
                  <li>
                    <RouterLink
                      href={CUSTOMER_ROUTES.profile}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface-secondary hover:text-brand transition-colors cursor-pointer"
                      onClick={closeAccountMenu}
                      role="menuitem"
                    >
                      <IconUser size={16} />
                      <span>Hồ sơ cá nhân</span>
                    </RouterLink>
                  </li>

                  <li>
                    <RouterLink
                      href={CUSTOMER_ROUTES.security}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface-secondary hover:text-brand transition-colors cursor-pointer"
                      onClick={closeAccountMenu}
                      role="menuitem"
                    >
                      <IconLock size={16} />
                      <span>Bảo mật & Mật khẩu</span>
                    </RouterLink>
                  </li>

                  {user.role === 'ADMIN' && (
                    <li>
                      <RouterLink
                        href={CUSTOMER_ROUTES.admin}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface-secondary hover:text-brand font-medium transition-colors cursor-pointer"
                        onClick={closeAccountMenu}
                        role="menuitem"
                      >
                        <IconDashboard size={16} />
                        <span>Bảng điều khiển Quản trị</span>
                      </RouterLink>
                    </li>
                  )}

                  {user.role === 'ONLINE_STAFF' && (
                    <li>
                      <RouterLink
                        href={CUSTOMER_ROUTES.staff}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface-secondary hover:text-brand font-medium transition-colors cursor-pointer"
                        onClick={closeAccountMenu}
                        role="menuitem"
                      >
                        <IconPackage size={16} />
                        <span>Bàn làm việc Nhân viên</span>
                      </RouterLink>
                    </li>
                  )}

                  {user.role === 'POS_STAFF' && (
                    <li>
                      <RouterLink
                        href={CUSTOMER_ROUTES.pos}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface-secondary hover:text-brand font-medium transition-colors cursor-pointer"
                        onClick={closeAccountMenu}
                        role="menuitem"
                      >
                        <IconCreditCard size={16} />
                        <span>Bàn làm việc POS</span>
                      </RouterLink>
                    </li>
                  )}

                  <li className="my-1 border-t border-border" />

                  <li>
                    <button
                      type="button"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-brand hover:bg-brand-soft transition-colors cursor-pointer w-full text-left"
                      onClick={handleLogout}
                      role="menuitem"
                    >
                      <IconLogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
            className="md:hidden p-2 rounded-lg text-ink hover:text-brand hover:bg-surface-secondary transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            type="button"
          >
            {mobileMenuOpen ? (
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                height="22"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="22"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                aria-hidden="true"
                className="w-6 h-6"
                fill="none"
                height="22"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="22"
              >
                <path d="M4 12h16M4 6h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen ? (
        <div className="md:hidden fixed inset-x-0 top-16 bg-surface border-b border-border shadow-lg p-4 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav aria-label="Điều hướng di động">
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
              <li>
                <RouterLink
                  aria-current={isHomeRoute ? 'page' : undefined}
                  className={`block px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                    isHomeRoute
                      ? 'text-brand font-semibold bg-brand-soft'
                      : 'text-ink hover:text-brand hover:bg-surface-secondary font-medium'
                  }`}
                  href={CUSTOMER_ROUTES.home}
                  onClick={closeMobileMenu}
                >
                  Trang chủ
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  aria-current={isCatalogRoute ? 'page' : undefined}
                  className={`block px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                    isCatalogRoute
                      ? 'text-brand font-semibold bg-brand-soft'
                      : 'text-ink hover:text-brand hover:bg-surface-secondary font-medium'
                  }`}
                  href={CUSTOMER_ROUTES.products}
                  onClick={closeMobileMenu}
                >
                  Sản phẩm
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  aria-current={isArtisansRoute ? 'page' : undefined}
                  className={`block px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                    isArtisansRoute
                      ? 'text-brand font-semibold bg-brand-soft'
                      : 'text-ink hover:text-brand hover:bg-surface-secondary font-medium'
                  }`}
                  href={CUSTOMER_ROUTES.artisans}
                  onClick={closeMobileMenu}
                >
                  Nghệ nhân & Làng nghề
                </RouterLink>
              </li>

              {/* Mobile Auth Actions */}
              {isAuthenticated && user ? (
                <>
                  <li className="my-2 border-t border-border" />
                  <li className="px-3.5 py-2 bg-surface-secondary/60 rounded-lg flex flex-col mb-1">
                    <span className="text-sm font-semibold text-ink">{user.fullName || user.email}</span>
                    <span className="text-xs text-brand font-medium">{roleName}</span>
                  </li>
                  <li>
                    <RouterLink
                      className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink hover:text-brand hover:bg-surface-secondary rounded-lg font-medium"
                      href={CUSTOMER_ROUTES.profile}
                      onClick={closeMobileMenu}
                    >
                      Hồ sơ cá nhân
                    </RouterLink>
                  </li>
                  <li>
                    <RouterLink
                      className="flex items-center gap-2 px-3.5 py-2 text-sm text-ink hover:text-brand hover:bg-surface-secondary rounded-lg font-medium"
                      href={CUSTOMER_ROUTES.security}
                      onClick={closeMobileMenu}
                    >
                      Bảo mật & Mật khẩu
                    </RouterLink>
                  </li>
                  {user.role === 'ADMIN' && (
                    <li>
                      <RouterLink
                        className="flex items-center gap-2 px-3.5 py-2 text-sm text-brand font-semibold hover:bg-brand-soft rounded-lg"
                        href={CUSTOMER_ROUTES.admin}
                        onClick={closeMobileMenu}
                      >
                        Bảng điều khiển Quản trị
                      </RouterLink>
                    </li>
                  )}
                  {user.role === 'ONLINE_STAFF' && (
                    <li>
                      <RouterLink
                        className="flex items-center gap-2 px-3.5 py-2 text-sm text-brand font-semibold hover:bg-brand-soft rounded-lg"
                        href={CUSTOMER_ROUTES.staff}
                        onClick={closeMobileMenu}
                      >
                        Bàn làm việc Nhân viên
                      </RouterLink>
                    </li>
                  )}
                  {user.role === 'POS_STAFF' && (
                    <li>
                      <RouterLink
                        className="flex items-center gap-2 px-3.5 py-2 text-sm text-brand font-semibold hover:bg-brand-soft rounded-lg"
                        href={CUSTOMER_ROUTES.pos}
                        onClick={closeMobileMenu}
                      >
                        Bàn làm việc POS
                      </RouterLink>
                    </li>
                  )}
                  <li>
                    <button
                      type="button"
                      className="flex items-center gap-2 px-3.5 py-2 text-sm text-brand font-medium hover:bg-brand-soft rounded-lg w-full text-left cursor-pointer"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="my-2 border-t border-border" />
                  <li>
                    <RouterLink
                      className="block px-3.5 py-2.5 rounded-lg text-sm text-ink hover:text-brand hover:bg-surface-secondary font-medium"
                      href={CUSTOMER_ROUTES.login}
                      onClick={closeMobileMenu}
                    >
                      Đăng nhập
                    </RouterLink>
                  </li>
                  <li>
                    <RouterLink
                      className="block px-3.5 py-2.5 rounded-lg text-sm text-brand font-semibold bg-brand-soft/60"
                      href={CUSTOMER_ROUTES.register}
                      onClick={closeMobileMenu}
                    >
                      Đăng ký tài khoản
                    </RouterLink>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

export default SiteHeader

