import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/features/auth/authService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../../api/apiClient.js'", 'let apiClient; export function setClient(client) { apiClient = client }')
const { default: service, setClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('Google navigation stays on the frontend origin and remembers only an order ID', (t) => {
  const originalWindow = globalThis.window
  const originalStorage = globalThis.sessionStorage
  const stored = new Map()
  let destination
  globalThis.window = {location: {assign: (url) => { destination = url }}}
  globalThis.sessionStorage = {setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key)}
  t.after(() => { globalThis.window = originalWindow; globalThis.sessionStorage = originalStorage })
  service.startGoogleLogin(441)
  assert.equal(destination, '/api/v1/auth/google/authorization/google')
  assert.deepEqual([...stored], [['m4n-google-return-order', '441']])
  service.startGoogleLogin(null)
  assert.equal(stored.size, 0)
})

test('Google availability uses the shared API client and supports aborting navigation away', async () => {
  const controller = new AbortController()
  setClient({get: async (path, options) => {
    assert.equal(path, '/auth/google/options')
    assert.equal(options.signal, controller.signal)
    return {available: false}
  }})
  assert.deepEqual(await service.getGoogleLoginOptions({signal: controller.signal}), {available: false})
})
