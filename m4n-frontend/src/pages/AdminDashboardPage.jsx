import { useState, useEffect } from 'react'
import { getDashboardSummary } from '../services/dashboardService.js'
import { formatCurrencyVND } from '../utils/currency.js'
import RevenueTrendChart from '../components/admin/RevenueTrendChart.jsx'
import InventoryDonutChart from '../components/admin/InventoryDonutChart.jsx'
import {
  IconInstrument,
  IconPackage,
  IconCheck,
  IconClose,
  IconStore,
} from '../components/ui/Icons.jsx'
import prodDanTranh from '../assets/images/prod-dan-tranh.jpg'
import prodDanBau from '../assets/images/prod-dan-bau.jpg'
import prodDanNguyet from '../assets/images/prod-dan-nguyet.jpg'
import prodSaoTruc from '../assets/images/prod-sao-truc.jpg'

const PERIOD_OPTIONS = [
  { id: 'day', label: 'Ngày' },
  { id: 'week', label: 'Tuần' },
  { id: 'month', label: 'Tháng' },
  { id: 'quarter', label: 'Quý' },
]

const PRODUCT_IMAGE_MAP = {
  'TRN-001': prodDanTranh,
  'BAU-001': prodDanBau,
  'NGU-001': prodDanNguyet,
  'SAO-001': prodSaoTruc,
}

function formatDateVN(dateStr) {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return dateStr
  }
}

function getStatusBadge(status, label) {
  switch (status) {
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>{label || 'Hoàn thành'}</span>
        </span>
      )
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>{label || 'Đã xác nhận'}</span>
        </span>
      )
    case 'OUT_OF_STOCK_WAITING':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>{label || 'Chờ bổ sung kho'}</span>
        </span>
      )
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>{label || 'Đã hủy'}</span>
        </span>
      )
    case 'PENDING_CONFIRMATION':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>{label || 'Chờ xác nhận'}</span>
        </span>
      )
  }
}

function AdminDashboardPage() {
  const [period, setPeriod] = useState('month')
  const [retryCount, setRetryCount] = useState(0)
  const [dashboardState, setDashboardState] = useState({
    status: 'loading',
    data: null,
    error: null,
  })

  useEffect(() => {
    let active = true

    getDashboardSummary(period)
      .then((data) => {
        if (active) {
          setDashboardState({ status: 'success', data, error: null })
        }
      })
      .catch((err) => {
        if (active) {
          setDashboardState({
            status: 'error',
            data: null,
            error: err?.message || 'Không thể tải dữ liệu dashboard.',
          })
        }
      })

    return () => {
      active = false
    }
  }, [period, retryCount])

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
    setDashboardState((prev) => ({ ...prev, status: 'loading' }))
  }

  const handleRetry = () => {
    setDashboardState((prev) => ({ ...prev, status: 'loading' }))
    setRetryCount((c) => c + 1)
  }

  const loading = dashboardState.status === 'loading'
  const error = dashboardState.error
  const summary = dashboardState.data

  const kpi = summary?.kpi
  const inventory = summary?.inventory
  const revenueTrend = summary?.revenueTrend || []
  const topProducts = summary?.topProducts || []
  const recentOrders = summary?.recentOrders || []

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Dashboard Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-5 sm:p-6 rounded-2xl border border-[#E5E8EB] shadow-xs">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#17191B] tracking-tight font-sans">
            Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500">
            Tổng quan hoạt động kinh doanh và vận hành của M4N.
          </p>
        </div>

        {/* TailAdmin-style Segmented Period Selector */}
        <div
          className="inline-flex items-center p-1 bg-[#F5F7FA] rounded-xl border border-[#E5E8EB] self-start sm:self-auto"
          role="tablist"
          aria-label="Chọn kỳ báo cáo"
        >
          {PERIOD_OPTIONS.map((opt) => {
            const isActive = period === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handlePeriodChange(opt.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#111315] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-[#17191B] hover:bg-[#E5E8EB]/50'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Global Error Notice if request fails */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="font-bold">Lỗi:</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors cursor-pointer"
            onClick={handleRetry}
          >
            Thử lại
          </button>
        </div>
      )}


      {/* Row 1: 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Doanh thu */}
        <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#0D9488]" />
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-xs font-semibold text-zinc-500">Doanh thu</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center border border-teal-200 shrink-0">
              <IconStore size={18} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="h-8 w-32 bg-zinc-200 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-extrabold text-[#17191B] tracking-tight font-sans">
                {formatCurrencyVND(kpi?.totalRevenue)}
              </p>
            )}
            <span className="text-[11px] text-zinc-400 font-medium">
              Đơn hàng đã hoàn thành (BR-REVENUE-01)
            </span>
          </div>
        </div>

        {/* KPI 2: Tổng đơn hàng */}
        <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#626970]" />
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-xs font-semibold text-zinc-500">Tổng đơn hàng</span>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center border border-zinc-200 shrink-0">
              <IconPackage size={18} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="h-8 w-20 bg-zinc-200 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-extrabold text-[#17191B] tracking-tight font-sans">
                {Number(kpi?.totalOrders || 0).toLocaleString('vi-VN')}
              </p>
            )}
            <span className="text-[11px] text-zinc-400 font-medium">
              Tất cả trạng thái đơn
            </span>
          </div>
        </div>

        {/* KPI 3: Đơn hoàn thành */}
        <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#1F6B5A]" />
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-xs font-semibold text-zinc-500">Đơn hoàn thành</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shrink-0">
              <IconCheck size={18} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="h-8 w-20 bg-zinc-200 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-extrabold text-[#17191B] tracking-tight font-sans">
                {Number(kpi?.completedOrders || 0).toLocaleString('vi-VN')}
              </p>
            )}
            <span className="text-[11px] text-zinc-400 font-medium">
              Giao dịch thành công
            </span>
          </div>
        </div>

        {/* KPI 4: Đơn đã hủy */}
        <div className="flex flex-col justify-between p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#DC2626]" />
          <div className="flex items-start justify-between gap-3 mb-3">
            <span className="text-xs font-semibold text-zinc-500">Đơn đã hủy</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-200 shrink-0">
              <IconClose size={18} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {loading ? (
              <div className="h-8 w-20 bg-zinc-200 animate-pulse rounded-lg" />
            ) : (
              <p className="text-2xl font-extrabold text-[#17191B] tracking-tight font-sans">
                {Number(kpi?.cancelledOrders || 0).toLocaleString('vi-VN')}
              </p>
            )}
            <span className="text-[11px] text-zinc-400 font-medium">
              Không tính vào doanh thu
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: Charts (Revenue Trend 8 cols, Inventory Overview 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Revenue Trend Chart */}
        <div className="lg:col-span-8 flex flex-col p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-[#17191B] tracking-tight">
                Biến động Doanh thu
              </h3>
              <p className="text-xs text-zinc-400">
                Thống kê doanh thu theo {PERIOD_OPTIONS.find((p) => p.id === period)?.label.toLowerCase()}
              </p>
            </div>
            <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-teal-50 text-[#0D9488] border border-teal-200 self-start sm:self-auto">
              {PERIOD_OPTIONS.find((p) => p.id === period)?.label}
            </span>
          </div>

          <div className="flex-1 min-h-[260px] flex items-center justify-center">
            {loading ? (
              <div className="w-full h-60 bg-zinc-100 animate-pulse rounded-xl" />
            ) : (
              <RevenueTrendChart data={revenueTrend} />
            )}
          </div>
        </div>

        {/* Right: Inventory Status */}
        <div className="lg:col-span-4 flex flex-col p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#17191B] tracking-tight">
                Tình trạng tồn kho
              </h3>
              <p className="text-xs text-zinc-400">
                Kho tổng nhạc cụ thời gian thực
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">
              KHO M4N
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {loading ? (
              <div className="w-full h-60 bg-zinc-100 animate-pulse rounded-xl" />
            ) : (
              <InventoryDonutChart inventory={inventory} />
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Operational Tables (Best-selling products & Recent orders) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left: Best-selling Products (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#17191B] tracking-tight">
                Sản phẩm bán chạy
              </h3>
              <p className="text-xs text-zinc-400">
                Top nhạc cụ đạt sản lượng cao từ đơn hoàn thành
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : topProducts.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Chưa có dữ liệu sản phẩm bán ra trong kỳ này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E8EB] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Nhạc cụ</th>
                    <th className="py-2.5 px-3">Phân loại</th>
                    <th className="py-2.5 px-3 text-right">Đã bán</th>
                    <th className="py-2.5 px-3 text-right">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F4F5]">
                  {topProducts.map((prod) => {
                    const thumb = PRODUCT_IMAGE_MAP[prod.productCode]
                    return (
                      <tr key={prod.productId} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border border-border flex items-center justify-center">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={prod.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <IconInstrument size={16} className="text-zinc-400" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-[#17191B] truncate max-w-[180px]">
                                {prod.productName}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {prod.productCode}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-zinc-600 font-medium">
                          {prod.categoryName || 'Nhạc cụ'}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#17191B]">
                          {prod.quantitySold}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-[#0D9488]">
                          {formatCurrencyVND(prod.revenue)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Recent Orders (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#E5E8EB] shadow-xs">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-[#17191B] tracking-tight">
                Đơn hàng gần đây
              </h3>
              <p className="text-xs text-zinc-400">
                Giao dịch phát sinh mới nhất trên hệ thống
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-100 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400">
              Chưa có đơn hàng nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E8EB] text-zinc-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-2.5">Mã đơn</th>
                    <th className="py-2.5 px-2.5">Khách hàng</th>
                    <th className="py-2.5 px-2.5 text-right">Giá trị</th>
                    <th className="py-2.5 px-2.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F4F5]">
                  {recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="py-3 px-2.5">
                        <div className="flex flex-col">
                          <span className="font-bold text-[#17191B] font-mono text-[11px]">
                            {ord.orderCode}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {formatDateVN(ord.createdAt)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2.5">
                        <span className="font-medium text-[#17191B] truncate block max-w-[110px]">
                          {ord.customerName}
                        </span>
                      </td>
                      <td className="py-3 px-2.5 text-right font-bold text-[#17191B]">
                        {formatCurrencyVND(ord.finalAmount)}
                      </td>
                      <td className="py-3 px-2.5 text-center">
                        {getStatusBadge(ord.status, ord.statusLabel)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardPage
