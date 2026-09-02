import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import User from '#models/user'

/**
 * The billing and feature-flag endpoints read the dev/prod customer databases, which
 * the test database does not carry, so these assert on what is rejected before any
 * customer-data read: the route gate (401/403), body validation, and the production
 * god-admin rule. Validation runs before the org lookup on purpose, so a bad body is
 * answered without a query.
 */
test.group('Org billing API', (group) => {
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
      .get('/api/v1/orgs/org_1/billing/subscription')
      .accept('json')
      .redirects(0)

    response.assertStatus(401)
  })

  test('rejects a signed-in non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client.get('/api/v1/orgs/org_1/billing/plan').loginAs(user).redirects(0)

    response.assertStatus(403)
  })

  test('rejects a feature flag update from a non-admin', async ({ client }) => {
    const user = await makeUser({ role: 'normal_user' })

    const response = await client
      .put('/api/v1/orgs/org_1/feature-flags')
      .json({ features: { tenantLimit: 10 }, reason: 'support ticket 123' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
  })

  test('rejects a feature flag update without a reason', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client
      .put('/api/v1/orgs/org_1/feature-flags')
      .json({ features: { tenantLimit: 10 } })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    /** VineJS failures are answered as 400 by the exception handler. */
    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  })

  test('rejects a negative limit', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client
      .put('/api/v1/orgs/org_1/feature-flags')
      .json({ features: { tenantLimit: -1 }, reason: 'support ticket 123' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  })

  test('rejects a reset without the typed confirmation', async ({ client }) => {
    const user = await makeUser({ role: 'admin' })

    const response = await client
      .post('/api/v1/orgs/org_1/feature-flags/reset')
      .json({ reason: 'support ticket 123' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(400)
    response.assertBodyContains({ type: 'validation' })
  })

  test('requires a god admin to change flags in production', async ({ client }) => {
    /** A prod grant pins this admin to the production database without making them a god admin. */
    const user = await makeUser({ role: 'admin', enableProdAccess: true, isGodAdmin: false })

    const response = await client
      .put('/api/v1/orgs/org_1/feature-flags')
      .json({ features: { tenantLimit: 10 }, reason: 'support ticket 123' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
  })

  test('requires a god admin to reset flags in production', async ({ client }) => {
    const user = await makeUser({ role: 'admin', enableProdAccess: true, isGodAdmin: false })

    const response = await client
      .post('/api/v1/orgs/org_1/feature-flags/reset')
      .json({ reason: 'support ticket 123', confirmation: 'reset something' })
      .loginAs(user)
      .withCsrfToken()
      .redirects(0)

    response.assertStatus(403)
  })
})
