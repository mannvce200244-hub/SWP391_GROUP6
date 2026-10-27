export function getStatusBadge(status) {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return {
        label: 'Chờ xác nhận',
        className: 'text-amber-800 bg-[#F6F7F8] border-amber-200',
      }
    case 'CONFIRMED':
      return {
        label: 'Đã xác nhận',
        className: 'text-teal-700 bg-surface-secondary border-teal-200',
      }
    case 'OUT_OF_STOCK_WAITING':
      return {
        label: 'Chờ xử lý tồn kho',
        className: 'text-orange-800 bg-[#F6F7F8] border-orange-200',
      }
    case 'SHIPPING':
      return {
        label: 'Đang giao hàng',
        className: 'text-blue-700 bg-surface-secondary border-blue-200',
      }
    case 'DELIVERED':
      return {
        label: 'Đã giao hàng',
        className: 'text-violet-700 bg-surface-secondary border-violet-200',
      }
    case 'COMPLETED':
      return {
        label: 'Đã hoàn thành',
        className: 'text-emerald-700 bg-surface-secondary border-emerald-200',
      }
    case 'CANCELLED':
      return {
        label: 'Đã hủy',
        className: 'text-rose-700 bg-surface-secondary border-rose-200',
      }
    default:
      return {
        label: 'Trạng thái không xác định',
        className: 'text-slate-700 bg-surface-secondary border-slate-200',
      }
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (!Number.isFinite(d.getTime())) return 'Chưa có ngày hợp lệ'
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return 'Chưa có ngày hợp lệ'
  }
}



