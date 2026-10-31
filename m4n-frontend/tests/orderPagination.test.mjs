import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/services/orderService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'let apiClient; export function setTestClient(client) { apiClient = client }')
const { default: service, setTestClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('customer order pages request only the selected zero-based server page and preserve totals', async () => {
  const urls = []
  const page = { content: [{ id: 23 }], totalPages: 3, totalElements: 23, number: 2 }
  setTestClient({ get: async (url) => { urls.push(new URL(url, 'http://localhost')); return page } })
  assert.equal(await service.getMyOrders({ page: 2, size: 10, status: 'ALL' }), page)
  assert.equal(urls[0].pathname, '/orders/me')
  assert.deepEqual(Object.fromEntries(urls[0].searchParams), { page: '2', size: '10' })
  await service.getMyOrders({ page: 0, size: 10, status: 'PENDING_CONFIRMATION' })
  assert.deepEqual(Object.fromEntries(urls[1].searchParams), { page: '0', size: '10', status: 'PENDING_CONFIRMATION' })
})

test('customer pagination exposes request failures so the page can offer retry', async () => {
  const error = new Error('Temporary request failure')
  setTestClient({ get: async () => { throw error } })
  await assert.rejects(service.getMyOrders({ page: 1 }), (actual) => actual === error)
})
