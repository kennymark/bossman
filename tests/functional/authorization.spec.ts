import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import TeamMember from '#models/team_member'
import User from '#models/user'

/**
 * Covers the route-level gate on `/api/v1`. These endpoints back admin pages but were
 * previously guarded by `auth()` alone, so any signed-in user could reach every one of
 * them regardless of role or page grants.
 *
 * Assertions check that the request is *rejected*, not what a handler returns: most of
 * these read the dev/prod application databases, which the test database does not have.
 */
test.group('API authorization', (group) => {
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

  test('rejects an anonymous caller', async ({ client }) => {
    const response = await client.get('/api/v1/dashboard/stats').accept('json').redirects(0)

    response.assertStatus(401)
  })

  test('rejects a signed-in non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client.get('/api/v1/dashboard/stats').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('rejects a backup creation from a non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client
      .post('/api/v1/db-backups')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
  })

  test('rejects a page the admin has no grant for', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })
    /** Granted the dashboard only — db-backups must stay closed. */
    await restrictTo(user.id, ['dashboard'])

    const response = await client
      .post('/api/v1/db-backups')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
  })

  test('lets a granted page through the gate', async ({ client, assert }) => {
    const user = await makeUser({ role: 'admin' })
    await restrictTo(user.id, ['dashboard'])

    const response = await client.get('/api/v1/dashboard/stats').loginAs(user).redirects(0)

    /** Reached the handler; whatever it returns, authorization did not block it. */
    assert.notEqual(response.status(), 403)
    assert.notEqual(response.status(), 401)
  })

  test('lets an unrestricted admin through', async ({ client, assert }) => {
    const user = await makeUser({ role: 'super_admin' })

    const response = await client
      .post('/api/v1/db-backups')
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    assert.notEqual(response.status(), 403)
  })
})
