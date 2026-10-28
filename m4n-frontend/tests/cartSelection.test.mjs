import test from 'node:test'
import assert from 'node:assert/strict'
import { reconcileCartSelection } from '../src/features/cart/cartSelection.js'

test('cart synchronization preserves a partial selection', () => {
  const items = [{ id: 11, productId: 1 }, { id: 12, productId: 2 }, { id: 13, productId: 3 }]
  const selection = { owner: 7, selectedIds: [13], knownIds: [11, 12, 13] }
  assert.deepEqual(selection.selectedIds, [13])
  assert.equal(reconcileCartSelection(selection, 7, items), selection)
  assert.deepEqual(items.map((item) => item.id), [11, 12, 13])
})

test('checkout consumption preserves unselected cart entries and does not select them afterward', () => {
  const items = [{ id: 11, productId: 1 }, { id: 12, productId: 2 }]
  const selection = { owner: 7, selectedIds: [12], knownIds: [11, 12] }
  assert.deepEqual(reconcileCartSelection(selection, 7, items.slice(0, 1)).selectedIds, [])
})

test('new cart additions stay selected normally and account changes clear the old selection', () => {
  const selection = { owner: 7, selectedIds: [11], knownIds: [11, 12] }
  const items = [{ id: 11 }, { id: 12 }, { id: 13 }]
  assert.deepEqual(reconcileCartSelection(selection, 7, items).selectedIds, [11, 13])
  assert.deepEqual(reconcileCartSelection(selection, null, items).selectedIds, [])
  assert.deepEqual(reconcileCartSelection(selection, 8, [{ id: 21 }]).selectedIds, [21])
})
