import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const paymentSource = (await readFile(new URL('../src/services/paymentService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'const apiClient = {}')
const { verifiedPaymentUrl } = await import(`data:text/javascript;base64,${Buffer.from(paymentSource).toString('base64')}`)
globalThis.posMomoVerify = verifiedPaymentUrl
const source = (await readFile(new URL('../src/services/posMomoService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'const apiClient = {}; export { apiClient as testApiClient }')
  .replace("import { verifiedPaymentUrl } from './paymentService.js'", 'const verifiedPaymentUrl = globalThis.posMomoVerify')
const { posPaymentReturnId, posPaymentMethodLabel, default: service, testApiClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('POS return accepts only one valid intent ID regardless of client success flags', () => {
  const id = `pos-${'a'.repeat(32)}`
  assert.equal(posPaymentReturnId(`?m4nPosPaymentId=${id}&resultCode=0&orderId=provider`), id)
  for (const value of ['', '?m4nPosPaymentId=441', '?m4nPosPaymentId=pos-abc', `?m4nPosPaymentId=${id}&m4nPosPaymentId=${id}`,
    `?m4nPosPaymentId=pos-${'A'.repeat(32)}`, `?orderId=${id}`]) assert.equal(posPaymentReturnId(value), null)
})

test('POS MoMo opens only official sandbox card checkout', () => {
  let redirected
  globalThis.window = { location: { assign: (value) => { redirected = value } } }
  const url = 'https://test-payment.momo.vn/v2/gateway/pay?token=fixture'
  service.open({ paymentUrl: url }); assert.equal(redirected, url)
  for (const value of ['https://evil.test/v2/gateway/pay', 'javascript:alert(1)', 'http://test-payment.momo.vn/v2/gateway/pay']) {
    assert.throws(() => service.open({ paymentUrl: value }))
  }
})

test('reconciliation uses persisted intent without sending any client success or amount', async () => {
  let call
  testApiClient.post = async (path, body) => { call = { path, body }; return { status: 'PENDING' } }
  assert.deepEqual(await service.reconcile('pos-fixture'), { status: 'PENDING' })
  assert.deepEqual(call, { path: '/pos/payments/momo/pos-fixture/reconcile', body: {} })
  testApiClient.post = async () => { throw new Error('Provider unavailable') }
  await assert.rejects(service.reconcile('pos-fixture'), /Provider unavailable/)
})

test('receipt and history distinguish MoMo from manual bank transfer', () => {
  assert.equal(posPaymentMethodLabel('MOMO'), 'Thẻ quốc tế qua MoMo')
  assert.equal(posPaymentMethodLabel('BANK_TRANSFER'), 'Chuyển khoản')
  assert.equal(posPaymentMethodLabel('CASH'), 'Tiền mặt')
  assert.equal(posPaymentMethodLabel('OTHER'), 'Chưa xác định')
})

test('cancellation requests only the owned intent and preserves server cancellation status and errors', async () => {
  let call
  const result = { status: 'PENDING', cancelRequested: true, invoiceId: null, refundStatus: 'NONE' }
  testApiClient.post = async (path, body) => { call = { path, body }; return result }
  assert.deepEqual(await service.cancel('pos-fixture'), result)
  assert.deepEqual(call, { path: '/pos/payments/momo/pos-fixture/cancel', body: {} })
  testApiClient.post = async () => { throw new Error('Invoice already issued') }
  await assert.rejects(service.cancel('pos-fixture'), /Invoice already issued/)
})
