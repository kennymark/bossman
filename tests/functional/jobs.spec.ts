import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import TeamMember from '#models/team_member'
import User from '#models/user'

/**
 * The job monitor endpoints.
 *
 * The suite has no MongoDB, and `.env.test` sets neither `MONGO_URL_DEV` nor
 * `MONGO_URL_PROD`, so every case here asserts on what happens *before* the store is
 * consulted: the route-level gate, validation, and the "not configured" answer.
 */
test.group('Jobs API', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  const JOB_ID = '64b7f3a2c1d2e3f4a5b6c7d8'

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

  test('rejects an anonymous caller', async ({ client }) => {
    const response = await client.get('/api/v1/jobs/status').accept('json').redirects(0)

    response.assertStatus(401)
  })

  test('rejects a signed-in non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client.get('/api/v1/jobs/status').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('rejects an admin without the jobs grant', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })
    await restrictTo(user.id, ['dashboard'])

    const response = await client.get('/api/v1/jobs/status').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('reports the store as unconfigured to a granted admin', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })
    await restrictTo(user.id, ['jobs'])

    const response = await client.get('/api/v1/jobs/status').loginAs(user).redirects(0)

    response.assertStatus(200)
    response.assertBodyContains({ configured: false, env: 'dev' })
  })

  test('answers 503 with a plain explanation when the store is not configured', async ({
    client,
  }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client.get('/api/v1/jobs/stats').loginAs(user).redirects(0)

    response.assertStatus(503)
    response.assertBodyContains({ error: 'Job monitor is not configured for dev' })
  })

  test('rejects a malformed job id before touching the store', async ({ client }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client.get('/api/v1/jobs/not-an-id').loginAs(user).redirects(0)

    response.assertStatus(404)
  })

  test('rejects an unknown queue filter', async ({ client }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client
      .get('/api/v1/jobs/list')
      .qs({ queue: 'everything' })
      .loginAs(user)
      .redirects(0)

    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  })

  /**
   * Validation runs before the store is consulted, so a missing reason is rejected even
   * though the store is not configured — the operator is told what is wrong with the
   * request, not with the server. The app's exception handler answers every VineJS
   * failure with 400 `{ type: 'validation' }`, not 422.
   */
  test('a re-run without a reason fails validation, not authorization', async ({
    client,
    assert,
  }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client
      .post(`/api/v1/jobs/${JOB_ID}/rerun`)
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    assert.notEqual(response.status(), 401)
    assert.notEqual(response.status(), 403)
    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  })

  test('a re-run with a reason reaches the store and finds it unconfigured', async ({ client }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client
      .post(`/api/v1/jobs/${JOB_ID}/rerun`)
      .json({ reason: 'Replaying a payment that timed out' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(503)
    response.assertBodyContains({ error: 'Job monitor is not configured for dev' })
  })

  test('a delete needs both a reason and a confirmation', async ({ client }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client
      .delete(`/api/v1/jobs/${JOB_ID}`)
      .json({ reason: 'Stale schedule left over from a migration' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  })

  /** Web pages are sent to a page the admin does hold rather than answered with a 403. */
  test('the jobs page itself is behind the same grant', async ({ client, assert }) => {
    const user = await makeUser({ role: 'admin' })
    await restrictTo(user.id, ['dashboard'])

    const response = await client.get('/jobs').loginAs(user).redirects(0)

    response.assertStatus(302)
    assert.match(String(response.header('location')), /\/dashboard$/)
  })
})
