import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import authTokenStorage from '../src/features/auth/authTokenStorage.js'

const tokenModuleUrl = new URL('../src/features/auth/authTokenStorage.js', import.meta.url).href
const source = (await readFile(new URL('../src/api/apiClient.js', import.meta.url), 'utf8'))
  .replace("'../features/auth/authTokenStorage.js'", JSON.stringify(tokenModuleUrl))
let moduleNumber = 0

async function createClient(t, apiBase = 'http://localhost:8080/api/v1', dev = true) {
  const originalFetch = globalThis.fetch
  authTokenStorage.clearToken()
  t.after(() => { globalThis.fetch = originalFetch; authTokenStorage.clearToken() })
  const configuredSource = source.replace('import.meta.env.VITE_API_BASE_URL', JSON.stringify(apiBase))
    .replace('import.meta.env.DEV', JSON.stringify(dev))
  return (await import(`data:text/javascript;base64,${Buffer.from(`${configuredSource}\n// ${++moduleNumber}`).toString('base64')}`)).apiClient
}

test('production without an API override uses the current site instead of localhost', async (t) => {
  const api = await createClient(t, '', false)
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/v1/auth/refresh')
    assert.equal(options.headers['X-Requested-With'], 'M4N')
    assert.equal(options.credentials, 'include')
    return json({ accessToken: 'test-token', user: { id: 1 } })
  }
  assert.equal(api.getBaseUrl(), '/api/v1')
  await api.refreshSession()
})

test('development retains localhost fallback and explicit production API configuration is preserved', async (t) => {
  assert.equal((await createClient(t, '', true)).getBaseUrl(), 'http://localhost:8080/api/v1')
  assert.equal((await createClient(t, 'https://api.example.test/api/v1/', false)).getBaseUrl(), 'https://api.example.test/api/v1')
})

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

test('reset OTP rejection does not refresh a session or retry a single-use verification', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('existing-session')
  const calls = []
  globalThis.fetch = async (url) => {
    calls.push(url)
    return json({ message: 'Mã xác thực không hợp lệ.' }, 401)
  }
  await assert.rejects(api.post('/auth/verify-reset-otp', { email: 'test@example.test', challengeId: 'fixture', code: '000000' }),
    (error) => error.status === 401)
  assert.deepEqual(calls, ['http://localhost:8080/api/v1/auth/verify-reset-otp'])
  assert.equal(authTokenStorage.getToken(), 'existing-session')
})

test('pending registration endpoints do not refresh or retry after rejection', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('existing-session')
  const calls = []
  globalThis.fetch = async (url) => { calls.push(url); return json({ message: 'Rejected' }, 401) }
  for (const path of ['/auth/register/start', '/auth/register/verify']) {
    await assert.rejects(api.post(path, {}), (error) => error.status === 401)
  }
  assert.deepEqual(calls, ['http://localhost:8080/api/v1/auth/register/start', 'http://localhost:8080/api/v1/auth/register/verify'])
  assert.equal(authTokenStorage.getToken(), 'existing-session')
})

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

test('a JSON body finishing after an account switch cannot expose the previous account response', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('previous-account')
  const parsing = deferred()
  const started = deferred()
  globalThis.fetch = async () => ({
    ok: true, status: 200, headers: new Headers({ 'Content-Type': 'application/json' }),
    json: async () => { started.resolve(); await parsing.promise; return { privateData: 'previous account' } },
  })
  const read = api.get('/profile')
  await started.promise
  authTokenStorage.setToken('next-account')
  parsing.resolve()
  await assert.rejects(read, (error) => error.status === 401)
  assert.equal(authTokenStorage.getToken(), 'next-account')
})

test('an invoice download finishing after logout cannot return the previous session file', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('previous-account')
  const downloading = deferred()
  const started = deferred()
  globalThis.fetch = async () => ({
    ok: true, status: 200, headers: new Headers({ 'Content-Type': 'application/pdf' }),
    blob: async () => { started.resolve(); await downloading.promise; return new Blob(['private invoice']) },
  })
  const read = api.getBlob('/pos/invoices/1/pdf')
  await started.promise
  authTokenStorage.clearToken()
  downloading.resolve()
  await assert.rejects(read, (error) => error.status === 401)
})

test('unavailable OTP delivery has actionable copy while unexpected failures stay sanitized', async (t) => {
  const api = await createClient(t)
  globalThis.fetch = async () => json({ message: 'Dịch vụ OTP email chưa được cấu hình.' }, 503)
  await assert.rejects(api.post('/auth/email-otp', { email: 'customer@example.test', purpose: 'REGISTER' }),
    (error) => error.status === 503 && error.message === 'Dịch vụ OTP email chưa được cấu hình.')
  globalThis.fetch = async () => json({ message: 'internal stack trace' }, 500)
  await assert.rejects(api.post('/auth/email-otp', {}),
    (error) => error.status === 500 && !error.message.includes('stack trace'))
})

test('initial hydration and concurrent 401 responses share one refresh', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('expired')
  const gate = deferred()
  let refreshes = 0
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes += 1
      await gate.promise
      return json({ accessToken: 'rotated', user: { id: 1 } })
    }
    return options.headers.Authorization === 'Bearer rotated' ? json({ ok: true }) : json({}, 401)
  }
  const hydration = api.refreshSession()
  const secondHydration = api.refreshSession()
  const reads = [api.get('/cart'), api.get('/orders/me')]
  gate.resolve()
  assert.deepEqual(await Promise.all(reads), [{ ok: true }, { ok: true }])
  assert.equal((await hydration).accessToken, 'rotated')
  assert.equal((await secondHydration).accessToken, 'rotated')
  assert.equal(refreshes, 1)
})

test('late 401 uses the rotated token without another cookie rotation', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('expired')
  const oldResponse = deferred()
  let refreshes = 0
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshes += 1
      return json({ accessToken: 'rotated', user: { id: 1 } })
    }
    if (url.endsWith('/slow') && options.headers.Authorization === 'Bearer expired') {
      await oldResponse.promise
      return json({}, 401)
    }
    return options.headers.Authorization === 'Bearer rotated' ? json({ ok: true }) : json({}, 401)
  }
  const slow = api.get('/slow')
  await api.get('/fast')
  oldResponse.resolve()
  assert.deepEqual(await slow, { ok: true })
  assert.equal(refreshes, 1)
})

test('invoice blobs use the same refresh and retry pipeline', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('expired')
  globalThis.fetch = async (url, options) => {
    if (url.endsWith('/auth/refresh')) return json({ accessToken: 'rotated', user: { id: 1 } })
    return options.headers.Authorization === 'Bearer rotated'
      ? new Response('%PDF-1.4', { headers: { 'Content-Type': 'application/pdf' } })
      : json({}, 401)
  }
  assert.equal(await (await api.getBlob('/invoices/1/pdf')).text(), '%PDF-1.4')
})

test('temporary refresh failures and ordinary 403 responses preserve the session', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('expired')
  globalThis.fetch = async (url) => url.endsWith('/auth/refresh') ? json({}, 503) : json({}, 401)
  await assert.rejects(api.get('/cart'), (error) => error.status === 503)
  assert.equal(authTokenStorage.getToken(), 'expired')
  globalThis.fetch = async (url) => {
    if (url.endsWith('/auth/refresh')) throw new TypeError('offline')
    return json({}, 401)
  }
  await assert.rejects(api.get('/cart'), (error) => error.status === 0)
  assert.equal(authTokenStorage.getToken(), 'expired')
  globalThis.fetch = async () => json({}, 403)
  await assert.rejects(api.get('/cart'), (error) => error.status === 403)
  assert.equal(authTokenStorage.getToken(), 'expired')
})

test('invalid refresh and an unauthorized retry clear the session', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('expired')
  globalThis.fetch = async () => json({}, 401)
  await assert.rejects(api.get('/cart'), (error) => error.status === 401)
  assert.equal(authTokenStorage.getToken(), null)
  authTokenStorage.setToken('expired-again')
  globalThis.fetch = async (url) => url.endsWith('/auth/refresh')
    ? json({ accessToken: 'rotated', user: { id: 1 } }) : json({}, 401)
  await assert.rejects(api.get('/cart'), (error) => error.status === 401)
  assert.equal(authTokenStorage.getToken(), null)
})

test('an in-flight refresh cannot restore a cleared session', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('expired')
  const gate = deferred()
  globalThis.fetch = async () => { await gate.promise; return json({ accessToken: 'rotated', user: { id: 1 } }) }
  const refresh = api.refreshSession()
  authTokenStorage.clearToken()
  gate.resolve()
  await assert.rejects(refresh, (error) => error.status === 401)
  assert.equal(authTokenStorage.getToken(), null)
})

test('a response from a previous account is never retried using the new account', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('account-a')
  const gate = deferred()
  let calls = 0
  globalThis.fetch = async () => { calls += 1; await gate.promise; return json({}, 401) }
  const oldRequest = api.post('/cart', { productId: 1, quantity: 1 })
  authTokenStorage.setToken('account-b')
  gate.resolve()
  await assert.rejects(oldRequest, (error) => error.status === 401)
  assert.equal(calls, 1)
  assert.equal(authTokenStorage.getToken(), 'account-b')
})

test('public auth requests omit the bearer token', async (t) => {
  const api = await createClient(t)
  authTokenStorage.setToken('current-token')
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined)
    return json({ message: 'ok' })
  }
  await api.post('/auth/forgot-password', { email: 'customer@example.com' })
  await api.post('/auth/reset-password', { token: 'reset-token', newPassword: 'new-password' })
})
