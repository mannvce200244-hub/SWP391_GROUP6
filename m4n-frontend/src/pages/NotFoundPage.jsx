import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'

function NotFoundPage() {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4 sm:p-8 max-w-lg mx-auto gap-3">
      <p className="text-xs font-bold uppercase tracking-wider text-brand">404</p>
      <h1 className="text-3xl font-bold tracking-tight text-ink font-sans">Không tìm thấy trang</h1>
      <p className="text-sm text-muted">Đường dẫn này chưa thuộc phạm vi frontend hiện tại.</p>
      <RouterLink
        className="inline-flex items-center justify-center font-semibold transition-colors bg-brand text-white hover:bg-brand-hover h-11 px-6 text-sm rounded-lg cursor-pointer shadow-xs mt-2"
        href={CUSTOMER_ROUTES.home}
      >
        Về trang chủ
      </RouterLink>
    </section>
  )
}

export default NotFoundPage
