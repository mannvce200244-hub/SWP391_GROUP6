import RouterLink from '../../routes/RouterLink.jsx'
import BrandLogo from './BrandLogo.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

const DISCOVER_LINKS = Object.freeze([
  { label: 'Tất cả sản phẩm', href: CUSTOMER_ROUTES.products },
  { label: 'Nghệ nhân & Làng nghề', href: CUSTOMER_ROUTES.artisans },
  { label: 'Bài viết & Hướng dẫn', href: CUSTOMER_ROUTES.articles },
  { label: 'Nhạc cụ dây', href: `${CUSTOMER_ROUTES.products}?group=DAY` },
  { label: 'Nhạc cụ hơi', href: `${CUSTOMER_ROUTES.products}?group=HOI` },
  { label: 'Nhạc cụ gõ', href: `${CUSTOMER_ROUTES.products}?group=GO` },
])

function SiteFooter({ onOpenChat, supportHref }) {
  return (
    <footer className="bg-[#F6F7F8] text-ink border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Column 1: Brand intro */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <BrandLogo />
          <p className="text-sm text-secondary leading-relaxed max-w-sm">
            Nền tảng mua sắm nhạc cụ truyền thống với thông tin sản phẩm, nghệ nhân,
            làng nghề và hỗ trợ trực tuyến trong cùng một hệ thống.
          </p>
        </div>

        {/* Column 2: Discover */}
        <nav aria-label="Khám phá danh mục" className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold tracking-wider text-secondary uppercase">Khám phá</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mt-3">
            {DISCOVER_LINKS.map((link) => (
              <li key={link.label}>
                <RouterLink href={link.href} className="text-sm text-secondary hover:text-brand transition-colors">
                  {link.label}
                </RouterLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Column 3: Account */}
        <nav aria-label="Tài khoản" className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold tracking-wider text-secondary uppercase">Tài khoản</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mt-3">
            <li>
              <RouterLink href={CUSTOMER_ROUTES.profile} className="text-sm text-secondary hover:text-brand transition-colors">
                Hồ sơ cá nhân
              </RouterLink>
            </li>
          </ul>
        </nav>

        {/* Column 4: Support */}
        {(onOpenChat || supportHref) && <nav aria-label="Hỗ trợ" className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold tracking-wider text-secondary uppercase">Hỗ trợ</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mt-3">
            <li>
              {onOpenChat ? (
                <button type="button" onClick={onOpenChat} className="min-h-11 cursor-pointer text-left text-sm text-secondary hover:text-brand transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                  Chat với nhân viên
                </button>
              ) : (
                <RouterLink href={supportHref} className="text-sm text-secondary hover:text-brand transition-colors">
                  Hàng đợi hỗ trợ
                </RouterLink>
              )}
            </li>
          </ul>
        </nav>}
      </div>

      <div className="border-t border-border py-6 text-center text-xs text-secondary">
        <p>© {new Date().getFullYear()} M4N · Nhạc cụ truyền thống Việt Nam.</p>
      </div>
    </footer>
  )
}

export default SiteFooter
