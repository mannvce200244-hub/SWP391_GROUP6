import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'
import viteConfig from '../vite.config.js'

const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))

test('Vercel import can read every rewrite destination without executing JavaScript or resolving environment variables', async () => {
  await assert.rejects(access(new URL('../vercel.mjs', import.meta.url)), { code: 'ENOENT' })
  for (const rewrite of config.rewrites) {
    assert.equal(typeof rewrite.source, 'string')
    assert.equal(typeof rewrite.destination, 'string')
    assert.ok(rewrite.destination.length > 0)
    assert.equal(rewrite.destination.includes('${'), false)
  }
})

test('Vercel proxies browser API requests to Railway and preserves a separate SPA return route', () => {
  assert.equal(config.framework, 'vite')
  assert.equal(config.outputDirectory, 'dist')
  const [api, spa] = config.rewrites
  assert.equal(api.source, '/api/v1/:path*')
  assert.equal(api.destination, 'https://swp391group6-production.up.railway.app/api/v1/:path*')
  const frontendRoute = new RegExp(`^${spa.source.replace('/:path(', '/(')}$`)
  for (const path of ['/payment-return', '/account/orders', '/checkout', '/login']) {
    assert.equal(frontendRoute.test(path), true)
  }
  assert.equal(frontendRoute.test('/api/v1/payments/orders/1'), false)
  assert.equal(spa.destination, '/index.html')
  assert.deepEqual(config.headers[0].headers, [{ key: 'Cache-Control', value: 'private, no-store' }])
})

test('the API rewrite targets the public HTTPS backend without credentials or internal hosts', () => {
  const destination = new URL(config.rewrites[0].destination)
  assert.equal(destination.protocol, 'https:')
  assert.equal(destination.hostname, 'swp391group6-production.up.railway.app')
  assert.equal(destination.port, '')
  assert.equal(destination.username, '')
  assert.equal(destination.password, '')
  assert.equal(destination.search, '')
  assert.equal(destination.hash, '')
})

test('production builds reject direct cross-site API configuration that would lose SameSite refresh cookies', () => {
  const previous = process.env.VITE_API_BASE_URL
  try {
    process.env.VITE_API_BASE_URL = 'https://swp391group6-production.up.railway.app/api/v1'
    assert.throws(() => viteConfig({ command: 'build', mode: 'production' }), /VITE_API_BASE_URL/)
    process.env.VITE_API_BASE_URL = '/api/v1'
    assert.doesNotThrow(() => viteConfig({ command: 'build', mode: 'production' }))
  } finally {
    if (previous === undefined) delete process.env.VITE_API_BASE_URL
    else process.env.VITE_API_BASE_URL = previous
  }
})
