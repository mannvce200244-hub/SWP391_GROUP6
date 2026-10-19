function InventoryDonutChart({ inventory = {} }) {
  const available = Number(inventory.availableCount) || 0
  const lowStock = Number(inventory.lowStockCount) || 0
  const outOfStock = Number(inventory.outOfStockCount) || 0
  const totalItems = Number(inventory.totalItems) || 0

  const totalModels = available + lowStock + outOfStock
  const sumForPct = totalModels > 0 ? totalModels : 1

  const pctAvailable = Math.round((available / sumForPct) * 100)
  const pctLowStock = Math.round((lowStock / sumForPct) * 100)
  const pctOutOfStock = Math.max(0, 100 - pctAvailable - pctLowStock)

  // SVG Donut calculation
  const size = 160
  const strokeWidth = 18
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const dashAvailable = (pctAvailable / 100) * circumference
  const dashLowStock = (pctLowStock / 100) * circumference
  const dashOutOfStock = (pctOutOfStock / 100) * circumference

  const offsetAvailable = 0
  const offsetLowStock = -dashAvailable
  const offsetOutOfStock = -(dashAvailable + dashLowStock)

  const items = [
    {
      label: 'Sẵn sàng / Đủ hàng',
      count: available,
      color: '#1F6B5A',
      bgColor: 'bg-emerald-500',
      tagColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      pct: pctAvailable,
    },
    {
      label: 'Sắp hết hàng',
      count: lowStock,
      color: '#D97706',
      bgColor: 'bg-amber-500',
      tagColor: 'text-amber-700 bg-amber-50 border-amber-200',
      pct: pctLowStock,
    },
    {
      label: 'Hết hàng',
      count: outOfStock,
      color: '#DC2626',
      bgColor: 'bg-rose-500',
      tagColor: 'text-rose-700 bg-rose-50 border-rose-200',
      pct: pctOutOfStock,
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      {/* Top row: Donut & Quick stats */}
      <div className="flex items-center justify-around gap-4 py-2">
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
            {/* Background ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#F2F4F5"
              strokeWidth={strokeWidth}
            />

            {/* Available segment */}
            {pctAvailable > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#1F6B5A"
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashAvailable} ${circumference}`}
                strokeDashoffset={offsetAvailable}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}

            {/* Low stock segment */}
            {pctLowStock > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#D97706"
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashLowStock} ${circumference}`}
                strokeDashoffset={offsetLowStock}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}

            {/* Out of stock segment */}
            {pctOutOfStock > 0 && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#DC2626"
                strokeWidth={strokeWidth}
                strokeDasharray={`${dashOutOfStock} ${circumference}`}
                strokeDashoffset={offsetOutOfStock}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-ink font-sans tracking-tight">
              {totalItems}
            </span>
            <span className="text-[10px] uppercase font-semibold text-muted tracking-wider">
              Hiện có
            </span>
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="flex flex-col gap-2.5 flex-1 min-w-0">
          <div className="text-xs font-semibold text-muted">
            Tổng cộng: <strong className="text-ink">{totalModels}</strong> mẫu nhạc cụ
          </div>
          <div className="text-xs font-semibold text-muted">
            Tổng tồn: <strong className="text-ink">{totalItems}</strong> sản phẩm
          </div>
        </div>
      </div>

      {/* Legend & Details */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/80">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-surface-secondary/70 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`w-2.5 h-2.5 rounded-full ${it.bgColor} shrink-0`} />
              <span className="text-ink font-medium truncate">{it.label}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-bold text-ink">{it.count}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${it.tagColor}`}>
                {it.pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InventoryDonutChart
