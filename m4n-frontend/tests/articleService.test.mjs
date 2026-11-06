import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/services/articleService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'let apiClient; export function setTestClient(client) { apiClient = client }')
const { default: articleService, setTestClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const emptyPage = { content: [], totalPages: 0, totalElements: 0, number: 0 }

test('article collections serialize zero-based pages and omit empty enum filters', async () => {
  const calls = []
  setTestClient({ get: async (url) => { calls.push(new URL(url, 'http://localhost')); return emptyPage } })
  await articleService.listPublished({ page: 3, size: 5, type: 'GUIDE', artisanId: 42, productId: null })
  await articleService.listAdmin({ page: 2, status: 'DRAFT', type: '' })
  assert.equal(calls[0].pathname, '/articles')
  assert.deepEqual(Object.fromEntries(calls[0].searchParams), { page: '2', size: '5', type: 'GUIDE', artisanId: '42' })
  assert.equal(calls[1].pathname, '/admin/articles')
  assert.deepEqual(Object.fromEntries(calls[1].searchParams), { page: '1', size: '20', status: 'DRAFT' })
})

test('article deletion sends expectedVersion zero as a required query parameter', async () => {
  let requested
  setTestClient({ delete: async (url) => { requested = new URL(url, 'http://localhost'); return null } })
  assert.equal(await articleService.delete(11, 0), null)
  assert.equal(requested.pathname, '/admin/articles/11')
  assert.equal(requested.searchParams.get('expectedVersion'), '0')
})

test('article association searches preserve encoded keyword characters and bounded pages', async () => {
  const calls = []
  setTestClient({ get: async (url) => { calls.push(new URL(url, 'http://localhost')); return { ...emptyPage, content: [{ id: 1, name: 'Result' }] } } })
  for (const kind of ['product', 'artisan', 'craftVillage']) {
    assert.deepEqual(await articleService.searchAssociations(kind, '  đàn & sáo + lễ  '), [{ id: 1, name: 'Result' }])
  }
  assert.deepEqual(calls.map((url) => url.pathname), ['/products', '/artisans/search', '/craft-villages/search'])
  for (const url of calls) {
    assert.equal(url.searchParams.get('keyword'), 'đàn & sáo + lễ')
    assert.equal(url.searchParams.get('page'), '0')
    assert.equal(url.searchParams.get('size'), '8')
  }
})
