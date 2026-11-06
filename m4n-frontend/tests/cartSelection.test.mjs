import test from 'node:test'
import assert from 'node:assert/strict'
import { cartCheckoutUrl, cartSelectionError, parseCartCheckout, reconcileCartSelection } from '../src/features/cart/cartSelection.js'

test('checkout URL retains exactly the ticked cart rows across reload', () => {
  const url = cartCheckoutUrl([11, 13])
  const search = new URL(url, 'http://localhost').search
  assert.deepEqual(parseCartCheckout(search), { cartItemIds: [11, 13], error: '' })
  assert.deepEqual(parseCartCheckout(new URL(url, 'http://localhost').search).cartItemIds, [11, 13])
})

test('missing, empty, duplicate and invalid selections never fall back to the whole cart', () => {
  for (const search of ['', '?cartItemIds=', '?cartItemIds=1,1', '?cartItemIds=1&cartItemIds=2',
    '?cartItemIds=0', '?cartItemIds=-1', '?cartItemIds=1.5', '?cartItemIds=1,',
    '?cartItemIds=9007199254740992', '?cartItemIds=1,foo',
    `?cartItemIds=${Array.from({ length: 101 }, (_, i) => i + 1).join(',')}`]) {
    const result = parseCartCheckout(search)
    assert.deepEqual(result.cartItemIds, [], search)
    assert.ok(result.error, search)
  }
  assert.throws(() => cartCheckoutUrl([]))
})

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


test('cart actions explain the existing 100-row limit and allow checkout after deselecting excess rows', () => {
  const ids = Array.from({ length: 101 }, (_, i) => i + 1)
  assert.match(cartSelectionError(ids), /100/)
  assert.throws(() => cartCheckoutUrl(ids), /100/)
  assert.equal(cartSelectionError(ids.slice(0, 100)), '')
  assert.deepEqual(parseCartCheckout(new URL(cartCheckoutUrl(ids.slice(0, 100)), 'http://localhost').search).cartItemIds, ids.slice(0, 100))
})
