import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

test.group('Health Checks', (group) => {
  group.each.setup(async () => {
    // No database setup needed for health checks
  })

  test('should return healthy status when all checks pass', async ({ client, assert }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    const body = response.body()

    assert.property(body, 'isHealthy')
    assert.property(body, 'checks')
    assert.isTrue(body.isHealthy)
  })

  test('should return health check report structure', async ({ client, assert }) => {
    const response = await client.get('/health')

    response.assertStatus(200)
    const body = response.body()

    assert.property(body, 'isHealthy')
    assert.property(body, 'checks')
    assert.isArray(body.checks)
  })
})
