import assert from 'node:assert/strict'
import test from 'node:test'
import { variantFormErrors, variantRequests } from '../src/features/catalog/productVariantForm.js'

const base = { name: 'Sáo trúc', variantGroup: 'Sáo nứa', variantLabel: 'Tone Đô', price: '100000', code: 'SAO-C', barcode: '', categoryId: 1 }
test('multiple variants preserve shared attributes and independent prices and identifiers', () => {
  const rows = [{ label: 'Tone Rê', price: '150000', code: '', barcode: '' }, { label: 'Tone Mi', price: '100000', code: 'sao-e', barcode: '8930000000001' }]
  assert.deepEqual(variantFormErrors(base, rows), {})
  const requests = variantRequests(base, rows)
  assert.equal(requests.length, 3)
  assert.equal(requests[1].price, 150000)
  assert.equal(requests[1].code, null)
  assert.equal(requests[2].code, 'SAO-E')
  assert.ok(requests.every((row) => row.variantGroup === base.variantGroup && row.categoryId === 1))
})
test('variant rows reject duplicate tones, SKU/barcodes, and invalid or excessive prices', () => {
  const rows = [{ label: ' tone đô ', price: '0', code: 'sao-c', barcode: '' }, { label: 'Tone Rê', price: '1.234', code: '', barcode: '89301' }, { label: '', price: '1000000000000', code: '', barcode: '89301' }]
  const errors = variantFormErrors(base, rows)
  for (const field of ['variants[1].variantLabel', 'variants[1].code', 'variants[1].price', 'variants[2].price', 'variants[3].price', 'variants[3].variantLabel', 'variants[3].barcode']) assert.ok(errors[field], field)
})
