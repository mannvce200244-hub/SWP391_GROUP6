export function getPaymentPresentation(payment, order) {
  if (payment.refundStatus === 'SUCCEEDED') {
    return { tone: 'success', title: order?.status === 'CANCELLED' ? 'Đã hủy và hoàn tiền' : 'Hoàn tiền thành công', description: 'Cổng thanh toán đã xác nhận hoàn lại toàn bộ số tiền thanh toán.' }
  }
  if (payment.refundStatus === 'PENDING') {
    return { tone: 'pending', title: 'Đang xử lý hoàn tiền', description: 'Yêu cầu hoàn tiền đang được xác minh. Bạn có thể kiểm tra lại sau ít phút.' }
  }
  if (payment.refundStatus === 'FAILED') {
    return { tone: 'warning', title: 'Hoàn tiền chưa thành công', description: 'Đơn hàng vẫn giữ trạng thái hiện tại. Vui lòng kiểm tra đơn hàng để thử lại hoặc liên hệ hỗ trợ.' }
  }
  if (payment.paymentMethod === 'COD') {
    return { tone: 'success', title: payment.isPaid ? 'Đã thanh toán' : 'Đã ghi nhận đơn hàng', description: payment.isPaid ? 'Cảm ơn bạn đã mua sắm cùng M4N.' : 'Bạn sẽ thanh toán khi nhận hàng. Theo dõi tiến độ trong Đơn hàng của tôi.' }
  }
  if (payment.status === 'SUCCEEDED' && payment.isPaid) {
    return { tone: 'success', title: 'Thanh toán thành công', description: order?.status === 'PENDING_CONFIRMATION' ? 'M4N đã nhận thanh toán. Đơn hàng đang chờ nhân viên xác nhận.' : 'M4N đã nhận thanh toán. Bạn có thể theo dõi tiến độ trong đơn hàng.' }
  }
  if (payment.status === 'FAILED') {
    return { tone: 'warning', title: 'Thanh toán chưa thành công', description: 'Đơn hàng đã được lưu. Bạn có thể thử thanh toán lại khi sẵn sàng.' }
  }
  if (payment.status === 'NONE' && !payment.isPaid) {
    return { tone: 'pending', title: 'Đơn hàng chờ thanh toán', description: 'Hoàn tất thanh toán để M4N tiếp nhận và xử lý đơn hàng của bạn.' }
  }
  return { tone: 'pending', title: 'Đang xác minh thanh toán', description: 'Giao dịch chưa có kết quả cuối cùng. Hãy kiểm tra lại trước khi thanh toán thêm.' }
}
