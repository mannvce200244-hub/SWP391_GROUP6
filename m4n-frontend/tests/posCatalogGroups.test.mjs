import assert from 'node:assert/strict'
import test from 'node:test'
import { groupPosCatalog, hasPosVariants } from '../src/features/pos/posCatalogGroups.js'

test('POS opens variant choices only for a multi-SKU or named-variant product', () => {
  assert.equal(hasPosVariants({ id: 1, familyId: 10, variantCount: 1 }), false)
  assert.equal(hasPosVariants({ id: 1, familyId: 10, variantCount: 2 }), true)
  assert.equal(hasPosVariants({ id: 1, familyId: 10, variantCount: 1, variantLabel: 'Đô (C)' }), true)
  assert.equal(hasPosVariants({ id: 1, variantGroup: 'Sáo trúc' }), true)
  assert.equal(hasPosVariants({ id: 1 }), false)
})

test('POS shows one family card without merging independent SKU prices or balances', () => {
  const c = { id: 1, variantGroup: 'Tiêu Tre', variantLabel: 'C', price: 680000, quantity: 0 }
  const d = { id: 2, variantGroup: ' tiêu tre ', variantLabel: 'D', price: 720000, quantity: 3 }
  const groups = groupPosCatalog([c, d])
  assert.equal(groups.length, 1)
  assert.equal(groups[0].product, c)
  assert.deepEqual([c.price, c.quantity, d.price, d.quantity], [680000, 0, 720000, 3])
})

test('ungrouped SKUs with matching names remain independently addable and retain result order', () => {
  const a = { id: 1, name: 'Sáo trúc' }
  const b = { id: 2, name: 'Sáo trúc', variantGroup: '' }
  const family = { id: 3, name: 'Đàn nguyệt', variantGroup: 'Nguyệt' }
  assert.deepEqual(groupPosCatalog([a, family, b]).map((g) => g.product), [a, family, b])
  assert.deepEqual(groupPosCatalog([]), [])
})

test('explicit parent IDs group variants without merging unrelated products with the same name', () => {
  const c = { id: 1, familyId: 10, familyName: 'Tiêu Tre', variantLabel: 'C' }
  const d = { id: 2, familyId: 10, familyName: 'Tiêu Tre', variantLabel: 'D' }
  const other = { id: 3, familyId: 20, familyName: 'Tiêu Tre', variantLabel: 'C' }
  assert.deepEqual(groupPosCatalog([c, other, d]).map(item => item.product), [c, other])
})
