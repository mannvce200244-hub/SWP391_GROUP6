import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test, { after } from 'node:test'

const previousWindow = globalThis.window
globalThis.window = { location: { origin: 'https://shop.example.test' } }
after(() => { globalThis.window = previousWindow })

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

test('online VNPay starts only with a return to this frontend payment page', async () => {
  const url = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_ReturnUrl=' + encodeURIComponent('https://shop.example.test/payment-return?orderId=540')
  testApiClient.post = async (path) => {
    assert.equal(path, '/payments/orders/540/vnpay')
    return { paymentUrl: url }
  }
  assert.equal(await paymentService.start(540, 'VNPAY'), url)
})

test('online VNPay rejects stale localhost, other sites, invalid paths and duplicate returns before redirect', async () => {
  const base = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?'
  const returns = [
    '', 'vnp_ReturnUrl=not-a-url',
    ...['http://localhost:5173/payment-return?orderId=540', 'https://evil.test/payment-return',
      'https://shop.example.test/pos', 'https://user@shop.example.test/payment-return',
      'https://shop.example.test/payment-return#unexpected'].map(value => 'vnp_ReturnUrl=' + encodeURIComponent(value)),
    'vnp_ReturnUrl=' + encodeURIComponent('https://shop.example.test/payment-return') + '&vnp_ReturnUrl=' + encodeURIComponent('https://evil.test/payment-return'),
  ]
  for (const query of returns) {
    testApiClient.post = async () => ({ paymentUrl: base + query })
    await assert.rejects(paymentService.start(540, 'VNPAY'), /Liên kết trả về chưa hợp lệ/)
  }
})

test('online MoMo checkout is unaffected by the VNPay return guard', async () => {
  const url = 'https://test-payment.momo.vn/v2/gateway/pay?token=fixture'
  testApiClient.post = async () => ({ paymentUrl: url })
  assert.equal(await paymentService.start(540, 'MOMO'), url)
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
