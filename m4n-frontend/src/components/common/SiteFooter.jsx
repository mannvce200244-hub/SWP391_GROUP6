import RouterLink from '../../routes/RouterLink.jsx'
import BrandLogo from './BrandLogo.jsx'
import { CUSTOMER_ROUTES } from '../../routes/customerRoutes.js'

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        {/* Column 1: Brand intro */}
        <div className="site-footer__col site-footer__col--brand">
          <BrandLogo variant="dark" />
          <p className="footer-brand__desc">
            Nền tảng mua sắm và giới thiệu nhạc cụ truyền thống Việt Nam chất lượng
            cao, kết nối trực tiếp với nghệ nhân và làng nghề chế tác thủ công.
          </p>
        </div>

        {/* Column 2: Discover */}
        <div className="site-footer__col">
          <h3 className="footer-heading">Khám phá</h3>
          <ul className="footer-nav">
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products}>
                Tất cả sản phẩm
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products}>
                Nhạc cụ dây
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products}>
                Nhạc cụ hơi
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.products}>
                Nhạc cụ gõ
              </RouterLink>
            </li>
          </ul>
        </div>

        {/* Column 3: Account */}
        <div className="site-footer__col">
          <h3 className="footer-heading">Tài khoản</h3>
          <ul className="footer-nav">
            <li>
              <RouterLink href={CUSTOMER_ROUTES.home}>
                Đơn hàng của tôi
              </RouterLink>
            </li>
            <li>
              <RouterLink href={CUSTOMER_ROUTES.home}>
                Hồ sơ cá nhân
              </RouterLink>
            </li>
          </ul>
        </div>

        {/* Column 4: Support */}
        <div className="site-footer__col">
          <h3 className="footer-heading">Hỗ trợ</h3>
          <ul className="footer-nav">
            <li>
              <RouterLink href={CUSTOMER_ROUTES.home}>
                Chat với nhân viên trực tuyến
              </RouterLink>
            </li>
          </ul>
          <p className="footer-support-note">
            Đội ngũ tư vấn trực tuyến hỗ trợ thông tin chi tiết về từng nhạc cụ và kỹ thuật chơi.
          </p>
        </div>
      </div>

      <div className="site-footer__bottom">
        <p>© {new Date().getFullYear()} M4N · Nhạc cụ truyền thống Việt Nam. Bảo lưu mọi quyền.</p>
      </div>
    </footer>
  )
}

export default SiteFooter
