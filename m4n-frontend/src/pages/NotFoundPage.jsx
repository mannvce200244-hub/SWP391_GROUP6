import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'

function NotFoundPage() {
  return (
    <section className="page-shell not-found">
      <p className="eyebrow">404</p>
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn này chưa thuộc phạm vi frontend hiện tại.</p>
      <RouterLink
        className="button button--primary"
        href={CUSTOMER_ROUTES.home}
      >
        Về trang chủ
      </RouterLink>
    </section>
  )
}

export default NotFoundPage
