import { useState } from 'react'
import RouterLink from '../../routes/RouterLink.jsx'
import BrandLogo from './BrandLogo.jsx'
import {
  CUSTOMER_ROUTES,
  isProductPath,
} from '../../routes/customerRoutes.js'

function SiteHeader({ pathname }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isHomeRoute = pathname === CUSTOMER_ROUTES.home
  const isCatalogRoute = isProductPath(pathname)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="site-header">
      <div className="site-header__inner">
        {/* Left: Brand */}
        <RouterLink
          aria-label="M4N - Trang chủ Nhạc cụ truyền thống"
          className="brand"
          href={CUSTOMER_ROUTES.home}
          onClick={closeMobileMenu}
        >
          <BrandLogo />
        </RouterLink>

        {/* Center: Main Navigation */}
        <nav aria-label="Điều hướng chính" className="site-nav-desktop">
          <ul className="site-nav">
            <li>
              <RouterLink
                aria-current={isHomeRoute ? 'page' : undefined}
                className={`site-nav__link ${isHomeRoute ? 'site-nav__link--active' : ''}`}
                href={CUSTOMER_ROUTES.home}
              >
                Trang chủ
              </RouterLink>
            </li>
            <li>
              <RouterLink
                aria-current={isCatalogRoute ? 'page' : undefined}
                className={`site-nav__link ${isCatalogRoute ? 'site-nav__link--active' : ''}`}
                href={CUSTOMER_ROUTES.products}
              >
                Sản phẩm
              </RouterLink>
            </li>
          </ul>
        </nav>

        {/* Right: Commerce utility actions */}
        <div className="site-header__actions">
          <RouterLink
            aria-label="Tìm kiếm sản phẩm"
            className="header-action-btn"
            href={CUSTOMER_ROUTES.products}
            onClick={closeMobileMenu}
            title="Tìm kiếm sản phẩm"
          >
            <svg
              aria-hidden="true"
              className="action-icon"
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
            <span className="header-action-label">Tìm kiếm</span>
          </RouterLink>

          <RouterLink
            aria-label="Giỏ hàng (0 sản phẩm)"
            className="header-action-btn header-action-btn--cart"
            href={CUSTOMER_ROUTES.products}
            onClick={closeMobileMenu}
            title="Giỏ hàng"
          >
            <span className="cart-icon-wrap">
              <svg
                aria-hidden="true"
                className="action-icon"
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
              <span className="cart-badge" aria-hidden="true">0</span>
            </span>
            <span className="header-action-label">Giỏ hàng</span>
          </RouterLink>

          <RouterLink
            aria-label="Tài khoản / Đăng nhập"
            className="header-action-btn header-action-btn--account"
            href={CUSTOMER_ROUTES.home}
            onClick={closeMobileMenu}
            title="Tài khoản"
          >
            <svg
              aria-hidden="true"
              className="action-icon"
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
            <span className="header-action-label">Tài khoản</span>
          </RouterLink>

          {/* Mobile Menu Toggle Button */}
          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            type="button"
          >
            {mobileMenuOpen ? (
              <svg
                aria-hidden="true"
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
        <div className="site-header__mobile-menu">
          <nav aria-label="Điều hướng di động">
            <ul className="mobile-nav-list">
              <li>
                <RouterLink
                  aria-current={isHomeRoute ? 'page' : undefined}
                  className={`mobile-nav-link ${isHomeRoute ? 'mobile-nav-link--active' : ''}`}
                  href={CUSTOMER_ROUTES.home}
                  onClick={closeMobileMenu}
                >
                  Trang chủ
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  aria-current={isCatalogRoute ? 'page' : undefined}
                  className={`mobile-nav-link ${isCatalogRoute ? 'mobile-nav-link--active' : ''}`}
                  href={CUSTOMER_ROUTES.products}
                  onClick={closeMobileMenu}
                >
                  Sản phẩm
                </RouterLink>
              </li>
              <li>
                <RouterLink
                  className="mobile-nav-link"
                  href={CUSTOMER_ROUTES.products}
                  onClick={closeMobileMenu}
                >
                  Tìm kiếm nhạc cụ
                </RouterLink>
              </li>
            </ul>
          </nav>
        </div>
      ) : null}
    </header>
  )
}

export default SiteHeader
