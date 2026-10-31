export const STAFF_TREND_DAY_OPTIONS = Object.freeze([7, 14, 30])

export const STAFF_TREND_STATUS_OPTIONS = Object.freeze([
  Object.freeze({ value: '', label: 'Tất cả trạng thái' }),
  Object.freeze({ value: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' }),
  Object.freeze({ value: 'CONFIRMED', label: 'Đã xác nhận' }),
  Object.freeze({ value: 'OUT_OF_STOCK_WAITING', label: 'Chờ bổ sung kho' }),
  Object.freeze({ value: 'SHIPPING', label: 'Đang giao hàng' }),
  Object.freeze({ value: 'DELIVERED', label: 'Đã giao hàng' }),
  Object.freeze({ value: 'COMPLETED', label: 'Đã hoàn thành' }),
  Object.freeze({ value: 'CANCELLED', label: 'Đã hủy' }),
])

export function readInitialTrendFilters() {
  const params = new URLSearchParams(window.location.search)
  const requestedDays = Number(params.get('days'))
  const requestedStatus = params.get('status') || ''
  const days = STAFF_TREND_DAY_OPTIONS.includes(requestedDays) ? requestedDays : 7
  const status = STAFF_TREND_STATUS_OPTIONS.some((option) => option.value === requestedStatus)
    ? requestedStatus
    : ''
  return { days, status }
}
