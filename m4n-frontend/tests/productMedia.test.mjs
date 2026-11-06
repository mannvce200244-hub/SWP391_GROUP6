import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const source = await readFile(new URL('../src/features/catalog/productMedia.js', import.meta.url), 'utf8')
const filename = '12345678-1234-1234-1234-123456789abc.png'
let revision = 0
async function mediaHelpers(t, apiBase = 'http://localhost:8080/api/v1', page = 'http://localhost:5173') {
  const previous = globalThis.window
  globalThis.window = { location: new URL(page) }
  t.after(() => { globalThis.window = previous })
  const configured = source.replace(/import apiClient from '[^']+'/, `const apiClient = { getBaseUrl: () => ${JSON.stringify(apiBase)} }`)
  return import(`data:text/javascript;base64,${Buffer.from(`${configured}\n// ${++revision}`).toString('base64')}`)
}

test('local uploaded image is visible in the catalog, detail and direct checkout media helper', async (t) => {
  const { getFirstProductImage } = await mediaHelpers(t)
  const media = { type: 'IMAGE', url: `http://localhost:8080/api/v1/media/${filename}` }
  assert.deepEqual(getFirstProductImage([media]), media)
})

test('HTTP exception accepts only local uploaded files from the configured backend', async (t) => {
  const { isSafeMediaUrl } = await mediaHelpers(t)
  for (const url of [
    `http://example.test/api/v1/media/${filename}`, `http://localhost:8081/api/v1/media/${filename}`,
    `http://localhost:8080/other/${filename}`, 'http://localhost:8080/api/v1/media/not-an-upload.png',
    `http://localhost:8080/api/v1/media/nested/${filename}`,
    `http://user:pass@localhost:8080/api/v1/media/${filename}`, `http://localhost:8080/api/v1/media/${filename}?x=1`,
    'javascript:alert(1)', '//example.test/image.png', '/\\example.test/image.png', '/\n/example.test/image.png',
  ]) assert.equal(isSafeMediaUrl(url), false, url)
  assert.equal(isSafeMediaUrl('/assets/images/instrument.jpg'), true)
  assert.equal(isSafeMediaUrl('https://images.example.test/instrument.png'), true)
})

test('HTTPS pages never embed insecure localhost images', async (t) => {
  const { isSafeMediaUrl } = await mediaHelpers(t, '/api/v1', 'https://shop.example.test')
  assert.equal(isSafeMediaUrl(`http://localhost:8080/api/v1/media/${filename}`), false)
  assert.equal(isSafeMediaUrl('https://api.example.test/api/v1/media/' + filename), true)
})

test('the bundled and hosted tieu photograph retain the same source and license', async (t) => {
  const { getMediaCredit } = await mediaHelpers(t, '/api/v1', 'https://shop.example.test')
  const bundled = getMediaCredit('/assets/images/prod-tieu.jpg')
  assert.equal(bundled.author, 'Victortsang')
  assert.equal(bundled.license, 'CC BY-SA 3.0')
  assert.deepEqual(getMediaCredit('https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Xiao_with_various_scales.jpg/1280px-Xiao_with_various_scales.jpg'), bundled)
  assert.deepEqual(getMediaCredit('https://raw.githubusercontent.com/mannvce200244-hub/SWP391_GROUP6/0123456789012345678901234567890123456789/m4n-frontend/public/assets/images/prod-tieu.jpg'), bundled)
  assert.equal(getMediaCredit('https://example.test/prod-tieu.jpg'), null)
})
