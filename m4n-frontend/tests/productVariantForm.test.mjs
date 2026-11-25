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
test('adding one variant sends one new SKU without extra rows or the source identity', () => {
  const newVariant = { ...base, variantLabel: 'Tone Rê', code: null, barcode: null, price: 150000, isActive: false }
  assert.deepEqual(variantFormErrors(newVariant, [], true), {})
  assert.deepEqual(variantRequests(newVariant, []), [newVariant])
  assert.equal(base.variantLabel, 'Tone Đô')
  const extra = { label: 'Tone Mi', price: '150000', code: '', barcode: '', id: 'extra' }
  assert.equal(variantRequests(newVariant, [extra]).length, 2)
  assert.equal(variantRequests(newVariant, []).length, 1)
  assert.equal(variantRequests(newVariant, [extra])[1].isActive, false)
})
test('variant mode requires a tone and no longer requires a manually entered group', () => {
  const ungrouped = { ...base, variantGroup: '', variantLabel: '' }
  assert.deepEqual(variantFormErrors(ungrouped, []), {})
  const errors = variantFormErrors(ungrouped, [], true)
  assert.equal(errors.variantGroup, undefined)
  assert.ok(errors.variantLabel)
  assert.ok(variantFormErrors({ ...base, variantLabel: '' }, [], true).variantLabel)
  assert.deepEqual(variantFormErrors({ ...base, variantGroup: '' }, [], true), {})
})
test('blank additional rows block creation instead of silently creating an unintended variant', () => {
  const errors = variantFormErrors(base, [{ label: '', code: '', barcode: '', price: '' }], true)
  assert.ok(errors['variants[1].variantLabel'])
  assert.ok(errors['variants[1].price'])
  assert.deepEqual(variantFormErrors(base, [], true), {})
})

test('new variants keep the explicit parent reference without requiring a group-name input', () => {
  const parent = { ...base, familyId: 25, variantGroup: undefined }
  const rows = [{ label: 'Tone Rê', code: '', barcode: '', price: '150000' }]
  assert.deepEqual(variantFormErrors(parent, rows, true), {})
  assert.deepEqual(variantRequests(parent, rows).map(item => item.familyId), [25, 25])
})
test('variant rows reject duplicate tones, SKU/barcodes, and invalid or excessive prices', () => {
  const rows = [{ label: ' tone đô ', price: '0', code: 'sao-c', barcode: '' }, { label: 'Tone Rê', price: '1.234', code: '', barcode: '89301' }, { label: '', price: '1000000000000', code: '', barcode: '89301' }]
  const errors = variantFormErrors(base, rows)
  for (const field of ['variants[1].variantLabel', 'variants[1].code', 'variants[1].price', 'variants[2].price', 'variants[3].price', 'variants[3].variantLabel', 'variants[3].barcode']) assert.ok(errors[field], field)
})

test('editing a legacy SKU adds only the requested new variants under its existing parent', () => {
  const source = { ...base, code: 'SW4-P1', familyId: 42, billableWeightKg: 0.5, media: [{ url: 'https://example.com/flute.jpg', mediaType: 'IMAGE' }] }
  const rows = [{ label: 'Tone Rê', price: '150000', code: '', barcode: '' }]
  assert.deepEqual(variantFormErrors(source, rows), {})
  const additional = variantRequests(source, rows).slice(1)
  assert.equal(additional.length, 1)
  assert.equal(additional[0].familyId, 42)
  assert.equal(additional[0].variantLabel, 'Tone Rê')
  assert.equal(additional[0].code, null)
  assert.equal(additional[0].barcode, null)
  assert.equal(additional[0].price, 150000)
  assert.equal(additional[0].billableWeightKg, 0.5)
  assert.deepEqual(additional[0].media, source.media)
  assert.equal(source.code, 'SW4-P1')
})
