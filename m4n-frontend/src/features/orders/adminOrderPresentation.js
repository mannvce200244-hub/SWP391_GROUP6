const ORDER_DATE_FORMATTER = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Ho_Chi_Minh',
})

export function getStatusBadge(status) {
  switch (status) {
    case 'PENDING_CONFIRMATION':
      return { label: 'Chờ xác nhận', className: 'text-amber-800 bg-[#F6F7F8] border-amber-200' }
    case 'CONFIRMED':
      return { label: 'Đã xác nhận', className: 'text-teal-700 bg-[#F6F7F8] border-teal-200' }
    case 'OUT_OF_STOCK_WAITING':
      return { label: 'Chờ xử lý tồn kho', className: 'text-orange-800 bg-[#F6F7F8] border-orange-200' }
    case 'SHIPPING':
      return { label: 'Đang giao hàng', className: 'text-blue-700 bg-[#F6F7F8] border-blue-200' }
    case 'DELIVERED':
      return { label: 'Đã giao hàng', className: 'text-violet-700 bg-[#F6F7F8] border-violet-200' }
    case 'COMPLETED':
      return { label: 'Hoàn thành', className: 'text-emerald-700 bg-[#F6F7F8] border-emerald-200' }
    case 'CANCELLED':
      return { label: 'Đã hủy', className: 'text-rose-700 bg-[#F6F7F8] border-rose-200' }
    default:
      return { label: status || 'Không xác định', className: 'text-zinc-600 bg-[#F6F7F8] border-[#CDD2D5]' }
  }
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? dateStr : ORDER_DATE_FORMATTER.format(date)
}

export function getPaymentMethodBadge(method) {
  if (!method) return { label: 'Chưa rõ', className: 'bg-[#F6F7F8] text-zinc-600 border-zinc-200' }
  const m = String(method).toUpperCase()
  if (m === 'COD') {
    return { label: 'COD', className: 'bg-[#F6F7F8] text-zinc-700 border-zinc-200' }
  }
  if (m.includes('NAPAS') || m.includes('QR')) {
    return { label: 'QR Napas', className: 'bg-[#F6F7F8] text-indigo-700 border-indigo-200' }
  }
  if (m.includes('CHUYỂN KHOẢN') || m.includes('TRANSFER') || m === 'BANK_TRANSFER') {
    return { label: 'Chuyển khoản', className: 'bg-[#F6F7F8] text-indigo-700 border-indigo-200' }
  }
  if (m === 'ONLINE') {
    return { label: 'Trực tuyến', className: 'bg-[#F6F7F8] text-blue-700 border-blue-200' }
  }
  return { label: method, className: 'bg-[#F6F7F8] text-zinc-600 border-zinc-200' }
}

export function getShortAddress(address) {
  if (!address) return 'Chưa có địa chỉ'
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ')
  }
  return address
}

