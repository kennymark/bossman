import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import BackupRun from '#models/backup_run'
import TeamMember from '#models/team_member'
import User from '#models/user'

/**
 * The attention list and revenue stats sit behind the same route gate as the pages
 * they back. The customer-database sections of `attention` cannot be read in the test
 * environment — that is what the graceful degradation is for, and the granted-admin
 * case pins that the admin-database sections still answer.
 */
test.group('Dashboard attention and revenue', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function makeUser(attrs: Partial<User> = {}) {
    return User.create({
      fullName: 'Test User',
      email: `${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'normal_user',
      isGodAdmin: false,
      enableProdAccess: false,
      emailVerified: true,
      ...attrs,
    } as Partial<User>)
  }

  function restrictTo(userId: string, allowedPages: string[]) {
    return TeamMember.create({
      userId,
      role: 'member',
      allowedPages,
      enableProdAccess: false,
    } as Partial<TeamMember>)
  }

  for (const path of ['/api/v1/dashboard/attention', '/api/v1/analytics/revenue/stats']) {
    test(`rejects an anonymous caller on ${path}`, async ({ client }) => {
      const response = await client.get(path).accept('json').redirects(0)

      response.assertStatus(401)
    })

    test(`rejects a signed-in non-admin on ${path}`, async ({ client }) => {
      const user = await makeUser({ role: 'normal_user' })

      const response = await client.get(path).loginAs(user).redirects(0)

      response.assertStatus(403)
    })
  }

  test('rejects an admin without the dashboard grant', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })
    await restrictTo(user.id, ['analytics'])

    const response = await client.get('/api/v1/dashboard/attention').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('rejects an admin without the analytics grant', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })
    await restrictTo(user.id, ['dashboard'])

    const response = await client.get('/api/v1/analytics/revenue/stats').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('rejects a malformed revenue range', async ({ client }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client
      .get('/api/v1/analytics/revenue/stats')
      .qs({ startDate: 'yesterday' })
      .loginAs(user)
      .redirects(0)

    /** The API handler maps validation failures to 400, not 422. */
    response.assertStatus(400)
  })

  test('answers a granted admin with the attention list', async ({ client, assert }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client.get('/api/v1/dashboard/attention').loginAs(user).redirects(0)

    response.assertStatus(200)
    const body = response.body()
    assert.isArray(body.items)
    assert.isObject(body.counts)
    assert.equal(body.counts.total, body.items.length)
    /** The customer-database readers cannot run here and must say so, not throw. */
    assert.isArray(body.degraded)
  })

  test('surfaces admin-database items alongside degraded sections', async ({ client, assert }) => {
    const user = await makeUser({ role: 'super_admin' })
    const expiring = await makeUser({
      role: 'admin',
      enableProdAccess: true,
      prodAccessExpiresAt: DateTime.now().plus({ days: 2 }),
    })
    await BackupRun.create({
      appEnv: 'dev',
      status: 'failed',
      trigger: 'schedule',
      error: 'pg_dump exited 1',
      startedAt: DateTime.now().minus({ hours: 1 }),
      finishedAt: DateTime.now().minus({ hours: 1 }),
    })

    const response = await client.get('/api/v1/dashboard/attention').loginAs(user).redirects(0)

    response.assertStatus(200)
    const body = response.body() as {
      items: { kind: string; severity: string; detail: string }[]
      counts: { critical: number }
    }
    const kinds = body.items.map((item) => item.kind)
    assert.include(kinds, 'prod_access_expiring')
    assert.include(kinds, 'backup_failed')
    assert.isTrue(
      body.items.some(
        (item) => item.kind === 'prod_access_expiring' && item.detail === expiring.email,
      ),
    )
    assert.isAtLeast(body.counts.critical, 1)
    /** Critical items sort first so the operator sees the worst thing at the top. */
    assert.equal(body.items[0].severity, 'critical')
  })
})
