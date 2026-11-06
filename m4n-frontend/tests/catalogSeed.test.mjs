import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('all twelve seeded instruments have a bundled photograph and complete shipping data', async () => {
  const products = JSON.parse(await readFile(new URL('../../m4n-backend/src/main/resources/seed/catalog.json', import.meta.url), 'utf8'))
  assert.equal(products.length, 12)
  assert.equal(new Set(products.map(p => p.code)).size, 12)
  for (const group of ['DAY', 'HOI', 'GO']) assert.equal(products.filter(p => p.category === group).length, 4)
  for (const product of products) {
    assert.match(product.image, /^prod-[a-z-]+\.jpg$/)
    const photo = await readFile(new URL(`../public/assets/images/${product.image}`, import.meta.url))
    assert.ok(photo.length > 10000, product.code)
    assert.equal(photo.readUInt16BE(0), 0xffd8, product.code)
    assert.ok(Number(product.weightKg) > 0, product.code)
    assert.ok(Number(product.price) > 0, product.code)
    for (const key of ['name', 'description', 'material', 'dimensions', 'musicalRange', 'origin', 'alt']) {
      assert.ok(product[key]?.trim(), `${product.code}: ${key}`)
    }
  }
})
