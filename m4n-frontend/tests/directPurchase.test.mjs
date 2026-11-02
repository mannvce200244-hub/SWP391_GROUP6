import test from 'node:test'
import assert from 'node:assert/strict'
import { directCheckoutUrl, parseDirectPurchase } from '../src/features/checkout/directPurchase.js'

test('direct purchase is repeatable and reload retains exactly one product and quantity', () => {
  const url = directCheckoutUrl(10, 2)
  assert.equal(directCheckoutUrl(10, 2), url)
  assert.deepEqual(parseDirectPurchase(new URL(url, 'http://localhost').search), {
    directPurchase: { productId: 10, quantity: 2 }, error: '',
  })
  assert.deepEqual(parseDirectPurchase(''), { directPurchase: null, error: '' })
})

test('invalid direct links never fall back to cart checkout', () => {
  for (const query of ['?productId=1', '?quantity=1', '?productId=1&quantity=0',
    '?productId=1&quantity=1.5', '?productId=1&quantity=-1', '?productId=0&quantity=1',
    '?productId=1&productId=2&quantity=1', '?productId=1&quantity=1&quantity=2',
    '?productId=9007199254740992&quantity=1', '?productId=1&quantity=2147483648']) {
    const result = parseDirectPurchase(query)
    assert.equal(result.directPurchase, null, query)
    assert.ok(result.error, query)
  }
  assert.throws(() => directCheckoutUrl(1, 0))
})

test('direct purchase input contains no client pricing or cart IDs', () => {
  const result = parseDirectPurchase('?productId=1&quantity=2&price=1')
  assert.deepEqual(result.directPurchase, { productId: 1, quantity: 2 })
  assert.ok(parseDirectPurchase('?productId=1&quantity=2&cartItemIds=99').error)
})
