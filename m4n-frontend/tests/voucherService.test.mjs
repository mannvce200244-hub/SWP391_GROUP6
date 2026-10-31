import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/services/voucherService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'let apiClient; export function setTestClient(client) { apiClient = client }')
const { default: service, setTestClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('voucher update preserves submillisecond timestamps at the exact one-hour boundary', async () => {
  const calls = []
  setTestClient({ put: async (path, body) => { calls.push({ path, body }); return body } })
  await service.updateVoucher(1, { discountRate: 10, minimumOrderValue: 0,
    validFrom: '2026-01-01T00:00:30.123456Z', validUntil: '2026-01-01T01:00:30.123456Z' })
  assert.equal(calls[0].body.validFrom, '2026-01-01T00:00:30.123456Z')
  assert.equal(calls[0].body.validUntil, '2026-01-01T01:00:30.123456Z')
})

test('voucher creation serializes zoned dates to UTC and retains unlimited expiration', async () => {
  const calls = []
  setTestClient({ post: async (path, body) => { calls.push({ path, body }); return body } })
  await service.createVoucher({ code: 'TEST', discountRate: 10, minimumOrderValue: 0,
    validFrom: '2027-01-01T10:00:00+07:00', validUntil: '' })
  assert.equal(calls[0].body.validFrom, '2027-01-01T03:00:00.000Z')
  assert.equal(calls[0].body.validUntil, null)
})
