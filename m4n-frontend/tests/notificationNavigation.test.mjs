import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/features/notifications/notificationNavigation.js', import.meta.url), 'utf8'))
  .replace("import { navigateTo } from '../../routes/customerRoutes.js'", 'const navigateTo = (path) => globalThis.notificationTestNavigate(path)')
const { notificationDestination, openNotification, OPEN_CUSTOMER_CHAT_EVENT } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('notification links keep local navigation and reject external or disguised destinations', () => {
  for (const link of ['https://evil.test', '//evil.test', '/\\evil.test', 'javascript:alert(1)', '/\nevil.test']) {
    assert.equal(notificationDestination({ type: 'ORDER', link }, 'CUSTOMER'), null)
  }
  assert.deepEqual(notificationDestination({ type: 'ORDER', link: '/account/orders?orderId=5' }, 'CUSTOMER'), { path: '/account/orders?orderId=5' })
})

test('staff messages navigate to the exact conversation even when already read', () => {
  let path
  globalThis.notificationTestNavigate = (value) => { path = value }
  openNotification({ type: 'CHAT', isRead: true, link: '/staff/chat?conversationId=42' }, 'ONLINE_STAFF')
  assert.equal(path, '/staff/chat?conversationId=42')
  assert.deepEqual(notificationDestination({ type: 'CHAT', link: '/profile' }, 'ONLINE_STAFF'), { path: '/staff/chat' })
})

test('customer reply notifications open the support dialog rather than the profile page', () => {
  let event
  globalThis.window = { dispatchEvent: (value) => { event = value } }
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail } }
  openNotification({ type: 'CHAT', link: '/?chat=17' }, 'CUSTOMER')
  assert.equal(event.type, OPEN_CUSTOMER_CHAT_EVENT)
  assert.deepEqual(event.detail, { conversationId: 17 })
  assert.deepEqual(notificationDestination({ type: 'CHAT', link: '/profile' }, 'CUSTOMER'), { openChat: true, chatId: null })
})
