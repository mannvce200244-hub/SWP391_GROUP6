import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
const source = (await readFile(new URL('../src/services/posService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'let apiClient; export function setTestClient(client) { apiClient = client }')
const service = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('POS customer search encodes name and phone and sends only approved selections when finalizing', async () => {
  const calls = []
  service.setTestClient({ get: async (path) => calls.push({ path }), post: async (path, body) => calls.push({ path, body }) })
  await service.searchCustomers(' A&B ')
  await service.finalizeSale({ items: [{ productId: 1, quantity: 2 }], customerId: 12, customerName: ' Buyer ' })
  await service.finalizeSale({ items: [{ productId: 1, quantity: 1 }], posCustomerId: 9, customerPhone: ' 0912345678 ' })
  assert.equal(calls[0].path, '/pos/customers?q=A%26B')
  assert.equal(calls[1].body.customerId, 12)
  assert.equal(calls[1].body.posCustomerId, null)
  assert.equal(calls[1].body.customerName, 'Buyer')
  assert.equal(calls[2].body.posCustomerId, 9)
  assert.equal(calls[2].body.customerId, null)
  assert.equal(calls[2].body.customerPhone, '0912345678')
})
