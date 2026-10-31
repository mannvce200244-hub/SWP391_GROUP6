import test from 'node:test'
import assert from 'node:assert/strict'
import { validateRecipient, recipientFromAddress, deliveryFromAddress } from '../src/features/checkout/recipientValidation.js'

const address = { customerName: 'Nguyễn An', customerPhone: '0912345678', customerEmail: 'an@example.com', shippingAddress: '12 Nguyễn Trãi, Hà Nội', notes: 'Gọi trước' }
test('selecting saved address copies every recipient field and clears absent optional values', () => {
  assert.deepEqual(recipientFromAddress({ ...address, id: 3 }), address)
  assert.equal(recipientFromAddress({ ...address, notes: null }).notes, '')
  assert.deepEqual(deliveryFromAddress(address), { provinceId: null, wardId: null, streetAddress: '' })
  const deliveryAddress = { provinceId: 1, wardId: 2, streetAddress: '12 Nguyễn Trãi' }
  assert.deepEqual(deliveryFromAddress({ ...address, deliveryAddress }), deliveryAddress)
})
test('address editor and checkout share recipient validation including local versus carrier address', () => {
  assert.deepEqual(validateRecipient(address), {})
  const invalid = { customerName: '', customerPhone: '0123456789', customerEmail: 'invalid', shippingAddress: '', notes: 'n'.repeat(501) }
  assert.deepEqual(Object.keys(validateRecipient(invalid)), ['customerName', 'customerPhone', 'customerEmail', 'shippingAddress', 'notes'])
  assert.equal(validateRecipient({ ...address, shippingAddress: '' }, true).shippingAddress, undefined)
  assert.ok(validateRecipient({ ...address, shippingAddress: '' }).shippingAddress)
})
