export function getCustomerCancellation(order, payment) {
  if (order.status !== 'PENDING_CONFIRMATION') {
    return {
      canCancel: false,
      title: 'Đơn hàng không còn có thể tự hủy',
      description: 'Trạng thái đơn hàng đã thay đổi. Vui lòng liên hệ nhân viên qua mục “Chat với nhân viên” ở cuối trang để được hỗ trợ.',
    }
  }
  if (order.canCustomerCancel === true) {
    if (order.paymentMethod === 'MOMO' && order.isPaid && payment?.refundStatus !== 'SUCCEEDED') {
      const pending = payment?.refundStatus === 'PENDING'
      const failed = payment?.refundStatus === 'FAILED'
      return {
        canCancel: true,
        title: pending ? 'Đang hoàn tiền để hủy đơn' : failed ? 'Hoàn tiền chưa thành công' : 'Hủy đơn và hoàn tiền?',
        description: pending
          ? 'MoMo đang xử lý hoàn tiền. Đơn sẽ được hủy khi hoàn tiền thành công. Kiểm tra lại bằng yêu cầu hiện tại để tránh hoàn trùng.'
          : failed ? 'MoMo chưa hoàn tiền thành công nên đơn vẫn giữ nguyên. Bạn có thể thử lại yêu cầu hoàn tiền và hủy đơn.'
            : 'M4N sẽ hoàn lại toàn bộ số tiền qua MoMo và hủy đơn khi hoàn tiền thành công.',
        confirmLabel: pending ? 'Kiểm tra hoàn tiền' : failed ? 'Thử hoàn tiền và hủy' : 'Xác nhận hủy và hoàn tiền',
        processingLabel: pending ? 'Đang kiểm tra…' : 'Đang hoàn tiền và hủy…',
      }
    }
    return {
      canCancel: true,
      title: 'Xác nhận hủy đơn hàng?',
      description: 'Đơn hàng đang chờ xác nhận. Bạn có chắc chắn muốn hủy đơn hàng này không?',
    }
  }
  if (order.isPaid) {
    return {
      canCancel: false,
      title: 'Cần hoàn tiền trước khi hủy',
      description: 'Đơn hàng đã thanh toán. Vui lòng liên hệ nhân viên qua mục “Chat với nhân viên” ở cuối trang và cung cấp mã đơn hàng để Admin hỗ trợ hoàn tiền. Sau khi cổng thanh toán xác nhận hoàn tiền toàn phần thành công, bạn có thể hủy nếu đơn vẫn đang chờ xác nhận.',
    }
  }
  return {
    canCancel: false,
    title: 'Cần kiểm tra thanh toán trước khi hủy',
    description: 'Đơn hàng hiện chưa đủ điều kiện hủy. Hãy kiểm tra trạng thái thanh toán để hệ thống đối soát giao dịch đang chờ xử lý. Nếu vẫn chưa thể hủy, vui lòng liên hệ nhân viên qua mục “Chat với nhân viên” ở cuối trang.',
  }
}

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



