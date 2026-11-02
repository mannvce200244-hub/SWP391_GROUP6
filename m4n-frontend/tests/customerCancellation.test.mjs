import assert from 'node:assert/strict'
import test from 'node:test'
import { getCustomerCancellation } from '../src/features/orders/orderPresentation.js'

const pending = { status: 'PENDING_CONFIRMATION', paymentMethod: 'MOMO' }

test('paid order without refund permission explains the admin refund step', () => {
  const result = getCustomerCancellation({ ...pending, isPaid: true, canCustomerCancel: false })
  assert.equal(result.canCancel, false)
  assert.match(result.title, /hoàn tiền/)
  assert.match(result.description, /Admin/)
  assert.match(result.description, /xác nhận hoàn tiền toàn phần thành công/)
})

test('verified refunded order may cancel even though the historical paid flag remains true', () => {
  assert.equal(getCustomerCancellation({ ...pending, isPaid: true, canCustomerCancel: true }).canCancel, true)
})

test('MoMo cancellation explains the refund and keeps pending retries on the existing request', () => {
  const order = { ...pending, isPaid: true, canCustomerCancel: true }
  const ready = getCustomerCancellation(order, { refundStatus: 'NONE' })
  assert.equal(ready.confirmLabel, 'Xác nhận hủy và hoàn tiền')
  assert.match(ready.description, /hủy đơn khi hoàn tiền thành công/)
  assert.equal(getCustomerCancellation(order, { refundStatus: 'PENDING' }).confirmLabel, 'Kiểm tra hoàn tiền')
  assert.equal(getCustomerCancellation(order, { refundStatus: 'FAILED' }).confirmLabel, 'Thử hoàn tiền và hủy')
  assert.equal(getCustomerCancellation(order, { refundStatus: 'SUCCEEDED' }).confirmLabel, undefined)
})

test('unpaid order with pending or unknown payment needs verification before cancellation', () => {
  for (const permission of [false, undefined]) {
    const result = getCustomerCancellation({ ...pending, isPaid: false, canCustomerCancel: permission })
    assert.equal(result.canCancel, false)
    assert.match(result.title, /kiểm tra thanh toán/)
  }
})

test('unpaid pending order can cancel only with server permission', () => {
  assert.equal(getCustomerCancellation({ ...pending, isPaid: false, canCustomerCancel: true }).canCancel, true)
})

test('a changed order status prevents cancellation even if an old permission is true', () => {
  for (const status of ['CONFIRMED', 'SHIPPING', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'OUT_OF_STOCK_WAITING']) {
    const result = getCustomerCancellation({ ...pending, status, canCustomerCancel: true })
    assert.equal(result.canCancel, false)
    assert.match(result.description, /Trạng thái đơn hàng đã thay đổi/)
  }
})
