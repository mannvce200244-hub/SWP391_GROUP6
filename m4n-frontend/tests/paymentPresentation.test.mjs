import test from 'node:test'
import assert from 'node:assert/strict'
import { getPaymentPresentation } from '../src/features/checkout/paymentPresentation.js'

const payment = { paymentMethod: 'MOMO', status: 'SUCCEEDED', isPaid: true, refundStatus: 'NONE' }

test('return presentation shows verified success without implying fulfillment', () => {
  const result = getPaymentPresentation(payment, { status: 'PENDING_CONFIRMATION' })
  assert.equal(result.title, 'Thanh toán thành công')
  assert.match(result.description, /chờ nhân viên xác nhận/)
  assert.notEqual(getPaymentPresentation({ ...payment, isPaid: false }).tone, 'success')
})

test('refund status takes precedence over the historical successful charge', () => {
  assert.equal(getPaymentPresentation({ ...payment, refundStatus: 'SUCCEEDED' }, { status: 'CANCELLED' }).title, 'Đã hủy và hoàn tiền')
  assert.equal(getPaymentPresentation({ ...payment, refundStatus: 'PENDING' }).title, 'Đang xử lý hoàn tiền')
  assert.equal(getPaymentPresentation({ ...payment, refundStatus: 'FAILED' }).tone, 'warning')
})

test('pending, failed, unknown and COD outcomes have distinct honest copy', () => {
  assert.equal(getPaymentPresentation({ ...payment, status: 'PENDING', isPaid: false }).title, 'Đang xác minh thanh toán')
  assert.equal(getPaymentPresentation({ ...payment, status: 'FAILED', isPaid: false }).tone, 'warning')
  assert.equal(getPaymentPresentation({ ...payment, status: 'NONE', isPaid: false }).title, 'Đơn hàng chờ thanh toán')
  assert.equal(getPaymentPresentation({ ...payment, status: 'UNKNOWN', isPaid: false }).tone, 'pending')
  assert.equal(getPaymentPresentation({ ...payment, paymentMethod: 'COD', isPaid: false }).title, 'Đã ghi nhận đơn hàng')
})
