const STATUS_STYLES = Object.freeze({
  PENDING_CONFIRMATION: 'bg-brand',
  CONFIRMED: 'bg-jade',
  OUT_OF_STOCK_WAITING: 'bg-zinc-500',
  SHIPPING: 'bg-blue-600',
  DELIVERED: 'bg-violet-600',
  COMPLETED: 'bg-emerald-700',
  CANCELLED: 'bg-rose-600',
})

function StaffOrderStatusChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Chưa có dữ liệu trạng thái đơn hàng.
      </div>
    )
  }

  const maxCount = Math.max(...data.map((item) => Number(item.count) || 0), 1)

  return (
    <ul aria-label="Phân bổ đơn hàng theo trạng thái" className="flex flex-col gap-5">
      {data.map((item) => {
        const count = Number(item.count) || 0
        const width = `${Math.max((count / maxCount) * 100, count > 0 ? 5 : 0)}%`

        return (
          <li key={item.status} className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-medium text-ink">{item.label}</span>
              <strong className="font-mono text-ink tabular-nums">{count}</strong>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-subtle" aria-hidden="true">
              <div
                className={`h-full rounded-full ${STATUS_STYLES[item.status] || 'bg-zinc-500'}`}
                style={{ width }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default StaffOrderStatusChart
