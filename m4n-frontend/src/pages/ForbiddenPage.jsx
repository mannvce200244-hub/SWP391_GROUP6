import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'
import useAuth from '../features/auth/useAuth.js'

function ForbiddenPage() {
  const { user, isAuthenticated } = useAuth()

  let homeDestination = CUSTOMER_ROUTES.home
  if (isAuthenticated && user) {
    if (user.role === 'ADMIN') homeDestination = CUSTOMER_ROUTES.admin
    else if (user.role === 'ONLINE_STAFF') homeDestination = CUSTOMER_ROUTES.staff
    else if (user.role === 'POS_STAFF') homeDestination = CUSTOMER_ROUTES.pos
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-lg w-full bg-surface rounded-2xl border border-border p-6 sm:p-10 text-center shadow-md flex flex-col items-center gap-4">
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase tracking-wider">
          403 - Quyền truy cập bị từ chối
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-ink font-sans">Bạn không có quyền truy cập trang này</h1>
        <p className="text-sm text-muted leading-relaxed">
          Tài khoản hiện tại của bạn không có đủ thẩm quyền để xem hoặc thao tác trên nội dung được yêu cầu. Nếu bạn cần quyền truy cập, vui lòng liên hệ quản trị viên hệ thống.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full">
          <RouterLink href={homeDestination} className="inline-flex items-center justify-center font-semibold transition-colors bg-brand text-white hover:bg-brand-hover h-11 px-5 text-sm rounded-lg cursor-pointer shadow-xs">
            Về trang chủ của bạn
          </RouterLink>
          <RouterLink href={CUSTOMER_ROUTES.home} className="inline-flex items-center justify-center font-semibold transition-colors border border-border bg-surface text-ink hover:bg-surface-secondary h-11 px-5 text-sm rounded-lg cursor-pointer">
            Khám phá cửa hàng
          </RouterLink>
        </div>
      </div>
    </div>
  )
}

export default ForbiddenPage
