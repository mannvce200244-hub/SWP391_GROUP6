export function formatVoucherDateTime(value) {
  const date = new Date(value)
  if (!value || !Number.isFinite(date.getTime())) return ''
  const hours = date.getHours()
  const time = `${String(hours % 12 || 12).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')} ${hours < 12 ? 'SA' : 'CH'}`
  return `${time}, ngày ${new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)}`
}

export function minimumVoucherEnd(createdAt, validFrom) {
  return Math.max(new Date(createdAt).getTime(), validFrom ? new Date(validFrom).getTime() : 0) + 3_600_000
}

export function validateVoucherPeriod(createdAt, validFrom, validUntil) {
  if (!validUntil) return ''
  const end = new Date(validUntil).getTime()
  const minimum = minimumVoucherEnd(createdAt, validFrom)
  if (!Number.isFinite(end) || !Number.isFinite(minimum)) return 'Thời gian chương trình không hợp lệ.'
  return end < minimum ? 'Thời gian kết thúc phải cách lúc tạo và lúc bắt đầu ít nhất 1 giờ.' : ''
}
