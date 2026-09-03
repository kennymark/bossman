import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import TeamMember from '#models/team_member'
import User from '#models/user'

/**
 * The per-user payments list on the customer page.
 *
 * These endpoints read the dev/prod application databases, which the test database is
 * not, so the assertions are about who is allowed to ask and what shape a bad request
 * gets back — never about the rows themselves.
 */
test.group('Org payments', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  function makeUser(attrs: Partial<User> = {}) {
    return User.create({
      fullName: 'Test User',
      email: `${Math.random().toString(36).slice(2)}@example.com`,
      password: 'password123',
      role: 'admin',
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
    const response = await client.get('/api/v1/orgs/abc/payments').accept('json').redirects(0)

    response.assertStatus(401)
  })

  test('rejects a signed-in non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client.get('/api/v1/orgs/abc/payments').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('rejects an admin without the customers grant', async ({ client }) => {
    const user = await makeUser()
    /** Granted the dashboard only — the customer page's data must stay closed. */
    await restrictTo(user.id, ['dashboard'])

    const response = await client.get('/api/v1/orgs/abc/payments').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('gates the user list behind the same grant', async ({ client }) => {
    const user = await makeUser()
    await restrictTo(user.id, ['dashboard'])

    const response = await client.get('/api/v1/orgs/abc/payment-users').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('refuses a status outside the known set', async ({ client, assert }) => {
    const user = await makeUser()

    const response = await client
      .get('/api/v1/orgs/abc/payments')
      .qs({ status: 'not-a-status' })
      .loginAs(user)
      .redirects(0)

    /** Validation answers 400 here; the exception handler maps VineJS errors that way. */
    assert.equal(response.status(), 400)
  })

  test('refuses an invoice status that belongs to payments', async ({ client, assert }) => {
    const user = await makeUser()

    const response = await client
      .get('/api/v1/orgs/abc/invoices')
      .qs({ status: 'underpaid' })
      .loginAs(user)
      .redirects(0)

    assert.equal(response.status(), 400)
  })

  test('lets a granted admin through to the handler', async ({ client, assert }) => {
    const user = await makeUser()
    await restrictTo(user.id, ['orgs'])

    const response = await client
      .get('/api/v1/orgs/abc/payments')
      .qs({ status: 'paid' })
      .loginAs(user)
      .redirects(0)

    /** Whatever the dev database does with it, authorization did not block the call. */
    assert.notEqual(response.status(), 401)
    assert.notEqual(response.status(), 403)
    assert.notEqual(response.status(), 400)
  })
})
