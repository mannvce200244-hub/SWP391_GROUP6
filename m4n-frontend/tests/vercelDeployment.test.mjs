import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../vercel.mjs', import.meta.url), 'utf8')
let sequence = 0
async function deployment(backend, api = '/api/v1') {
  const configured = source.replaceAll('process.env.M4N_BACKEND_ORIGIN', JSON.stringify(backend))
    .replaceAll('process.env.VITE_API_BASE_URL', JSON.stringify(api))
  return (await import(`data:text/javascript;base64,${Buffer.from(`${configured}\n// ${++sequence}`).toString('base64')}`)).config
}

test('Vercel proxies browser API requests to Railway and preserves a separate SPA return route', async () => {
  const config = await deployment('https://m4n-demo.up.railway.app')
  assert.equal(config.framework, 'vite')
  assert.equal(config.outputDirectory, 'dist')
  const [api, spa] = config.rewrites
  assert.equal(api.source, '/api/v1/:path*')
  assert.equal(api.destination, 'https://m4n-demo.up.railway.app/api/v1/:path*')
  const frontendRoute = new RegExp(`^${spa.source.replace('/:path(', '/(')}$`)
  for (const path of ['/payment-return', '/account/orders', '/checkout', '/login']) {
    assert.equal(frontendRoute.test(path), true)
  }
  assert.equal(frontendRoute.test('/api/v1/payments/orders/1'), false)
  assert.equal(spa.destination, '/index.html')
  assert.deepEqual(config.headers[0].headers, [{ key: 'Cache-Control', value: 'private, no-store' }])
})

test('deployment cannot silently use localhost, a stale tunnel, credentials or a malformed backend origin', async () => {
  for (const origin of ['', 'http://localhost:8080', 'https://localhost', 'https://127.0.0.1',
    'https://temporary.trycloudflare.com', 'https://api.railway.internal',
    'https://m4n-demo.up.railway.app/', 'https://m4n-demo.up.railway.app/api/v1',
    'https://name:secret@m4n-demo.up.railway.app', 'https://m4n-demo.up.railway.app?next=evil']) {
    await assert.rejects(deployment(origin), /M4N_BACKEND_ORIGIN/)
  }
})

test('Vercel deployment rejects direct cross-site API configuration that would lose SameSite refresh cookies', async () => {
  await assert.rejects(deployment('https://m4n-demo.up.railway.app', 'https://m4n-demo.up.railway.app/api/v1'), /VITE_API_BASE_URL/)
  assert.equal((await deployment('https://m4n-demo.up.railway.app', '')).framework, 'vite')
})
