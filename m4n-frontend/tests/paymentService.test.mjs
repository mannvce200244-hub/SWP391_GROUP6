import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/services/paymentService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'const apiClient = {}; export { apiClient as testApiClient }')
const { verifiedPaymentUrl, paymentReturnOrderId, default: paymentService, testApiClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('MoMo return reads internal ID independently of provider orderId and result flags', () => {
  assert.equal(paymentReturnOrderId('?m4nOrderId=55&orderId=provider-reference&resultCode=0'), '55')
  assert.equal(paymentReturnOrderId('?orderId=provider-reference&m4nOrderId=55&resultCode=1006'), '55')
  assert.equal(paymentReturnOrderId('?orderId=55&vnp_ResponseCode=00'), '55')
})

test('payment return rejects missing, ambiguous and invalid internal IDs', () => {
  for (const search of ['', '?orderId=provider-reference', '?orderId=0', '?orderId=55&orderId=66',
    '?m4nOrderId=&orderId=55', '?m4nOrderId=55&m4nOrderId=66', '?m4nOrderId=-1']) {
    assert.equal(paymentReturnOrderId(search), null)
  }
})

test('MoMo redirect is restricted to the official sandbox payment endpoint and selected provider', () => {
  const url = 'https://test-payment.momo.vn/v2/gateway/pay?token=sample'
  assert.equal(verifiedPaymentUrl(url, 'MOMO'), url)
  assert.throws(() => verifiedPaymentUrl(url, 'VNPAY'))
  for (const unsafe of [
    'https://test-payment.momo.vn.attacker.test/v2/gateway/pay',
    'http://test-payment.momo.vn/v2/gateway/pay',
    'https://test-payment.momo.vn/redirect?target=https://attacker.test',
    'https://attacker@test-payment.momo.vn/v2/gateway/pay',
    'https://test-payment.momo.vn:8443/v2/gateway/pay',
  ]) assert.throws(() => verifiedPaymentUrl(unsafe, 'MOMO'))
})

test('payment redirect accepts only the configured VNPay sandbox checkout endpoint', () => {
  const url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_TxnRef=123&vnp_SecureHash=abc'
  assert.equal(verifiedPaymentUrl(url), url)
  for (const unsafe of [
    'javascript:alert(1)',
    'https://sandbox.vnpayment.vn.attacker.test/paymentv2/vpcpay.html',
    'https://sandbox.vnpayment.vn@attacker.test/paymentv2/vpcpay.html',
    'http://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    'https://sandbox.vnpayment.vn:8443/paymentv2/vpcpay.html',
    'https://sandbox.vnpayment.vn/redirect?target=https://attacker.test',
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html#unverified',
  ]) assert.throws(() => verifiedPaymentUrl(unsafe), /Liên kết thanh toán không hợp lệ/)
})


test('return page queries the provider for pending online payments without starting a charge', async () => {
  for (const method of ['MOMO', 'VNPAY']) {
    const calls = []
    testApiClient.get = async (path) => { calls.push(['get', path]); return { status: 'PENDING', paymentMethod: method } }
    testApiClient.post = async (path, body) => { calls.push(['post', path, body]); return { status: 'SUCCEEDED', paymentMethod: method } }
    assert.equal((await paymentService.getReturnStatus('440')).status, 'SUCCEEDED')
    assert.deepEqual(calls, [['get', '/payments/orders/440'], ['post', '/payments/orders/440/reconcile', {}]])
  }
})

test('return page does not reconcile final payments or COD and never trusts URL flags', async () => {
  for (const state of [{ status: 'SUCCEEDED', paymentMethod: 'MOMO' }, { status: 'FAILED', paymentMethod: 'MOMO' },
    { status: 'NONE', paymentMethod: 'MOMO' }, { status: 'PENDING', paymentMethod: 'COD' }]) {
    testApiClient.get = async () => state
    testApiClient.post = async () => { assert.fail('Unexpected provider reconciliation') }
    assert.equal(await paymentService.getReturnStatus('440'), state)
  }
})

test('return verification failures remain errors instead of declaring success', async () => {
  const failure = new Error('Cannot verify payment')
  testApiClient.get = async () => ({ status: 'PENDING', paymentMethod: 'MOMO' })
  testApiClient.post = async () => { throw failure }
  await assert.rejects(paymentService.getReturnStatus('440'), failure)
  testApiClient.get = async () => { throw failure }
  await assert.rejects(paymentService.getReturnStatus('440'), failure)
})
