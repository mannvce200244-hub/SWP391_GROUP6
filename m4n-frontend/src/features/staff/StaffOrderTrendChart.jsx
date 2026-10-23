const DAY_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
})

function formatDateLabel(date) {
  return DAY_FORMATTER.format(new Date(`${date}T00:00:00`))
}

function StaffOrderTrendChart({ data = [] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        Chưa có dữ liệu đơn hàng trong 7 ngày gần đây.
      </div>
    )
  }

  const width = Math.max(680, data.length * 64)
  const height = 260
  const padding = { top: 24, right: 24, bottom: 42, left: 44 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const values = data.map((item) => Number(item.orderCount) || 0)
  const maxValue = Math.max(...values, 1)
  const yMax = Math.max(4, Math.ceil(maxValue / 4) * 4)
  const points = data.map((item, index) => ({
    ...item,
    label: formatDateLabel(item.date),
    count: values[index],
    x: padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth,
    y: padding.top + chartHeight - (values[index] / yMax) * chartHeight,
  }))
  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
  const tickValues = [0, yMax / 2, yMax]

  return (
    <div className="w-full">
      <p className="mb-2 text-[11px] text-muted sm:hidden">Cuộn ngang để xem đủ 7 ngày.</p>
      <div className="overflow-x-auto">
        <svg
          aria-label="Biểu đồ số đơn hàng mới trong 7 ngày gần đây"
          className="h-auto w-full"
          role="img"
          style={{ minWidth: `${width}px` }}
          viewBox={`0 0 ${width} ${height}`}
        >
        {tickValues.map((tick) => {
          const y = padding.top + chartHeight - (tick / yMax) * chartHeight
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeDasharray="4 5"
              />
              <text x={padding.left - 12} y={y + 4} textAnchor="end" className="fill-muted text-[11px]">
                {tick}
              </text>
            </g>
          )
        })}

        <path
          d={linePath}
          fill="none"
          stroke="currentColor"
          className="text-brand"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        />

        {points.map((point) => (
          <g key={point.date}>
            <circle
              aria-label={`${point.label}: ${point.count} đơn hàng`}
              className="fill-white stroke-brand outline-none focus-visible:stroke-[5px]"
              cx={point.x}
              cy={point.y}
              r="5"
              role="img"
              strokeWidth="3"
              tabIndex={0}
            />
            <text x={point.x} y={height - 14} textAnchor="middle" className="fill-muted text-[11px] font-medium">
              {point.label}
            </text>
            <text x={point.x} y={point.y - 12} textAnchor="middle" className="fill-ink text-[11px] font-bold">
              {point.count}
            </text>
          </g>
        ))}
        </svg>
      </div>
    </div>
  )
}

export default StaffOrderTrendChart
