import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import TeamMember from '#models/team_member'
import User from '#models/user'

/**
 * Route-level gate on the maintenance and documents surfaces.
 *
 * Assertions check that a request is *rejected* (or, for a granted admin, that it
 * was not rejected by authorization). The handlers read the customer databases, which
 * the test database does not have, so nothing here asserts on a payload.
 */
test.group('Maintenance and documents authorization', (group) => {
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

  const API_ENDPOINTS = [
    '/api/v1/maintenance/stats',
    '/api/v1/maintenance/export',
    '/api/v1/maintenance/by-org/org_1',
    '/api/v1/documents/stats',
    '/api/v1/documents/export',
    '/api/v1/documents/by-org/org_1',
  ]

  const PAGES = ['/maintenance', '/maintenance/req_1', '/documents']

  test('rejects an anonymous caller on every API endpoint', async ({ client }) => {
    for (const url of API_ENDPOINTS) {
      const response = await client.get(url).accept('json').redirects(0)
      response.assertStatus(401)
    }
  })

  test('sends an anonymous visitor away from the pages', async ({ client, assert }) => {
    for (const url of PAGES) {
      const response = await client.get(url).redirects(0)
      assert.oneOf(response.status(), [302, 401], url)
    }
  })

  test('rejects a signed-in non-admin', async ({ client, assert }) => {
    const user = await makeUser({ role: 'normal_user' })

    for (const url of API_ENDPOINTS) {
      const response = await client.get(url).loginAs(user).accept('json').redirects(0)
      response.assertStatus(403)
    }
    /** The web pages send a forbidden user back to the dashboard rather than 403ing. */
    for (const url of PAGES) {
      const response = await client.get(url).loginAs(user).redirects(0)
      assert.oneOf(response.status(), [302, 403], url)
    }
  })

  test('rejects an admin whose grant is for another page', async ({ client, assert }) => {
    const user = await makeUser({ role: 'admin' })
    /** Granted the dashboard only — maintenance and documents must stay closed. */
    await restrictTo(user.id, ['dashboard'])

    for (const url of API_ENDPOINTS) {
      const response = await client.get(url).loginAs(user).accept('json').redirects(0)
      response.assertStatus(403)
    }
    for (const url of PAGES) {
      const response = await client.get(url).loginAs(user).redirects(0)
      assert.oneOf(response.status(), [302, 403], url)
    }
  })

  test('a maintenance grant does not open documents, and vice versa', async ({ client }) => {
    const maintenanceOnly = await makeUser({ role: 'admin' })
    await restrictTo(maintenanceOnly.id, ['maintenance'])

    const documentsOnly = await makeUser({ role: 'admin' })
    await restrictTo(documentsOnly.id, ['documents'])

    const crossed = await client
      .get('/api/v1/documents/stats')
      .loginAs(maintenanceOnly)
      .accept('json')
      .redirects(0)
    crossed.assertStatus(403)

    const crossedBack = await client
      .get('/api/v1/maintenance/stats')
      .loginAs(documentsOnly)
      .accept('json')
      .redirects(0)
    crossedBack.assertStatus(403)
  })

  test('lets a granted admin through the gate', async ({ client, assert }) => {
    const user = await makeUser({ role: 'admin' })
    await restrictTo(user.id, ['maintenance', 'documents'])

    for (const url of [...API_ENDPOINTS, ...PAGES]) {
      const response = await client.get(url).loginAs(user).accept('json').redirects(0)
      /** Reached the handler; whatever it returns, authorization did not block it. */
      assert.notEqual(response.status(), 401, url)
      assert.notEqual(response.status(), 403, url)
    }
  })

  /** The exception handler answers a VineJS failure with 400, not 422 (see `app/exceptions/handler.ts`). */
  test('validates the export filters before touching the database', async ({ client }) => {
    const user = await makeUser({ role: 'super_admin' })

    const badStatus = await client
      .get('/api/v1/maintenance/export?status=bogus')
      .loginAs(user)
      .accept('json')
      .redirects(0)
    badStatus.assertStatus(400)

    const badSort = await client
      .get('/api/v1/maintenance/export?sortBy=id')
      .loginAs(user)
      .accept('json')
      .redirects(0)
    badSort.assertStatus(400)

    const badExpiry = await client
      .get('/api/v1/documents/export?expiry=soon')
      .loginAs(user)
      .accept('json')
      .redirects(0)
    badExpiry.assertStatus(400)

    const badType = await client
      .get('/api/v1/documents/export?docType=passport')
      .loginAs(user)
      .accept('json')
      .redirects(0)
    badType.assertStatus(400)
  })
})
