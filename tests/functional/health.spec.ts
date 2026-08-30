import { test } from '@japa/runner'

import env from '#start/env'

test.group('Health Checks', () => {
  test('reports liveness to anonymous callers without disclosing details', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    const body = response.body()

    assert.property(body, 'isHealthy')
    assert.isTrue(body.isHealthy)
    /** The detailed report names every database connection, so it must not be public. */
    assert.notProperty(body, 'checks')
  })

  test('returns the full report to a caller holding the monitoring secret', async ({
    client,
    assert,
  }) => {
    const secret = env.get('HEALTH_CHECK_SECRET')
    assert.isString(secret, 'HEALTH_CHECK_SECRET must be set in .env.test')

    const response = await client.get('/health').header('x-monitoring-secret', secret!)

    response.assertStatus(200)
    const body = response.body()

    assert.property(body, 'isHealthy')
    assert.property(body, 'checks')
    assert.isArray(body.checks)
  })

  test('ignores an incorrect monitoring secret', async ({ client, assert }) => {
    const response = await client.get('/health').header('x-monitoring-secret', 'wrong')

    response.assertStatus(200)
    assert.notProperty(response.body(), 'checks')
  })
})
