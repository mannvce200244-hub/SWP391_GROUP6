import StaffOrderTrendChart from './StaffOrderTrendChart.jsx'
import {
  STAFF_TREND_DAY_OPTIONS,
  STAFF_TREND_STATUS_OPTIONS,
} from './staffDashboardFilters.js'

function StaffOrderTrendPanel({
  appliedFilters,
  data,
  filterError,
  filters,
  isRefreshing,
  onFilterChange,
}) {
  const appliedStatusLabel = STAFF_TREND_STATUS_OPTIONS.find(
    (option) => option.value === appliedFilters.status,
  )?.label

  return (
    <article
      aria-busy={isRefreshing}
      className="rounded-2xl border border-border bg-white p-5 shadow-xs sm:p-6 xl:col-span-7"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-balance text-base font-bold text-ink">
            Đơn hàng mới trong {appliedFilters.days} ngày
          </h2>
          <p className="mt-1 text-xs text-muted">
            {appliedStatusLabel}, theo ngày tạo đơn và múi giờ Việt Nam.
          </p>
        </div>

        <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:w-auto sm:grid-cols-2">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-muted">
            Khoảng thời gian
            <select
              className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 motion-reduce:transition-none"
              onChange={(event) => onFilterChange({ days: Number(event.target.value) })}
              value={filters.days}
            >
              {STAFF_TREND_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>{days} ngày</option>
              ))}
            </select>
          </label>

          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold text-muted">
            Trạng thái đơn
            <select
              className="min-h-11 w-full min-w-0 rounded-xl border border-border bg-white px-3 text-sm font-medium text-ink outline-none transition-[border-color,box-shadow] focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 motion-reduce:transition-none"
              onChange={(event) => onFilterChange({ status: event.target.value })}
              value={filters.status}
            >
              {STAFF_TREND_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-3 min-h-5 text-xs" role="status" aria-live="polite">
        {isRefreshing && <span className="text-muted">Đang cập nhật biểu đồ…</span>}
        {filterError && (
          <span className="text-danger">Không thể áp dụng bộ lọc. Biểu đồ đang giữ dữ liệu trước đó.</span>
        )}
      </div>

      <div className={isRefreshing ? 'opacity-60 transition-opacity motion-reduce:transition-none' : 'transition-opacity motion-reduce:transition-none'}>
        <StaffOrderTrendChart data={data} />
      </div>
    </article>
  )
}

export default StaffOrderTrendPanel
