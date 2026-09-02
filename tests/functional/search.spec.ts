import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import TeamMember from '#models/team_member'
import User from '#models/user'

/**
 * `/api/v1/search` reads the customer databases, which the test database does not
 * have: every group fails and the handler answers with an empty list. The assertions
 * therefore cover the gate and the validator, plus the response shape.
 *
 * Validation failures answer 400, not 422: `app/exceptions/handler.ts` maps every
 * VineJS error to `badRequest` for API calls, and this endpoint follows the rest.
 */
test.group('Global search', (group) => {
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

  test('rejects an anonymous caller', async ({ client }) => {
    const response = await client
      .get('/api/v1/search')
      .qs({ q: 'baker' })
      .accept('json')
      .redirects(0)

    response.assertStatus(401)
  })

  test('rejects a signed-in non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client
      .get('/api/v1/search')
      .qs({ q: 'baker' })
      .loginAs(user)
      .accept('json')
      .redirects(0)

    response.assertStatus(403)
  })

  test('rejects a query shorter than two characters', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client
      .get('/api/v1/search')
      .qs({ q: 'b' })
      .loginAs(user)
      .accept('json')
      .redirects(0)

    response.assertStatus(400)
  })

  test('rejects a missing query', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client.get('/api/v1/search').loginAs(user).accept('json').redirects(0)

    response.assertStatus(400)
  })

  test('answers a granted admin with a result list', async ({ client, assert }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client
      .get('/api/v1/search')
      .qs({ q: 'baker street' })
      .loginAs(user)
      .accept('json')
      .redirects(0)

    response.assertStatus(200)
    const body = response.body()
    assert.equal(body.query, 'baker street')
    assert.isArray(body.groups)
    assert.isArray(body.results)
  })

  test('only searches the groups the member is granted', async ({ client, assert }) => {
    const user = await makeUser({ role: 'admin' })
    await TeamMember.create({
      userId: user.id,
      role: 'member',
      allowedPages: ['leases'],
      enableProdAccess: false,
    } as Partial<TeamMember>)

    const response = await client
      .get('/api/v1/search')
      .qs({ q: 'baker street', groups: 'orgs,leases,users' })
      .loginAs(user)
      .accept('json')
      .redirects(0)

    response.assertStatus(200)
    assert.deepEqual(response.body().groups, ['leases'])
  })
})
