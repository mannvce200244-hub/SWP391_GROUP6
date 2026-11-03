import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { formatCurrencyVND } from '../src/utils/currency.js'

const source = (await readFile(new URL('../src/services/inventoryService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'const apiClient = {}; export { apiClient as testApiClient }')
const { importStock, confirmStockDocument, testApiClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('receipt request includes purchase cost, while QC confirmation sends rejected goods only', async () => {
  const calls = []
  testApiClient.post = async (...args) => { calls.push(args); return { id: 8 } }
  await importStock(7, { quantity: '50', unitCost: 120000, notes: 'Batch' })
  await confirmStockDocument(8, { rejectedQuantity: 2, rejectionReason: 'Damaged' })
  assert.deepEqual(calls, [
    ['/inventory/7/import', { quantity: 50, unitCost: 120000, notes: 'Batch' }],
    ['/inventory/documents/8/confirm', { rejectedQuantity: 2, rejectionReason: 'Damaged' }],
  ])
})

test('batch cost display preserves whole VND beyond Number precision', () => {
  assert.equal(formatCurrencyVND('21474836467852516353.00'), '21.474.836.467.852.516.353 ₫')
  assert.equal(formatCurrencyVND(48n * 120000n), '5.760.000 ₫')
  assert.equal(formatCurrencyVND(0), '0 ₫')
})
