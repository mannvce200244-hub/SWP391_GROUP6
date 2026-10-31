import {
  ChevronRight,
  CircleCheckBig,
  Clock3,
  MailWarning,
  MessageCircle,
  MessagesSquare,
  Package,
  Search,
} from 'lucide-react'
import ErrorState from '../components/ui/ErrorState.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import useAuth from '../features/auth/useAuth.js'
import StaffOrderStatusChart from '../features/staff/StaffOrderStatusChart.jsx'
import StaffOrderTrendPanel from '../features/staff/StaffOrderTrendPanel.jsx'
import useStaffDashboard from '../features/staff/useStaffDashboard.js'
import RouterLink from '../routes/RouterLink.jsx'
import { CUSTOMER_ROUTES } from '../routes/customerRoutes.js'

const QUICK_ACTIONS = Object.freeze([
  Object.freeze({
    title: 'Đơn hàng online',
    description: 'Xem, xác nhận và xử lý đơn hàng trực tuyến từ khách hàng.',
    path: CUSTOMER_ROUTES.staffOrders,
    Icon: Package,
    accentColor: 'text-brand',
  }),
  Object.freeze({
    title: 'Hỗ trợ khách hàng',
    description: 'Tiếp nhận và phản hồi tin nhắn hỗ trợ từ khách hàng.',
    path: CUSTOMER_ROUTES.staffChat,
    Icon: MessageCircle,
    accentColor: 'text-jade',
  }),
  Object.freeze({
    title: 'Tra cứu sản phẩm',
    description: 'Tra cứu thông tin sản phẩm để hỗ trợ xử lý đơn và tư vấn.',
    path: CUSTOMER_ROUTES.staffProducts,
    Icon: Search,
    accentColor: 'text-zinc-700',
  }),
])

function DashboardSkeleton() {
  return (
    <div
      aria-label="Đang tải tổng quan công việc"
      aria-busy="true"
      className="flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Skeleton className="h-[22rem] w-full rounded-2xl xl:col-span-7" />
        <Skeleton className="h-[22rem] w-full rounded-2xl xl:col-span-5" />
      </div>
    </div>
  )
}
function StaffDashboardPage() {
  const { user } = useAuth()
  const {
    dashboardState,
    retryDashboard,
    trendFilters,
    updateTrendFilters,
  } = useStaffDashboard()
  const dashboard = dashboardState.data
  const kpi = dashboard?.kpi
  const kpiCards = kpi
    ? [
        {
          label: 'Đơn chờ xác nhận',
          value: kpi.pendingOrders,
          helper: 'Cần kiểm tra và phản hồi',
          Icon: Clock3,
          iconClassName: 'text-brand',
        },
        {
          label: 'Đơn đã xác nhận',
          value: kpi.confirmedOrders,
          helper: 'Đang tiếp tục xử lý',
          Icon: CircleCheckBig,
          iconClassName: 'text-jade',
        },
        {
          label: 'Hội thoại đang chờ',
          value: kpi.waitingConversations,
          helper: 'Chưa có nhân viên tiếp nhận',
          Icon: MessagesSquare,
          iconClassName: 'text-sky-600',
        },
        {
          label: 'Tin nhắn chưa đọc',
          value: kpi.unreadMessages,
          helper: 'Trong hội thoại của bạn',
          Icon: MailWarning,
          iconClassName: 'text-rose-600',
        },
      ]
    : []

  const attentionItems = kpi
    ? [
        {
          label: 'Đơn hàng chờ xác nhận',
          value: kpi.pendingOrders,
          path: CUSTOMER_ROUTES.staffOrders,
        },
        {
          label: 'Hội thoại chưa được tiếp nhận',
          value: kpi.waitingConversations,
          path: CUSTOMER_ROUTES.staffChat,
        },
        {
          label: 'Tin nhắn khách hàng chưa đọc',
          value: kpi.unreadMessages,
          path: CUSTOMER_ROUTES.staffChat,
        },
      ]
    : []

  return (
    <div className="flex flex-col gap-8 pb-10">
      <section className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-border bg-white p-6 shadow-xs sm:p-8 md:flex-row md:items-center">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand">
            Bàn làm việc Online
          </span>
          <h1 className="text-balance font-sans text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Xin chào, {user?.fullName || 'Nhân viên'}
          </h1>
          <p className="text-xs text-muted sm:text-sm">
            Tổng hợp công việc và truy cập nhanh các chức năng vận hành.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col rounded-xl border border-border bg-canvas px-4 py-2 text-xs">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tài khoản ca trực
            </span>
            <span className="mt-0.5 break-all font-mono font-bold text-ink">{user?.email}</span>
          </div>
          <div className="flex flex-col rounded-xl border border-border bg-white px-4 py-2 text-xs">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Trạng thái
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 font-bold text-jade">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-jade" />
              Đang trong ca trực
            </span>
          </div>
        </div>
      </section>

      {dashboardState.status === 'loading' && <DashboardSkeleton />}

      {dashboardState.status === 'error' && (
        <ErrorState
          title="Chưa thể tải tổng quan công việc"
          message="Dữ liệu vận hành đang tạm thời chưa sẵn sàng. Vui lòng thử lại."
          onRetry={retryDashboard}
        />
      )}

      {dashboard && dashboardState.status !== 'error' && (
        <>
          <section aria-labelledby="staff-kpi-heading" className="flex flex-col gap-4">
            <div>
              <h2 id="staff-kpi-heading" className="text-base font-bold text-ink">
                Tổng quan hôm nay
              </h2>
              <p className="mt-1 text-xs text-muted">Các đầu việc cần theo dõi trong ca trực hiện tại.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {kpiCards.map((item) => {
                const ItemIcon = item.Icon
                return (
                  <article key={item.label} className="rounded-2xl border border-border bg-white p-5 shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted">{item.label}</p>
                        <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-ink">
                          {item.value}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas">
                        <ItemIcon aria-hidden="true" className={item.iconClassName} size={20} />
                      </div>
                    </div>
                    <p className="mt-4 text-xs text-muted">{item.helper}</p>
                  </article>
                )
              })}
            </div>
          </section>

          <section aria-label="Biểu đồ vận hành" className="grid grid-cols-1 gap-5 xl:grid-cols-12">
            <StaffOrderTrendPanel
              appliedFilters={dashboardState.appliedFilters}
              data={dashboard.orderTrend}
              filterError={dashboardState.filterError}
              filters={trendFilters}
              isRefreshing={dashboardState.status === 'refreshing'}
              onFilterChange={updateTrendFilters}
            />

            <article className="rounded-2xl border border-border bg-white p-5 shadow-xs sm:p-6 xl:col-span-5">
              <h2 className="text-base font-bold text-ink">Phân bổ trạng thái đơn</h2>
              <p className="mt-1 text-xs text-muted">Số lượng đơn hiện có theo từng trạng thái.</p>
              <div className="mt-6">
                <StaffOrderStatusChart data={dashboard.orderStatusCounts} />
              </div>
            </article>
          </section>

          <section aria-labelledby="attention-heading" className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs">
            <div className="border-b border-border bg-canvas px-5 py-4 sm:px-6">
              <h2 id="attention-heading" className="text-base font-bold text-ink">Cần xử lý ngay</h2>
              <p className="mt-1 text-xs text-muted">Mở đúng hàng đợi để bắt đầu công việc.</p>
            </div>
            <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
              {attentionItems.map((item) => (
                <RouterLink
                  key={item.label}
                  href={item.path}
                  className="group flex items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 motion-reduce:transition-none sm:p-6"
                >
                  <div>
                    <p className="text-xs font-semibold text-muted">{item.label}</p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-ink">{item.value}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-brand">
                    Mở hàng đợi
                    <ChevronRight aria-hidden="true" className="transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" size={14} />
                  </span>
                </RouterLink>
              ))}
            </div>
          </section>
        </>
      )}

      <section aria-labelledby="quick-actions-heading" className="flex flex-col gap-4">
        <h2 id="quick-actions-heading" className="text-base font-bold text-ink">Chức năng vận hành</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((item) => {
            const ItemIcon = item.Icon
            return (
              <RouterLink
                key={item.path}
                href={item.path}
                className="group flex flex-col rounded-2xl border border-border bg-white p-5 text-left shadow-xs transition-[border-color,box-shadow] duration-200 hover:border-zinc-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:transition-none"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-canvas">
                  <ItemIcon aria-hidden="true" className={item.accentColor} size={20} />
                </div>
                <h3 className="mb-1.5 text-sm font-bold text-ink transition-colors group-hover:text-brand">
                  {item.title}
                </h3>
                <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted">{item.description}</p>
                <div className="mt-auto flex w-full items-center justify-between border-t border-border/80 pt-3 text-xs font-semibold text-brand">
                  <span>Mở chức năng</span>
                  <ChevronRight aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none" size={14} />
                </div>
              </RouterLink>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default StaffDashboardPage
