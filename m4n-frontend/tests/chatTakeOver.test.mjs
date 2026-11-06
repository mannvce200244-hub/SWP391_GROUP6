import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/services/chatService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../api/apiClient.js'", 'const apiClient = {}; export { apiClient as testApiClient }')
const { chatService, testApiClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('takeover sends the observed assignee so a stale queue cannot overwrite another takeover', async () => {
  const calls = []
  testApiClient.post = async (...args) => { calls.push(args); return { assignedStaffId: 9 } }
  testApiClient.get = async (path) => { calls.push(path); return { content: [] } }
  await chatService.getStaffConversations({ scope: 'ASSIGNED', page: 1 })
  const updated = await chatService.takeOver(100, 7)
  assert.equal(updated.assignedStaffId, 9)
  assert.deepEqual(calls, ['/chat/staff/conversations?scope=ASSIGNED&page=1&size=50',
    ['/chat/conversations/100/take-over', { expectedStaffId: 7 }]])
})
