import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (await readFile(new URL('../src/features/auth/authService.js', import.meta.url), 'utf8'))
  .replace("import apiClient from '../../api/apiClient.js'", 'let apiClient; export function setTestClient(client) { apiClient = client }')
const { default: service, setTestClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)

test('registration sends profile once and completes with only email/challenge/OTP, including after resume', async () => {
  const calls = []
  setTestClient({ post: async (path, body) => { calls.push({ path, body }); return {} } })
  await service.startRegistration({ fullName: ' Test Customer ', email: ' CUSTOMER@EXAMPLE.TEST ', password: ' Password123! ', phone: ' 0901234567 ' })
  await service.verifyRegistration({ email: 'customer@example.test', challengeId: 'resumed-challenge', code: '123456',
    password: 'never-repeat-this', fullName: 'do-not-replace-profile' })
  assert.equal(calls[0].body.email, 'customer@example.test')
  assert.equal(calls[0].body.password, ' Password123! ')
  assert.equal(calls[0].body.phone, '0901234567')
  assert.deepEqual(calls[1], { path: '/auth/register/verify',
    body: { email: 'customer@example.test', challengeId: 'resumed-challenge', code: '123456' } })
})
