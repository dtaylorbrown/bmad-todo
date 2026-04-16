import { test } from 'node:test'
import assert from 'node:assert/strict'
import { app } from './index.js'

test('GET /health returns ok status payload', async () => {
  const response = await app.request('/health')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'ok' })
})
