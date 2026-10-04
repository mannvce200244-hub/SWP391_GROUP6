import RouterLink from '../../routes/RouterLink.jsx'
import BrandLogo from './BrandLogo.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function SiteFooter() {
  return (
    <footer className="bg-ink text-white border-t border-neutral-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
        {/* Column 1: Brand intro */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <BrandLogo variant="dark" />
          <p className="text-sm text-neutral-400 leading-relaxed max-w-sm">
            Nền tảng mua sắm và giới thiệu nhạc cụ truyền thống Việt Nam chất lượng
            cao, kết nối trực tiếp với nghệ nhân và làng nghề chế tác thủ công.
          </p>
        </div>

        {/* Column 2: Discover */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Khám phá</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mt-3">
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products} className="text-sm text-neutral-300 hover:text-white transition-colors">
                Tất cả sản phẩm
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products} className="text-sm text-neutral-300 hover:text-white transition-colors">
                Nhạc cụ dây
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products} className="text-sm text-neutral-300 hover:text-white transition-colors">
                Nhạc cụ hơi
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products} className="text-sm text-neutral-300 hover:text-white transition-colors">
                Nhạc cụ gõ
              </RouterLink>
            </li>
          </ul>
        </div>

        {/* Column 3: Account */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Tài khoản</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mt-3">
            <li>
              <RouterLink href={CUSTOMER_ROUTES.home} className="text-sm text-neutral-300 hover:text-white transition-colors">
                Đơn hàng của tôi
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.home} className="text-sm text-neutral-300 hover:text-white transition-colors">
                Hồ sơ cá nhân
              </RouterLink>
            </li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">Hỗ trợ</h3>
          <ul className="flex flex-col gap-2.5 list-none p-0 m-0 mt-3">
            <li>
              <RouterLink href={CUSTOMER_ROUTES.home} className="text-sm text-neutral-300 hover:text-white transition-colors">
                Chat với nhân viên trực tuyến
              </RouterLink>
            </li>
          </ul>
          <p className="text-xs text-neutral-400 leading-relaxed mt-3">
            Đội ngũ tư vấn trực tuyến hỗ trợ thông tin chi tiết về từng nhạc cụ và kỹ thuật chơi.
          </p>
        </div>
      </div>

      <div className="border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} M4N · Nhạc cụ truyền thống Việt Nam. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  )
}

export default SiteFooter
