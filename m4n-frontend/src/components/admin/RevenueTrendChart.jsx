import { useState, useId } from 'react'
import { formatCurrencyVND } from '../../utils/currency.js'

function formatCompactVND(val) {
  if (val >= 1_000_000_000) {
    return (val / 1_000_000_000).toFixed(1) + ' tỷ'
  }
  if (val >= 1_000_000) {
    return (val / 1_000_000).toFixed(1) + ' tr'
  }
  if (val >= 1_000) {
    return (val / 1_000).toFixed(0) + ' k'
  }
  return String(val)
}

function RevenueTrendChart({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const gradientId = useId()

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-muted">
        Chưa có dữ liệu doanh thu trong kỳ này.
      </div>
    )
  }

  // Dimensions
  const svgWidth = 650
  const svgHeight = 250
  const padLeft = 60
  const padRight = 25
  const padTop = 30
  const padBottom = 35

  const chartW = svgWidth - padLeft - padRight
  const chartH = svgHeight - padTop - padBottom

  // Values
  const values = data.map((d) => Number(d.revenue) || 0)
  const maxVal = Math.max(...values, 1000000) // minimum scale 1M
  // Round up maxVal to a clean ceiling
  const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)))
  const yMax = Math.ceil(maxVal / magnitude) * magnitude

  const numTicks = 4
  const yTicks = Array.from({ length: numTicks + 1 }, (_, i) => (yMax / numTicks) * i)

  // Point coordinates
  const points = data.map((d, i) => {
    const x =
      data.length > 1
        ? padLeft + (i / (data.length - 1)) * chartW
        : padLeft + chartW / 2
    const val = Number(d.revenue) || 0
    const y = padTop + chartH - (val / yMax) * chartH
    return { x, y, val, label: d.label, orderCount: d.orderCount }
  })

  // Build SVG path
  const linePath = points.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`
  }, '')

  const firstPt = points[0]
  const lastPt = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPt.x},${padTop + chartH} L ${firstPt.x},${padTop + chartH} Z`

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
        aria-label="Biểu đồ xu hướng doanh thu"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0D9488" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Grid lines and labels */}
        {yTicks.map((tick) => {
          const yPos = padTop + chartH - (tick / yMax) * chartH
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={yPos}
                x2={svgWidth - padRight}
                y2={yPos}
                stroke="#E5E8EB"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padLeft - 10}
                y={yPos + 4}
                textAnchor="end"
                className="text-[11px] font-medium fill-muted"
              >
                {formatCompactVND(tick)}
              </text>
            </g>
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Primary Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#0D9488"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X Axis Labels */}
        {points.map((pt, i) => (
          <text
            key={i}
            x={pt.x}
            y={svgHeight - 10}
            textAnchor="middle"
            className="text-[11px] font-medium fill-muted"
          >
            {pt.label}
          </text>
        ))}

        {/* Interactive Hover Guide Line and Points */}
        {activePoint && (
          <g pointerEvents="none">
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartH}
              stroke="#0D9488"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              opacity="0.75"
            />
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r="6"
              fill="#FFFFFF"
              stroke="#0D9488"
              strokeWidth="3"
            />
          </g>
        )}

        {/* Invisible capture overlays for hover detection */}
        {points.map((pt, i) => {
          const segWidth = chartW / Math.max(points.length - 1, 1)
          const startX = Math.max(padLeft, pt.x - segWidth / 2)
          return (
            <rect
              key={i}
              x={startX}
              y={padTop}
              width={segWidth}
              height={chartH}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(i)}
              onBlur={() => setHoverIndex(null)}
              tabIndex={0}
              aria-label={`${pt.label}: ${formatCurrencyVND(pt.val)}, ${pt.orderCount} đơn`}
            />
          )
        })}
      </svg>

      {/* Floating Tooltip */}
      {activePoint && (
        <div
          className="absolute pointer-events-none z-20 bg-zinc-900 text-white px-3 py-2 rounded-xl shadow-xl text-xs flex flex-col gap-0.5 border border-zinc-700/80 transition-all duration-150"
          style={{
            left: `${(activePoint.x / svgWidth) * 100}%`,
            top: `${(activePoint.y / svgHeight) * 100}%`,
            transform: 'translate(-50%, -120%)',
          }}
        >
          <div className="text-[10px] text-zinc-400 font-medium">
            {activePoint.label}
          </div>
          <div className="font-bold text-sm text-white">
            {formatCurrencyVND(activePoint.val)}
          </div>
          <div className="text-[10px] text-zinc-300">
            {activePoint.orderCount ?? 0} đơn hàng
          </div>
        </div>
      )}
    </div>
  )
}

export default RevenueTrendChart
