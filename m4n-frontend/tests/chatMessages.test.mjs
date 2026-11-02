import assert from 'node:assert/strict'
import test from 'node:test'
import { extractContent, hasMessageGap, mergeMessages, formatActivity, formatMessageTime } from '../src/features/chat/chatMessages.js'

test('newest-first pages are shown in chronological order with deterministic ties', () => {
  const content = [
    { id: 3, createdAt: '2026-10-10T09:00:00' },
    { id: 2, createdAt: '2026-10-10T09:00:00' },
    { id: 1, createdAt: '2026-10-10T08:00:00' },
  ]
  assert.deepEqual(mergeMessages([], content).map((message) => message.id), [1, 2, 3])
  assert.equal(content[0].id, 3)
})

test('polling preserves history and a locally sent message while deduplicating overlapping older pages', () => {
  const history = [1, 2, 3, 4].map((id) => ({ id, createdAt: `2026-10-10T0${id}:00:00`, content: 'old' }))
  const poll = [3, 2].map((id) => ({ id, createdAt: `2026-10-10T0${id}:00:00`, content: 'read' }))
  const merged = mergeMessages(history, poll)
  assert.deepEqual(merged.map((message) => message.id), [1, 2, 3, 4])
  assert.equal(merged[1].content, 'read')
  assert.equal(merged[3].content, 'old')
})

test('empty or malformed responses and dates cannot crash chat presentation', () => {
  assert.deepEqual(extractContent({ content: null }), [])
  assert.deepEqual(extractContent(undefined), [])
  assert.equal(formatMessageTime('not-a-date'), '')
  assert.equal(formatActivity('not-a-date'), 'Chưa có tin nhắn')
})

test('a page lacking the previous latest message reopens history after a long polling outage', () => {
  const current = [{ id: 1 }, { id: 2 }]
  assert.equal(hasMessageGap(current, [{ id: 4 }, { id: 3 }, { id: 2 }]), false)
  assert.equal(hasMessageGap(current, [{ id: 204 }, { id: 203 }]), true)
  assert.equal(hasMessageGap(current, [{ id: 1 }]), false)
  assert.equal(hasMessageGap([], [{ id: 1 }]), false)
})
