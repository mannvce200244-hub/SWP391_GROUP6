import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/services/paymentService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'const apiClient = {}')
const { verifiedPaymentUrl } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

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
