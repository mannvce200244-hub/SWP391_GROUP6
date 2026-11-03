import test from 'node:test'
import assert from 'node:assert/strict'
import { formatVoucherDateTime, minimumVoucherEnd, validateVoucherPeriod } from '../src/features/admin/voucherPeriod.js'

const created = '2026-10-22T03:00:30Z'

test('Vietnamese voucher times distinguish midnight, morning, noon and afternoon', () => {
  assert.equal(formatVoucherDateTime('2026-10-22T00:30'), '12:30 SA, ngày 22/10/2026')
  assert.equal(formatVoucherDateTime('2026-10-22T11:29'), '11:29 SA, ngày 22/10/2026')
  assert.equal(formatVoucherDateTime('2026-10-22T12:29'), '12:29 CH, ngày 22/10/2026')
  assert.equal(formatVoucherDateTime('2026-10-22T13:30'), '01:30 CH, ngày 22/10/2026')
  assert.equal(formatVoucherDateTime('invalid'), '')
  assert.equal(formatVoucherDateTime(''), '')
})

test('voucher expiration is at least one hour after creation, including seconds', () => {
  assert.ok(validateVoucherPeriod(created, '', '2026-10-22T02:00:00Z'))
  assert.ok(validateVoucherPeriod(created, '', '2026-10-22T04:00:29Z'))
  assert.equal(validateVoucherPeriod(created, '', '2026-10-22T04:00:30Z'), '')
})

test('future start requires a full hour of validity; past start still uses creation', () => {
  const start = '2026-10-23T03:00:00Z'
  assert.ok(validateVoucherPeriod(created, start, '2026-10-23T03:59:59Z'))
  assert.equal(validateVoucherPeriod(created, start, '2026-10-23T04:00:00Z'), '')
  assert.equal(minimumVoucherEnd(created, '2026-10-21T03:00:00Z'), Date.parse('2026-10-22T04:00:30Z'))
})

test('editing uses original creation and unlimited expiration remains optional', () => {
  assert.equal(validateVoucherPeriod(created, '', '2026-10-22T04:00:30Z'), '')
  assert.equal(validateVoucherPeriod(created, '2026-10-23T03:00:00Z', ''), '')
  assert.ok(validateVoucherPeriod(created, '', 'invalid'))
})
